import express from 'express';
import CarbonCalculator from '../services/carbonFootprintCalculator.js';

const router = express.Router();

// Calculate Scope 1 emissions
router.post('/scope1/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const result = await CarbonCalculator.calculateScope1Emissions(companyId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate Scope 2 emissions
router.post('/scope2/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const result = await CarbonCalculator.calculateScope2Emissions(companyId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate Scope 3 emissions
router.post('/scope3/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const result = await CarbonCalculator.calculateScope3Emissions(companyId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get total carbon footprint
router.get('/footprint/:companyId/:period', async (req, res) => {
  try {
    const { companyId, period } = req.params;
    const result = await CarbonCalculator.calculateTotalFootprint(companyId, period);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate comprehensive carbon report
router.get('/report/:companyId/:period', async (req, res) => {
  try {
    const { companyId, period } = req.params;
    const result = await CarbonCalculator.generateCarbonReport(companyId, period);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get emission history
router.get('/history/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;
    const result = await CarbonCalculator.getEmissionHistory(companyId, startDate, endDate);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;