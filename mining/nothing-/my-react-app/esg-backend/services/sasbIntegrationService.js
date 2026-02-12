import db from '../database/db.js';

class SASBIntegrationService {
  constructor() {
    this.industries = {
      'extractives-minerals': {
        name: 'Extractives & Minerals Processing',
        standards: ['EM-MM', 'EM-IS', 'EM-CP'],
        topics: [
          'GHG Emissions',
          'Air Quality',
          'Energy Management',
          'Water & Wastewater Management',
          'Waste & Hazardous Materials',
          'Biodiversity Impacts',
          'Security, Human Rights & Rights of Indigenous Peoples',
          'Community Relations',
          'Labor Relations',
          'Workforce Health & Safety',
          'Business Ethics & Transparency'
        ]
      },
      'oil-gas': {
        name: 'Oil & Gas',
        standards: ['EM-EP', 'EM-MD', 'EM-RM'],
        topics: [
          'GHG Emissions',
          'Air Quality',
          'Water & Wastewater Management',
          'Biodiversity Impacts',
          'Security, Human Rights & Rights of Indigenous Peoples',
          'Community Relations',
          'Workforce Health & Safety',
          'Reserves Valuation & Capital Expenditures',
          'Business Ethics & Transparency'
        ]
      }
    };

    this.metrics = {
      'EM-MM-110a.1': {
        topic: 'GHG Emissions',
        metric: 'Gross global Scope 1 emissions',
        unit: 'Metric tons (t) CO₂-e',
        category: 'Quantitative'
      },
      'EM-MM-110a.2': {
        topic: 'GHG Emissions', 
        metric: 'Discussion of long-term and short-term strategy or plan to manage Scope 1 emissions',
        unit: 'n/a',
        category: 'Discussion and Analysis'
      },
      'EM-MM-120a.1': {
        topic: 'Air Quality',
        metric: 'Air emissions of particulates (PM10, PM2.5), NOx, SOx, volatile organic compounds (VOCs), and hazardous air pollutants (HAPs)',
        unit: 'Metric tons (t)',
        category: 'Quantitative'
      },
      'EM-MM-130a.1': {
        topic: 'Energy Management',
        metric: 'Total energy consumed, percentage grid electricity, percentage renewable',
        unit: 'Gigajoules (GJ), Percentage (%)',
        category: 'Quantitative'
      },
      'EM-MM-140a.1': {
        topic: 'Water & Wastewater Management',
        metric: 'Total fresh water withdrawn, percentage recycled, percentage in regions with High or Extremely High Baseline Water Stress',
        unit: 'Thousand cubic meters (m³), Percentage (%)',
        category: 'Quantitative'
      },
      'EM-MM-150a.1': {
        topic: 'Waste & Hazardous Materials',
        metric: 'Total weight of tailings waste, percentage recycled',
        unit: 'Metric tons (t), Percentage (%)',
        category: 'Quantitative'
      },
      'EM-MM-160a.1': {
        topic: 'Biodiversity Impacts',
        metric: 'Description of environmental management policies and practices for active sites',
        unit: 'n/a',
        category: 'Discussion and Analysis'
      },
      'EM-MM-210a.1': {
        topic: 'Security, Human Rights & Rights of Indigenous Peoples',
        metric: 'Percentage of reserves in or near areas of conflict',
        unit: 'Percentage (%)',
        category: 'Quantitative'
      },
      'EM-MM-210a.2': {
        topic: 'Security, Human Rights & Rights of Indigenous Peoples',
        metric: 'Percentage of reserves in or near indigenous land',
        unit: 'Percentage (%)',
        category: 'Quantitative'
      },
      'EM-MM-210b.1': {
        topic: 'Community Relations',
        metric: 'Discussion of process to manage risks and opportunities associated with community rights and interests',
        unit: 'n/a',
        category: 'Discussion and Analysis'
      },
      'EM-MM-310a.1': {
        topic: 'Workforce Health & Safety',
        metric: 'MSHA all-incidence rate, fatality rate, near miss frequency rate (NMFR), and average hours of health, safety, and emergency response training',
        unit: 'Rate, Hours',
        category: 'Quantitative'
      }
    };
  }

  async initializeSASBFramework(companyId, industry) {
    const industryData = this.industries[industry];
    if (!industryData) {
      throw new Error(`Industry ${industry} not supported`);
    }

    // Create SASB compliance record
    const complianceId = await this.createSASBCompliance(companyId, industry);
    
    // Initialize metrics for the industry
    await this.initializeIndustryMetrics(complianceId, industry);
    
    return {
      complianceId,
      industry: industryData.name,
      standards: industryData.standards,
      metricsCount: Object.keys(this.getIndustryMetrics(industry)).length
    };
  }

