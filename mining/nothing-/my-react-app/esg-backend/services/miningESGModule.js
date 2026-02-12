// Lazy loading singleton
let dbInstance = null;

const getDb = async () => {
  if (!dbInstance) {
    const { default: db } = await import('../database/db.js');
    dbInstance = db;
  }
  return dbInstance;
};

class MiningESGModule {
  // Tailings Management (GRI 11)
  static async manageTailings(companyId, data) {
    const db = await getDb();
    const tailingsData = {
      facility_count: data.facilityCount,
      total_volume: data.totalVolume,
      construction_method: data.constructionMethod,
      risk_classification: data.riskClassification,
      monitoring_frequency: data.monitoringFrequency,
      stability_assessment: data.stabilityAssessment,
      emergency_preparedness: data.emergencyPreparedness
    };

    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO mining_tailings (company_id, facility_count, total_volume, 
        construction_method, risk_classification, monitoring_frequency, 
        stability_assessment, emergency_preparedness, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [companyId, ...Object.values(tailingsData)], 
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...tailingsData });
        });
    });
  }

  // Biodiversity & Land Use
  static async trackBiodiversity(companyId, data) {
    const db = await getDb();
    const biodiversityMetrics = {
      total_land_disturbed: data.totalLandDisturbed,
      land_rehabilitated: data.landRehabilitated,
      protected_areas_impact: data.protectedAreasImpact,
      species_at_risk: data.speciesAtRisk,
      habitat_restoration: data.habitatRestoration,
      biodiversity_offset: data.biodiversityOffset
    };

    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO mining_biodiversity (company_id, total_land_disturbed, 
        land_rehabilitated, protected_areas_impact, species_at_risk, 
        habitat_restoration, biodiversity_offset, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [companyId, ...Object.values(biodiversityMetrics)], 
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...biodiversityMetrics });
        });
    });
  }

  // Community Relations & Indigenous Rights
  static async manageCommunityRelations(companyId, data) {
    const db = await getDb();
    const communityData = {
      consultation_meetings: data.consultationMeetings,
      grievance_mechanism: data.grievanceMechanism,
      local_employment_rate: data.localEmploymentRate,
      community_investment: data.communityInvestment,
      indigenous_consultation: data.indigenousConsultation,
      cultural_heritage_sites: data.culturalHeritageSites,
      resettlement_households: data.resettlementHouseholds
    };

    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO mining_community (company_id, consultation_meetings, 
        grievance_mechanism, local_employment_rate, community_investment, 
        indigenous_consultation, cultural_heritage_sites, resettlement_households, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [companyId, ...Object.values(communityData)], 
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...communityData });
        });
    });
  }

  // Water Stewardship
  static async manageWaterStewardship(companyId, data) {
    const db = await getDb();
    const waterData = {
      water_withdrawal: data.waterWithdrawal,
      water_discharge: data.waterDischarge,
      water_recycled: data.waterRecycled,
      water_quality_incidents: data.waterQualityIncidents,
      groundwater_monitoring: data.groundwaterMonitoring,
      watershed_management: data.watershedManagement
    };

    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO mining_water (company_id, water_withdrawal, water_discharge, 
        water_recycled, water_quality_incidents, groundwater_monitoring, 
        watershed_management, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [companyId, ...Object.values(waterData)], 
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...waterData });
        });
    });
  }

  // Mining-Specific Risk Assessment
  static async assessMiningRisks(companyId) {
    const [tailings, biodiversity, community, water] = await Promise.all([
      this.getTailingsData(companyId),
      this.getBiodiversityData(companyId),
      this.getCommunityData(companyId),
      this.getWaterData(companyId)
    ]);

    const risks = {
      tailings: this.assessTailingsRisk(tailings),
      environmental: this.assessEnvironmentalRisk(biodiversity, water),
      social: this.assessSocialRisk(community),
      operational: this.assessOperationalRisk({ tailings, biodiversity, community, water })
    };

    const overallRisk = Object.values(risks).reduce((sum, risk) => sum + risk, 0) / 4;

    return {
      overall: Math.round(overallRisk),
      breakdown: risks,
      level: overallRisk > 70 ? 'high' : overallRisk > 40 ? 'medium' : 'low',
      recommendations: this.generateRiskRecommendations(risks)
    };
  }

  // Mining KPIs Dashboard
  static async getMiningKPIs(companyId) {
    const data = await Promise.all([
      this.getTailingsData(companyId),
      this.getBiodiversityData(companyId),
      this.getCommunityData(companyId),
      this.getWaterData(companyId)
    ]);

    return {
      tailingsManagement: {
        facilities: data[0]?.facility_count || 0,
        riskLevel: data[0]?.risk_classification || 'unknown',
        lastAssessment: data[0]?.created_at || null
      },
      biodiversity: {
        landDisturbed: data[1]?.total_land_disturbed || 0,
        landRehabilitated: data[1]?.land_rehabilitated || 0,
        rehabilitationRate: this.calculateRehabilitation(data[1])
      },
      community: {
        localEmployment: data[2]?.local_employment_rate || 0,
        communityInvestment: data[2]?.community_investment || 0,
        grievances: data[2]?.grievance_mechanism || 'not_implemented'
      },
      water: {
        withdrawal: data[3]?.water_withdrawal || 0,
        recyclingRate: this.calculateWaterRecycling(data[3]),
        qualityIncidents: data[3]?.water_quality_incidents || 0
      }
    };
  }

  // Risk assessment methods
  static assessTailingsRisk(data) {
    if (!data) return 50;
    let risk = 0;
    if (data.risk_classification === 'high') risk += 40;
    if (data.risk_classification === 'extreme') risk += 60;
    if (!data.emergency_preparedness) risk += 30;
    if (data.monitoring_frequency === 'annual') risk += 20;
    return Math.min(100, risk);
  }

  static assessEnvironmentalRisk(biodiversity, water) {
    let risk = 0;
    if (biodiversity?.protected_areas_impact > 0) risk += 30;
    if (biodiversity?.species_at_risk > 5) risk += 25;
    if (water?.water_quality_incidents > 2) risk += 35;
    if ((water?.water_recycled / water?.water_withdrawal) < 0.3) risk += 10;
    return Math.min(100, risk);
  }

  static assessSocialRisk(community) {
    if (!community) return 30;
    let risk = 0;
    if (community.local_employment_rate < 20) risk += 25;
    if (community.resettlement_households > 0) risk += 30;
    if (!community.indigenous_consultation) risk += 35;
    if (community.grievance_mechanism === 'not_implemented') risk += 10;
    return Math.min(100, risk);
  }

  static assessOperationalRisk(data) {
    let risk = 0;
    if (data.tailings?.facility_count > 5) risk += 20;
    if (data.water?.water_withdrawal > 1000000) risk += 15;
    if (data.biodiversity?.total_land_disturbed > 10000) risk += 25;
    if (data.community?.consultation_meetings < 12) risk += 10;
    return Math.min(100, risk);
  }

  static generateRiskRecommendations(risks) {
    const recommendations = [];
    if (risks.tailings > 60) recommendations.push('Implement enhanced tailings monitoring and emergency response procedures');
    if (risks.environmental > 60) recommendations.push('Develop comprehensive biodiversity management and water stewardship plans');
    if (risks.social > 60) recommendations.push('Strengthen community engagement and indigenous consultation processes');
    if (risks.operational > 60) recommendations.push('Review operational procedures and implement additional safety measures');
    return recommendations;
  }

  // Helper methods
  static calculateRehabilitation(data) {
    if (!data || !data.total_land_disturbed) return 0;
    return Math.round((data.land_rehabilitated / data.total_land_disturbed) * 100);
  }

  static calculateWaterRecycling(data) {
    if (!data || !data.water_withdrawal) return 0;
    return Math.round((data.water_recycled / data.water_withdrawal) * 100);
  }

  // Database helper methods
  static async getTailingsData(companyId) {
    const db = await getDb();
    return new Promise((resolve) => {
      db.get('SELECT * FROM mining_tailings WHERE company_id = ? ORDER BY created_at DESC LIMIT 1', 
        [companyId], (err, row) => resolve(row));
    });
  }

  static async getBiodiversityData(companyId) {
    const db = await getDb();
    return new Promise((resolve) => {
      db.get('SELECT * FROM mining_biodiversity WHERE company_id = ? ORDER BY created_at DESC LIMIT 1', 
        [companyId], (err, row) => resolve(row));
    });
  }

  static getCommunityData(companyId) {
    return new Promise((resolve) => {
      db.get('SELECT * FROM mining_community WHERE company_id = ? ORDER BY created_at DESC LIMIT 1', 
        [companyId], (err, row) => resolve(row));
    });
  }

  static getWaterData(companyId) {
    return new Promise((resolve) => {
      db.get('SELECT * FROM mining_water WHERE company_id = ? ORDER BY created_at DESC LIMIT 1', 
        [companyId], (err, row) => resolve(row));
    });
  }
}

module.exports = MiningESGModule;