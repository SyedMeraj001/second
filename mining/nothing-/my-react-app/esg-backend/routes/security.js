import express from 'express';

// Lazy loading services
let SecurityComplianceService, threatDetection, encryptionService, requirePermission, PERMISSIONS;

const getSecurityComplianceService = async () => {
  if (!SecurityComplianceService) {
    const module = await import('../services/securityComplianceService.js');
    SecurityComplianceService = module.default;
  }
  return SecurityComplianceService;
};

const getThreatDetection = async () => {
  if (!threatDetection) {
    const module = await import('../services/threatDetectionSystem.js');
    threatDetection = module.threatDetection;
  }
  return threatDetection;
};

const getEncryptionService = async () => {
  if (!encryptionService) {
    const module = await import('../services/databaseEncryptionService.js');
    encryptionService = module.encryptionService;
  }
  return encryptionService;
};

const getRBAC = async () => {
  if (!requirePermission) {
    const module = await import('../middleware/rbac.js');
    requirePermission = module.requirePermission;
    PERMISSIONS = module.PERMISSIONS;
  }
  return { requirePermission, PERMISSIONS };
};

const router = express.Router();

// Apply threat detection to all security routes
router.use(async (req, res, next) => {
  try {
    const threatDetectionService = await getThreatDetection();
    threatDetectionService.detectThreats(req, res, next);
  } catch (error) {
    next();
  }
});

// Compliance Dashboard
router.get('/compliance/dashboard', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.VIEW_AUDIT_TRAIL)(req, res, async () => {
      const securityComplianceService = await getSecurityComplianceService();
      const dashboard = await securityComplianceService.getComplianceDashboard();
      res.json(dashboard);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get compliance dashboard' });
  }
});

// ISO 27001 Controls
router.get('/iso27001/controls', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.VIEW_AUDIT_TRAIL)(req, res, async () => {
      const securityComplianceService = await getSecurityComplianceService();
      const status = await securityComplianceService.getISO27001Status();
      res.json(status);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get ISO 27001 status' });
  }
});

router.post('/iso27001/assess/:controlId', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.MANAGE_USERS)(req, res, async () => {
      const { controlId } = req.params;
      const securityComplianceService = await getSecurityComplianceService();
      const result = await securityComplianceService.assessISO27001Control(
        controlId, req.body, req.user.id
      );
      res.json(result);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assess control' });
  }
});

// SOC 2 Controls
router.get('/soc2/controls', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.VIEW_AUDIT_TRAIL)(req, res, async () => {
      const securityComplianceService = await getSecurityComplianceService();
      const status = await securityComplianceService.getSOC2Status();
      res.json(status);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get SOC 2 status' });
  }
});

router.post('/soc2/test/:controlId', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.MANAGE_USERS)(req, res, async () => {
      const { controlId } = req.params;
      const securityComplianceService = await getSecurityComplianceService();
      const result = await securityComplianceService.testSOC2Control(
        controlId, req.body, req.user.id
      );
      res.json(result);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to test control' });
  }
});

// Security Incidents
router.post('/incidents', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.MANAGE_USERS)(req, res, async () => {
      const securityComplianceService = await getSecurityComplianceService();
      const incident = await securityComplianceService.logSecurityIncident(req.body, req.user.id);
      res.json(incident);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log incident' });
  }
});

router.get('/incidents', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.VIEW_AUDIT_TRAIL)(req, res, async () => {
      const { days = 30 } = req.query;
      const securityComplianceService = await getSecurityComplianceService();
      const incidents = await securityComplianceService.getRecentSecurityIncidents(days);
      res.json(incidents);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get incidents' });
  }
});

// Threat Detection
router.get('/threats/statistics', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.VIEW_AUDIT_TRAIL)(req, res, async () => {
      const { timeframe = '24h' } = req.query;
      const threatDetectionService = await getThreatDetection();
      const stats = await threatDetectionService.getThreatStatistics(timeframe);
      res.json(stats);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get threat statistics' });
  }
});

router.get('/threats/sources', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.VIEW_AUDIT_TRAIL)(req, res, async () => {
      const { limit = 10 } = req.query;
      const threatDetectionService = await getThreatDetection();
      const sources = await threatDetectionService.getTopThreatSources(limit);
      res.json(sources);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get threat sources' });
  }
});

// Security Metrics
router.post('/metrics/:metricName', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.MANAGE_USERS)(req, res, async () => {
      const { metricName } = req.params;
      const { value, unit } = req.body;
      const securityComplianceService = await getSecurityComplianceService();
      const result = await securityComplianceService.updateSecurityMetric(metricName, value, unit);
      res.json(result);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update metric' });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.VIEW_AUDIT_TRAIL)(req, res, async () => {
      const securityComplianceService = await getSecurityComplianceService();
      const metrics = await securityComplianceService.getSecurityMetrics();
      res.json(metrics);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Encryption Management
router.get('/encryption/status', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.MANAGE_USERS)(req, res, async () => {
      const encryptionSvc = await getEncryptionService();
      const status = encryptionSvc.getEncryptionStatus();
      res.json(status);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get encryption status' });
  }
});

router.post('/encryption/rotate-key', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.MANAGE_USERS)(req, res, async () => {
      const { oldKeyId, newKeyId } = req.body;
      const encryptionSvc = await getEncryptionService();
      const result = encryptionSvc.rotateKey(oldKeyId, newKeyId);
      res.json({ newKeyId: result, rotated: true });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to rotate encryption key' });
  }
});

// Compliance Evidence
router.post('/evidence', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.MANAGE_USERS)(req, res, async () => {
      const securityComplianceService = await getSecurityComplianceService();
      const evidence = await securityComplianceService.storeComplianceEvidence(req.body, req.user.id);
      res.json(evidence);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to store evidence' });
  }
});

// Compliance Reports
router.post('/reports/generate', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.VIEW_AUDIT_TRAIL)(req, res, async () => {
      const { framework, startDate, endDate } = req.body;
      const securityComplianceService = await getSecurityComplianceService();
      const report = await securityComplianceService.generateComplianceReport(framework, startDate, endDate);
      res.json(report);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Security Health Check
router.get('/health', async (req, res) => {
  try {
    const threatDetectionService = await getThreatDetection();
    const health = {
      timestamp: new Date().toISOString(),
      encryption: {
        status: 'active',
        algorithm: 'aes-256-gcm'
      },
      threatDetection: {
        status: 'active',
        rules: threatDetectionService.suspiciousPatterns?.length || 0
      },
      compliance: {
        frameworks: ['ISO27001', 'SOC2'],
        status: 'monitoring'
      }
    };
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Security health check failed' });
  }
});

export default router;