import db from '../database/db.js';

class SBTiIntegrationService {
  constructor() {
    this.targetTypes = {
      'absolute': 'Absolute emissions reduction',
      'intensity': 'Emissions intensity reduction',
      'renewable': 'Renewable energy procurement'
    };

    this.pathways = {
      '1.5C': {
        name: '1.5°C pathway',
        annualReduction: 0.045, // 4.5% per year
        description: 'Aligned with 1.5°C global warming limit'
      },
      '2C': {
        name: '2°C pathway', 
        annualReduction: 0.025, // 2.5% per year
        description: 'Aligned with well-below 2°C global warming limit'
      }
    };

    this.sectors = {
      'mining': {
        scope1Intensity: 2.5, // tCO2e/M$ baseline
        scope2Intensity: 1.8,
        scope3Intensity: 4.2,
        renewableTarget: 50 // % by 2030
      },
      'manufacturing': {
        scope1Intensity: 1.8,
        scope2Intensity: 2.1,
        scope3Intensity: 3.5,
        renewableTarget: 60
      }
    };
  }

  async createSBTiTarget(companyId, targetData) {
    const { 
      targetType, 
      scope, 
      pathway, 
      baselineYear, 
      baselineEmissions, 
      targetYear, 
      sector = 'mining' 
    } = targetData;

    // Validate SBTi criteria
    const validation = this.validateSBTiCriteria(targetData);
    if (!validation.valid) {
      throw new Error(`SBTi validation failed: ${validation.errors.join(', ')}`);
    }

    // Calculate target emissions based on pathway
    const targetCalculation = this.calculateSBTiTarget(
      baselineEmissions, 
      baselineYear, 
      targetYear, 
      pathway
    );

    const target = {
      companyId,
      targetType,
      scope,
      pathway,
      baselineYear,
      baselineEmissions,
      targetYear,
      targetEmissions: targetCalculation.targetEmissions,
      reductionPercent: targetCalculation.reductionPercent,
      annualReductionRate: targetCalculation.annualReductionRate,
      sbtiApproved: false,
      status: 'draft',
      sector,
      createdAt: new Date().toISOString()
    };

    const targetId = await this.saveSBTiTarget(target);
    return { ...target, id: targetId };
  }

