import WebSocket from 'ws';
import db from '../database/db.js';
import url from 'url';

class RealtimeSyncService {
  constructor() {
    this.clients = new Map();
    this.wss = null;
    this.allowedOrigins = ['http://localhost:3000', 'https://yourdomain.com'];
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server, 
      path: '/ws/sync',
      verifyClient: (info) => {
        // Origin verification for CSRF protection
        const origin = info.origin;
        if (!origin) return false;
        return this.allowedOrigins.includes(origin);
      }
    });
    
    this.wss.on('connection', (ws, req) => {
      const parsedUrl = url.parse(req.url, true);
      const userId = parsedUrl.query.userId;
      
      // Validate userId to prevent injection
      const userIdPattern = /^[a-zA-Z0-9-_]+$/;
      if (!userId || !userIdPattern.test(userId)) {
        ws.close(1008, 'Invalid user ID');
        return;
      }
      
      this.clients.set(userId, ws);
      console.log(`Client connected: ${userId}`);
      
      ws.on('message', (message) => {
        this.handleMessage(userId, message);
      });
      
      ws.on('close', () => {
        this.clients.delete(userId);
        console.log(`Client disconnected: ${userId}`);
      });
      
      ws.send(JSON.stringify({ type: 'connected', userId }));
    });
  }

  handleMessage(userId, message) {
    try {
      const data = JSON.parse(message);
      
      const handlers = {
        sync: () => {
          this.logSyncEvent(data.entityType, data.entityId, data.action, userId);
          this.broadcastToOthers(userId, data);
        },
        ping: () => {
          this.clients.get(userId)?.send(JSON.stringify({ type: 'pong' }));
        }
      };
      
      const handler = handlers[data.type];
      if (handler) {
        handler();
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  broadcastToOthers(senderId, data) {
    this.clients.forEach((ws, userId) => {
      if (userId !== senderId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'update',
          ...data,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  broadcastToAll(data) {
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  notifyUser(userId, data) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  logSyncEvent(entityType, entityId, action, userId) {
    // Validate inputs to prevent SQL injection
    const validEntityTypes = ['emissions', 'waste', 'energy', 'water', 'biodiversity'];
    const validActions = ['create', 'update', 'delete'];
    
    if (!validEntityTypes.includes(entityType) || !validActions.includes(action)) {
      console.error('Invalid entity type or action');
      return;
    }
    
    // Use parameterized query to prevent SQL injection
    const stmt = db.prepare(`
      INSERT INTO sync_log (entity_type, entity_id, action, user_id, synced)
      VALUES (?, ?, ?, ?, 1)
    `);
    
    stmt.run([entityType, entityId, action, userId], (err) => {
      if (err) console.error('Error logging sync event:', err);
    });
    
    stmt.finalize();
  }

  async getSyncLog(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM sync_log WHERE 1=1';
      const params = [];
      
      // Validate and sanitize filters to prevent SQL injection
      const validEntityTypes = ['emissions', 'waste', 'energy', 'water', 'biodiversity'];
      
      if (filters.entityType && validEntityTypes.includes(filters.entityType)) {
        query += ' AND entity_type = ?';
        params.push(filters.entityType);
      }
      if (filters.entityId && /^[a-zA-Z0-9-_]+$/.test(String(filters.entityId))) {
        query += ' AND entity_id = ?';
        params.push(String(filters.entityId));
      }
      
      query += ' ORDER BY timestamp DESC LIMIT 100';
      
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

export default new RealtimeSyncService();
