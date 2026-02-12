export class EUTaxonomyEngine {
  
  static objectives = [
    { id: 'climate-mitigation', name: 'Climate Change Mitigation', icon: '🌡️' },
    { id: 'climate-adaptation', name: 'Climate Change Adaptation', icon: '🛡️' },
    { id: 'water', name: 'Sustainable Use of Water', icon: '💧' },
    { id: 'circular-economy', name: 'Transition to Circular Economy', icon: '♻️' },
    { id: 'pollution', name: 'Pollution Prevention', icon: '🚫' },
    { id: 'biodiversity', name: 'Protection of Biodiversity', icon: '🌿' }
  ];

  static activities = [
    { naceCode: '35.11', name: 'Electricity generation from solar', objective: 'climate-mitigation', threshold: 100 },
    { naceCode: '35.12', name: 'Electricity generation from wind', objective: 'climate-mitigation', threshold: 100 },
    { naceCode: '35.13', name: 'Electricity generation from hydro', objective: 'climate-mitigation', threshold: 100 },
    { naceCode: '35.14', name: 'Electricity generation from geothermal', objective: 'climate-mitigation', threshold: 100 },
    { naceCode: '35.15', name: 'Electricity generation from biomass', objective: 'climate-mitigation', threshold: 200 },
    { naceCode: '41.00', name: 'Construction of buildings', objective: 'climate-mitigation', threshold: 10 },
    { naceCode: '42.11', name: 'Construction of roads', objective: 'climate-mitigation', threshold: 15 },
    { naceCode: '49.10', name: 'Passenger rail transport', objective: 'climate-mitigation', threshold: 50 },
    { naceCode: '49.31', name: 'Urban and suburban transport', objective: 'climate-mitigation', threshold: 50 },
    { naceCode: '49.41', name: 'Freight transport by road', objective: 'climate-mitigation', threshold: 25 },
    { naceCode: '64.19', name: 'Banking and financial services', objective: 'climate-mitigation', threshold: 0 },
    { naceCode: '71.12', name: 'Engineering activities', objective: 'climate-mitigation', threshold: 0 },
    { naceCode: '72.19', name: 'R&D in natural sciences', objective: 'climate-mitigation', threshold: 0 }
  ];

  static technicalCriteria = {
    'climate-mitigation': [
      { id: 'ghg-emissions', name: 'GHG emissions below threshold', type: 'numeric', unit: 'gCO2e/kWh' },
      { id: 'energy-efficiency', name: 'Energy efficiency standards met', type: 'boolean' },
      { id: 'renewable-share', name: 'Renewable energy share', type: 'percentage' },
      { id: 'lifecycle-emissions', name: 'Lifecycle emissions assessed', type: 'boolean' }
    ],
    'climate-adaptation': [
      { id: 'climate-risk', name: 'Climate risk assessment completed', type: 'boolean' },
      { id: 'adaptation-plan', name: 'Adaptation solutions implemented', type: 'boolean' },
      { id: 'resilience', name: 'Physical resilience measures', type: 'text' }
    ],
    'water': [
      { id: 'water-stress', name: 'Water stress assessment', type: 'boolean' },
      { id: 'water-efficiency', name: 'Water use efficiency measures', type: 'text' },
      { id: 'water-quality', name: 'Water quality monitoring', type: 'boolean' }
    ],
    'circular-economy': [
      { id: 'waste-reduction', name: 'Waste reduction targets', type: 'percentage' },
      { id: 'recycling-rate', name: 'Recycling rate', type: 'percentage' },
      { id: 'circular-design', name: 'Circular design principles', type: 'boolean' }
    ],
    'pollution': [
      { id: 'emissions-limits', name: 'Emissions within legal limits', type: 'boolean' },
      { id: 'hazardous-substances', name: 'Hazardous substances management', type: 'boolean' },
      { id: 'pollution-monitoring', name: 'Pollution monitoring system', type: 'boolean' }
    ],
    'biodiversity': [
      { id: 'biodiversity-assessment', name: 'Biodiversity impact assessment', type: 'boolean' },
      { id: 'protected-areas', name: 'No activities in protected areas', type: 'boolean' },
      { id: 'habitat-protection', name: 'Habitat protection measures', type: 'text' }
    ]
  };

  static minimumSafeguards = [
    { id: 'oecd-guidelines', name: 'OECD Guidelines for Multinational Enterprises', category: 'human-rights' },
    { id: 'un-guiding', name: 'UN Guiding Principles on Business and Human Rights', category: 'human-rights' },
    { id: 'ilo-conventions', name: 'ILO Core Labour Conventions', category: 'labour' },
    { id: 'tax-compliance', name: 'Tax compliance and transparency', category: 'governance' },
    { id: 'anti-corruption', name: 'Anti-corruption policies', category: 'governance' },
    { id: 'fair-competition', name: 'Fair competition practices', category: 'governance' }
  ];

  static assessActivity(activity, data) {
    const criteria = this.technicalCriteria[activity.objective] || [];
    const results = {
      activity: activity.naceCode,
      objective: activity.objective,
      substantialContribution: false,
      dnshPassed: false,
      minimumSafeguards: false,
      aligned: false,
      details: {}
    };

    // Check substantial contribution
    const criteriaResults = criteria.map(c => {
      const value = data.criteria?.[c.id];
      let passed = false;

      if (c.type === 'boolean') passed = value === true;
      else if (c.type === 'numeric') passed = value <= activity.threshold;
      else if (c.type === 'percentage') passed = value >= 50;
      else if (c.type === 'text') passed = value && value.length > 0;

      return { ...c, value, passed };
    });

    results.substantialContribution = criteriaResults.every(c => c.passed);
    results.details.criteria = criteriaResults;

    // Check DNSH for other objectives
    const dnshResults = this.objectives
      .filter(obj => obj.id !== activity.objective)
      .map(obj => ({
        objective: obj.id,
        name: obj.name,
        passed: data.dnsh?.[obj.id] === true
      }));

    results.dnshPassed = dnshResults.every(d => d.passed);
    results.details.dnsh = dnshResults;

    // Check minimum safeguards
    const safeguardResults = this.minimumSafeguards.map(s => ({
      ...s,
      compliant: data.safeguards?.[s.id] === true
    }));

    results.minimumSafeguards = safeguardResults.every(s => s.compliant);
    results.details.safeguards = safeguardResults;

    // Final alignment
    results.aligned = results.substantialContribution && results.dnshPassed && results.minimumSafeguards;

    return results;
  }

  static calculateAlignment(assessments, financialData) {
    const totalRevenue = financialData.totalRevenue || 0;
    const totalCapex = financialData.totalCapex || 0;
    const totalOpex = financialData.totalOpex || 0;

    let alignedRevenue = 0;
    let alignedCapex = 0;
    let alignedOpex = 0;

    assessments.forEach(assessment => {
      if (assessment.aligned) {
        alignedRevenue += assessment.revenue || 0;
        alignedCapex += assessment.capex || 0;
        alignedOpex += assessment.opex || 0;
      }
    });

    return {
      revenue: {
        total: totalRevenue,
        aligned: alignedRevenue,
        percentage: totalRevenue > 0 ? (alignedRevenue / totalRevenue * 100).toFixed(2) : 0
      },
      capex: {
        total: totalCapex,
        aligned: alignedCapex,
        percentage: totalCapex > 0 ? (alignedCapex / totalCapex * 100).toFixed(2) : 0
      },
      opex: {
        total: totalOpex,
        aligned: alignedOpex,
        percentage: totalOpex > 0 ? (alignedOpex / totalOpex * 100).toFixed(2) : 0
      },
      summary: {
        totalActivities: assessments.length,
        alignedActivities: assessments.filter(a => a.aligned).length,
        alignmentRate: assessments.length > 0 
          ? (assessments.filter(a => a.aligned).length / assessments.length * 100).toFixed(2) 
          : 0
      }
    };
  }

  static generateReport(assessments, alignment, companyInfo) {
    const report = {
      metadata: {
        company: companyInfo.name,
        reportingYear: companyInfo.year || new Date().getFullYear(),
        generatedAt: new Date().toISOString(),
        standard: 'EU Taxonomy Regulation (2020/852)'
      },
      executive: {
        alignmentPercentage: alignment.revenue.percentage,
        alignedRevenue: alignment.revenue.aligned,
        totalRevenue: alignment.revenue.total,
        alignedActivities: alignment.summary.alignedActivities,
        totalActivities: alignment.summary.totalActivities
      },
      activities: assessments.map(a => ({
        naceCode: a.activity,
        objective: a.objective,
        revenue: a.revenue,
        aligned: a.aligned,
        substantialContribution: a.substantialContribution,
        dnshPassed: a.dnshPassed,
        minimumSafeguards: a.minimumSafeguards
      })),
      kpis: {
        revenue: alignment.revenue,
        capex: alignment.capex,
        opex: alignment.opex
      },
      recommendations: this.generateRecommendations(assessments, alignment)
    };

    return report;
  }

  static generateRecommendations(assessments, alignment) {
    const recommendations = [];

    // Low alignment
    if (parseFloat(alignment.revenue.percentage) < 20) {
      recommendations.push({
        priority: 'high',
        category: 'alignment',
        message: 'Low taxonomy alignment detected',
        action: 'Identify opportunities to transition activities to taxonomy-aligned operations',
        impact: 'Improve ESG rating and access to green financing'
      });
    }

    // DNSH failures
    const dnshFailures = assessments.filter(a => a.substantialContribution && !a.dnshPassed);
    if (dnshFailures.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'dnsh',
        message: `${dnshFailures.length} activities fail DNSH criteria`,
        action: 'Implement mitigation measures for environmental impacts',
        impact: 'Unlock taxonomy alignment for substantial contribution activities'
      });
    }

    // Safeguards issues
    const safeguardIssues = assessments.filter(a => !a.minimumSafeguards);
    if (safeguardIssues.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'safeguards',
        message: `${safeguardIssues.length} activities fail minimum safeguards`,
        action: 'Strengthen governance, human rights, and labour practices',
        impact: 'Essential for taxonomy eligibility'
      });
    }

    return recommendations;
  }

  static searchActivities(query) {
    const lowerQuery = query.toLowerCase();
    return this.activities.filter(a => 
      a.naceCode.includes(lowerQuery) || 
      a.name.toLowerCase().includes(lowerQuery)
    );
  }

  static getActivityByCode(naceCode) {
    return this.activities.find(a => a.naceCode === naceCode);
  }

  static getObjectiveById(id) {
    return this.objectives.find(o => o.id === id);
  }
}
