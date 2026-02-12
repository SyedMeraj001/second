import db from '../database/db.js';

class AIESGScoringEngine {
  constructor() {
    this.weights = {
      environmental: 0.4,
      social: 0.3,
      governance: 0.3
    };

    this.scoringModels = {
      environmental: {
        ghgEmissions: { weight: 0.25, benchmark: 'lower_better' },
        energyIntensity: { weight: 0.20, benchmark: 'lower_better' },
        waterUsage: { weight: 0.15, benchmark: 'lower_better' },
        wasteGeneration: { weight: 0.15, benchmark: 'lower_better' },
        renewableEnergy: { weight: 0.15, benchmark: 'higher_better' },
        biodiversityImpact: { weight: 0.10, benchmark: 'lower_better' }
      },
      social: {
        workplaceSafety: { weight: 0.25, benchmark: 'lower_better' },
        employeeDiversity: { weight: 0.20, benchmark: 'higher_better' },
        communityEngagement: { weight: 0.20, benchmark: 'higher_better' },
        humanRights: { weight: 0.15, benchmark: 'higher_better' },
        laborPractices: { weight: 0.10, benchmark: 'higher_better' },
        productSafety: { weight: 0.10, benchmark: 'higher_better' }
      },
      governance: {
        boardDiversity: { weight: 0.25, benchmark: 'higher_better' },
        executiveCompensation: { weight: 0.20, benchmark: 'balanced' },
        businessEthics: { weight: 0.20, benchmark: 'higher_better' },
        riskManagement: { weight: 0.15, benchmark: 'higher_better' },
        transparency: { weight: 0.10, benchmark: 'higher_better' },
        cybersecurity: { weight: 0.10, benchmark: 'higher_better' }
      }
    };

    this.industryBenchmarks = {
      'mining': {
        ghgEmissions: { median: 2.5, top25: 1.8, unit: 'tCO2e/M$' },
        workplaceSafety: { median: 3.2, top25: 1.5, unit: 'LTIFR' },
        boardDiversity: { median: 25, top25: 40, unit: '%' }
      },
      'manufacturing': {
        ghgEmissions: { median: 1.8, top25: 1.2, unit: 'tCO2e/M$' },
        workplaceSafety: { median: 2.1, top25: 0.8, unit: 'LTIFR' },
        boardDiversity: { median: 30, top25: 45, unit: '%' }
      }
    };
  }

  async calculateESGScore(companyId, industry = 'mining') {
    const companyData = await this.getCompanyData(companyId);
    const benchmarks = this.industryBenchmarks[industry] || this.industryBenchmarks['mining'];
    
    const environmentalScore = this.calculateCategoryScore('environmental', companyData, benchmarks);
    const socialScore = this.calculateCategoryScore('social', companyData, benchmarks);
    const governanceScore = this.calculateCategoryScore('governance', companyData, benchmarks);
    
    const overallScore = (
      environmentalScore.score * this.weights.environmental +
      socialScore.score * this.weights.social +
      governanceScore.score * this.weights.governance
    );

    const result = {
      companyId,
      overallScore: Math.round(overallScore),
      rating: this.getESGRating(overallScore),
      categoryScores: {
        environmental: environmentalScore,
        social: socialScore,
        governance: governanceScore
      },
      industryComparison: this.generateIndustryComparison(overallScore, industry),
      recommendations: this.generateAIRecommendations(environmentalScore, socialScore, governanceScore),
      riskAssessment: this.assessESGRisks(environmentalScore, socialScore, governanceScore),
      calculatedAt: new Date().toISOString()
    };

    await this.saveESGScore(result);
    return result;
  }

  calculateCategoryScore(category, companyData, benchmarks) {
    const model = this.scoringModels[category];
    let categoryScore = 0;
    const metricScores = {};

    for (const [metric, config] of Object.entries(model)) {
      const value = companyData[metric] || 0;
      const benchmark = benchmarks[metric];
      
      let normalizedScore = 50; // Default middle score
      
      if (benchmark) {
        normalizedScore = this.normalizeMetricScore(value, benchmark, config.benchmark);
      }
      
      metricScores[metric] = {
        value,
        normalizedScore,
        weight: config.weight,
        contribution: normalizedScore * config.weight
      };
      
      categoryScore += normalizedScore * config.weight;
    }

    return {
      score: Math.round(categoryScore),
      metrics: metricScores,
      performance: this.getCategoryPerformance(categoryScore)
    };
  }

  normalizeMetricScore(value, benchmark, benchmarkType) {
    switch (benchmarkType) {
      case 'lower_better':
        if (value <= benchmark.top25) return 90;
        if (value <= benchmark.median) return 70;
        if (value <= benchmark.median * 1.5) return 50;
        return 30;
        
      case 'higher_better':
        if (value >= benchmark.top25) return 90;
        if (value >= benchmark.median) return 70;
        if (value >= benchmark.median * 0.7) return 50;
        return 30;
        
      case 'balanced':
        const target = benchmark.median;
        const deviation = Math.abs(value - target) / target;
        if (deviation <= 0.1) return 90;
        if (deviation <= 0.2) return 70;
        if (deviation <= 0.3) return 50;
        return 30;
        
      default:
        return 50;
    }
  }

  getESGRating(score) {
    if (score >= 80) return 'AAA';
    if (score >= 70) return 'AA';
    if (score >= 60) return 'A';
    if (score >= 50) return 'BBB';
    if (score >= 40) return 'BB';
    if (score >= 30) return 'B';
    return 'CCC';
  }

  getCategoryPerformance(score) {
    if (score >= 75) return 'Leading';
    if (score >= 60) return 'Above Average';
    if (score >= 40) return 'Average';
    return 'Below Average';
  }

