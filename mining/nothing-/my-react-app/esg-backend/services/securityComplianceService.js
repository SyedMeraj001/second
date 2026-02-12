// Lazy loading singleton
let dbInstance = null;

const getDb = async () => {
  if (!dbInstance) {
    const { default: db } = await import('../database/db.js');
    dbInstance = db;
  }
  return dbInstance;
};

class SecurityComplianceService {
  // ISO 27001 Control Management
  static async assessISO27001Control(controlId, assessmentData, assessorId) {
    const db = await getDb();
    const { implementationStatus, riskLevel, evidence, notes } = assessmentData;
    
    return new Promise((resolve, reject) => {
      db.run(`UPDATE iso27001_controls 
        SET implementation_status = ?, risk_level = ?, last_assessment_date = DATE('now'),
            next_assessment_date = DATE('now', '+1 year'), evidence_location = ?,
            owner_id = ?
        WHERE control_id = ?`,
        [implementationStatus, riskLevel, evidence, assessorId, controlId],
        function(err) {
          if (err) reject(err);
          else {
            // Log assessment
            this.logComplianceActivity('ISO27001', controlId, 'assessment', assessorId);
            resolve({ updated: this.changes > 0 });
          }
        });
    });
  }

  // SOC 2 Control Testing
  static async testSOC2Control(controlId, testData, testerId) {
    const db = await getDb();
    const { testingStatus, evidence, exceptions, notes } = testData;
    
    return new Promise((resolve, reject) => {
      db.run(`UPDATE soc2_controls 
        SET testing_status = ?, last_test_date = DATE('now'),
            next_test_date = DATE('now', '+3 months'), evidence_collected = ?,
            owner_id = ?
        WHERE control_id = ?`,
        [testingStatus, evidence ? 1 : 0, testerId, controlId],
        function(err) {
          if (err) reject(err);
          else {
            // Log test activity
            this.logComplianceActivity('SOC2', controlId, 'testing', testerId);
            resolve({ updated: this.changes > 0 });
          }
        });
    });
  }

  // Generate Compliance Dashboard
  static async getComplianceDashboard() {
    const [iso27001Status, soc2Status, recentIncidents, securityMetrics] = await Promise.all([
      this.getISO27001Status(),
      this.getSOC2Status(),
      this.getRecentSecurityIncidents(),
      this.getSecurityMetrics()
    ]);

    return {
      iso27001: iso27001Status,
      soc2: soc2Status,
      incidents: recentIncidents,
      metrics: securityMetrics,
      overallCompliance: this.calculateOverallCompliance(iso27001Status, soc2Status),
      lastUpdated: new Date().toISOString()
    };
  }

