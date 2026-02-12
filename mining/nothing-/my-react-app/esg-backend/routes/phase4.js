import express from 'express';
import multer from 'multer';
import path from 'path';

// Lazy loading services
let GRITemplateSystem, DataImportExportSystem, TwoFactorAuthSystem, StakeholderEngagementModule, requirePermission, PERMISSIONS;

const getGRITemplateSystem = async () => {
  if (!GRITemplateSystem) {
    const module = await import('../services/griTemplateSystem.js');
    GRITemplateSystem = module.default;
  }
  return GRITemplateSystem;
};

const getDataImportExportSystem = async () => {
  if (!DataImportExportSystem) {
    const module = await import('../services/dataImportExportSystem.js');
    DataImportExportSystem = module.default;
  }
  return DataImportExportSystem;
};

const getTwoFactorAuthSystem = async () => {
  if (!TwoFactorAuthSystem) {
    const module = await import('../services/twoFactorAuthSystem.js');
    TwoFactorAuthSystem = module.default;
  }
  return TwoFactorAuthSystem;
};

const getStakeholderEngagementModule = async () => {
  if (!StakeholderEngagementModule) {
    const module = await import('../services/stakeholderEngagementModule.js');
    StakeholderEngagementModule = module.default;
  }
  return StakeholderEngagementModule;
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

// Configure multer for file uploads with security
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  }
});

