const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../database/db');

class EnhancedReportingSystem {
  // Interactive Dashboard Data
  static async generateDashboardData(companyId, stakeholderType = 'executive') {
    const baseData = await this.getCompanyData(companyId);
    
    const dashboards = {
      executive: this.generateExecutiveDashboard(baseData),
      investor: this.generateInvestorDashboard(baseData),
      regulator: this.generateRegulatoryDashboard(baseData),
      community: this.generateCommunityDashboard(baseData)
    };

    return dashboards[stakeholderType] || dashboards.executive;
  }

  // Multi-format Export
  static async exportReport(companyId, format, template) {
    const data = await this.getCompanyData(companyId);
    
    switch (format.toLowerCase()) {
      case 'pdf':
        return this.generatePDFReport(data, template);
      case 'excel':
        return this.generateExcelReport(data, template);
      case 'word':
        return this.generateWordReport(data, template);
      case 'powerpoint':
        return this.generatePowerPointReport(data, template);
      default:
        throw new Error('Unsupported format');
    }
  }

  // Real-time Monitoring Dashboard
  static async getRealTimeMetrics(companyId) {
    const metrics = await this.getLatestMetrics(companyId);
    const alerts = await this.getActiveAlerts(companyId);
    const trends = await this.getTrendIndicators(companyId);

    return {
      timestamp: new Date().toISOString(),
      metrics: {
        environmental: {
          emissions: metrics.scope1Emissions + metrics.scope2Emissions,
          energy: metrics.energyConsumption,
          water: metrics.waterWithdrawal,
          waste: metrics.wasteGenerated
        },
        social: {
          safety: metrics.lostTimeInjuryRate,
          diversity: metrics.femaleEmployeesPercentage,
          training: metrics.trainingHoursPerEmployee
        },
        governance: {
          board: metrics.independentDirectorsPercentage,
          ethics: metrics.ethicsTrainingCompletion,
          cyber: metrics.dataBreachIncidents
        }
      },
      alerts,
      trends,
      overallScore: this.calculateOverallScore(metrics)
    };
  }

  // Assurance Support
  static async generateAssurancePackage(companyId) {
    const auditTrail = await this.getAuditTrail(companyId);
    const dataLineage = await this.getDataLineage(companyId);
    const evidence = await this.getEvidenceFiles(companyId);
    const validationResults = await this.getValidationResults(companyId);

    return {
      auditTrail,
      dataLineage,
      evidence,
      validationResults,
      assuranceLevel: this.determineAssuranceLevel(validationResults),
      recommendations: this.generateAssuranceRecommendations(validationResults)
    };
  }

  // Stakeholder-specific dashboards
  static generateExecutiveDashboard(data) {
    return {
      kpis: [
        { name: 'ESG Score', value: data.overallScore, target: 85, trend: 'up' },
        { name: 'Carbon Intensity', value: data.carbonIntensity, target: 50, trend: 'down' },
        { name: 'Safety Rate', value: data.lostTimeInjuryRate, target: 1.0, trend: 'down' },
        { name: 'Board Diversity', value: data.boardDiversity, target: 40, trend: 'up' }
      ],
      charts: ['esg-trends', 'risk-heatmap', 'target-progress'],
      alerts: data.alerts?.filter(a => a.severity === 'high') || []
    };
  }

  static generateInvestorDashboard(data) {
    return {
      kpis: [
        { name: 'Climate Risk Score', value: data.climateRisk, benchmark: 'sector' },
        { name: 'TCFD Compliance', value: data.tcfdCompliance, target: 100 },
        { name: 'ESG Rating', value: data.esgRating, peer: 'A-' },
        { name: 'Sustainability ROI', value: data.sustainabilityROI, trend: 'up' }
      ],
      charts: ['scenario-analysis', 'peer-benchmarking', 'financial-impact'],
      disclosures: data.mandatoryDisclosures
    };
  }

