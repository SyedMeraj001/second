const db = require('../database/db');
const rateLimit = require('express-rate-limit');

class ThreatDetectionSystem {
  constructor() {
    this.suspiciousPatterns = [
      /(\bSELECT\b.*\bFROM\b.*\bWHERE\b.*\b(OR|AND)\b.*=.*)/i, // SQL injection
      /<script[^>]*>.*?<\/script>/gi, // XSS
      /(\.\./.*){3,}/g, // Path traversal
      /\b(union|select|insert|update|delete|drop|create|alter)\b/gi, // SQL keywords
      /(javascript:|data:|vbscript:)/gi, // Dangerous protocols
    ];
    
    this.ipWhitelist = new Set(['127.0.0.1', '::1']);
    this.suspiciousIPs = new Map();
    this.rateLimiters = new Map();
    
    this.initializeDetectionRules();
  }

  initializeDetectionRules() {
    // Initialize rate limiters for different endpoints
    this.rateLimiters.set('login', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: 'Too many login attempts',
      standardHeaders: true,
      legacyHeaders: false,
    }));

    this.rateLimiters.set('api', rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute
      message: 'Rate limit exceeded',
    }));
  }

  // Main threat detection middleware
  detectThreats(req, res, next) {
    const startTime = Date.now();
    const clientIP = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || '';
    const requestPath = req.path;
    const requestMethod = req.method;
    
    // Skip detection for whitelisted IPs
    if (this.ipWhitelist.has(clientIP)) {
      return next();
    }

    const threats = [];
    
    // 1. Check for suspicious patterns in request
    threats.push(...this.checkSuspiciousPatterns(req));
    
    // 2. Check for anomalous behavior
    threats.push(...this.checkAnomalousBehavior(req, clientIP));
    
    // 3. Check IP reputation
    threats.push(...this.checkIPReputation(clientIP));
    
    // 4. Check request size and frequency
    threats.push(...this.checkRequestAnomalies(req, clientIP));

    // Process threats
    if (threats.length > 0) {
      const highestThreat = threats.reduce((max, threat) => 
        threat.level > max.level ? threat : max);
      
      this.logThreatEvent(req, threats, highestThreat);
      
      // Block high and critical threats
      if (highestThreat.level >= 4) {
        this.blockRequest(res, highestThreat);
        return;
      }
      
      // Add suspicious IP to monitoring
      if (highestThreat.level >= 3) {
        this.addSuspiciousIP(clientIP);
      }
    }

    // Log normal request for baseline
    this.logNormalRequest(req);
    next();
  }

  checkSuspiciousPatterns(req) {
    const threats = [];
    const checkData = [
      req.query ? JSON.stringify(req.query) : '',
      req.body ? JSON.stringify(req.body) : '',
      req.path,
      req.get('User-Agent') || ''
    ].join(' ');

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(checkData)) {
        threats.push({
          type: 'suspicious_pattern',
          level: 4, // High
          description: `Suspicious pattern detected: ${pattern.source}`,
          data: checkData.substring(0, 200)
        });
      }
    }

    return threats;
  }

  checkAnomalousBehavior(req, clientIP) {
    const threats = [];
    const userAgent = req.get('User-Agent') || '';
    
    // Check for missing or suspicious user agent
    if (!userAgent || userAgent.length < 10) {
      threats.push({
        type: 'suspicious_user_agent',
        level: 2, // Medium
        description: 'Missing or suspicious user agent',
        data: userAgent
      });
    }

    // Check for unusual request methods
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      threats.push({
        type: 'unusual_method',
        level: 3, // High
        description: `Unusual HTTP method: ${req.method}`,
        data: req.method
      });
    }

    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];
    for (const header of suspiciousHeaders) {
      if (req.get(header) && req.get(header) !== clientIP) {
        threats.push({
          type: 'header_spoofing',
          level: 3,
          description: `Potential header spoofing: ${header}`,
          data: req.get(header)
        });
      }
    }

    return threats;
  }

  checkIPReputation(clientIP) {
    const threats = [];
    
    // Check if IP is in suspicious list
    if (this.suspiciousIPs.has(clientIP)) {
      const suspiciousData = this.suspiciousIPs.get(clientIP);
      threats.push({
        type: 'suspicious_ip',
        level: 3,
        description: `IP flagged as suspicious`,
        data: `Previous incidents: ${suspiciousData.incidents}`
      });
    }

    // Check for private IP ranges accessing from internet
    if (this.isPrivateIP(clientIP) && req.get('x-forwarded-for')) {
      threats.push({
        type: 'private_ip_external',
        level: 2,
        description: 'Private IP accessing from external network',
        data: clientIP
      });
    }

    return threats;
  }

  checkRequestAnomalies(req, clientIP) {
    const threats = [];
    
    // Check request size
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
      threats.push({
        type: 'large_request',
        level: 2,
        description: 'Unusually large request',
        data: `${contentLength} bytes`
      });
    }

    // Check for too many parameters
    const paramCount = Object.keys(req.query || {}).length + Object.keys(req.body || {}).length;
    if (paramCount > 50) {
      threats.push({
        type: 'parameter_pollution',
        level: 3,
        description: 'Too many parameters in request',
        data: `${paramCount} parameters`
      });
    }

    return threats;
  }

  logThreatEvent(req, threats, highestThreat) {
    const eventId = this.generateEventId();
    const clientIP = this.getClientIP(req);
    
    const eventData = {
      event_id: eventId,
      event_type: highestThreat.type,
      threat_level: this.getThreatLevelName(highestThreat.level),
      source_ip: clientIP,
      request_path: req.path,
      request_method: req.method,
      user_agent: req.get('User-Agent'),
      detection_rule: highestThreat.description,
      blocked: highestThreat.level >= 4,
      detected_at: new Date().toISOString()
    };

    // Store in database
    db.run(`INSERT INTO threat_detection_events 
      (event_id, event_type, threat_level, source_ip, request_path, request_method, 
       user_agent, detection_rule, blocked, detected_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(eventData),
      (err) => {
        if (err) console.error('Failed to log threat event:', err);
      });

    // Alert for high-level threats
    if (highestThreat.level >= 4) {
      this.sendThreatAlert(eventData, threats);
    }
  }

  blockRequest(res, threat) {
    res.status(403).json({
      error: 'Request blocked by security system',
      reason: 'Suspicious activity detected',
      reference: this.generateEventId()
    });
  }

  addSuspiciousIP(ip) {
    const existing = this.suspiciousIPs.get(ip) || { incidents: 0, firstSeen: Date.now() };
    existing.incidents++;
    existing.lastSeen = Date.now();
    this.suspiciousIPs.set(ip, existing);
  }

  logNormalRequest(req) {
    // Sample normal requests for baseline (1% sampling)
    if (Math.random() < 0.01) {
      const eventData = {
        event_id: this.generateEventId(),
        event_type: 'normal_request',
        threat_level: 'info',
        source_ip: this.getClientIP(req),
        request_path: req.path,
        request_method: req.method,
        detected_at: new Date().toISOString()
      };

      db.run(`INSERT INTO threat_detection_events 
        (event_id, event_type, threat_level, source_ip, request_path, request_method, detected_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        Object.values(eventData));
    }
  }

  sendThreatAlert(eventData, threats) {
    // In production, this would send alerts via email, Slack, etc.
    console.warn('🚨 SECURITY ALERT:', {
      eventId: eventData.event_id,
      threatLevel: eventData.threat_level,
      sourceIP: eventData.source_ip,
      threats: threats.map(t => t.description)
    });
  }

  // Utility methods
  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '0.0.0.0';
  }

  isPrivateIP(ip) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  getThreatLevelName(level) {
    const levels = ['info', 'low', 'medium', 'high', 'critical'];
    return levels[level] || 'unknown';
  }

  generateEventId() {
    return 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get threat statistics
  async getThreatStatistics(timeframe = '24h') {
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 1;
    
    return new Promise((resolve, reject) => {
      db.all(`SELECT 
        threat_level,
        COUNT(*) as count,
        COUNT(CASE WHEN blocked = 1 THEN 1 END) as blocked_count
        FROM threat_detection_events 
        WHERE detected_at > datetime('now', '-${hours} hours')
        GROUP BY threat_level`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
    });
  }

  // Get top threat sources
  async getTopThreatSources(limit = 10) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT 
        source_ip,
        COUNT(*) as threat_count,
        MAX(threat_level) as max_threat_level
        FROM threat_detection_events 
        WHERE detected_at > datetime('now', '-24 hours')
        AND threat_level != 'info'
        GROUP BY source_ip
        ORDER BY threat_count DESC
        LIMIT ?`, [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
    });
  }
}

// Create global threat detection instance
const threatDetection = new ThreatDetectionSystem();

module.exports = {
  ThreatDetectionSystem,
  threatDetection
};