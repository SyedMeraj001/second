import db from '../database/db.js';

class EUTaxonomyService {
  constructor() {
    this.objectives = {
      'climate-mitigation': 'Climate change mitigation',
      'climate-adaptation': 'Climate change adaptation', 
      'water-marine': 'Sustainable use and protection of water and marine resources',
      'circular-economy': 'Transition to a circular economy',
      'pollution-prevention': 'Pollution prevention and control',
      'biodiversity': 'Protection and restoration of biodiversity and ecosystems'
    };

    this.activities = {
      'mining': {
        'coal-mining': {
          eligible: false,
          reason: 'Coal mining activities are excluded from EU Taxonomy'
        },
        'metal-ore-mining': {
          eligible: true,
          conditions: [
            'Extraction of materials essential for renewable energy and low-carbon technologies',
            'Implementation of best available techniques (BAT)',
            'Comprehensive environmental management system',
            'Restoration plan for mining sites'
          ]
        },
        'quarrying': {
          eligible: true,
          conditions: [
            'Materials used for sustainable construction',
            'Circular economy principles applied',
            'Biodiversity impact mitigation'
          ]
        }
      },
      'manufacturing': {
        'cement-production': {
          eligible: true,
          conditions: [
            'Specific CO2 emissions below taxonomy threshold',
            'Use of alternative fuels and raw materials',
            'Carbon capture and utilization technologies'
          ]
        }
      }
    };

    this.criteria = {
      'substantial-contribution': {
        'climate-mitigation': {
          thresholds: {
            'ghg-emissions': 'Lifecycle GHG emissions lower than fossil fuel comparator',
            'energy-efficiency': 'Top 15% energy performance in sector'
          }
        }
      },
      'do-no-significant-harm': {
        'climate-adaptation': 'Physical climate risks identified and addressed',
        'water-marine': 'Water use efficiency and quality protection',
        'circular-economy': 'Waste prevention and recycling maximized',
        'pollution-prevention': 'Emissions within EU standards',
        'biodiversity': 'No significant impact on Natura 2000 sites'
      },
      'minimum-safeguards': [
        'OECD Guidelines for Multinational Enterprises',
        'UN Guiding Principles on Business and Human Rights',
        'ILO Declaration on Fundamental Principles and Rights at Work',
        'International Bill of Human Rights'
      ]
    };
  }

  async assessTaxonomyEligibility(companyId, activities) {
    const assessments = [];
    
    for (const activity of activities) {
      const assessment = await this.assessActivity(companyId, activity);
      assessments.push(assessment);
    }
    
    return {
      companyId,
      assessments,
      overallEligibility: this.calculateOverallEligibility(assessments),
      assessmentDate: new Date().toISOString()
    };
  }

  async assessActivity(companyId, activity) {
    const { sector, activityType, revenue, description } = activity;
    
    const eligibilityCheck = this.checkEligibility(sector, activityType);
    if (!eligibilityCheck.eligible) {
      return {
        ...activity,
        eligible: false,
        aligned: false,
        reason: eligibilityCheck.reason,
        revenue: revenue || 0
      };
    }

    // Check alignment criteria
    const alignmentCheck = await this.checkAlignment(companyId, activity);
    
    return {
      ...activity,
      eligible: true,
      aligned: alignmentCheck.aligned,
      conditions: eligibilityCheck.conditions,
      alignmentDetails: alignmentCheck,
      revenue: revenue || 0
    };
  }

  checkEligibility(sector, activityType) {
    const sectorActivities = this.activities[sector];
    if (!sectorActivities) {
      return { eligible: false, reason: 'Sector not covered by EU Taxonomy' };
    }
    
    const activity = sectorActivities[activityType];
    if (!activity) {
      return { eligible: false, reason: 'Activity not defined in EU Taxonomy' };
    }
    
    return activity;
  }

  async checkAlignment(companyId, activity) {
    // Get company ESG data for alignment assessment
    const esgData = await this.getCompanyESGData(companyId);
    
    const checks = {
      substantialContribution: this.assessSubstantialContribution(activity, esgData),
      doNoSignificantHarm: this.assessDNSH(esgData),
      minimumSafeguards: this.assessMinimumSafeguards(esgData)
    };
    
    const aligned = checks.substantialContribution.meets && 
                   checks.doNoSignificantHarm.meets && 
                   checks.minimumSafeguards.meets;
    
    return {
      aligned,
      checks,
      score: this.calculateAlignmentScore(checks)
    };
  }

  assessSubstantialContribution(activity, esgData) {
    // Simplified assessment - in production would be more detailed
    const ghgIntensity = esgData.scope1Emissions / (esgData.revenue || 1);
    const energyEfficiency = esgData.renewableEnergyPercentage || 0;
    
    return {
      meets: ghgIntensity < 0.5 && energyEfficiency > 15, // Example thresholds
      details: {
        ghgIntensity,
        energyEfficiency,
        thresholds: 'GHG < 0.5 tCO2e/€M revenue, Renewable energy > 15%'
      }
    };
  }