  async updateSASBMetric(companyId, metricCode, value, reportingPeriod) {
    const metric = this.metrics[metricCode];
    if (!metric) {
      throw new Error(`SASB metric ${metricCode} not found`);
    }

    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO sasb_metrics 
        (company_id, metric_code, metric_name, topic, value, unit, category, reporting_period, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [
        companyId,
        metricCode,
        metric.metric,
        metric.topic,
        typeof value === 'object' ? JSON.stringify(value) : value,
        metric.unit,
        metric.category,
        reportingPeriod
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            metricCode,
            value,
            updated: true
          });
        }
      });
    });
  }

  async getSASBCompliance(companyId, reportingPeriod) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          sc.industry,
          sc.standards,
          COUNT(sm.id) as reported_metrics,
          COUNT(CASE WHEN sm.value IS NOT NULL AND sm.value != '' THEN 1 END) as completed_metrics
        FROM sasb_compliance sc
        LEFT JOIN sasb_metrics sm ON sc.company_id = sm.company_id 
          AND sm.reporting_period = ?
        WHERE sc.company_id = ?
        GROUP BY sc.id
      `;
      
      db.get(query, [reportingPeriod, companyId], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          const industryMetrics = this.getIndustryMetrics(row.industry);
          const totalMetrics = Object.keys(industryMetrics).length;
          const completionRate = totalMetrics > 0 ? (row.completed_metrics / totalMetrics * 100) : 0;
          
          resolve({
            ...row,
            standards: JSON.parse(row.standards),
            totalMetrics,
            completionRate: Math.round(completionRate),
            status: completionRate >= 80 ? 'compliant' : completionRate >= 50 ? 'partial' : 'non-compliant'
          });
        }
      });
    });
  }

  async getSASBReport(companyId, reportingPeriod) {
    const compliance = await this.getSASBCompliance(companyId, reportingPeriod);
    if (!compliance) {
      throw new Error('No SASB compliance record found');
    }

    const metrics = await this.getSASBMetrics(companyId, reportingPeriod);
    const topicSummary = this.generateTopicSummary(metrics);
    
    return {
      compliance,
      metrics,
      topicSummary,
      recommendations: this.generateRecommendations(compliance, metrics),
      generatedAt: new Date().toISOString()
    };
  }

  async getSASBMetrics(companyId, reportingPeriod) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM sasb_metrics 
        WHERE company_id = ? AND reporting_period = ?
        ORDER BY topic, metric_code
      `;
      
      db.all(query, [companyId, reportingPeriod], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const metrics = rows.map(row => ({
            ...row,
            value: row.category === 'Quantitative' && typeof row.value === 'string' 
              ? parseFloat(row.value) || row.value 
              : row.value
          }));
          resolve(metrics);
        }
      });
    });
  }

  generateTopicSummary(metrics) {
    const summary = {};
    
    metrics.forEach(metric => {
      if (!summary[metric.topic]) {
        summary[metric.topic] = {
          totalMetrics: 0,
          completedMetrics: 0,
          completionRate: 0
        };
      }
      
      summary[metric.topic].totalMetrics++;
      if (metric.value !== null && metric.value !== '') {
        summary[metric.topic].completedMetrics++;
      }
    });
    
    Object.keys(summary).forEach(topic => {
      const data = summary[topic];
      data.completionRate = data.totalMetrics > 0 
        ? Math.round((data.completedMetrics / data.totalMetrics) * 100)
        : 0;
    });
    
    return summary;
  }

  generateRecommendations(compliance, metrics) {
    const recommendations = [];
    
    if (compliance.completionRate < 50) {
      recommendations.push('Priority: Complete basic SASB metric collection to achieve minimum compliance threshold');
    }
    
    const incompleteTopics = Object.entries(this.generateTopicSummary(metrics))
      .filter(([topic, data]) => data.completionRate < 80)
      .map(([topic]) => topic);
    
    if (incompleteTopics.length > 0) {
      recommendations.push(`Focus on completing metrics for: ${incompleteTopics.join(', ')}`);
    }
    
    if (compliance.completionRate >= 80) {
      recommendations.push('Consider third-party assurance for SASB disclosures to enhance credibility');
    }
    
    return recommendations;
  }

  getIndustryMetrics(industry) {
    return Object.fromEntries(
      Object.entries(this.metrics).filter(([code]) => 
        code.startsWith('EM-MM') && industry === 'extractives-minerals' ||
        code.startsWith('EM-EP') && industry === 'oil-gas'
      )
    );
  }

  async createSASBCompliance(companyId, industry) {
    const industryData = this.industries[industry];
    
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO sasb_compliance 
        (company_id, industry, standards, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [
        companyId,
        industry,
        JSON.stringify(industryData.standards)
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async initializeIndustryMetrics(complianceId, industry) {
    const industryMetrics = this.getIndustryMetrics(industry);
    
    for (const [code, metric] of Object.entries(industryMetrics)) {
      await new Promise((resolve, reject) => {
        const query = `
          INSERT OR IGNORE INTO sasb_metric_definitions 
          (metric_code, topic, metric_name, unit, category, industry)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.run(query, [
          code,
          metric.topic,
          metric.metric,
          metric.unit,
          metric.category,
          industry
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

export default new SASBIntegrationService();