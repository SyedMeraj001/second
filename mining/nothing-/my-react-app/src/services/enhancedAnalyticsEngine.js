// Enhanced Advanced Analytics Engine
class EnhancedAnalyticsEngine {
  // Predictive trend analysis
  predictTrend(data, periods = 3) {
    if (data.length < 2) return [];
    
    const values = data.map(d => d.value);
    const n = values.length;
    
    // Simple linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate predictions
    const predictions = [];
    for (let i = 0; i < periods; i++) {
      const x = n + i;
      predictions.push({
        period: x,
        predicted: slope * x + intercept,
        confidence: this.calculateConfidence(values, slope, intercept)
      });
    }
    
    return predictions;
  }

  calculateConfidence(values, slope, intercept) {
    const predictions = values.map((_, i) => slope * i + intercept);
    const errors = values.map((v, i) => Math.abs(v - predictions[i]));
    const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
    return Math.max(0, Math.min(100, 100 - (avgError / Math.max(...values)) * 100));
  }

  // Anomaly detection
  detectAnomalies(data, threshold = 2) {
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );
    
    return data.filter((d, i) => 
      Math.abs(values[i] - mean) > threshold * stdDev
    ).map(d => ({
      ...d,
      deviation: Math.abs(d.value - mean) / stdDev,
      severity: Math.abs(d.value - mean) > 3 * stdDev ? 'high' : 'medium'
    }));
  }

  // Correlation analysis
  calculateCorrelation(data1, data2) {
    const n = Math.min(data1.length, data2.length);
    const mean1 = data1.reduce((a, b) => a + b, 0) / n;
    const mean2 = data2.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0, denom1 = 0, denom2 = 0;
    for (let i = 0; i < n; i++) {
      const diff1 = data1[i] - mean1;
      const diff2 = data2[i] - mean2;
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }
    
    return numerator / Math.sqrt(denom1 * denom2);
  }

  // Performance scoring
  calculatePerformanceScore(metrics) {
    const weights = {
      environmental: 0.35,
      social: 0.35,
      governance: 0.30
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(metrics).forEach(([category, value]) => {
      if (weights[category]) {
        totalScore += value * weights[category];
        totalWeight += weights[category];
      }
    });
    
    return totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 0;
  }

  // Benchmark comparison
  compareToBenchmark(value, benchmark) {
    const difference = value - benchmark;
    const percentDiff = ((difference / benchmark) * 100).toFixed(2);
    
    return {
      value,
      benchmark,
      difference,
      percentDiff,
      status: difference >= 0 ? 'above' : 'below',
      rating: this.getRating(percentDiff)
    };
  }

  getRating(percentDiff) {
    const diff = parseFloat(percentDiff);
    if (diff >= 20) return 'excellent';
    if (diff >= 10) return 'good';
    if (diff >= 0) return 'average';
    if (diff >= -10) return 'below-average';
    return 'poor';
  }

  // Year-over-year growth
  calculateYoYGrowth(currentYear, previousYear) {
    if (!previousYear || previousYear === 0) return null;
    return (((currentYear - previousYear) / previousYear) * 100).toFixed(2);
  }

  // Moving average
  calculateMovingAverage(data, window = 3) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        result.push(null);
      } else {
        const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / window);
      }
    }
    return result;
  }

  // Risk assessment
  assessRisk(metrics) {
    const riskFactors = {
      emissions: metrics.emissions > 1000 ? 'high' : 'low',
      waterUsage: metrics.waterUsage > 5000 ? 'high' : 'low',
      wasteGeneration: metrics.wasteGeneration > 500 ? 'high' : 'low',
      incidents: metrics.incidents > 5 ? 'high' : 'low'
    };
    
    const highRisks = Object.values(riskFactors).filter(r => r === 'high').length;
    
    return {
      factors: riskFactors,
      overallRisk: highRisks >= 3 ? 'high' : highRisks >= 2 ? 'medium' : 'low',
      score: ((4 - highRisks) / 4 * 100).toFixed(0)
    };
  }

  // Generate insights
  generateInsights(data) {
    const insights = [];
    
    // Trend insight
    const predictions = this.predictTrend(data);
    if (predictions.length > 0) {
      const trend = predictions[predictions.length - 1].predicted > data[data.length - 1].value ? 'increasing' : 'decreasing';
      insights.push({
        type: 'trend',
        message: `Data is ${trend} with ${predictions[0].confidence.toFixed(0)}% confidence`,
        severity: trend === 'increasing' ? 'warning' : 'info'
      });
    }
    
    // Anomaly insight
    const anomalies = this.detectAnomalies(data);
    if (anomalies.length > 0) {
      insights.push({
        type: 'anomaly',
        message: `${anomalies.length} anomalies detected`,
        severity: 'warning',
        details: anomalies
      });
    }
    
    return insights;
  }
}

export default new EnhancedAnalyticsEngine();
