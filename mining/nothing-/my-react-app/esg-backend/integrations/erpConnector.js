// Lazy load axios only when needed
let axiosInstance = null;
const getAxios = () => {
  if (!axiosInstance) {
    try {
      axiosInstance = require('axios');
    } catch (error) {
      throw new Error(`Failed to load axios: ${error.message}`);
    }
  }
  return axiosInstance;
};

class ERPConnector {
  constructor(config) {
    if (!config || !config.baseURL || !config.apiKey || !config.type) {
      throw new Error('Config must include baseURL, apiKey, and type');
    }
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.type = config.type; // 'SAP', 'Oracle', 'NetSuite'
    this.emissionFactor = config.emissionFactor || 0.5;
  }

  async _makeRequest(endpointType, params, transformFn, mockFn) {
    try {
      const axios = getAxios();
      const endpoint = this._getEndpoint(endpointType);
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        params
      });
      return transformFn(response.data);
    } catch (error) {
      console.error(`ERP ${endpointType} data fetch failed:`, error.message);
      return mockFn();
    }
  }

  async getEnergyData(startDate, endDate) {
    return this._makeRequest('energy', { startDate, endDate }, 
      (data) => this.transformEnergyData(data), 
      () => this.getMockEnergyData());
  }

  async getFinancialData(year) {
    return this._makeRequest('financial', { year }, 
      (data) => this.transformFinancialData(data), 
      () => this.getMockFinancialData());
  }

  _getEndpoint(type) {
    const endpointMaps = {
      energy: {
        SAP: '/api/energy/consumption',
        Oracle: '/rest/energy/data',
        NetSuite: '/services/energy'
      },
      financial: {
        SAP: '/api/financial/revenue',
        Oracle: '/rest/financial/summary',
        NetSuite: '/services/financial'
      }
    };
    const endpoints = endpointMaps[type] || {};
    return endpoints[this.type] || `/api/${type}`;
  }

  transformEnergyData(data) {
    return {
      totalConsumption: data.total || 0,
      renewablePercentage: data.renewable_pct || 0,
      scope2Emissions: (data.total || 0) * this.emissionFactor,
      period: data.period
    };
  }

  transformFinancialData(data) {
    return {
      revenue: data.revenue || 0,
      operatingCosts: data.costs || 0,
      year: data.year
    };
  }

  getMockEnergyData() {
    return {
      totalConsumption: Math.floor(Math.random() * 100000) + 50000,
      renewablePercentage: Math.floor(Math.random() * 50) + 25,
      scope2Emissions: Math.floor(Math.random() * 25000) + 10000,
      period: new Date().toISOString().slice(0, 7)
    };
  }

  getMockFinancialData() {
    return {
      revenue: Math.floor(Math.random() * 10000000) + 5000000,
      operatingCosts: Math.floor(Math.random() * 5000000) + 2000000,
      year: new Date().getFullYear()
    };
  }
}

export default ERPConnector;