  generateIndustryComparison(score, industry) {
    // Simulated industry percentile - in production would use real data
    const percentile = Math.min(95, Math.max(5, score + Math.random() * 20 - 10));
    
    return {
      industry,
      percentile: Math.round(percentile),
      position: percentile >= 75 ? 'Top Quartile' : 
                percentile >= 50 ? 'Above Median' :
                percentile >= 25 ? 'Below Median' : 'Bottom Quartile'
    };
  }

  generateAIRecommendations(envScore, socialScore, govScore) {
    const recommendations = [];
    
    // Environmental recommendations
    if (envScore.score < 60) {
      const weakestMetric = this.findWeakestMetric(envScore.metrics);
      recommendations.push({
        category: 'Environmental',
        priority: 'High',
        action: `Improve ${weakestMetric} performance through targeted initiatives`,
        impact: 'Could increase overall ESG score by 5-8 points'
      });
    }
    
    // Social recommendations
    if (socialScore.score < 60) {
      recommendations.push({
        category: 'Social',
        priority: 'Medium',
        action: 'Enhance workplace safety programs and diversity initiatives',
        impact: 'Could improve social score by 10-15 points'
      });
    }
    
    // Governance recommendations
    if (govScore.score < 60) {
      recommendations.push({
        category: 'Governance',
        priority: 'Medium',
        action: 'Strengthen board diversity and risk management frameworks',
        impact: 'Could enhance governance score by 8-12 points'
      });
    }
    
    return recommendations;
  }

  assessESGRisks(envScore, socialScore, govScore) {
    const risks = [];
    
    if (envScore.score < 40) {
      risks.push({
        type: 'Environmental',
        level: 'High',
        description: 'Significant environmental compliance and reputation risks',
        mitigation: 'Implement comprehensive environmental management system'
      });
    }
    
    if (socialScore.score < 40) {
      risks.push({
        type: 'Social',
        level: 'Medium',
        description: 'Workforce and community relation challenges',
        mitigation: 'Enhance stakeholder engagement and safety protocols'
      });
    }
    
    if (govScore.score < 40) {
      risks.push({
        type: 'Governance',
        level: 'High',
        description: 'Corporate governance and oversight deficiencies',
        mitigation: 'Strengthen board oversight and transparency measures'
      });
    }
    
    return risks;
  }

  findWeakestMetric(metrics) {
    let weakest = null;
    let lowestScore = 100;
    
    for (const [metric, data] of Object.entries(metrics)) {
      if (data.normalizedScore < lowestScore) {
        lowestScore = data.normalizedScore;
        weakest = metric;
      }
    }
    
    return weakest;
  }

  async predictESGTrends(companyId, years = 3) {
    const historicalScores = await this.getHistoricalScores(companyId);
    if (historicalScores.length < 2) return null;
    
    const trend = this.calculateTrend(historicalScores);
    const predictions = [];
    
    for (let i = 1; i <= years; i++) {
      const predictedScore = Math.max(0, Math.min(100, 
        trend.slope * i + trend.intercept
      ));
      
      predictions.push({
        year: new Date().getFullYear() + i,
        predictedScore: Math.round(predictedScore),
        confidence: Math.max(0.3, 0.9 - (i * 0.15)),
        rating: this.getESGRating(predictedScore)
      });
    }
    
    return {
      trend: trend.slope > 0 ? 'improving' : 'declining',
      predictions,
      confidence: 'medium'
    };
  }

  calculateTrend(scores) {
    const n = scores.length;
    const sumX = scores.reduce((sum, _, i) => sum + i, 0);
    const sumY = scores.reduce((sum, score) => sum + score.overall_score, 0);
    const sumXY = scores.reduce((sum, score, i) => sum + (i * score.overall_score), 0);
    const sumXX = scores.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  async saveESGScore(scoreData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO ai_esg_scores 
        (company_id, overall_score, rating, environmental_score, social_score, 
         governance_score, score_data, calculated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [
        scoreData.companyId,
        scoreData.overallScore,
        scoreData.rating,
        scoreData.categoryScores.environmental.score,
        scoreData.categoryScores.social.score,
        scoreData.categoryScores.governance.score,
        JSON.stringify(scoreData)
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getCompanyData(companyId) {
    // Simplified - would query comprehensive ESG metrics
    return new Promise((resolve) => {
      resolve({
        // Environmental metrics
        ghgEmissions: 2.2, // tCO2e/M$
        energyIntensity: 45, // GJ/M$
        waterUsage: 1200, // m³/M$
        wasteGeneration: 15, // tonnes/M$
        renewableEnergy: 28, // %
        biodiversityImpact: 0.3, // impact score
        
        // Social metrics
        workplaceSafety: 2.1, // LTIFR
        employeeDiversity: 35, // %
        communityEngagement: 75, // score
        humanRights: 85, // compliance %
        laborPractices: 80, // score
        productSafety: 95, // %
        
        // Governance metrics
        boardDiversity: 42, // %
        executiveCompensation: 8.5, // ratio
        businessEthics: 88, // score
        riskManagement: 78, // score
        transparency: 82, // score
        cybersecurity: 85 // score
      });
    });
  }

  async getHistoricalScores(companyId) {
    return new Promise((resolve) => {
      db.all(`
        SELECT overall_score, calculated_at 
        FROM ai_esg_scores 
        WHERE company_id = ? 
        ORDER BY calculated_at DESC LIMIT 5
      `, [companyId], (err, rows) => {
        resolve(rows || []);
      });
    });
  }
}

export default new AIESGScoringEngine();