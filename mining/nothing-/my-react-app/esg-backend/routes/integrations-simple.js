import express from 'express';

const router = express.Router();

// Simple in-memory storage for demo
let configs = {
  erp: null,
  hr: null
};

// Configure ERP
router.post('/erp/configure', (req, res) => {
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
    configs.erp = { type, baseURL, apiKey };
    res.json({ message: 'ERP integration configured successfully', type });
  } catch (error) {
    res.status(500).json({ error: 'Configuration failed' });
  }
});

// Configure HR
router.post('/hr/configure', (req, res) => {
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
    configs.hr = { type, baseURL, apiKey };
    res.json({ message: 'HR integration configured successfully', type });
  } catch (error) {
    res.status(500).json({ error: 'Configuration failed' });
  }
});

// Sync ERP data
router.post('/erp/sync', (req, res) => {
  try {
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const mockData = {
      energy: {
        totalConsumption: Math.floor(Math.random() * 100000) + 50000,
        renewablePercentage: Math.floor(Math.random() * 50) + 25,
        scope2Emissions: Math.floor(Math.random() * 25000) + 10000
      },
      financial: {
        revenue: Math.floor(Math.random() * 10000000) + 5000000,
        operatingCosts: Math.floor(Math.random() * 5000000) + 2000000
      }
    };
    
    res.json({
      success: true,
      data: mockData,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Sync HR data
router.post('/hr/sync', (req, res) => {
  try {
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const mockData = {
      employees: {
        totalEmployees: Math.floor(Math.random() * 5000) + 100,
        newHires: Math.floor(Math.random() * 200) + 10,
        turnoverRate: Math.floor(Math.random() * 15) + 5
      },
      diversity: {
        femalePercentage: Math.floor(Math.random() * 30) + 35,
        minorityPercentage: Math.floor(Math.random() * 25) + 20
      },
      safety: {
        incidentRate: Math.random() * 3,
        lostTimeRate: Math.random() * 1.5
      }
    };
    
    res.json({
      success: true,
      data: mockData,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Get status
router.get('/status', (res) => {
  res.json({
    erp: {
      configured: !!configs.erp,
      type: configs.erp?.type || null
    },
    hr: {
      configured: !!configs.hr,
      type: configs.hr?.type || null
    }
  });
});

export default router;