// Lazy load database only when needed
let dbInstance = null;
const getDb = () => {
  if (!dbInstance) {
    try {
      dbInstance = require('../database/db');
    } catch (error) {
      throw new Error(`Failed to load database: ${error.message}`);
    }
  }
  return dbInstance;
};

class AuditService {
  static async logAction(tableName, recordId, action, oldValues, newValues, userId, req = null) {
    const db = getDb();
    const ipAddress = req ? (req.ip || req.connection.remoteAddress) : null;
    const userAgent = req ? req.get('User-Agent') : null;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO audit_trail (table_name, record_id, action, old_values, new_values, user_id, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tableName,
          recordId,
          action,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          userId,
          ipAddress,
          userAgent
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static async getAuditTrail(tableName, recordId, limit = 50) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      const query = `
        SELECT a.*, u.full_name, u.email 
        FROM audit_trail a
        JOIN users u ON a.user_id = u.id
        WHERE a.table_name = ? AND a.record_id = ?
        ORDER BY a.created_at DESC
        LIMIT ?
      `;
      
      db.all(query, [tableName, recordId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  static async getUserActivity(userId, limit = 100) {
    const db = getDb();
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM audit_trail 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      db.all(query, [userId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Middleware to automatically log data changes
  static auditMiddleware(tableName) {
    return async (req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Log successful operations
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const action = req.method === 'POST' ? 'CREATE' : 
                        req.method === 'PUT' ? 'UPDATE' : 
                        req.method === 'DELETE' ? 'DELETE' : 'READ';
          
          if (action !== 'READ') {
            const recordId = req.params.id || req.body.id || 'unknown';
            AuditService.logAction(
              tableName,
              recordId,
              action,
              req.originalData || null,
              req.body || null,
              req.user?.id || 1,
              req
            ).catch(console.error);
          }
        }
        
        originalSend.call(this, data);
      };
      
      next();
    };
  }
}

export default AuditService;