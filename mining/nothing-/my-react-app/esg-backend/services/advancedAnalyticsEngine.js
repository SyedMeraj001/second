// Lazy loading singleton
let dbInstance = null;

const getDb = async () => {
  if (!dbInstance) {
    const { default: db } = await import('../database/db.js');
    dbInstance = db;
  }
  return dbInstance;
};

class AdvancedAnalyticsEngine {
  // TCFD Scenario Analysis
  static async performScenarioAnalysis(companyId, scenarios = ['1.5C', '2C', '3C']) {
    const baseData = await this.getCompanyEmissions(companyId);
    const results = {};

    for (const scenario of scenarios) {
      const multipliers = this.getScenarioMultipliers(scenario);
      results[scenario] = {
        physicalRisk: baseData.scope1 * multipliers.physical,
        transitionRisk: baseData.scope2 * multipliers.transition,
        financialImpact: this.calculateFinancialImpact(baseData, multipliers),
        timeHorizon: scenario === '1.5C' ? 'short' : scenario === '2C' ? 'medium' : 'long'
      };
    }

    return results;
  }

  // Trend Forecasting
  static async forecastTrends(companyId, metric, years = 3) {
    const historicalData = await this.getHistoricalData(companyId, metric);
    if (historicalData.length < 2) return null;

    const trend = this.calculateTrend(historicalData);
    const forecast = [];

    for (let i = 1; i <= years; i++) {
      const year = new Date().getFullYear() + i;
      const value = trend.slope * i + trend.intercept;
      forecast.push({
        year,
        predicted: Math.max(0, value),
        confidence: Math.max(0.3, 0.9 - (i * 0.15))
      });
    }

    return { historical: historicalData, forecast, trend };
  }

  // Peer Benchmarking
  static async performBenchmarking(companyId, sector) {
    const companyData = await this.getCompanyMetrics(companyId);
    const peerData = await this.getSectorBenchmarks(sector);
    
    const benchmarks = {};
    for (const [metric, value] of Object.entries(companyData)) {
      const peer = peerData[metric];
      if (peer) {
        benchmarks[metric] = {
          company: value,
          sectorMedian: peer.median,
          sectorTop25: peer.top25,
          percentile: this.calculatePercentile(value, peer.distribution),
          performance: value <= peer.top25 ? 'leading' : value <= peer.median ? 'average' : 'lagging'
        };
      }
    }

    return benchmarks;
  }

  // Risk Scoring
  static async calculateRiskScore(companyId) {
    const data = await this.getCompanyMetrics(companyId);
    const weights = { environmental: 0.4, social: 0.3, governance: 0.3 };
    
    const risks = {
      environmental: this.assessEnvironmentalRisk(data),
      social: this.assessSocialRisk(data),
      governance: this.assessGovernanceRisk(data)
    };

    const overallRisk = Object.entries(risks).reduce((sum, [category, score]) => 
      sum + (score * weights[category]), 0);

    return {
      overall: Math.round(overallRisk),
      breakdown: risks,
      level: overallRisk > 70 ? 'high' : overallRisk > 40 ? 'medium' : 'low'
    };
  }

  // Target Tracking
  static async trackTargets(companyId) {
    const targets = await this.getCompanyTargets(companyId);
    const current = await this.getCompanyMetrics(companyId);
    
    return targets.map(target => ({
      metric: target.metric,
      target: target.value,
      current: current[target.metric] || 0,
      progress: this.calculateProgress(current[target.metric], target.baseline, target.value),
      deadline: target.deadline,
      onTrack: this.isOnTrack(current[target.metric], target.baseline, target.value, target.deadline)
    }));
  }

  // Helper methods
  static getScenarioMultipliers(scenario) {
    const multipliers = {
      '1.5C': { physical: 1.2, transition: 2.0 },
      '2C': { physical: 1.5, transition: 1.5 },
      '3C': { physical: 2.5, transition: 1.0 }
    };
    return multipliers[scenario] || multipliers['2C'];
  }

  static calculateFinancialImpact(baseData, multipliers) {
    return (baseData.scope1 + baseData.scope2) * multipliers.transition * 50; // $50/tCO2e
  }