  validateSBTiCriteria(targetData) {
    const errors = [];
    const { targetType, scope, baselineYear, targetYear, baselineEmissions } = targetData;

    // Timeline validation
    const currentYear = new Date().getFullYear();
    if (baselineYear > currentYear - 1) {
      errors.push('Baseline year must be at least 1 year in the past');
    }
    
    if (targetYear - baselineYear < 5) {
      errors.push('Target must be at least 5 years from baseline');
    }
    
    if (targetYear - currentYear > 15) {
      errors.push('Target year cannot be more than 15 years in the future');
    }

    // Scope validation
    if (!['scope1', 'scope2', 'scope1+2', 'scope3'].includes(scope)) {
      errors.push('Invalid scope specification');
    }

    // Baseline validation
    if (!baselineEmissions || baselineEmissions <= 0) {
      errors.push('Valid baseline emissions required');
    }

    // Target type validation
    if (!this.targetTypes[targetType]) {
      errors.push('Invalid target type');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  calculateSBTiTarget(baselineEmissions, baselineYear, targetYear, pathway) {
    const pathwayData = this.pathways[pathway];
    if (!pathwayData) {
      throw new Error(`Invalid pathway: ${pathway}`);
    }

    const years = targetYear - baselineYear;
    const totalReduction = 1 - Math.pow(1 - pathwayData.annualReduction, years);
    const targetEmissions = baselineEmissions * (1 - totalReduction);
    const reductionPercent = totalReduction * 100;

    return {
      targetEmissions: Math.round(targetEmissions),
      reductionPercent: Math.round(reductionPercent * 10) / 10,
      annualReductionRate: pathwayData.annualReduction * 100
    };
  }

  async trackSBTiProgress(companyId, targetId, currentEmissions, reportingYear) {
    const target = await this.getSBTiTarget(targetId);
    if (!target) {
      throw new Error('Target not found');
    }

    const yearsElapsed = reportingYear - target.baseline_year;
    const totalYears = target.target_year - target.baseline_year;
    const progressExpected = (yearsElapsed / totalYears) * 100;
    
    const emissionsReduction = target.baseline_emissions - currentEmissions;
    const progressActual = (emissionsReduction / (target.baseline_emissions - target.target_emissions)) * 100;
    
    const onTrack = progressActual >= (progressExpected * 0.8); // 80% threshold

    const progress = {
      targetId,
      reportingYear,
      currentEmissions,
      progressActual: Math.round(progressActual * 10) / 10,
      progressExpected: Math.round(progressExpected * 10) / 10,
      onTrack,
      yearsRemaining: target.target_year - reportingYear,
      requiredAnnualReduction: this.calculateRequiredReduction(
        currentEmissions, 
        target.target_emissions, 
        target.target_year - reportingYear
      )
    };

    await this.saveProgressUpdate(progress);
    return progress;
  }

  calculateRequiredReduction(currentEmissions, targetEmissions, yearsRemaining) {
    if (yearsRemaining <= 0) return 0;
    
    const totalReductionNeeded = currentEmissions - targetEmissions;
    const annualReduction = totalReductionNeeded / yearsRemaining;
    const annualReductionPercent = (annualReduction / currentEmissions) * 100;
    
    return Math.round(annualReductionPercent * 10) / 10;
  }

  async generateNetZeroPathway(companyId, targetYear = 2050, sector = 'mining') {
    const currentEmissions = await this.getCurrentEmissions(companyId);
    const sectorData = this.sectors[sector];
    
    const pathway = {
      companyId,
      targetYear,
      currentEmissions,
      milestones: [],
      recommendations: []
    };

    // Generate 5-year milestones
    const years = targetYear - new Date().getFullYear();
    const milestoneInterval = 5;
    
    for (let i = milestoneInterval; i <= years; i += milestoneInterval) {
      const milestoneYear = new Date().getFullYear() + i;
      const reductionTarget = this.calculateMilestoneReduction(i, years);
      
      pathway.milestones.push({
        year: milestoneYear,
        targetEmissions: Math.round(currentEmissions.total * (1 - reductionTarget)),
        reductionPercent: Math.round(reductionTarget * 100),
        keyActions: this.generateMilestoneActions(i, sector)
      });
    }

    // Generate recommendations
    pathway.recommendations = this.generateNetZeroRecommendations(currentEmissions, sector);
    
    return pathway;
  }

  calculateMilestoneReduction(yearsFromNow, totalYears) {
    // Accelerating reduction curve - more aggressive in later years
    const progress = yearsFromNow / totalYears;
    return Math.pow(progress, 0.8) * 0.95; // 95% reduction by target year
  }

  generateMilestoneActions(yearsFromNow, sector) {
    const actions = {
      5: ['Implement energy efficiency programs', 'Begin renewable energy procurement'],
      10: ['Scale renewable energy to 50%', 'Electrify mobile equipment'],
      15: ['Achieve 80% renewable energy', 'Deploy carbon capture technologies'],
      20: ['Implement nature-based solutions', 'Achieve operational carbon neutrality'],
      25: ['Offset remaining emissions', 'Achieve net-zero operations']
    };
    
    return actions[yearsFromNow] || ['Continue emission reduction efforts'];
  }

  generateNetZeroRecommendations(emissions, sector) {
    const recommendations = [
      {
        category: 'Energy Transition',
        priority: 'High',
        action: 'Transition to 100% renewable electricity',
        impact: `Could reduce Scope 2 emissions by ${emissions.scope2} tCO2e`,
        timeline: '2025-2030'
      },
      {
        category: 'Operational Efficiency',
        priority: 'High', 
        action: 'Implement comprehensive energy management system',
        impact: `Could reduce Scope 1 emissions by 15-25%`,
        timeline: '2024-2027'
      },
      {
        category: 'Technology Innovation',
        priority: 'Medium',
        action: 'Invest in carbon capture and storage technologies',
        impact: 'Could address hard-to-abate emissions',
        timeline: '2028-2035'
      }
    ];
    
    return recommendations;
  }

  async saveSBTiTarget(target) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO sbti_targets 
        (company_id, target_type, scope, pathway, baseline_year, baseline_emissions,
         target_year, target_emissions, reduction_percent, annual_reduction_rate,
         sbti_approved, status, sector, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(query, [
        target.companyId, target.targetType, target.scope, target.pathway,
        target.baselineYear, target.baselineEmissions, target.targetYear,
        target.targetEmissions, target.reductionPercent, target.annualReductionRate,
        target.sbtiApproved, target.status, target.sector, target.createdAt
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getSBTiTarget(targetId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM sbti_targets WHERE id = ?', [targetId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async saveProgressUpdate(progress) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO sbti_progress 
        (target_id, reporting_year, current_emissions, progress_actual, 
         progress_expected, on_track, years_remaining, required_annual_reduction)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(query, [
        progress.targetId, progress.reportingYear, progress.currentEmissions,
        progress.progressActual, progress.progressExpected, progress.onTrack,
        progress.yearsRemaining, progress.requiredAnnualReduction
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async getCurrentEmissions(companyId) {
    // Simplified - would query actual emissions data
    return {
      scope1: 50000,
      scope2: 30000,
      scope3: 120000,
      total: 200000
    };
  }
}

export default new SBTiIntegrationService();