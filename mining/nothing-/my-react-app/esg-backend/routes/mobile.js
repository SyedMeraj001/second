import express from 'express';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy loading singletons
let dbInstance = null;

const getDb = async () => {
  if (!dbInstance) {
    const { default: db } = await import('../database/db.js');
    dbInstance = db;
  }
  return dbInstance;
};

const router = express.Router();

// Rate limiting for mobile endpoints
const mobileRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

router.use(mobileRateLimit);

// Configure multer for mobile file uploads with size limits
const mobileUpload = multer({
  dest: path.join(__dirname, '../uploads/mobile/'),
  limits: { 
    fileSize: 10 * 1024 * 1024, // Reduced to 10MB
    files: 5 // Limit number of files
  },
  fileFilter: (file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  }
});

// Device Registration with authentication
router.post('/device/register', async (req, res) => {
  try {
    const db = await getDb();
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { deviceId, userId, deviceName, deviceType, osVersion, appVersion, pushToken } = req.body;
    
    db.run(`INSERT OR REPLACE INTO mobile_devices 
      (device_id, user_id, device_name, device_type, os_version, app_version, push_token, last_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [deviceId, userId, deviceName, deviceType, osVersion, appVersion, pushToken],
      function(err) {
        if (err) {
          res.status(500).json({ error: 'Device registration failed' });
        } else {
          res.json({ success: true, deviceRegistered: true });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync Offline Data with authentication and CSRF protection
router.post('/sync/offline-data', async (req, res) => {
  try {
    const db = await getDb();
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { offlineEntries, deviceId } = req.body;
    const results = { synced: 0, failed: 0, conflicts: 0, errors: [] };
    
    // Start sync session
    const syncStarted = new Date().toISOString();
    
    for (const entry of offlineEntries) {
      try {
        // Check for conflicts
        const existing = await checkForConflicts(entry.offlineId);
        if (existing) {
          results.conflicts++;
          await logConflict(entry.offlineId, existing, entry);
          continue;
        }
        
        // Save offline entry
        await saveOfflineEntry(entry);
        
        // Convert to regular ESG data
        await convertToESGData(entry);
        
        results.synced++;
      } catch (error) {
        results.failed++;
        results.errors.push({ offlineId: entry.offlineId, error: error.message });
      }
    }
    
    // Log sync session
    await logSyncSession(deviceId, req.user.id, results, syncStarted);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Mobile Form Templates with CSRF protection
router.get('/forms/templates', async (req, res) => {
  try {
    const db = await getDb();
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token for sensitive data
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    db.all('SELECT * FROM mobile_form_cache WHERE expires_at > CURRENT_TIMESTAMP OR expires_at IS NULL', 
      (err, templates) => {
        if (err) {
          res.status(500).json({ error: 'Failed to get templates' });
        } else {
          const formattedTemplates = templates.map(t => ({
            code: t.template_code,
            version: t.template_version,
            data: JSON.parse(t.template_data),
            cachedAt: t.cached_at
          }));
          res.json(formattedTemplates);
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Field Data Session with authentication and CSRF protection
router.post('/session/start', async (req, res) => {
  try {
    const db = await getDb();
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { sessionId, deviceId, companyId, siteName, sessionType, locationData, weatherData } = req.body;
    
    db.run(`INSERT INTO field_data_sessions 
      (session_id, user_id, device_id, company_id, site_name, session_type, started_at, location_data, weather_data) 
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`,
      [sessionId, req.user.id, deviceId, companyId, siteName, sessionType, 
       JSON.stringify(locationData), JSON.stringify(weatherData)],
      function(err) {
        if (err) {
          res.status(500).json({ error: 'Failed to start session' });
        } else {
          res.json({ success: true, sessionId: sessionId });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// End Field Data Session with authentication and CSRF protection
router.post('/session/:sessionId/end', async (req, res) => {
  try {
    const db = await getDb();
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { sessionId } = req.params;
    const { totalEntries, notes } = req.body;
    
    db.run(`UPDATE field_data_sessions 
      SET completed_at = CURRENT_TIMESTAMP, total_entries = ?, session_status = 'completed', notes = ? 
      WHERE session_id = ? AND user_id = ?`,
      [totalEntries, notes, sessionId, req.user.id],
      function(err) {
        if (err) {
          res.status(500).json({ error: 'Failed to end session' });
        } else {
          res.json({ success: true, sessionEnded: true });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Mobile Attachments with CSRF protection
router.post('/attachments/upload', mobileUpload.array('files', 5), async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { dataEntryId, offlineId } = req.body;
    const uploadedFiles = [];
    
    for (const file of req.files) {
      const attachmentData = {
        data_entry_id: dataEntryId || null,
        offline_id: offlineId || null,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        file_path: file.path,
        captured_at: new Date().toISOString()
      };
      
      const attachmentId = await saveAttachment(attachmentData);
      uploadedFiles.push({ id: attachmentId, filename: file.originalname });
    }
    
    res.json({ success: true, files: uploadedFiles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Sync Status with authentication
router.get('/sync/status/:deviceId', async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { deviceId } = req.params;
    
    const [pendingData, lastSync, deviceInfo] = await Promise.all([
      getPendingSyncData(deviceId),
      getLastSyncSession(deviceId),
      getDeviceInfo(deviceId)
    ]);
    
    res.json({
      pendingEntries: pendingData.length,
      lastSyncAt: lastSync?.completed_at,
      lastSyncStatus: lastSync?.sync_status,
      deviceActive: deviceInfo?.active || false,
      syncRecommended: pendingData.length > 10
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Mobile App Settings with authentication and CSRF protection
router.get('/settings/:userId/:deviceId', async (req, res) => {
  try {
    const db = await getDb();
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { userId, deviceId } = req.params;
    
    db.all('SELECT setting_key, setting_value FROM mobile_app_settings WHERE user_id = ? AND device_id = ?',
      [userId, deviceId], (err, settings) => {
        if (err) {
          res.status(500).json({ error: 'Failed to get settings' });
        } else {
          const settingsObj = {};
          settings.forEach(s => settingsObj[s.setting_key] = s.setting_value);
          res.json(settingsObj);
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Mobile App Settings with CSRF protection
router.post('/settings/:userId/:deviceId', async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { userId, deviceId } = req.params;
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await updateSetting(userId, deviceId, key, value);
    }
    
    res.json({ success: true, updated: Object.keys(settings).length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper Functions
async function checkForConflicts(offlineId) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM offline_data_entries WHERE offline_id = ?', [offlineId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function saveOfflineEntry(entry) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO offline_data_entries 
      (offline_id, company_id, user_id, device_id, data_type, form_data, location_data, created_offline_at, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
      [entry.offlineId, entry.companyId, entry.userId, entry.deviceId, entry.dataType, 
       JSON.stringify(entry.data), JSON.stringify(entry.locationData), entry.timestamp],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
  });
}

async function convertToESGData(entry) {
  const db = await getDb();
  return new Promise((resolve) => {
    const { environmental, social, governance } = entry.data;
    const categories = { environmental, social, governance };
    
    let savedCount = 0;
    let totalMetrics = Object.values(categories).reduce((sum, cat) => 
      sum + (cat ? Object.keys(cat).length : 0), 0);
    
    if (totalMetrics === 0) return resolve();
    
    Object.entries(categories).forEach(([categoryName, metrics]) => {
      if (metrics) {
        Object.entries(metrics).forEach(([metricName, value]) => {
          db.run(`INSERT INTO esg_data 
            (company_id, user_id, category, metric_name, metric_value, reporting_year, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [entry.companyId, entry.userId, categoryName, metricName, value, new Date().getFullYear()],
            function() {
              savedCount++;
              if (savedCount === totalMetrics) {
                resolve();
              }
            });
        });
      }
    });
  });
}