  assessDNSH(esgData) {
    const checks = {
      climateAdaptation: esgData.climateRiskAssessment || false,
      waterMarine: (esgData.waterRecyclingRate || 0) > 30,
      circularEconomy: (esgData.wasteRecyclingRate || 0) > 50,
      pollutionPrevention: (esgData.airQualityCompliance || 0) >= 95,
      biodiversity: esgData.biodiversityManagementPlan || false
    };
    
    const meetsAll = Object.values(checks).every(check => check === true);
    
    return {
      meets: meetsAll,
      details: checks
    };
  }

  assessMinimumSafeguards(esgData) {
    const safeguards = {
      humanRights: esgData.humanRightsPolicy || false,
      laborRights: esgData.laborStandardsCompliance || false,
      businessEthics: esgData.antiCorruptionPolicy || false,
      taxation: esgData.taxTransparency || false
    };
    
    const meetsAll = Object.values(safeguards).every(check => check === true);
    
    return {
      meets: meetsAll,
      details: safeguards
    };
  }

  calculateAlignmentScore(checks) {
    let score = 0;
    if (checks.substantialContribution.meets) score += 40;
    if (checks.doNoSignificantHarm.meets) score += 40;
    if (checks.minimumSafeguards.meets) score += 20;
    return score;
  }

  calculateOverallEligibility(assessments) {
    const totalRevenue = assessments.reduce((sum, a) => sum + (a.revenue || 0), 0);
    const eligibleRevenue = assessments
      .filter(a => a.eligible)
      .reduce((sum, a) => sum + (a.revenue || 0), 0);
    const alignedRevenue = assessments
      .filter(a => a.aligned)
      .reduce((sum, a) => sum + (a.revenue || 0), 0);
    
    return {
      totalRevenue,
      eligibleRevenue,
      alignedRevenue,
      eligibilityPercentage: totalRevenue > 0 ? (eligibleRevenue / totalRevenue * 100) : 0,
      alignmentPercentage: totalRevenue > 0 ? (alignedRevenue / totalRevenue * 100) : 0,
      taxonomyCompliant: (alignedRevenue / totalRevenue * 100) >= 50 // Example threshold
    };
  }

  async saveTaxonomyAssessment(companyId, assessment) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO eu_taxonomy_assessments 
        (company_id, assessment_data, eligibility_percentage, alignment_percentage, 
         compliant, assessment_date)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [
        companyId,
        JSON.stringify(assessment),
        assessment.overallEligibility.eligibilityPercentage,
        assessment.overallEligibility.alignmentPercentage,
        assessment.overallEligibility.taxonomyCompliant
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            saved: true
          });
        }
      });
    });
  }

  async getTaxonomyReport(companyId, year) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM eu_taxonomy_assessments 
        WHERE company_id = ? AND strftime('%Y', assessment_date) = ?
        ORDER BY assessment_date DESC LIMIT 1
      `;
      
      db.get(query, [companyId, year], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...row,
            assessment_data: JSON.parse(row.assessment_data)
          });
        }
      });
    });
  }

  async getCompanyESGData(companyId) {
    // Simplified - would query actual ESG metrics
    return new Promise((resolve) => {
      db.get(`
        SELECT 
          SUM(CASE WHEN metric_name = 'scope1Emissions' THEN metric_value ELSE 0 END) as scope1Emissions,
          SUM(CASE WHEN metric_name = 'revenue' THEN metric_value ELSE 0 END) as revenue,
          AVG(CASE WHEN metric_name = 'renewableEnergyPercentage' THEN metric_value ELSE 0 END) as renewableEnergyPercentage,
          AVG(CASE WHEN metric_name = 'waterRecyclingRate' THEN metric_value ELSE 0 END) as waterRecyclingRate,
          AVG(CASE WHEN metric_name = 'wasteRecyclingRate' THEN metric_value ELSE 0 END) as wasteRecyclingRate
        FROM esg_data WHERE company_id = ?
      `, [companyId], (err, row) => {
        resolve(row || {
          scope1Emissions: 1000,
          revenue: 100000000,
          renewableEnergyPercentage: 25,
          waterRecyclingRate: 40,
          wasteRecyclingRate: 60,
          climateRiskAssessment: true,
          airQualityCompliance: 98,
          biodiversityManagementPlan: true,
          humanRightsPolicy: true,
          laborStandardsCompliance: true,
          antiCorruptionPolicy: true,
          taxTransparency: true
        });
      });
    });
  }
}

export default new EUTaxonomyService();