  static calculateTrend(data) {
    const n = data.length;
    const sumX = data.reduce((sum, d, i) => sum + i, 0);
    const sumY = data.reduce((sum, d) => sum + d.value, 0);
    const sumXY = data.reduce((sum, d, i) => sum + (i * d.value), 0);
    const sumXX = data.reduce((sum, d, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  static calculatePercentile(value, distribution) {
    const sorted = distribution.sort((a, b) => a - b);
    const below = sorted.filter(v => v < value).length;
    return Math.round((below / sorted.length) * 100);
  }

  static assessEnvironmentalRisk(data) {
    let risk = 0;
    if (data.scope1Emissions > 10000) risk += 30;
    if (data.scope2Emissions > 5000) risk += 20;
    if (data.waterWithdrawal > 100000) risk += 25;
    if (data.wasteGenerated > 1000) risk += 25;
    return Math.min(100, risk);
  }

  static assessSocialRisk(data) {
    let risk = 0;
    if (data.lostTimeInjuryRate > 5) risk += 40;
    if (data.femaleEmployeesPercentage < 20) risk += 30;
    if (data.employeeTurnoverRate > 20) risk += 30;
    return Math.min(100, risk);
  }

  static assessGovernanceRisk(data) {
    let risk = 0;
    if (data.independentDirectorsPercentage < 30) risk += 35;
    if (data.dataBreachIncidents > 0) risk += 40;
    if (data.ethicsTrainingCompletion < 80) risk += 25;
    return Math.min(100, risk);
  }

  static calculateProgress(current, baseline, target) {
    if (!baseline || !target) return 0;
    return Math.round(((current - baseline) / (target - baseline)) * 100);
  }

  static isOnTrack(current, baseline, target, deadline) {
    const progress = this.calculateProgress(current, baseline, target);
    const timeElapsed = (new Date().getFullYear() - baseline.year) / (deadline.year - baseline.year);
    return progress >= (timeElapsed * 100 * 0.8); // 80% of expected progress
  }

  // Database helper methods
  static async getCompanyEmissions(companyId) {
    const db = await getDb();
    return new Promise((resolve) => {
      db.get(`SELECT 
        SUM(CASE WHEN scope = 1 THEN co2_equivalent ELSE 0 END) as scope1,
        SUM(CASE WHEN scope = 2 THEN co2_equivalent ELSE 0 END) as scope2,
        SUM(CASE WHEN scope = 3 THEN co2_equivalent ELSE 0 END) as scope3
        FROM emissions_data WHERE company_id = ?`, [companyId], 
        (err, row) => resolve(row || { scope1: 0, scope2: 0, scope3: 0 }));
    });
  }

  static async getHistoricalData(companyId, metric) {
    const db = await getDb();
    return new Promise((resolve) => {
      db.all(`SELECT reporting_year as year, metric_value as value 
        FROM esg_data WHERE company_id = ? AND metric_name = ? 
        ORDER BY reporting_year`, [companyId, metric], 
        (err, rows) => resolve(rows || []));
    });
  }

  static async getCompanyMetrics(companyId) {
    const db = await getDb();
    return new Promise((resolve) => {
      db.all(`SELECT metric_name, metric_value FROM esg_data 
        WHERE company_id = ? AND reporting_year = ?`, 
        [companyId, new Date().getFullYear()], (err, rows) => {
          const metrics = {};
          (rows || []).forEach(row => metrics[row.metric_name] = row.metric_value);
          resolve(metrics);
        });
    });
  }

  static getSectorBenchmarks(sector) {
    // Simplified - in production, this would query industry benchmark data
    return Promise.resolve({
      scope1Emissions: { median: 5000, top25: 2000, distribution: [1000, 2000, 5000, 8000, 12000] },
      femaleEmployeesPercentage: { median: 30, top25: 45, distribution: [15, 25, 30, 40, 50] },
      independentDirectorsPercentage: { median: 40, top25: 60, distribution: [20, 35, 40, 55, 70] }
    });
  }

  static getCompanyTargets(companyId) {
    // Simplified - in production, this would query targets table
    return Promise.resolve([
      { metric: 'scope1Emissions', value: 3000, baseline: { value: 5000, year: 2020 }, deadline: { year: 2030 } },
      { metric: 'femaleEmployeesPercentage', value: 50, baseline: { value: 25, year: 2020 }, deadline: { year: 2025 } }
    ]);
  }
}

export default AdvancedAnalyticsEngine;