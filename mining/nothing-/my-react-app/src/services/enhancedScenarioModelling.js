/**
 * ENHANCED SCENARIO MODELLING SERVICE
 * What-if analysis, multiple scenario comparison, sensitivity analysis
 */

class EnhancedScenarioModelling {
  constructor() {
    this.scenarios = [];
    this.baselineData = null;
  }

  /**
   * Set baseline data for comparison
   */
  setBaseline(data) {
    this.baselineData = {
      id: 'baseline',
      name: 'Current State',
      timestamp: new Date().toISOString(),
      metrics: data,
      type: 'baseline'
    };
    return this.baselineData;
  }

  /**
   * Create a new scenario with what-if changes
   */
  createScenario(config) {
    const scenario = {
      id: `scenario-${Date.now()}`,
      name: config.name,
      description: config.description,
      timestamp: new Date().toISOString(),
      changes: config.changes || {},
      assumptions: config.assumptions || [],
      timeframe: config.timeframe || '1-year',
      type: 'scenario',
      metrics: this.calculateScenarioMetrics(config.changes)
    };

    this.scenarios.push(scenario);
    return scenario;
  }

  /**
   * What-if analysis: Calculate impact of specific changes
   */
  whatIfAnalysis(changes) {
    if (!this.baselineData) {
      throw new Error('Baseline data not set. Call setBaseline() first.');
    }

    const analysis = {
      id: `whatif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      changes: changes,
      baseline: this.baselineData.metrics,
      projected: {},
      impact: {},
      recommendations: []
    };

    // Calculate projected values
    Object.keys(changes).forEach(metric => {
      const baseValue = this.baselineData.metrics[metric] || 0;
      const change = changes[metric];
      
      if (typeof change === 'object') {
        // Percentage change
        if (change.type === 'percentage') {
          analysis.projected[metric] = baseValue * (1 + change.value / 100);
        }
        // Absolute change
        else if (change.type === 'absolute') {
          analysis.projected[metric] = baseValue + change.value;
        }
        // Target value
        else if (change.type === 'target') {
          analysis.projected[metric] = change.value;
        }
      } else {
        // Direct value
        analysis.projected[metric] = change;
      }

      // Calculate impact
      analysis.impact[metric] = {
        absolute: analysis.projected[metric] - baseValue,
        percentage: ((analysis.projected[metric] - baseValue) / baseValue) * 100,
        direction: analysis.projected[metric] > baseValue ? 'increase' : 'decrease'
      };
    });

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  /**
   * Compare multiple scenarios side-by-side
   */
  compareScenarios(scenarioIds) {
    const scenarios = scenarioIds.map(id => 
      id === 'baseline' ? this.baselineData : this.scenarios.find(s => s.id === id)
    ).filter(Boolean);

    if (scenarios.length < 2) {
      throw new Error('Need at least 2 scenarios to compare');
    }

    const comparison = {
      id: `comparison-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scenarios: scenarios,
      metrics: {},
      bestScenario: {},
      worstScenario: {},
      summary: {}
    };

    // Get all unique metrics
    const allMetrics = new Set();
    scenarios.forEach(s => {
      Object.keys(s.metrics).forEach(m => allMetrics.add(m));
    });

    // Compare each metric across scenarios
    allMetrics.forEach(metric => {
      const values = scenarios.map(s => ({
        scenarioId: s.id,
        scenarioName: s.name,
        value: s.metrics[metric] || 0
      }));

      const sorted = [...values].sort((a, b) => b.value - a.value);
      
      comparison.metrics[metric] = {
        values: values,
        best: sorted[0],
        worst: sorted[sorted.length - 1],
        range: sorted[0].value - sorted[sorted.length - 1].value,
        average: values.reduce((sum, v) => sum + v.value, 0) / values.length
      };

      // Track best/worst scenarios
      if (!comparison.bestScenario[sorted[0].scenarioId]) {
        comparison.bestScenario[sorted[0].scenarioId] = 0;
      }
      comparison.bestScenario[sorted[0].scenarioId]++;

      if (!comparison.worstScenario[sorted[sorted.length - 1].scenarioId]) {
        comparison.worstScenario[sorted[sorted.length - 1].scenarioId] = 0;
      }
      comparison.worstScenario[sorted[sorted.length - 1].scenarioId]++;
    });

    // Generate summary
    comparison.summary = this.generateComparisonSummary(comparison);

    return comparison;
  }

