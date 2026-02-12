import express from 'express';
import ESGController from '../controllers/ESGController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generic routes for all ESG models
const models = [
  'WasteData', 'AirQualityData', 'BiodiversityData', 'HumanRightsData',
  'CommunityProjects', 'WorkforceData', 'SafetyIncidents', 'EthicsCompliance',
  'SecurityIncidents', 'BoardComposition', 'AIAnalysis', 'PortalAccess',
  'FrameworkCompliance', 'AuditorSessions', 'SentimentData'
];

models.forEach(modelName => {
  const route = modelName.toLowerCase().replace(/([A-Z])/g, '-$1').substring(1);

  // GET /api/esg/:model/:companyId
  // Protected: Any logged in user
  router.get(`/${route}/:companyId`, authenticateToken, async (req, res) => {
    try {
      const result = await ESGController.findAll(modelName, req.params.companyId, req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/esg/:model
  // Protected: Any logged in user (data entry)
  router.post(`/${route}`, authenticateToken, async (req, res) => {
    try {
      // CSRF protection: validate request origin
      const origin = req.headers.origin || req.headers.referer;
      const host = req.get('host');
      if (!req.headers['x-requested-with'] && (!origin || !origin.includes(host))) {
        return res.status(403).json({ success: false, error: 'Invalid request origin' });
      }
      
      const result = await ESGController.create(modelName, req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // PUT /api/esg/:model/:id
  // Protected: Any logged in user
  router.put(`/${route}/:id`, authenticateToken, async (req, res) => {
    try {
      // CSRF protection: validate request origin
      const origin = req.headers.origin || req.headers.referer;
      const host = req.get('host');
      if (!req.headers['x-requested-with'] && (!origin || !origin.includes(host))) {
        return res.status(403).json({ success: false, error: 'Invalid request origin' });
      }
      
      const result = await ESGController.update(modelName, req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // DELETE /api/esg/:model/:id
  // RESTRICTED: super_admin or supervisor only
  router.delete(`/${route}/:id`,
    authenticateToken,
    authorizeRole(['super_admin', 'supervisor']),
    async (req, res) => {
      try {
        // CSRF protection: validate request origin and require CSRF token
        const origin = req.headers.origin || req.headers.referer;
        const host = req.get('host');
        const hasValidOrigin = origin && origin.includes(host);
        const hasCSRFHeader = req.headers['x-requested-with'] === 'XMLHttpRequest';
        
        if (!hasCSRFHeader && !hasValidOrigin) {
          return res.status(403).json({ success: false, error: 'CSRF validation failed' });
        }
        
        const result = await ESGController.delete(modelName, req.params.id);
        res.json(result);
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    }
  );
});

export default router;