  static generateRegulatoryDashboard(data) {
    return {
      compliance: [
        { framework: 'CSRD', status: data.csrdCompliance, deadline: '2025-01-01' },
        { framework: 'SEC Climate', status: data.secCompliance, deadline: '2025-03-31' },
        { framework: 'TCFD', status: data.tcfdCompliance, deadline: 'ongoing' }
      ],
      charts: ['compliance-status', 'regulatory-gaps', 'submission-timeline'],
      submissions: data.regulatorySubmissions
    };
  }

  static generateCommunityDashboard(data) {
    return {
      impact: [
        { area: 'Local Employment', value: data.localEmployment, unit: 'jobs' },
        { area: 'Community Investment', value: data.communityInvestment, unit: 'USD' },
        { area: 'Environmental Impact', value: data.environmentalImpact, unit: 'score' },
        { area: 'Stakeholder Satisfaction', value: data.stakeholderSatisfaction, unit: '%' }
      ],
      charts: ['community-impact', 'stakeholder-feedback', 'local-initiatives'],
      initiatives: data.communityInitiatives
    };
  }

  // Report generation methods
  static async generatePDFReport(data, template) {
    const doc = new PDFDocument();
    const filename = `esg-report-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../reports', filename);

    doc.pipe(fs.createWriteStream(filepath));

    // Header
    doc.fontSize(20).text('ESG Performance Report', 50, 50);
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);

    // Executive Summary
    doc.fontSize(16).text('Executive Summary', 50, 120);
    doc.fontSize(10).text(`Overall ESG Score: ${data.overallScore}/100`, 50, 150);
    doc.text(`Environmental Score: ${data.environmentalScore}/100`, 50, 170);
    doc.text(`Social Score: ${data.socialScore}/100`, 50, 190);
    doc.text(`Governance Score: ${data.governanceScore}/100`, 50, 210);

    // Key Metrics Table
    doc.fontSize(16).text('Key Metrics', 50, 250);
    let yPos = 280;
    Object.entries(data.metrics || {}).forEach(([key, value]) => {
      doc.fontSize(10).text(`${key}: ${value}`, 50, yPos);
      yPos += 20;
    });

    doc.end();
    return { filename, filepath };
  }

  static async generateExcelReport(data, template) {
    // Simplified Excel generation - in production use a library like xlsx
    const csvData = this.convertToCSV(data);
    const filename = `esg-report-${Date.now()}.csv`;
    const filepath = path.join(__dirname, '../reports', filename);
    
    fs.writeFileSync(filepath, csvData);
    return { filename, filepath };
  }

  static convertToCSV(data) {
    const headers = ['Metric', 'Value', 'Unit', 'Target', 'Status'];
    const rows = [headers.join(',')];
    
    Object.entries(data.metrics || {}).forEach(([key, value]) => {
      rows.push(`${key},${value},${data.units?.[key] || ''},${data.targets?.[key] || ''},${data.status?.[key] || ''}`);
    });
    
    return rows.join('\n');
  }

  // Helper methods
  static async getCompanyData(companyId) {
    return new Promise((resolve) => {
      db.all(`SELECT * FROM esg_data WHERE company_id = ? 
        AND reporting_year = ?`, [companyId, new Date().getFullYear()], 
        (err, rows) => {
          const data = { metrics: {}, overallScore: 75 };
          (rows || []).forEach(row => {
            data.metrics[row.metric_name] = row.metric_value;
          });
          resolve(data);
        });
    });
  }

  static async getLatestMetrics(companyId) {
    return new Promise((resolve) => {
      db.all(`SELECT metric_name, metric_value FROM esg_data 
        WHERE company_id = ? ORDER BY created_at DESC LIMIT 20`, 
        [companyId], (err, rows) => {
          const metrics = {};
          (rows || []).forEach(row => metrics[row.metric_name] = row.metric_value);
          resolve(metrics);
        });
    });
  }

  static async getActiveAlerts(companyId) {
    // Simplified - in production would query alerts table
    return [
      { type: 'threshold', message: 'Scope 1 emissions above target', severity: 'medium' },
      { type: 'compliance', message: 'CSRD submission due in 30 days', severity: 'high' }
    ];
  }

  static calculateOverallScore(metrics) {
    const scores = Object.values(metrics).filter(v => typeof v === 'number');
    return scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  }
}

module.exports = EnhancedReportingSystem;