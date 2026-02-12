export class ScenarioEngine {
  
  static createScenario(name, baselineData, adjustments) {
    return {
      id: Date.now(),
      name,
      baselineData,
      adjustments,
      results: this.calculateScenario(baselineData, adjustments),
      createdAt: new Date().toISOString()
    };
  }

  static calculateScenario(baseline, adjustments) {
    const results = { ...baseline };
    
    Object.entries(adjustments).forEach(([metric, adjustment]) => {
      const baseValue = baseline[metric] || 0;
      
      if (adjustment.type === 'percentage') {
        results[metric] = baseValue * (1 + adjustment.value / 100);
      } else if (adjustment.type === 'absolute') {
        results[metric] = baseValue + adjustment.value;
      } else if (adjustment.type === 'target') {
        results[metric] = adjustment.value;
      }
    });
    
    return results;
  }

  static compareScenarios(scenarios) {
    const comparison = {
      scenarios: scenarios.map(s => s.name),
      metrics: {},
      summary: {}
    };
    
    const allMetrics = new Set();
    scenarios.forEach(s => {
      Object.keys(s.results).forEach(m => allMetrics.add(m));
    });
    
    allMetrics.forEach(metric => {
      comparison.metrics[metric] = scenarios.map(s => ({
        scenario: s.name,
        value: s.results[metric] || 0,
        change: this.calculateChange(s.baselineData[metric], s.results[metric])
      }));
    });
    
    return comparison;
  }

  static calculateChange(baseline, result) {
    if (!baseline || baseline === 0) return 0;
    return ((result - baseline) / baseline * 100).toFixed(1);
  }

  static runMonteCarloSimulation(baselineData, uncertainties, iterations = 1000) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const scenario = { ...baselineData };
      
      Object.entries(uncertainties).forEach(([metric, uncertainty]) => {
        const baseValue = baselineData[metric] || 0;
        const randomFactor = this.normalRandom(uncertainty.mean || 0, uncertainty.stdDev || 0.1);
        scenario[metric] = baseValue * (1 + randomFactor);
      });
      
      results.push(scenario);
    }
    
    return this.analyzeSimulationResults(results);
  }

  static normalRandom(mean = 0, stdDev = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  static analyzeSimulationResults(results) {
    const analysis = {};
    const metrics = Object.keys(results[0]);
    
    metrics.forEach(metric => {
      const values = results.map(r => r[metric]).sort((a, b) => a - b);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      
      analysis[metric] = {
        mean: mean.toFixed(2),
        median: values[Math.floor(values.length / 2)].toFixed(2),
        p5: values[Math.floor(values.length * 0.05)].toFixed(2),
        p95: values[Math.floor(values.length * 0.95)].toFixed(2),
        min: Math.min(...values).toFixed(2),
        max: Math.max(...values).toFixed(2)
      };
    });
    
    return analysis;
  }

  static getPresetScenarios() {
    return [
      {
        id: 'optimistic',
        name: 'Optimistic Growth',
        description: 'Best-case scenario with aggressive improvements',
        adjustments: {
          scope1Emissions: { type: 'percentage', value: -30 },
          scope2Emissions: { type: 'percentage', value: -40 },
          renewableEnergy: { type: 'percentage', value: 50 },
          waterUsage: { type: 'percentage', value: -25 },
          wasteRecycling: { type: 'percentage', value: 40 },
          diversityScore: { type: 'percentage', value: 25 }
        }
      },
      {
        id: 'realistic',
        name: 'Realistic Progress',
        description: 'Moderate improvements with current resources',
        adjustments: {
          scope1Emissions: { type: 'percentage', value: -15 },
          scope2Emissions: { type: 'percentage', value: -20 },
          renewableEnergy: { type: 'percentage', value: 25 },
          waterUsage: { type: 'percentage', value: -12 },
          wasteRecycling: { type: 'percentage', value: 20 },
          diversityScore: { type: 'percentage', value: 10 }
        }
      },
      {
        id: 'conservative',
        name: 'Conservative Baseline',
        description: 'Minimal changes, business as usual',
        adjustments: {
          scope1Emissions: { type: 'percentage', value: -5 },
          scope2Emissions: { type: 'percentage', value: -8 },
          renewableEnergy: { type: 'percentage', value: 10 },
          waterUsage: { type: 'percentage', value: -5 },
          wasteRecycling: { type: 'percentage', value: 8 },
          diversityScore: { type: 'percentage', value: 5 }
        }
      },
      {
        id: 'netzero2030',
        name: 'Net Zero by 2030',
        description: 'Aggressive decarbonization pathway',
        adjustments: {
          scope1Emissions: { type: 'percentage', value: -80 },
          scope2Emissions: { type: 'percentage', value: -100 },
          scope3Emissions: { type: 'percentage', value: -50 },
          renewableEnergy: { type: 'target', value: 100 },
          carbonOffset: { type: 'percentage', value: 200 }
        }
      },
      {
        id: 'circular',
        name: 'Circular Economy',
        description: 'Focus on waste reduction and recycling',
        adjustments: {
          wasteGenerated: { type: 'percentage', value: -40 },
          wasteRecycling: { type: 'percentage', value: 60 },
          waterRecycling: { type: 'percentage', value: 50 },
          materialReuse: { type: 'percentage', value: 70 }
        }
      }
    ];
  }

  static calculateImpact(scenario, category = 'all') {
    const impacts = {
      environmental: 0,
      social: 0,
      governance: 0,
      financial: 0
    };
    
    Object.entries(scenario.adjustments).forEach(([metric, adjustment]) => {
      const impact = Math.abs(adjustment.value);
      
      if (metric.includes('emission') || metric.includes('water') || metric.includes('waste')) {
        impacts.environmental += impact;
      } else if (metric.includes('diversity') || metric.includes('safety') || metric.includes('employee')) {
        impacts.social += impact;
      } else if (metric.includes('board') || metric.includes('governance')) {
        impacts.governance += impact;
      }
    });
    
    impacts.financial = (impacts.environmental + impacts.social + impacts.governance) * 0.15;
    
    return category === 'all' ? impacts : impacts[category];
  }

  static exportScenario(scenario, format = 'json') {
    if (format === 'json') {
      return JSON.stringify(scenario, null, 2);
    } else if (format === 'csv') {
      const headers = ['Metric', 'Baseline', 'Scenario', 'Change'];
      const rows = Object.keys(scenario.results).map(metric => [
        metric,
        scenario.baselineData[metric] || 0,
        scenario.results[metric] || 0,
        this.calculateChange(scenario.baselineData[metric], scenario.results[metric])
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
