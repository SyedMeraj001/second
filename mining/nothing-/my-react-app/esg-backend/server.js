import config from './config/config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './models/index.js';
import esgRoutes from './routes/esgRoutes.js';
import kpiRoutes from './routes/kpiRoutes.js';
import reportingRoutes from './routes/reportingRoutes.js';
import iotRoutes from './routes/iotRoutes.js';
import frameworkComplianceRoutes from './routes/frameworkComplianceRoutes.js';
import advancedRoutes from './routes/advanced.js';
import authRoutes from './routes/auth.js'; // Import Auth Routes
import supportRoutes from './routes/supportSimple.js'; // Import Support Routes

const app = express();
const PORT = config.port;

// Security Middleware
app.use(helmet()); // Set security headers
app.use(cors({
  origin: config.frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from default
  message: 'Too many requests, please try again later'
});
app.use('/api', limiter); // Apply rate limiting to all API routes

app.use(express.json());
app.use(cookieParser());

// CSRF Protection for state-changing operations
const csrfProtection = csurf({ cookie: true });

// CSRF token endpoint (GET request, no CSRF needed)
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Apply CSRF protection to state-changing routes
app.use('/api/esg', csrfProtection);
app.use('/api/kpi', csrfProtection);
app.use('/api/reports', csrfProtection);
app.use('/api/iot', csrfProtection);
app.use('/api/framework-compliance', csrfProtection);
app.use('/api/advanced', csrfProtection);
// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes (no CSRF on read-only routes)
app.use('/api/auth', authRoutes); // Connect Auth Routes (no CSRF on auth routes)
app.use('/api/support', supportRoutes); // Connect Support Routes (no CSRF, no rate limit issues)
app.use('/api/esg', esgRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/reports', reportingRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/framework-compliance', frameworkComplianceRoutes);
app.use('/api/advanced', advancedRoutes);

// Health check (no CSRF needed for read-only endpoint)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    env: config.env,
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('Starting ESG Backend server...');
    console.log(`Environment: ${config.env}`);
    console.log(`Database: ${config.db.dialect}`);
    
    await initializeDatabase();
    console.log(`Database initialized successfully (${config.db.dialect})`);

    app.listen(PORT, () => {
      console.log(`ESG Backend server running on port ${PORT}`);
      console.log(`Frontend URL: ${config.frontendUrl}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

startServer();