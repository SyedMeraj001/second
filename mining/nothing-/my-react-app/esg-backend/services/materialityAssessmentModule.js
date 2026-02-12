// Complete Materiality Assessment Module
class MaterialityAssessmentModule {
  constructor() {
    this.stakeholders = ['investors', 'employees', 'customers', 'community', 'regulators'];
    this.impactAreas = ['environmental', 'social', 'governance'];
  }

  // Impact Materiality Assessment
  assessImpactMateriality(topic, data) {
    const assessment = {
      topic,
      impactType: data.impactType, // positive, negative, both
      scale: this.calculateScale(data),
      scope: this.calculateScope(data),
      irremediability: this.calculateIrremediability(data),
      likelihood: data.likelihood || 'medium',
      overallScore: 0,
      materialityLevel: ''
    };

    // Calculate overall impact materiality score (0-100)
    assessment.overallScore = (
      assessment.scale * 0.4 +
      assessment.scope * 0.3 +
      assessment.irremediability * 0.2 +
      this.likelihoodScore(assessment.likelihood) * 0.1
    );

    assessment.materialityLevel = this.getMaterialityLevel(assessment.overallScore);

    return assessment;
  }

  calculateScale(data) {
    // Scale: How severe is the impact? (0-100)
    const factors = {
      severity: data.severity || 50, // 0-100
      magnitude: data.magnitude || 50, // 0-100
      duration: data.duration || 50 // 0-100
    };

    return (factors.severity + factors.magnitude + factors.duration) / 3;
  }

  calculateScope(data) {
    // Scope: How widespread is the impact? (0-100)
    const affected = data.peopleAffected || 0;
    const total = data.totalPopulation || 1;
    const percentage = (affected / total) * 100;

    if (percentage >= 75) return 100;
    if (percentage >= 50) return 75;
    if (percentage >= 25) return 50;
    if (percentage >= 10) return 25;
    return 10;
  }

  calculateIrremediability(data) {
    // Irremediability: Can the impact be reversed? (0-100)
    const remediability = data.remediability || 'medium';
    
    const scores = {
      'irreversible': 100,
      'difficult': 75,
      'medium': 50,
      'easy': 25,
      'reversible': 0
    };

    return scores[remediability] || 50;
  }

  likelihoodScore(likelihood) {
    const scores = {
      'certain': 100,
      'high': 75,
      'medium': 50,
      'low': 25,
      'rare': 10
    };
    return scores[likelihood] || 50;
  }

  // Financial Materiality Assessment
  assessFinancialMateriality(topic, data) {
    const assessment = {
      topic,
      revenueImpact: this.calculateRevenueImpact(data),
      costImpact: this.calculateCostImpact(data),
      assetImpact: this.calculateAssetImpact(data),
      liabilityImpact: this.calculateLiabilityImpact(data),
      timeHorizon: data.timeHorizon || 'medium-term',
      likelihood: data.likelihood || 'medium',
      overallScore: 0,
      materialityLevel: ''
    };

    // Calculate overall financial materiality score (0-100)
    assessment.overallScore = (
      assessment.revenueImpact * 0.3 +
      assessment.costImpact * 0.3 +
      assessment.assetImpact * 0.2 +
      assessment.liabilityImpact * 0.2
    ) * (this.likelihoodScore(assessment.likelihood) / 100);

    assessment.materialityLevel = this.getMaterialityLevel(assessment.overallScore);

    return assessment;
  }

  calculateRevenueImpact(data) {
    // Revenue impact as percentage of total revenue
    const impact = data.revenueImpact || 0;
    const totalRevenue = data.totalRevenue || 1;
    const percentage = Math.abs((impact / totalRevenue) * 100);

    if (percentage >= 10) return 100;
    if (percentage >= 5) return 75;
    if (percentage >= 2) return 50;
    if (percentage >= 1) return 25;
    return 10;
  }

  calculateCostImpact(data) {
    // Cost impact as percentage of operating costs
    const impact = data.costImpact || 0;
    const totalCosts = data.totalCosts || 1;
    const percentage = Math.abs((impact / totalCosts) * 100);

    if (percentage >= 10) return 100;
    if (percentage >= 5) return 75;
    if (percentage >= 2) return 50;
    if (percentage >= 1) return 25;
    return 10;
  }

