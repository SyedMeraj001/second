import express from 'express';
import SASBService from '../services/sasbIntegrationService.js';

const router = express.Router();

// Initialize SASB framework for a company
router.post('/initialize/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { industry } = req.body;
    
    const result = await SASBService.initializeSASBFramework(companyId, industry);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update SASB metric
router.post('/metrics/:companyId/:metricCode', async (req, res) => {
  try {
    const { companyId, metricCode } = req.params;
    const { value, reportingPeriod } = req.body;
    
    const result = await SASBService.updateSASBMetric(companyId, metricCode, value, reportingPeriod);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get SASB compliance status
router.get('/compliance/:companyId/:reportingPeriod', async (req, res) => {
  try {
    const { companyId, reportingPeriod } = req.params;
    
    const result = await SASBService.getSASBCompliance(companyId, reportingPeriod);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get SASB metrics for a company
router.get('/metrics/:companyId/:reportingPeriod', async (req, res) => {
  try {
    const { companyId, reportingPeriod } = req.params;
    
    const result = await SASBService.getSASBMetrics(companyId, reportingPeriod);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate SASB report
router.get('/report/:companyId/:reportingPeriod', async (req, res) => {
  try {
    const { companyId, reportingPeriod } = req.params;
    
    const result = await SASBService.getSASBReport(companyId, reportingPeriod);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;