  /**
   * Sensitivity analysis: Test impact of variable changes
   */
  sensitivityAnalysis(variable, range) {
    if (!this.baselineData) {
      throw new Error('Baseline data not set. Call setBaseline() first.');
    }

    const baseValue = this.baselineData.metrics[variable] || 0;
    const results = [];

    // Test different values in range
    const steps = range.steps || 10;
    const min = range.min !== undefined ? range.min : baseValue * 0.5;
    const max = range.max !== undefined ? range.max : baseValue * 1.5;
    const stepSize = (max - min) / steps;

    for (let i = 0; i <= steps; i++) {
      const testValue = min + (stepSize * i);
      const change = ((testValue - baseValue) / baseValue) * 100;

      const scenario = this.whatIfAnalysis({
        [variable]: testValue
      });

      results.push({
        value: testValue,
        changePercent: change,
        impact: scenario.impact,
        projected: scenario.projected
      });
    }

    return {
      id: `sensitivity-${Date.now()}`,
      variable: variable,
      baseValue: baseValue,
      range: { min, max },
      results: results,
      insights: this.generateSensitivityInsights(variable, results)
    };
  }

  /**
   * Multi-variable sensitivity analysis
   */
  multiVariableSensitivity(variables) {
    const results = {};

    variables.forEach(config => {
      results[config.variable] = this.sensitivityAnalysis(
        config.variable,
        config.range
      );
    });

    return {
      id: `multi-sensitivity-${Date.now()}`,
      timestamp: new Date().toISOString(),
      variables: variables.map(v => v.variable),
      results: results,
      correlations: this.calculateCorrelations(results)
    };
  }

  /**
   * Scenario templates for common use cases
   */
  getScenarioTemplates() {
    return {
      'aggressive-reduction': {
        name: 'Aggressive Emissions Reduction',
        description: 'Reduce emissions by 50% over 5 years',
        changes: {
          carbonEmissions: { type: 'percentage', value: -50 },
          energyConsumption: { type: 'percentage', value: -30 },
          renewableEnergy: { type: 'percentage', value: 100 }
        },
        assumptions: [
          'Investment in renewable energy',
          'Process optimization',
          'Technology upgrades'
        ],
        timeframe: '5-years'
      },
      'moderate-improvement': {
        name: 'Moderate ESG Improvement',
        description: 'Balanced improvements across all ESG metrics',
        changes: {
          carbonEmissions: { type: 'percentage', value: -20 },
          waterUsage: { type: 'percentage', value: -15 },
          wasteRecycling: { type: 'percentage', value: 25 },
          employeeSafety: { type: 'percentage', value: 30 },
          diversityRatio: { type: 'percentage', value: 20 }
        },
        assumptions: [
          'Incremental improvements',
          'Moderate investment',
          'Stakeholder engagement'
        ],
        timeframe: '3-years'
      },
      'business-as-usual': {
        name: 'Business as Usual',
        description: 'Continue current trajectory',
        changes: {
          carbonEmissions: { type: 'percentage', value: 5 },
          waterUsage: { type: 'percentage', value: 2 },
          wasteRecycling: { type: 'percentage', value: 5 }
        },
        assumptions: [
          'No major changes',
          'Current growth rate',
          'Minimal new investment'
        ],
        timeframe: '3-years'
      },
      'net-zero-2030': {
        name: 'Net Zero by 2030',
        description: 'Achieve net zero emissions by 2030',
        changes: {
          carbonEmissions: { type: 'percentage', value: -100 },
          renewableEnergy: { type: 'percentage', value: 100 },
          carbonOffset: { type: 'absolute', value: 10000 }
        },
        assumptions: [
          'Major capital investment',
          '100% renewable energy',
          'Carbon offset programs',
          'Supply chain transformation'
        ],
        timeframe: '7-years'
      },
      'cost-optimization': {
        name: 'Cost Optimization Focus',
        description: 'Reduce costs while maintaining ESG performance',
        changes: {
          energyConsumption: { type: 'percentage', value: -25 },
          waterUsage: { type: 'percentage', value: -20 },
          wasteRecycling: { type: 'percentage', value: 30 },
          operationalCosts: { type: 'percentage', value: -15 }
        },
        assumptions: [
          'Efficiency improvements',
          'Process automation',
          'Waste reduction'
        ],
        timeframe: '2-years'
      }
    };
  }

  /**
   * Apply a template to create a scenario
   */
  applyTemplate(templateName) {
    const templates = this.getScenarioTemplates();
    const template = templates[templateName];

    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return this.createScenario(template);
  }

