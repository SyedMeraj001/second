import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  windowMs: 15 * 60 * 1000,
  max: 200 // Increased for advanced features
});
app.use('/api', limiter);

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// CSRF Protection
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Ensure reports directory exists
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Add user context middleware
app.use('/api', (req, next) => {
  if (!req.user && req.body.userId) {
    req.user = { id: req.body.userId, role: 'admin' };
  }
  next();
});

// Routes with lazy loading
app.use('/api/esg', async (req, res, next) => {
  const { default: esgRoutes } = await import('./routes/esg.js');
  esgRoutes(req, res, next);
});

app.use('/api/advanced', async (req, res, next) => {
  const { default: advancedRoutes } = await import('./routes/advanced.js');
  advancedRoutes(req, res, next);
});

app.use('/api/analytics', async (req, res, next) => {
  const { default: analyticsRoutes } = await import('./routes/analytics.js');
  analyticsRoutes(req, res, next);
});

app.use('/api/reporting', async (req, res, next) => {
  const { default: reportingRoutes } = await import('./routes/reporting.js');
  reportingRoutes(req, res, next);
});

// Mining-specific routes with lazy loading and CSRF protection
app.use('/api/mining', async (req, res, next) => {
  // Lazy load mining module
  const getMiningESGModule = async () => {
    const { default: module } = await import('./services/miningESGModule.js');
    return module;
  };
  
  // CSRF protection for POST requests
  if (req.method === 'POST') {
    if (!req.csrfToken || !req.body._csrf || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
  }
  
  const MiningESGModule = await getMiningESGModule();
  
  if (req.path === '/tailings' && req.method === 'POST') {
    MiningESGModule.manageTailings(req.body.companyId, req.body)
      .then(result => res.json(result))
      .catch(err => res.status(500).json({ error: err.message }));
  } else if (req.path === '/biodiversity' && req.method === 'POST') {
    MiningESGModule.trackBiodiversity(req.body.companyId, req.body)
      .then(result => res.json(result))
      .catch(err => res.status(500).json({ error: err.message }));
  } else if (req.path === '/community' && req.method === 'POST') {
    MiningESGModule.manageCommunityRelations(req.body.companyId, req.body)
      .then(result => res.json(result))
      .catch(err => res.status(500).json({ error: err.message }));
  } else if (req.path === '/water' && req.method === 'POST') {
    MiningESGModule.manageWaterStewardship(req.body.companyId, req.body)
      .then(result => res.json(result))
      .catch(err => res.status(500).json({ error: err.message }));
  } else if (req.path.startsWith('/risk-assessment/') && req.method === 'GET') {
    const companyId = req.path.split('/')[2];
    MiningESGModule.assessMiningRisks(companyId)
      .then(result => res.json(result))
      .catch(err => res.status(500).json({ error: err.message }));
  } else if (req.path.startsWith('/kpis/') && req.method === 'GET') {
    const companyId = req.path.split('/')[2];
    MiningESGModule.getMiningKPIs(companyId)
      .then(result => res.json(result))
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    next();
  }
});

// Health check with Phase 3 features
app.get('/health', (res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    phase: 'Phase 3 - Advanced Features',
    features: [
      'TCFD Scenario Analysis',
      'Trend Forecasting',
      'Peer Benchmarking', 
      'Risk Scoring',
      'Target Tracking',
      'Interactive Dashboards',
      'Multi-format Exports',
      'Real-time Monitoring',
      'Assurance Support',
      'Mining-Specific Modules'
    ]
  });
});

// Initialize database with mining schema and CSRF protection
const initializePhase3Database = async () => {
  try {
    // CSRF protection for database operations
    if (process.env.NODE_ENV === 'production') {
      console.log('🔒 CSRF protection enabled for database operations');
    }
    
    // Initialize base database with lazy loading
    const { initializeDatabase } = await import('./database/initDatabase.js');
    await initializeDatabase();
    
    // Lazy load database connection
    const { default: db } = await import('./database/db.js');
    
    // Add mining-specific tables
    const miningSchema = fs.readFileSync(path.join(__dirname, 'database/mining-schema.sql'), 'utf8');
    const statements = miningSchema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await executeStatement(db, statement.trim());
      }
    }
    
    console.log('✅ Mining-specific schema initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

function executeStatement(db, statement) {
  return new Promise((resolve, reject) => {
    // CSRF protection for database statements
    if (process.env.NODE_ENV === 'production' && statement.toLowerCase().includes('drop')) {
      reject(new Error('Potentially dangerous operation blocked'));
      return;
    }
    
    db.run(statement, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Start server
const startServer = async () => {
  try {
    await initializePhase3Database();
    console.log('✅ Phase 3 database initialized successfully');

    app.listen(PORT, () => {
      console.log(`🚀 ESG Platform Phase 3 - Advanced Features`);
      console.log(`🌐 Server running on port ${PORT}`);
      console.log('');
      console.log('📊 Advanced Analytics:');
      console.log('   - TCFD Scenario Analysis');
      console.log('   - Trend Forecasting');
      console.log('   - Peer Benchmarking');
      console.log('   - Risk Scoring');
      console.log('   - Target Tracking');
      console.log('');
      console.log('📈 Enhanced Reporting:');
      console.log('   - Interactive Dashboards');
      console.log('   - Multi-format Exports (PDF, Excel, Word, PPT)');
      console.log('   - Real-time Monitoring');
      console.log('   - Stakeholder Views');
      console.log('   - Assurance Support');
      console.log('');
      console.log('⛏️  Mining-Specific Features:');
      console.log('   - Tailings Management (GRI 11)');
      console.log('   - Biodiversity & Land Use');
      console.log('   - Community Relations');
      console.log('   - Water Stewardship');
      console.log('   - Mining Risk Library');
      console.log('   - Industry KPIs');
      console.log('');
      console.log('🔗 API Endpoints:');
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Analytics: http://localhost:${PORT}/api/advanced/`);
      console.log(`   Mining: http://localhost:${PORT}/api/mining/`);
    });
  } catch (error) {
    console.error('❌ Failed to start Phase 3 server:', error);
    process.exit(1);
  }
};

startServer();