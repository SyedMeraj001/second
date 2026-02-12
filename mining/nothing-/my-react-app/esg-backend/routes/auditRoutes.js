import express from 'express';
const router = express.Router();

// Lazy loading services
let AuditService, FileStorageService, WorkflowService, ComplianceReportService, NotificationService;

const getAuditService = async () => {
  if (!AuditService) {
    const module = await import('../services/auditService.js');
    AuditService = module.default;
  }
  return AuditService;
};

const getFileStorageService = async () => {
  if (!FileStorageService) {
    const module = await import('../services/fileStorageService.js');
    FileStorageService = module.default;
  }
  return FileStorageService;
};

const getWorkflowService = async () => {
  if (!WorkflowService) {
    const module = await import('../services/workflowService.js');
    WorkflowService = module.default;
  }
  return WorkflowService;
};

const getComplianceReportService = async () => {
  if (!ComplianceReportService) {
    const module = await import('../services/complianceReportService.js');
    ComplianceReportService = module.default;
  }
  return ComplianceReportService;
};

const getNotificationService = async () => {
  if (!NotificationService) {
    const module = await import('../services/notificationService.js');
    NotificationService = module.default;
  }
  return NotificationService;
};

// Audit Trail Endpoints
router.get('/audit-trail', async (req, res) => {
  try {
    const filters = {
      recordId: req.query.recordId,
      tableName: req.query.tableName,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 1000
    };
    const auditService = await getAuditService();
    const trail = await auditService.getAuditTrail(filters);
    res.json({ success: true, data: trail, count: trail.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/audit-trail', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { action, tableName, recordId, userId, userRole, oldValues, newValues, metadata } = req.body;
    const auditService = await getAuditService();
    const result = await auditService.createAuditEntry(
      action, tableName, recordId, userId, userRole, oldValues, newValues, metadata
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/audit-trail/verify', async (req, res) => {
  try {
    const startId = parseInt(req.query.startId) || 1;
    const endId = req.query.endId ? parseInt(req.query.endId) : null;
    const auditService = await getAuditService();
    const result = await auditService.verifyAuditChain(startId, endId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Evidence File Endpoints
router.post('/evidence/upload', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { dataId, file, uploadedBy, description } = req.body;
    const fileStorageService = await getFileStorageService();
    const auditService = await getAuditService();
    const result = await fileStorageService.uploadFile(dataId, file, uploadedBy, description);
    
    await auditService.createAuditEntry(
      'evidence_upload', 'evidence_files', result.id, uploadedBy, 'user',
      null, { dataId, fileName: file.name }
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/evidence/:dataId', async (req, res) => {
  try {
    const fileStorageService = await getFileStorageService();
    const files = await fileStorageService.getFilesByDataId(req.params.dataId);
    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/evidence/file/:fileId', async (req, res) => {
  try {
    const fileStorageService = await getFileStorageService();
    const file = await fileStorageService.getFile(req.params.fileId);
    res.json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/evidence/:fileId', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { userId } = req.body;
    const fileStorageService = await getFileStorageService();
    const auditService = await getAuditService();
    const result = await fileStorageService.deleteFile(req.params.fileId, userId);
    
    await auditService.createAuditEntry(
      'evidence_delete', 'evidence_files', req.params.fileId, userId, 'user',
      { fileId: req.params.fileId }, null
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Workflow Endpoints
router.post('/workflow/create', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { dataId, dataType, submittedBy, submitterEmail } = req.body;
    const workflowService = await getWorkflowService();
    const result = await workflowService.createWorkflow(dataId, dataType, submittedBy, submitterEmail);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/workflow/:workflowId/approve', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { approverId, approverEmail, comments } = req.body;
    const workflowService = await getWorkflowService();
    const result = await workflowService.approveWorkflow(
      req.params.workflowId, approverId, approverEmail, comments
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/workflow/:workflowId/reject', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { approverId, approverEmail, comments } = req.body;
    const workflowService = await getWorkflowService();
    const result = await workflowService.rejectWorkflow(
      req.params.workflowId, approverId, approverEmail, comments
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/workflow/:workflowId', async (req, res) => {
  try {
    const workflowService = await getWorkflowService();
    const workflow = await workflowService.getWorkflowWithSteps(req.params.workflowId);
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/workflow/pending/:level?', async (req, res) => {
  try {
    const workflowService = await getWorkflowService();
    const workflows = await workflowService.getPendingWorkflows(req.params.level);
    res.json({ success: true, data: workflows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compliance Reports
router.post('/compliance/report/sox', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { periodStart, periodEnd, generatedBy } = req.body;
    const complianceReportService = await getComplianceReportService();
    const result = await complianceReportService.generateSOXReport(periodStart, periodEnd, generatedBy);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/compliance/report/iso', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { periodStart, periodEnd, generatedBy } = req.body;
    const complianceReportService = await getComplianceReportService();
    const result = await complianceReportService.generateISOReport(periodStart, periodEnd, generatedBy);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/compliance/report/gdpr', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const { periodStart, periodEnd, generatedBy } = req.body;
    const complianceReportService = await getComplianceReportService();
    const result = await complianceReportService.generateGDPRReport(periodStart, periodEnd, generatedBy);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/compliance/reports', async (req, res) => {
  try {
    const complianceReportService = await getComplianceReportService();
    const reports = await complianceReportService.getReports({ reportType: req.query.type });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Notifications
router.post('/notifications/process', async (req, res) => {
  try {
    if (!req.csrfToken || req.csrfToken() !== req.body._csrf) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    const notificationService = await getNotificationService();
    const result = await notificationService.processQueue();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
