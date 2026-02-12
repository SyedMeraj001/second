export class AIInsightsEngine {
  
  static generateInsights(esgData, benchmarkData = null) {
    const insights = [];
    
    insights.push(...this.detectAnomalies(esgData));
    insights.push(...this.generateRecommendations(esgData, benchmarkData));
    insights.push(...this.identifyTrends(esgData));
    insights.push(...this.assessRisks(esgData));
    
    return insights.sort((a, b) => b.priority - a.priority);
  }

  static detectAnomalies(data) {
    const anomalies = [];
    const grouped = this.groupByMetric(data);
    
    Object.entries(grouped).forEach(([metric, values]) => {
      if (values.length < 3) return;
      
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
      
      values.forEach((value, idx) => {
        const zScore = Math.abs((value - mean) / stdDev);
        
        if (zScore > 2.5) {
          anomalies.push({
            type: 'anomaly',
            severity: zScore > 3 ? 'high' : 'medium',
            priority: zScore > 3 ? 90 : 70,
            metric,
            value,
            expected: mean,
            deviation: ((value - mean) / mean * 100).toFixed(1),
            message: `${metric} shows unusual ${value > mean ? 'increase' : 'decrease'} of ${Math.abs((value - mean) / mean * 100).toFixed(1)}%`,
            action: `Investigate ${metric} data for period ${idx + 1}`,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
    
    return anomalies;
  }

  static generateRecommendations(data, benchmarkData) {
    const recommendations = [];
    const metrics = this.calculateMetrics(data);
    
    // Environmental recommendations
    if (metrics.carbonIntensity > 100) {
      recommendations.push({
        type: 'recommendation',
        category: 'environmental',
        severity: 'high',
        priority: 85,
        message: 'Carbon intensity exceeds industry standards',
        action: 'Implement renewable energy transition plan',
        expectedImpact: 'Reduce carbon emissions by 30-40%',
        timeline: '12-18 months',
        cost: 'Medium',
        timestamp: new Date().toISOString()
      });
    }
    
    if (metrics.waterUsage > 50000) {
      recommendations.push({
        type: 'recommendation',
        category: 'environmental',
        severity: 'medium',
        priority: 70,
        message: 'High water consumption detected',
        action: 'Install water recycling systems',
        expectedImpact: 'Reduce water usage by 25-35%',
        timeline: '6-12 months',
        cost: 'Low',
        timestamp: new Date().toISOString()
      });
    }
    
    // Social recommendations
    if (metrics.diversityScore < 40) {
      recommendations.push({
        type: 'recommendation',
        category: 'social',
        severity: 'high',
        priority: 80,
        message: 'Workforce diversity below target',
        action: 'Launch inclusive hiring program',
        expectedImpact: 'Improve diversity score by 15-20 points',
        timeline: '6-12 months',
        cost: 'Low',
        timestamp: new Date().toISOString()
      });
    }
    
    if (metrics.safetyIncidents > 5) {
      recommendations.push({
        type: 'recommendation',
        category: 'social',
        severity: 'critical',
        priority: 95,
        message: 'Safety incidents exceed acceptable threshold',
        action: 'Implement enhanced safety training program',
        expectedImpact: 'Reduce incidents by 50-60%',
        timeline: '3-6 months',
        cost: 'Medium',
        timestamp: new Date().toISOString()
      });
    }
    
    // Governance recommendations
    if (metrics.boardIndependence < 50) {
      recommendations.push({
        type: 'recommendation',
        category: 'governance',
        severity: 'medium',
        priority: 65,
        message: 'Board independence below best practice',
        action: 'Recruit independent board members',
        expectedImpact: 'Improve governance score by 10-15 points',
        timeline: '6-12 months',
        cost: 'Low',
        timestamp: new Date().toISOString()
      });
    }
    
    return recommendations;
  }

  static identifyTrends(data) {
    const trends = [];
    const grouped = this.groupByMetric(data);
    
    Object.entries(grouped).forEach(([metric, values]) => {
      if (values.length < 3) return;
      
      const trend = this.calculateTrend(values);
      
      if (Math.abs(trend.slope) > 0.1) {
        trends.push({
          type: 'trend',
          severity: 'info',
          priority: 50,
          metric,
          direction: trend.slope > 0 ? 'increasing' : 'decreasing',
          rate: (trend.slope * 100).toFixed(1),
          message: `${metric} is ${trend.slope > 0 ? 'increasing' : 'decreasing'} at ${Math.abs(trend.slope * 100).toFixed(1)}% per period`,
          action: trend.slope > 0 ? 'Monitor and maintain positive trend' : 'Investigate declining performance',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return trends;
  }

  static assessRisks(data) {
    const risks = [];
    const metrics = this.calculateMetrics(data);
    
    // Climate risk
    if (metrics.carbonIntensity > 150) {
      risks.push({
        type: 'risk',
        category: 'environmental',
        severity: 'high',
        priority: 88,
        riskType: 'Climate transition risk',
        message: 'High carbon intensity poses regulatory and market risks',
        action: 'Develop carbon reduction roadmap',
        likelihood: 'High',
        impact: 'High',
        timeframe: 'Short-term (1-3 years)',
        timestamp: new Date().toISOString()
      });
    }
    
    // Social risk
    if (metrics.safetyIncidents > 10) {
      risks.push({
        type: 'risk',
        category: 'social',
        severity: 'critical',
        priority: 95,
        riskType: 'Operational and reputational risk',
        message: 'High safety incident rate threatens operations and reputation',
        action: 'Immediate safety protocol review and enhancement',
        likelihood: 'High',
        impact: 'Critical',
        timeframe: 'Immediate',
        timestamp: new Date().toISOString()
      });
    }
    
    return risks;
  }

  static groupByMetric(data) {
    const grouped = {};
    
    data.forEach(entry => {
      const metric = entry.metric || entry.name || 'unknown';
      if (!grouped[metric]) grouped[metric] = [];
      grouped[metric].push(parseFloat(entry.value));
    });
    
    return grouped;
  }

  static calculateMetrics(data) {
    const metrics = {
      carbonIntensity: 0,
      waterUsage: 0,
      diversityScore: 0,
      safetyIncidents: 0,
      boardIndependence: 0
    };
    
    data.forEach(entry => {
      if (entry.metric?.includes('carbon') || entry.metric?.includes('emission')) {
        metrics.carbonIntensity += parseFloat(entry.value) || 0;
      }
      if (entry.metric?.includes('water')) {
        metrics.waterUsage += parseFloat(entry.value) || 0;
      }
      if (entry.metric?.includes('diversity') || entry.metric?.includes('female')) {
        metrics.diversityScore = Math.max(metrics.diversityScore, parseFloat(entry.value) || 0);
      }
      if (entry.metric?.includes('safety') || entry.metric?.includes('incident')) {
        metrics.safetyIncidents += parseFloat(entry.value) || 0;
      }
      if (entry.metric?.includes('board') || entry.metric?.includes('independent')) {
        metrics.boardIndependence = Math.max(metrics.boardIndependence, parseFloat(entry.value) || 0);
      }
    });
    
    return metrics;
  }

  static calculateTrend(values) {
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    values.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += Math.pow(x - xMean, 2);
    });
    
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    return { slope, intercept };
  }

  static prioritizeInsights(insights) {
    return insights.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return b.priority - a.priority;
    });
  }
}