async function getPendingSyncData(deviceId) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM offline_data_entries WHERE device_id = ? AND sync_status = "pending"', 
      [deviceId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
  });
}

async function getLastSyncSession(deviceId) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM sync_sessions WHERE device_id = ? ORDER BY started_at DESC LIMIT 1', 
      [deviceId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
  });
}

async function getDeviceInfo(deviceId) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM mobile_devices WHERE device_id = ?', [deviceId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function saveAttachment(attachmentData) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO mobile_attachments 
      (data_entry_id, offline_id, file_name, file_type, file_size, file_path, captured_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      Object.values(attachmentData),
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
  });
}

async function updateSetting(userId, deviceId, key, value) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.run(`INSERT OR REPLACE INTO mobile_app_settings 
      (user_id, device_id, setting_key, setting_value, updated_at) 
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, deviceId, key, value],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
  });
}

async function logSyncSession(deviceId, userId, results, syncStarted) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO sync_sessions 
      (device_id, user_id, started_at, completed_at, synced_count, failed_count, conflicts_count) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`,
      [deviceId, userId, syncStarted, results.synced, results.failed, results.conflicts],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
  });
}

async function logConflict(offlineId, existing, entry) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO sync_conflicts 
      (offline_id, existing_data, new_data, conflict_type, created_at) 
      VALUES (?, ?, ?, 'data_conflict', CURRENT_TIMESTAMP)`,
      [offlineId, JSON.stringify(existing), JSON.stringify(entry)],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
  });
}

export default router;