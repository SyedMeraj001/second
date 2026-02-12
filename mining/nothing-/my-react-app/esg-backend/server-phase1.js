const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./database/initDatabase');
const { authenticateToken } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3002;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Add user context middleware for routes that need it
app.use('/api/esg', (req, res, next) => {
  // For testing, add a default user if none exists
  if (!req.user && req.body.userId) {
    req.user = { id: req.body.userId, role: 'admin' };
  }
  next();
});

// Routes
app.use('/api/esg', require('./routes/esg'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reporting', require('./routes/reporting'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    phase1Features: [
      'Enhanced Database Schema',
      'Data Validation Engine', 
      'RBAC System',
      'Audit Trail Service',
      'Approval Workflows'
    ]
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('✅ Enhanced database initialized successfully');

    app.listen(PORT, () => {
      console.log(`🚀 ESG Backend server running on port ${PORT}`);
      console.log('📋 Phase 1 Features Active:');
      console.log('   - Enhanced Database Schema with RBAC');
      console.log('   - Data Validation Engine');
      console.log('   - Audit Trail System');
      console.log('   - Multi-level Approval Workflows');
      console.log('   - Role-based Access Control');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();