  calculateAssetImpact(data) {
    // Asset value impact
    const impact = data.assetImpact || 0;
    const totalAssets = data.totalAssets || 1;
    const percentage = Math.abs((impact / totalAssets) * 100);

    if (percentage >= 5) return 100;
    if (percentage >= 2) return 75;
    if (percentage >= 1) return 50;
    if (percentage >= 0.5) return 25;
    return 10;
  }

  calculateLiabilityImpact(data) {
    // Liability impact
    const impact = data.liabilityImpact || 0;
    const totalLiabilities = data.totalLiabilities || 1;
    const percentage = Math.abs((impact / totalLiabilities) * 100);

    if (percentage >= 5) return 100;
    if (percentage >= 2) return 75;
    if (percentage >= 1) return 50;
    if (percentage >= 0.5) return 25;
    return 10;
  }

  // Double Materiality Assessment
  assessDoubleMateriality(topic, impactData, financialData) {
    const impactMateriality = this.assessImpactMateriality(topic, impactData);
    const financialMateriality = this.assessFinancialMateriality(topic, financialData);

    return {
      topic,
      impactMateriality,
      financialMateriality,
      isMaterial: impactMateriality.overallScore >= 50 || financialMateriality.overallScore >= 50,
      priority: this.calculatePriority(impactMateriality.overallScore, financialMateriality.overallScore),
      recommendation: this.generateRecommendation(impactMateriality, financialMateriality)
    };
  }

  calculatePriority(impactScore, financialScore) {
    const avgScore = (impactScore + financialScore) / 2;
    
    if (avgScore >= 75) return 'critical';
    if (avgScore >= 50) return 'high';
    if (avgScore >= 25) return 'medium';
    return 'low';
  }

  generateRecommendation(impactMateriality, financialMateriality) {
    const recommendations = [];

    if (impactMateriality.overallScore >= 75) {
      recommendations.push('High impact materiality - immediate action required');
    }

    if (financialMateriality.overallScore >= 75) {
      recommendations.push('High financial materiality - significant business impact');
    }

    if (impactMateriality.overallScore >= 50 && financialMateriality.overallScore >= 50) {
      recommendations.push('Material on both dimensions - priority topic for disclosure');
    }

    if (recommendations.length === 0) {
      recommendations.push('Monitor and reassess periodically');
    }

    return recommendations;
  }

  getMaterialityLevel(score) {
    if (score >= 75) return 'very-high';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  // Stakeholder Engagement
  conductStakeholderSurvey(topic, stakeholderGroup, responses) {
    const importance = responses.reduce((sum, r) => sum + r.importance, 0) / responses.length;
    const concern = responses.reduce((sum, r) => sum + r.concern, 0) / responses.length;

    return {
      topic,
      stakeholderGroup,
      importance: importance, // 0-100
      concern: concern, // 0-100
      responseCount: responses.length,
      averageScore: (importance + concern) / 2
    };
  }

  // Generate Materiality Matrix
  generateMaterialityMatrix(assessments) {
    return assessments.map(assessment => ({
      topic: assessment.topic,
      x: assessment.financialMateriality.overallScore,
      y: assessment.impactMateriality.overallScore,
      priority: assessment.priority,
      isMaterial: assessment.isMaterial
    }));
  }

  // Generate Report
  generateMaterialityReport(assessments) {
    const materialTopics = assessments.filter(a => a.isMaterial);
    const criticalTopics = assessments.filter(a => a.priority === 'critical');

    return {
      summary: {
        totalTopics: assessments.length,
        materialTopics: materialTopics.length,
        criticalTopics: criticalTopics.length,
        assessmentDate: new Date().toISOString()
      },
      materialTopics: materialTopics.map(t => ({
        topic: t.topic,
        priority: t.priority,
        impactScore: t.impactMateriality.overallScore,
        financialScore: t.financialMateriality.overallScore,
        recommendations: t.recommendation
      })),
      matrix: this.generateMaterialityMatrix(assessments)
    };
  }
}

module.exports = MaterialityAssessmentModule;
