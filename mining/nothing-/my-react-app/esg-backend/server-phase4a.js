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
const PORT = process.env.PORT || 3003;

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

app.use('/api/advanced', async (req, res, next) => {
  const { default: advancedRoutes } = await import('./routes/advanced.js');
  advancedRoutes(req, res, next);
});

app.use('/api/carbon', async (req, res, next) => {
  const { default: carbonRoutes } = await import('./routes/carbon.js');
  carbonRoutes(req, res, next);
});

app.use('/api/mining', async (req, res, next) => {
  const getMiningESGModule = async () => {
    const { default: module } = await import('./services/miningESGModule.js');
    return module;
  };
  
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
  } else if (req.path.startsWith('/risk-assessment/') && req.method === 'GET') {
    const companyId = req.path.split('/')[2];
    MiningESGModule.assessMiningRisks(companyId)
      .then(result => res.json(result))
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    phase: 'Phase 4A - Carbon Management',
    features: [
      'GHG Protocol Compliance',
      'Scope 1, 2, 3 Emissions',
      'Carbon Footprint Calculator',
      'Emission Factor Database',
      'Carbon Reporting',
      'Historical Tracking'
    ]
  });
});

// Initialize database
const initializePhase4ADatabase = async () => {
  try {
    const { initializeDatabase } = await import('./database/initDatabase.js');
    await initializeDatabase();
    
    const { default: db } = await import('./database/db.js');
    
    // Add carbon schema
    const carbonSchema = fs.readFileSync(path.join(__dirname, 'database/carbon-schema.sql'), 'utf8');
    const statements = carbonSchema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await executeStatement(db, statement.trim());
      }
    }
    
    console.log('✅ Carbon management schema initialized');
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
    await initializePhase4ADatabase();
    console.log('✅ Phase 4A database initialized successfully');

    app.listen(PORT, () => {
      console.log(`🚀 ESG Platform Phase 4A - Carbon Management`);
      console.log(`🌐 Server running on port ${PORT}`);
      console.log('');
      console.log('🌱 CARBON MANAGEMENT FEATURES:');
      console.log('   - GHG Protocol Compliant Calculations');
      console.log('   - Scope 1, 2, 3 Emissions Tracking');
      console.log('   - Comprehensive Emission Factor Database');
      console.log('   - Carbon Footprint Reporting');
      console.log('   - Historical Trend Analysis');
      console.log('   - Reduction Recommendations');
      console.log('');
      console.log('🔗 API Endpoints:');
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Carbon: http://localhost:${PORT}/api/carbon/`);
      console.log(`   Scope 1: http://localhost:${PORT}/api/carbon/scope1/:companyId`);
      console.log(`   Scope 2: http://localhost:${PORT}/api/carbon/scope2/:companyId`);
      console.log(`   Scope 3: http://localhost:${PORT}/api/carbon/scope3/:companyId`);
    });
  } catch (error) {
    console.error('❌ Failed to start Phase 4A server:', error);
    process.exit(1);
  }
};

startServer();