  /**
   * Calculate scenario metrics based on changes
   */
  calculateScenarioMetrics(changes) {
    if (!this.baselineData) {
      return changes;
    }

    const metrics = { ...this.baselineData.metrics };

    Object.keys(changes).forEach(key => {
      const change = changes[key];
      const baseValue = metrics[key] || 0;

      if (typeof change === 'object') {
        if (change.type === 'percentage') {
          metrics[key] = baseValue * (1 + change.value / 100);
        } else if (change.type === 'absolute') {
          metrics[key] = baseValue + change.value;
        } else if (change.type === 'target') {
          metrics[key] = change.value;
        }
      } else {
        metrics[key] = change;
      }
    });

    return metrics;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    Object.keys(analysis.impact).forEach(metric => {
      const impact = analysis.impact[metric];
      
      if (Math.abs(impact.percentage) > 20) {
        recommendations.push({
          metric: metric,
          priority: Math.abs(impact.percentage) > 50 ? 'high' : 'medium',
          message: `${metric} shows ${impact.direction} of ${Math.abs(impact.percentage).toFixed(1)}%`,
          action: impact.direction === 'increase' 
            ? `Monitor and manage ${metric} growth`
            : `Leverage ${metric} reduction for competitive advantage`
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate comparison summary
   */
  generateComparisonSummary(comparison) {
    const bestScenarioId = Object.keys(comparison.bestScenario)
      .reduce((a, b) => comparison.bestScenario[a] > comparison.bestScenario[b] ? a : b);
    
    const bestScenario = comparison.scenarios.find(s => s.id === bestScenarioId);

    return {
      totalMetrics: Object.keys(comparison.metrics).length,
      bestOverall: {
        id: bestScenarioId,
        name: bestScenario?.name,
        winsCount: comparison.bestScenario[bestScenarioId]
      },
      recommendation: `${bestScenario?.name} performs best across ${comparison.bestScenario[bestScenarioId]} metrics`
    };
  }

  /**
   * Generate sensitivity insights
   */
  generateSensitivityInsights(variable, results) {
    const impacts = results.map(r => {
      const totalImpact = Object.values(r.impact).reduce((sum, i) => 
        sum + Math.abs(i.percentage), 0
      );
      return { value: r.value, impact: totalImpact };
    });

    const maxImpact = Math.max(...impacts.map(i => i.impact));
    const minImpact = Math.min(...impacts.map(i => i.impact));

    return {
      sensitivity: maxImpact - minImpact > 50 ? 'high' : 'moderate',
      recommendation: maxImpact - minImpact > 50
        ? `${variable} is highly sensitive - small changes have large impacts`
        : `${variable} shows moderate sensitivity - changes have proportional impacts`
    };
  }

  /**
   * Calculate correlations between variables
   */
  calculateCorrelations(results) {
    const correlations = {};
    const variables = Object.keys(results);

    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const var1 = variables[i];
        const var2 = variables[j];
        
        correlations[`${var1}_${var2}`] = {
          strength: 'moderate', // Simplified - would need actual correlation calculation
          direction: 'positive'
        };
      }
    }

    return correlations;
  }

  /**
   * Export scenario for reporting
   */
  exportScenario(scenarioId, format = 'json') {
    const scenario = scenarioId === 'baseline' 
      ? this.baselineData 
      : this.scenarios.find(s => s.id === scenarioId);

    if (!scenario) {
      throw new Error('Scenario not found');
    }

    if (format === 'json') {
      return JSON.stringify(scenario, null, 2);
    } else if (format === 'csv') {
      const rows = [['Metric', 'Value']];
      Object.entries(scenario.metrics).forEach(([key, value]) => {
        rows.push([key, value]);
      });
      return rows.map(r => r.join(',')).join('\n');
    }

    return scenario;
  }

  /**
   * Get all scenarios
   */
  getAllScenarios() {
    return [this.baselineData, ...this.scenarios].filter(Boolean);
  }

  /**
   * Delete scenario
   */
  deleteScenario(scenarioId) {
    this.scenarios = this.scenarios.filter(s => s.id !== scenarioId);
  }

  /**
   * Clear all scenarios
   */
  clearAll() {
    this.scenarios = [];
    this.baselineData = null;
  }
}

// Export singleton instance
const enhancedScenarioModelling = new EnhancedScenarioModelling();
export default enhancedScenarioModelling;
