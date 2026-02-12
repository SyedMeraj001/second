import express from 'express';

// Lazy loading singletons
let erpConnectorModule = null;
let hrConnectorModule = null;

const getERPConnector = async () => {
  if (!erpConnectorModule) {
    const module = await import('../integrations/erpConnector.js');
    erpConnectorModule = module.default || module.ERPConnector;
  }
  return erpConnectorModule;
};

const getHRConnector = async () => {
  if (!hrConnectorModule) {
    const module = await import('../integrations/hrConnector.js');
    hrConnectorModule = module.default || module.HRConnector;
  }
  return hrConnectorModule;
};

const router = express.Router();

// Configure integrations
router.post('/erp/configure', async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { type, baseURL, apiKey } = req.body;
    
    const ERPConnector = await getERPConnector();
    new ERPConnector({ type, baseURL, apiKey }); // Validate config
    
    // Store config in session or database
    req.session = req.session || {};
    req.session.erpConfig = { type, baseURL, apiKey };
    
    res.json({ message: 'ERP integration configured successfully', type });
  } catch (error) {
    res.status(500).json({ error: 'Configuration failed' });
  }
});

// Configure HR integration
router.post('/hr/configure', async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { type, baseURL, apiKey } = req.body;
    
    const HRConnector = await getHRConnector();
    new HRConnector({ type, baseURL, apiKey }); // Validate config
    
    req.session = req.session || {};
    req.session.hrConfig = { type, baseURL, apiKey };
    
    res.json({ message: 'HR integration configured successfully', type });
  } catch (error) {
    res.status(500).json({ error: 'Configuration failed' });
  }
});

// Sync ERP data
router.post('/erp/sync', async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const config = req.session?.erpConfig || {
      type: 'SAP',
      baseURL: 'https://api.mock-erp.com',
      apiKey: 'mock-key'
    };
    
    const ERPConnector = await getERPConnector();
    const connector = new ERPConnector(config);
    const energyData = await connector.getEnergyData();
    const financialData = await connector.getFinancialData();
    
    res.json({
      success: true,
      data: {
        energy: energyData,
        financial: financialData,
        syncTime: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'ERP sync failed', details: error.message });
  }
});

// Sync HR data
router.post('/hr/sync', async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const config = req.session?.hrConfig || {
      type: 'Workday',
      baseURL: 'https://api.mock-hr.com',
      apiKey: 'mock-key'
    };
    
    const HRConnector = await getHRConnector();
    const connector = new HRConnector(config);
    const employeeData = await connector.getEmployeeData();
    const diversityData = await connector.getDiversityData();
    const safetyData = await connector.getSafetyData();
    
    res.json({
      success: true,
      data: {
        employees: employeeData,
        diversity: diversityData,
        safety: safetyData,
        syncTime: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'HR sync failed', details: error.message });
  }
});

// Get integration status
router.get('/status', (req, res) => {
  const status = {
    erp: {
      configured: !!req.session?.erpConfig,
      type: req.session?.erpConfig?.type || null,
      lastSync: req.session?.lastERPSync || null
    },
    hr: {
      configured: !!req.session?.hrConfig,
      type: req.session?.hrConfig?.type || null,
      lastSync: req.session?.lastHRSync || null
    }
  };
  
  res.json(status);
});

export default router;