  // ISO 27001 Status
  static async getISO27001Status() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.all(`SELECT 
        implementation_status,
        risk_level,
        COUNT(*) as count
        FROM iso27001_controls 
        GROUP BY implementation_status, risk_level`,
        (err, rows) => {
          if (err) reject(err);
          else {
            const total = rows.reduce((sum, row) => sum + row.count, 0);
            const implemented = rows
              .filter(row => row.implementation_status === 'implemented')
              .reduce((sum, row) => sum + row.count, 0);
            
            resolve({
              total,
              implemented,
              compliance: total > 0 ? Math.round((implemented / total) * 100) : 0,
              breakdown: rows,
              status: implemented === total ? 'compliant' : 'in_progress'
            });
          }
        });
    });
  }

  // SOC 2 Status
  static async getSOC2Status() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.all(`SELECT 
        trust_service_category,
        testing_status,
        COUNT(*) as count
        FROM soc2_controls 
        GROUP BY trust_service_category, testing_status`,
        (err, rows) => {
          if (err) reject(err);
          else {
            const byCategory = {};
            rows.forEach(row => {
              if (!byCategory[row.trust_service_category]) {
                byCategory[row.trust_service_category] = { total: 0, passed: 0 };
              }
              byCategory[row.trust_service_category].total += row.count;
              if (row.testing_status === 'passed') {
                byCategory[row.trust_service_category].passed += row.count;
              }
            });

            const totalControls = rows.reduce((sum, row) => sum + row.count, 0);
            const passedControls = rows
              .filter(row => row.testing_status === 'passed')
              .reduce((sum, row) => sum + row.count, 0);

            resolve({
              total: totalControls,
              passed: passedControls,
              compliance: totalControls > 0 ? Math.round((passedControls / totalControls) * 100) : 0,
              categories: byCategory,
              status: passedControls === totalControls ? 'compliant' : 'testing_required'
            });
          }
        });
    });
  }

  // Security Incidents
  static async getRecentSecurityIncidents(days = 30) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.all(`SELECT 
        incident_id, incident_type, severity, status, title, detected_at
        FROM security_incidents 
        WHERE detected_at > datetime('now', '-${days} days')
        ORDER BY detected_at DESC
        LIMIT 10`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
    });
  }

  // Security Metrics
  static async getSecurityMetrics() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.all(`SELECT 
        metric_name, metric_value, metric_unit, target_value, status, measurement_date
        FROM security_metrics 
        WHERE measurement_date = DATE('now')
        ORDER BY metric_name`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
    });
  }

  // Log Security Incident
  static async logSecurityIncident(incidentData, reporterId) {
    const db = await getDb();
    const incident = {
      incident_id: this.generateIncidentId(),
      incident_type: incidentData.type,
      severity: incidentData.severity,
      title: incidentData.title,
      description: incidentData.description,
      affected_systems: incidentData.affectedSystems,
      detected_at: incidentData.detectedAt || new Date().toISOString(),
      reported_by: reporterId
    };

    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO security_incidents 
        (incident_id, incident_type, severity, title, description, affected_systems, detected_at, reported_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(incident),
        function(err) {
          if (err) reject(err);
          else {
            // Auto-assign based on severity
            if (incident.severity === 'critical' || incident.severity === 'high') {
              this.autoAssignIncident(incident.incident_id);
            }
            resolve({ id: this.lastID, incidentId: incident.incident_id });
          }
        });
    });
  }

  // Update Security Metric
  static async updateSecurityMetric(metricName, value, unit = null) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      // Get thresholds for the metric
      db.get(`SELECT threshold_warning, threshold_critical, target_value 
        FROM security_metrics 
        WHERE metric_name = ? 
        ORDER BY measurement_date DESC 
        LIMIT 1`,
        [metricName], (err, existing) => {
          if (err) {
            reject(err);
            return;
          }

          const status = this.determineMetricStatus(value, existing);
          
          db.run(`INSERT INTO security_metrics 
            (metric_name, metric_value, metric_unit, measurement_date, target_value, 
             threshold_warning, threshold_critical, status) 
            VALUES (?, ?, ?, DATE('now'), ?, ?, ?, ?)`,
            [metricName, value, unit, existing?.target_value, 
             existing?.threshold_warning, existing?.threshold_critical, status],
            function(err) {
              if (err) reject(err);
              else resolve({ id: this.lastID, status });
            });
        });
    });
  }

  // Generate Compliance Report
  static async generateComplianceReport(framework, startDate, endDate) {
    const reportData = {
      framework,
      period: { start: startDate, end: endDate },
      generated: new Date().toISOString()
    };

    if (framework === 'ISO27001') {
      reportData.controls = await this.getISO27001ControlsReport(startDate, endDate);
    } else if (framework === 'SOC2') {
      reportData.controls = await this.getSOC2ControlsReport(startDate, endDate);
    }

    reportData.incidents = await this.getIncidentsReport(startDate, endDate);
    reportData.metrics = await this.getMetricsReport(startDate, endDate);
    reportData.evidence = await this.getComplianceEvidence(framework, startDate, endDate);

    return reportData;
  }

  // Store Compliance Evidence
  static async storeComplianceEvidence(evidenceData, collectorId) {
    const evidence = {
      control_id: evidenceData.controlId,
      framework: evidenceData.framework,
      evidence_type: evidenceData.type,
      evidence_description: evidenceData.description,
      file_path: evidenceData.filePath,
      collected_by: collectorId,
      collection_date: evidenceData.collectionDate || new Date().toISOString().split('T')[0],
      retention_period: evidenceData.retentionPeriod || 2555, // 7 years default
      expiry_date: this.calculateExpiryDate(evidenceData.retentionPeriod)
    };

    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO compliance_evidence 
        (control_id, framework, evidence_type, evidence_description, file_path, 
         collected_by, collection_date, retention_period, expiry_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(evidence),
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...evidence });
        });
    });
  }

  // Helper Methods
  static calculateOverallCompliance(iso27001, soc2) {
    const avgCompliance = (iso27001.compliance + soc2.compliance) / 2;
    return {
      percentage: Math.round(avgCompliance),
      status: avgCompliance >= 95 ? 'compliant' : avgCompliance >= 80 ? 'mostly_compliant' : 'non_compliant'
    };
  }

  static determineMetricStatus(value, existing) {
    if (!existing) return 'normal';
    
    if (existing.threshold_critical && value >= existing.threshold_critical) return 'critical';
    if (existing.threshold_warning && value >= existing.threshold_warning) return 'warning';
    return 'normal';
  }

  static generateIncidentId() {
    return 'INC-' + new Date().getFullYear() + '-' + 
           String(Date.now()).slice(-6) + 
           Math.random().toString(36).substr(2, 3).toUpperCase();
  }

  static calculateExpiryDate(retentionDays) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + retentionDays);
    return expiry.toISOString().split('T')[0];
  }

  static logComplianceActivity(framework, controlId, activity, userId) {
    // Log compliance activities for audit trail
    console.log(`Compliance Activity: ${framework} ${controlId} ${activity} by user ${userId}`);
  }
}

export default SecurityComplianceService;