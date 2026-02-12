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
const PORT = process.env.PORT || 3004;

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

app.use('/api/eu-taxonomy', async (req, res, next) => {
  const EUTaxonomyService = (await import('./services/euTaxonomyService.js')).default;
  
  if (req.path.startsWith('/assess/') && req.method === 'POST') {
    const companyId = req.path.split('/')[2];
    try {
      const result = await EUTaxonomyService.assessTaxonomyEligibility(companyId, req.body.activities);
      await EUTaxonomyService.saveTaxonomyAssessment(companyId, result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.path.startsWith('/report/') && req.method === 'GET') {
    const [, , companyId, year] = req.path.split('/');
    try {
      const result = await EUTaxonomyService.getTaxonomyReport(companyId, year);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    phase: 'Phase 4B - Regulatory Compliance',
    features: [
      'SASB Integration Framework',
      'EU Taxonomy Compliance',
      'Industry-Specific Metrics',
      'Regulatory Reporting',
      'Compliance Assessment',
      'Sustainability Accounting'
    ]
  });
});

// Initialize database
const initializePhase4BDatabase = async () => {
  try {
    const { initializeDatabase } = await import('./database/initDatabase.js');
    await initializeDatabase();
    
    const { default: db } = await import('./database/db.js');
    
    // Add SASB schema
    const sasbSchema = fs.readFileSync(path.join(__dirname, 'database/sasb-schema.sql'), 'utf8');
    const sasbStatements = sasbSchema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of sasbStatements) {
      if (statement.trim()) {
        await executeStatement(db, statement.trim());
      }
    }
    
    // Add EU Taxonomy schema
    const taxonomySchema = `
      CREATE TABLE IF NOT EXISTS eu_taxonomy_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        assessment_data TEXT NOT NULL,
        eligibility_percentage REAL NOT NULL,
        alignment_percentage REAL NOT NULL,
        compliant BOOLEAN NOT NULL,
        assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      );
    `;
    
    await executeStatement(db, taxonomySchema);
    
    console.log('✅ Regulatory compliance schemas initialized');
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
    await initializePhase4BDatabase();
    console.log('✅ Phase 4B database initialized successfully');

    app.listen(PORT, () => {
      console.log(`🚀 ESG Platform Phase 4B - Regulatory Compliance`);
      console.log(`🌐 Server running on port ${PORT}`);
      console.log('');
      console.log('📋 REGULATORY COMPLIANCE FEATURES:');
      console.log('   - SASB (Sustainability Accounting Standards Board)');
      console.log('   - EU Taxonomy for Sustainable Activities');
      console.log('   - Industry-Specific Sustainability Metrics');
      console.log('   - Automated Compliance Assessment');
      console.log('   - Regulatory Reporting Framework');
      console.log('   - Green Investment Classification');
      console.log('');
      console.log('🔗 API Endpoints:');
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   SASB: http://localhost:${PORT}/api/sasb/`);
      console.log(`   EU Taxonomy: http://localhost:${PORT}/api/eu-taxonomy/`);
      console.log(`   Carbon: http://localhost:${PORT}/api/carbon/`);
    });
  } catch (error) {
    console.error('❌ Failed to start Phase 4B server:', error);
    process.exit(1);
  }
};

startServer();