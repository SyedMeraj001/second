import db from '../database/db.js';

class CarbonFootprintCalculator {
  constructor() {
    this.emissionFactors = {
      // Scope 1 - Direct emissions (tCO2e per unit)
      scope1: {
        naturalGas: 0.0053,      // per kWh
        diesel: 2.68,            // per liter
        gasoline: 2.31,          // per liter
        coal: 2.42,              // per kg
        propane: 1.51,           // per liter
        fuelOil: 2.96            // per liter
      },
      // Scope 2 - Electricity (tCO2e per MWh by region)
      scope2: {
        grid_average: 0.4,       // Global average
        renewable: 0.0,          // Renewable energy
        coal: 0.82,              // Coal-based electricity
        natural_gas: 0.35,       // Natural gas electricity
        nuclear: 0.012,          // Nuclear electricity
        hydro: 0.024             // Hydroelectric
      },
      // Scope 3 - Indirect emissions
      scope3: {
        business_travel: 0.21,   // per km (air travel)
        employee_commuting: 0.17, // per km (car)
        waste_disposal: 0.57,    // per tonne
        water_supply: 0.344,     // per m³
        purchased_goods: 2.1,    // per $1000 spend
        freight_transport: 0.11  // per tonne-km
      }
    };
  }

  async calculateScope1Emissions(companyId, data) {
    const { fuelConsumption, period } = data;
    let totalEmissions = 0;
    const breakdown = {};

    for (const [fuelType, consumption] of Object.entries(fuelConsumption)) {
      const factor = this.emissionFactors.scope1[fuelType] || 0;
      const emissions = consumption * factor;
      totalEmissions += emissions;
      breakdown[fuelType] = {
        consumption,
        emissionFactor: factor,
        emissions: emissions.toFixed(3)
      };
    }

    await this.saveEmissionData(companyId, 'scope1', totalEmissions, breakdown, period);
    
    return {
      scope: 'Scope 1',
      totalEmissions: totalEmissions.toFixed(3),
      unit: 'tCO2e',
      breakdown,
      period
    };
  }

  async calculateScope2Emissions(companyId, data) {
    const { electricityConsumption, energyMix, period } = data;
    let totalEmissions = 0;
    const breakdown = {};

    for (const [energyType, consumption] of Object.entries(electricityConsumption)) {
      const factor = this.emissionFactors.scope2[energyType] || this.emissionFactors.scope2.grid_average;
      const emissions = (consumption / 1000) * factor; // Convert kWh to MWh
      totalEmissions += emissions;
      breakdown[energyType] = {
        consumption,
        emissionFactor: factor,
        emissions: emissions.toFixed(3)
      };
    }

    await this.saveEmissionData(companyId, 'scope2', totalEmissions, breakdown, period);
    
    return {
      scope: 'Scope 2',
      totalEmissions: totalEmissions.toFixed(3),
      unit: 'tCO2e',
      breakdown,
      period
    };
  }

  async calculateScope3Emissions(companyId, data) {
    const { activities, period } = data;
    let totalEmissions = 0;
    const breakdown = {};

    for (const [activity, value] of Object.entries(activities)) {
      const factor = this.emissionFactors.scope3[activity] || 0;
      const emissions = value * factor;
      totalEmissions += emissions;
      breakdown[activity] = {
        activity_data: value,
        emissionFactor: factor,
        emissions: emissions.toFixed(3)
      };
    }

    await this.saveEmissionData(companyId, 'scope3', totalEmissions, breakdown, period);
    
    return {
      scope: 'Scope 3',
      totalEmissions: totalEmissions.toFixed(3),
      unit: 'tCO2e',
      breakdown,
      period
    };
  }

  async calculateTotalFootprint(companyId, period) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT scope, SUM(total_emissions) as emissions
        FROM carbon_emissions 
        WHERE company_id = ? AND period = ?
        GROUP BY scope
      `;
      
      db.all(query, [companyId, period], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const footprint = {
          scope1: 0,
          scope2: 0,
          scope3: 0,
          total: 0
        };

        rows.forEach(row => {
          footprint[row.scope] = parseFloat(row.emissions);
          footprint.total += parseFloat(row.emissions);
        });

        footprint.total = footprint.total.toFixed(3);
        footprint.scope1 = footprint.scope1.toFixed(3);
        footprint.scope2 = footprint.scope2.toFixed(3);
        footprint.scope3 = footprint.scope3.toFixed(3);

        resolve({
          companyId,
          period,
          carbonFootprint: footprint,
          calculatedAt: new Date().toISOString(),
          ghgProtocolCompliant: true
        });
      });
    });
  }

  async saveEmissionData(companyId, scope, totalEmissions, breakdown, period) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO carbon_emissions 
        (company_id, scope, total_emissions, breakdown, period, calculated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [
        companyId, 
        scope, 
        totalEmissions, 
        JSON.stringify(breakdown), 
        period
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getEmissionHistory(companyId, startDate, endDate) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM carbon_emissions 
        WHERE company_id = ? AND period BETWEEN ? AND ?
        ORDER BY period DESC
      `;
      
      db.all(query, [companyId, startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const history = rows.map(row => ({
            ...row,
            breakdown: JSON.parse(row.breakdown)
          }));
          resolve(history);
        }
      });
    });
  }

  async generateCarbonReport(companyId, period) {
    const footprint = await this.calculateTotalFootprint(companyId, period);
    const history = await this.getEmissionHistory(companyId, 
      new Date(new Date(period).getFullYear() - 1, 0, 1).toISOString().split('T')[0],
      period
    );

    return {
      ...footprint,
      trends: this.calculateTrends(history),
      recommendations: this.generateRecommendations(footprint.carbonFootprint),
      ghgProtocol: {
        compliant: true,
        standard: 'GHG Protocol Corporate Standard',
        methodology: 'Operational Control Approach'
      }
    };
  }

  calculateTrends(history) {
    if (history.length < 2) return null;
    
    const latest = history[0];
    const previous = history[1];
    
    return {
      scope1Change: ((latest.total_emissions - previous.total_emissions) / previous.total_emissions * 100).toFixed(1),
      trend: latest.total_emissions > previous.total_emissions ? 'increasing' : 'decreasing'
    };
  }

  generateRecommendations(footprint) {
    const recommendations = [];
    
    if (parseFloat(footprint.scope2) > parseFloat(footprint.scope1)) {
      recommendations.push('Consider renewable energy procurement to reduce Scope 2 emissions');
    }
    
    if (parseFloat(footprint.scope3) > (parseFloat(footprint.scope1) + parseFloat(footprint.scope2))) {
      recommendations.push('Focus on supply chain engagement to address Scope 3 emissions');
    }
    
    return recommendations;
  }
}

export default new CarbonFootprintCalculator();