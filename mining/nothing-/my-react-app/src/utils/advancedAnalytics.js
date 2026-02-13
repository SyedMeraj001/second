export class ESGAnalyticsEngine {
  constructor(data) {
    this.rawData = data;
    this.data = this.normalizeData(data);
    this.yearlyData = this.aggregateByYear(this.data);
  }

  normalizeData(data) {
    return data
      .map((item, originalIndex) => {
        let year = null;
        if (item.reportingYear && !isNaN(parseInt(item.reportingYear))) {
          year = parseInt(item.reportingYear);
        } else if (item.timestamp) {
          try {
            year = new Date(item.timestamp).getFullYear();
          } catch {
            year = new Date().getFullYear();
          }
        } else {
          year = new Date().getFullYear();
        }
        
        if (item.environmental || item.social || item.governance) {
          const results = [];
          ['environmental', 'social', 'governance'].forEach(cat => {
            if (item[cat]) {
              Object.entries(item[cat]).forEach(([key, value]) => {
                if (key !== 'description' && value !== '' && !isNaN(parseFloat(value))) {
                  results.push({
                    ...item,
                    category: cat,
                    metric: key,
                    value: parseFloat(value),
                    year,
                    _originalIndex: originalIndex
                  });
                }
              });
            }
          });
          return results;
        } else {
          const category = (item.category || '').toLowerCase();
          const value = parseFloat(item.value);
          return [{
            ...item,
            year,
            category,
            value: isNaN(value) ? null : value,
            _originalIndex: originalIndex
          }];
        }
      })
      .flat()
      .filter(item => item.year && item.category && item.value !== null && ['environmental','social','governance'].includes(item.category));
  }

  aggregateByYear(data) {
    const result = {};
    data.forEach(item => {
      if (!result[item.year]) {
        result[item.year] = {
          year: item.year,
          environmental: { sum: 0, count: 0 },
          social: { sum: 0, count: 0 },
          governance: { sum: 0, count: 0 }
        };
      }
      if (['environmental','social','governance'].includes(item.category)) {
        result[item.year][item.category].sum += item.value;
        result[item.year][item.category].count += 1;
      }
    });
    return Object.values(result).map(yearObj => ({
      year: yearObj.year,
      environmental: yearObj.environmental.count ? (yearObj.environmental.sum / yearObj.environmental.count).toFixed(2) : 0,
      social: yearObj.social.count ? (yearObj.social.sum / yearObj.social.count).toFixed(2) : 0,
      governance: yearObj.governance.count ? (yearObj.governance.sum / yearObj.governance.count).toFixed(2) : 0
    })).sort((a, b) => a.year - b.year);
  }

  // ESG Performance Forecasting
  generateForecast(years = 3) {
    const categories = ['environmental', 'social', 'governance'];
    const forecasts = {};

    categories.forEach(category => {
      const categoryData = this.data.filter(d => d.category === category);
      const yearlyAvg = this.calculateYearlyAverages(categoryData);
      
      forecasts[category] = this.predictTrend(yearlyAvg, years);
    });

    return {
      forecasts,
      confidence: this.calculateConfidence(),
      recommendations: this.generateRecommendations(forecasts)
    };
  }

  // Scenario Modeling
  runScenarioAnalysis(scenarios) {
    const results = {};
    
    scenarios.forEach(scenario => {
      results[scenario.name] = {
        impact: this.calculateScenarioImpact(scenario),
        timeline: scenario.timeline || 12,
        probability: scenario.probability || 0.7,
        riskLevel: this.assessRisk(scenario)
      };
    });

    return results;
  }

  // Predictive Risk Assessment
  assessESGRisks() {
    const risks = {
      environmental: this.assessEnvironmentalRisks(),
      social: this.assessSocialRisks(),
      governance: this.assessGovernanceRisks()
    };

    return {
      risks,
      overallRiskScore: this.calculateOverallRisk(risks),
      mitigationStrategies: this.suggestMitigations(risks)
    };
  }

  // Performance Benchmarking
  generateBenchmarks() {
    const industryBenchmarks = {
      mining: {
        environmental: { carbonIntensity: 2.5, waterUsage: 1200, wasteReduction: 15 },
        social: { safetyRate: 0.8, diversity: 35, training: 40 },
        governance: { boardIndependence: 60, ethicsTraining: 95, transparency: 85 }
      }
    };

    return this.compareToBenchmarks(industryBenchmarks.mining);
  }

  // Helper Methods
  calculateYearlyAverages(categoryData) {
    const yearGroups = {};
    categoryData.forEach(item => {
      if (!yearGroups[item.year]) yearGroups[item.year] = [];
      yearGroups[item.year].push(item.value);
    });

    return Object.entries(yearGroups).map(([year, values]) => ({
      year: parseInt(year),
      average: values.reduce((a, b) => a + b, 0) / values.length
    })).sort((a, b) => a.year - b.year);
  }

  predictTrend(yearlyData, forecastYears) {
    if (yearlyData.length < 2) return [];

    const trend = this.calculateLinearTrend(yearlyData);
    const predictions = [];
    const lastYear = Math.max(...yearlyData.map(d => d.year));

    for (let i = 1; i <= forecastYears; i++) {
      const year = lastYear + i;
      const predicted = trend.slope * year + trend.intercept;
      predictions.push({
        year,
        predicted: Math.max(0, predicted),
        confidence: Math.max(0.3, 0.9 - (i * 0.15))
      });
    }

    return predictions;
  }

  calculateLinearTrend(data) {
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.year, 0);
    const sumY = data.reduce((sum, d) => sum + d.average, 0);
    const sumXY = data.reduce((sum, d) => sum + (d.year * d.average), 0);
    const sumXX = data.reduce((sum, d) => sum + (d.year * d.year), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  calculateScenarioImpact(scenario) {
    const baselineScore = this.calculateCurrentScore();
    let impact = 0;

    scenario.changes.forEach(change => {
      const categoryWeight = { environmental: 0.4, social: 0.3, governance: 0.3 };
      impact += change.value * categoryWeight[change.category] * change.likelihood;
    });

    return {
      baseline: baselineScore,
      projected: baselineScore + impact,
      change: impact,
      percentage: (impact / baselineScore) * 100
    };
  }

  assessEnvironmentalRisks() {
    const envData = this.data.filter(d => d.category === 'environmental');
    const risks = [];

    // Carbon emissions risk
    const emissions = envData.filter(d => d.metric.includes('emission'));
    if (emissions.length > 0) {
      const avgEmissions = emissions.reduce((sum, d) => sum + d.value, 0) / emissions.length;
      risks.push({
        type: 'Carbon Emissions',
        level: avgEmissions > 1000 ? 'High' : avgEmissions > 500 ? 'Medium' : 'Low',
        score: Math.min(100, avgEmissions / 10),
        trend: this.calculateTrend(emissions)
      });
    }

    return risks;
  }

  assessSocialRisks() {
    const socialData = this.data.filter(d => d.category === 'social');
    const risks = [];

    // Safety risk assessment
    const safety = socialData.filter(d => d.metric.includes('safety') || d.metric.includes('injury'));
    if (safety.length > 0) {
      const avgSafety = safety.reduce((sum, d) => sum + d.value, 0) / safety.length;
      risks.push({
        type: 'Workplace Safety',
        level: avgSafety > 5 ? 'High' : avgSafety > 2 ? 'Medium' : 'Low',
        score: avgSafety * 10,
        trend: this.calculateTrend(safety)
      });
    }

    return risks;
  }

  assessGovernanceRisks() {
    const govData = this.data.filter(d => d.category === 'governance');
    const risks = [];

    // Board independence risk
    const board = govData.filter(d => d.metric.includes('board') || d.metric.includes('independent'));
    if (board.length > 0) {
      const avgIndependence = board.reduce((sum, d) => sum + d.value, 0) / board.length;
      risks.push({
        type: 'Board Independence',
        level: avgIndependence < 30 ? 'High' : avgIndependence < 50 ? 'Medium' : 'Low',
        score: 100 - avgIndependence,
        trend: this.calculateTrend(board)
      });
    }

    return risks;
  }

  calculateTrend(data) {
    if (data.length < 2) return 'Stable';
    const recent = data.slice(-3);
    const older = data.slice(0, -3);
    
    const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, d) => sum + d.value, 0) / older.length : recentAvg;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 5) return 'Improving';
    if (change < -5) return 'Declining';
    return 'Stable';
  }

  calculateCurrentScore() {
    const categories = ['environmental', 'social', 'governance'];
    let totalScore = 0;

    categories.forEach(category => {
      const categoryData = this.data.filter(d => d.category === category);
      if (categoryData.length > 0) {
        const avg = categoryData.reduce((sum, d) => sum + d.value, 0) / categoryData.length;
        totalScore += Math.min(100, avg);
      }
    });

    return totalScore / categories.length;
  }

  calculateConfidence() {
    const dataPoints = this.data.length;
    const yearSpan = this.yearlyData.length;
    
    if (dataPoints > 50 && yearSpan > 2) return 0.85;
    if (dataPoints > 20 && yearSpan > 1) return 0.70;
    return 0.55;
  }

  generateRecommendations(forecasts) {
    const recommendations = [];

    Object.entries(forecasts).forEach(([category, forecast]) => {
      const trend = forecast[forecast.length - 1]?.predicted || 0;
      const current = this.calculateCategoryAverage(category);
      
      if (trend < current * 0.9) {
        recommendations.push({
          category,
          priority: 'High',
          action: `Implement immediate improvement strategies for ${category}`,
          impact: 'Critical for maintaining ESG performance'
        });
      } else if (trend > current * 1.1) {
        recommendations.push({
          category,
          priority: 'Medium',
          action: `Continue current ${category} initiatives`,
          impact: 'Positive trajectory maintained'
        });
      }
    });

    return recommendations;
  }

  calculateCategoryAverage(category) {
    const categoryData = this.data.filter(d => d.category === category);
    return categoryData.length > 0 
      ? categoryData.reduce((sum, d) => sum + d.value, 0) / categoryData.length 
      : 0;
  }

  compareToBenchmarks(benchmarks) {
    const comparison = {};
    
    Object.entries(benchmarks).forEach(([category, metrics]) => {
      comparison[category] = {};
      const categoryData = this.data.filter(d => d.category === category);
      
      Object.entries(metrics).forEach(([metric, benchmark]) => {
        const metricData = categoryData.filter(d => d.metric.includes(metric.toLowerCase()));
        if (metricData.length > 0) {
          const current = metricData.reduce((sum, d) => sum + d.value, 0) / metricData.length;
          comparison[category][metric] = {
            current,
            benchmark,
            performance: current >= benchmark ? 'Above' : 'Below',
            gap: ((current - benchmark) / benchmark * 100).toFixed(1)
          };
        }
      });
    });

    return comparison;
  }

  calculateOverallRisk(risks) {
    const allRisks = [...risks.environmental, ...risks.social, ...risks.governance];
    if (allRisks.length === 0) return 0;
    
    const avgScore = allRisks.reduce((sum, risk) => sum + risk.score, 0) / allRisks.length;
    return Math.min(100, avgScore);
  }

  suggestMitigations(risks) {
    const mitigations = [];
    
    Object.entries(risks).forEach(([category, categoryRisks]) => {
      categoryRisks.forEach(risk => {
        if (risk.level === 'High') {
          mitigations.push({
            category,
            risk: risk.type,
            strategy: this.getMitigationStrategy(risk.type),
            timeline: '3-6 months',
            priority: 'Immediate'
          });
        }
      });
    });

    return mitigations;
  }

  getMitigationStrategy(riskType) {
    const strategies = {
      'Carbon Emissions': 'Implement renewable energy transition and carbon offset programs',
      'Workplace Safety': 'Enhance safety training and implement advanced monitoring systems',
      'Board Independence': 'Recruit independent directors and establish governance committees'
    };
    
    return strategies[riskType] || 'Develop targeted improvement plan';
  }
}

export default ESGAnalyticsEngine;