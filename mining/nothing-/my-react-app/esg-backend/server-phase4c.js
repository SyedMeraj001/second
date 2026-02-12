import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
});
app.use('/api', limiter);

app.use(express.json());

// Routes
app.use('/api/esg', async (req, res, next) => {
  const { default: esgRoutes } = await import('./routes/esg.js');
  esgRoutes(req, res, next);
});

app.use('/api/carbon', async (req, res, next) => {
  const { default: carbonRoutes } = await import('./routes/carbon.js');
  carbonRoutes(req, res, next);
});

app.use('/api/sasb', async (req, res, next) => {
  const { default: sasbRoutes } = await import('./routes/sasb.js');
  sasbRoutes(req, res, next);
});

app.use('/api/ai-analytics', async (req, res, next) => {
  const { default: aiRoutes } = await import('./routes/ai-analytics.js');
  aiRoutes(req, res, next);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    phase: 'Phase 4C - AI & Advanced Analytics',
    features: [
      'AI-Powered ESG Scoring',
      'Science-Based Targets (SBTi)',
      'Predictive Analytics',
      'Materiality Assessment',
      'Performance Optimization',
      'Net Zero Pathway Planning'
    ]
  });
});

// Initialize database
const initializePhase4CDatabase = async () => {
  try {
    const { initializeDatabase } = await import('./database/initDatabase.js');
    await initializeDatabase();
    
    const { default: db } = await import('./database/db.js');
    
    // Add AI analytics schema
    const aiSchema = fs.readFileSync(path.join(__dirname, 'database/ai-analytics-schema.sql'), 'utf8');
    const statements = aiSchema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await executeStatement(db, statement.trim());
      }
    }
    
    console.log('✅ AI analytics schemas initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

function executeStatement(db, statement) {
  return new Promise((resolve, reject) => {
    db.run(statement, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Start server
const startServer = async () => {
  try {
    await initializePhase4CDatabase();
    console.log('✅ Phase 4C database initialized successfully');

    app.listen(PORT, () => {
      console.log(`🚀 ESG Platform Phase 4C - AI & Advanced Analytics`);
      console.log(`🌐 Server running on port ${PORT}`);
      console.log('');
      console.log('🤖 AI & ADVANCED ANALYTICS FEATURES:');
      console.log('   - AI-Powered ESG Scoring Engine');
      console.log('   - Science-Based Targets (SBTi) Integration');
      console.log('   - Predictive ESG Trend Analysis');
      console.log('   - Automated Materiality Assessment');
      console.log('   - Performance Optimization Recommendations');
      console.log('   - Net Zero Pathway Planning');
      console.log('   - Risk Prediction & Mitigation');
      console.log('');
      console.log('🔗 API Endpoints:');
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   AI Analytics: http://localhost:${PORT}/api/ai-analytics/`);
      console.log(`   ESG Scoring: http://localhost:${PORT}/api/ai-analytics/esg-score/:companyId`);
      console.log(`   SBTi Targets: http://localhost:${PORT}/api/ai-analytics/sbti/targets/:companyId`);
      console.log(`   Net Zero: http://localhost:${PORT}/api/ai-analytics/sbti/net-zero/:companyId`);
    });
  } catch (error) {
    console.error('❌ Failed to start Phase 4C server:', error);
    process.exit(1);
  }
};

startServer();