// GRI Template Routes
router.get('/gri/templates', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.READ_DATA)(req, res, async () => {
      const griTemplateSystem = await getGRITemplateSystem();
      const templates = griTemplateSystem.getAvailableTemplates();
      res.json(templates);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

router.get('/gri/template/:templateCode/:companyId', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.READ_DATA)(req, res, async () => {
      const griTemplateSystem = await getGRITemplateSystem();
      const template = await griTemplateSystem.generateTemplate(req.params.templateCode, req.params.companyId);
      const existingData = await griTemplateSystem.getTemplateData(req.params.templateCode, req.params.companyId);
      
      // Merge existing data with template
      template.sections.forEach(section => {
        section.fields.forEach(field => {
          if (existingData[section.sectionKey] && existingData[section.sectionKey][field.code]) {
            field.value = existingData[section.sectionKey][field.code];
            field.completed = true;
          }
        });
      });
      
      res.json(template);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/gri/template/save', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.CREATE_DATA)(req, res, async () => {
      const { templateCode, companyId, sectionKey, fieldCode, value } = req.body;
      const griTemplateSystem = await getGRITemplateSystem();
      await griTemplateSystem.saveTemplateData(templateCode, companyId, sectionKey, fieldCode, value, req.user.id);
      res.json({ message: 'Template data saved successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/gri/report/:companyId', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.READ_DATA)(req, res, async () => {
      const { templates } = req.query;
      const templateCodes = templates ? templates.split(',') : ['GRI-102', 'GRI-300', 'GRI-400'];
      const griTemplateSystem = await getGRITemplateSystem();
      const report = await griTemplateSystem.generateGRIReport(req.params.companyId, templateCodes);
      res.json(report);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Data Import/Export Routes
router.get('/export/template/:type', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.READ_DATA)(req, res, async () => {
      const dataImportExportSystem = await getDataImportExportSystem();
      const template = dataImportExportSystem.generateExcelTemplate(req.params.type);
      res.json({
        message: 'Template generated successfully',
        filename: template.filename,
        downloadUrl: `/api/phase4/download/template/${template.filename}`
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/import/excel/:companyId', upload.single('file'), async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.CREATE_DATA)(req, res, async () => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const dataImportExportSystem = await getDataImportExportSystem();
      const results = await dataImportExportSystem.importExcelData(req.file.path, req.params.companyId, req.user.id);
      res.json(results);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/import/csv/:companyId', upload.single('file'), async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.CREATE_DATA)(req, res, async () => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const dataImportExportSystem = await getDataImportExportSystem();
      const results = await dataImportExportSystem.importCSVData(req.file.path, req.params.companyId, req.user.id);
      res.json(results);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/export/excel/:companyId', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.READ_DATA)(req, res, async () => {
      const options = req.body;
      const dataImportExportSystem = await getDataImportExportSystem();
      const export_result = await dataImportExportSystem.exportToExcel(req.params.companyId, options);
      res.json({
        message: 'Export completed successfully',
        filename: export_result.filename,
        downloadUrl: `/api/phase4/download/export/${export_result.filename}`
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Two-Factor Authentication Routes
router.post('/2fa/setup', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.READ_DATA)(req, res, async () => {
      const { userEmail } = req.body;
      const twoFactorAuthSystem = await getTwoFactorAuthSystem();
      const setup = await twoFactorAuthSystem.setup2FA(req.user.id, userEmail || req.user.email);
      res.json(setup);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/2fa/confirm', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.READ_DATA)(req, res, async () => {
      const { token } = req.body;
      const twoFactorAuthSystem = await getTwoFactorAuthSystem();
      const result = await twoFactorAuthSystem.confirm2FASetup(req.user.id, token);
      res.json(result);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/2fa/verify', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { userId, token } = req.body;
    const twoFactorAuthSystem = await getTwoFactorAuthSystem();
    const result = await twoFactorAuthSystem.verifyToken(userId, token);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/2fa/status', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.READ_DATA)(req, res, async () => {
      const twoFactorAuthSystem = await getTwoFactorAuthSystem();
      const status = await twoFactorAuthSystem.get2FAStatus(req.user.id);
      res.json(status);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/2fa/disable', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.READ_DATA)(req, res, async () => {
      const twoFactorAuthSystem = await getTwoFactorAuthSystem();
      const result = await twoFactorAuthSystem.disable2FA(req.user.id);
      res.json({ success: result });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stakeholder Engagement Routes
router.post('/stakeholder/survey', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.CREATE_DATA)(req, res, async () => {
      const { companyId, surveyData } = req.body;
      const stakeholderEngagementModule = await getStakeholderEngagementModule();
      const survey = await stakeholderEngagementModule.createSurvey(companyId, surveyData, req.user.id);
      res.json(survey);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stakeholder/survey/:surveyId/launch', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.APPROVE_SITE)(req, res, async () => {
      const stakeholderEngagementModule = await getStakeholderEngagementModule();
      const result = await stakeholderEngagementModule.launchSurvey(req.params.surveyId, req.user.id);
      res.json({ success: result });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stakeholder/survey/:surveyId/respond', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { respondentData, responses } = req.body;
    const stakeholderEngagementModule = await getStakeholderEngagementModule();
    const result = await stakeholderEngagementModule.submitResponse(req.params.surveyId, respondentData, responses);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stakeholder/survey/:surveyId/analysis', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.READ_DATA)(req, res, async () => {
      const stakeholderEngagementModule = await getStakeholderEngagementModule();
      const analysis = await stakeholderEngagementModule.analyzeSurveyResults(req.params.surveyId);
      res.json(analysis);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stakeholder/engagement-plan', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.CREATE_DATA)(req, res, async () => {
      const { companyId, planData } = req.body;
      const stakeholderEngagementModule = await getStakeholderEngagementModule();
      const plan = await stakeholderEngagementModule.createEngagementPlan(companyId, planData, req.user.id);
      res.json(plan);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stakeholder/dashboard/:companyId', async (req, res) => {
  try {
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.READ_DATA)(req, res, async () => {
      const stakeholderEngagementModule = await getStakeholderEngagementModule();
      const dashboard = await stakeholderEngagementModule.getEngagementDashboard(req.params.companyId);
      res.json(dashboard);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Integration Routes
router.post('/integration/setup', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.MANAGE_COMPANIES)(req, res, async () => {
      const { companyId, systemType, config } = req.body;
      const dataImportExportSystem = await getDataImportExportSystem();
      const integration = await dataImportExportSystem.setupAPIIntegration(companyId, systemType, config);
      res.json(integration);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/integration/:integrationId/sync', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { requirePermission, PERMISSIONS } = await getRBAC();
    await requirePermission(PERMISSIONS.MANAGE_COMPANIES)(req, res, async () => {
      const dataImportExportSystem = await getDataImportExportSystem();
      const results = await dataImportExportSystem.syncExternalData(req.params.integrationId);
      res.json(results);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File Download Routes with path traversal protection
router.get('/download/template/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filepath = path.join(process.cwd(), 'templates', filename);
    if (!filepath.startsWith(path.join(process.cwd(), 'templates'))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.download(filepath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/download/export/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filepath = path.join(process.cwd(), 'exports', filename);
    if (!filepath.startsWith(path.join(process.cwd(), 'exports'))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.download(filepath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;