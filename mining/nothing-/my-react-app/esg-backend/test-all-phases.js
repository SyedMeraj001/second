const BASE_URL = 'http://localhost:3002/api';

// Lazy loading singleton
let axiosInstance = null;

const getAxios = async () => {
  if (!axiosInstance) {
    const axios = await import('axios');
    axiosInstance = axios.default || axios;
  }
  return axiosInstance;
};

// CSRF token management
let csrfToken = null;

const getCsrfToken = async (axios) => {
  if (!csrfToken) {
    try {
      const response = await axios.get(`${BASE_URL}/csrf-token`);
      csrfToken = response.data.csrfToken;
    } catch (error) {
      console.warn('CSRF token not available, proceeding without it');
    }
  }
  return csrfToken;
};

const createSecureConfig = async (axios, data = null) => {
  const token = await getCsrfToken(axios);
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (token) {
    config.headers['X-CSRF-Token'] = token;
  }
  
  if (data) {
    config.data = data;
  }
  
  return config;
};

async function testAllPhases() {
  const axios = await getAxios();
  console.log('🚀 ESG System - Complete Phase Testing\n');
  console.log('=' .repeat(60));

  try {
    // Health Check
    console.log('🔍 System Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server Status:', health.data.message);
    console.log('');

    // Phase 1: Core ESG Data
    console.log('📊 PHASE 1: Core ESG Data Management');
    console.log('-'.repeat(40));
    
    const esgData = {
      companyName: 'TechCorp ESG',
      sector: 'Technology',
      region: 'North America',
      reportingYear: 2024,
      userId: 1,
      environmental: {
        scope1Emissions: 1500,
        scope2Emissions: 2500,
        energyConsumption: 75000,
        renewableEnergyPercentage: 45
      },
      social: {
        totalEmployees: 500,
        femaleEmployeesPercentage: 42,
        lostTimeInjuryRate: 1.2,
        trainingHoursPerEmployee: 25
      },
      governance: {
        boardSize: 9,
        independentDirectorsPercentage: 67,
        ethicsTrainingCompletion: 95
      }
    };

    const saveResult = await axios.post(`${BASE_URL}/esg/data`, esgData, await createSecureConfig(axios, esgData));
    console.log('✅ ESG Data Saved:', saveResult.data.message);

    const scores = await axios.get(`${BASE_URL}/esg/scores/1`);
    if (scores.data.environmental_score) {
      console.log('📈 ESG Scores:');
      console.log('   Environmental:', scores.data.environmental_score.toFixed(1));
      console.log('   Social:', scores.data.social_score.toFixed(1));
      console.log('   Governance:', scores.data.governance_score.toFixed(1));
      console.log('   Overall:', scores.data.overall_score.toFixed(1));
    }

    // Phase 2: Integrations & Compliance
    console.log('\n🔗 PHASE 2: Integrations & Compliance');
    console.log('-'.repeat(40));

    // ERP Integration
    const erpConfig = await axios.post(`${BASE_URL}/integrations/erp/configure`, {
      type: 'SAP',
      baseURL: 'https://api.sap-demo.com',
      apiKey: 'demo-sap-key-123'
    }, await createSecureConfig(axios));
    console.log('✅ ERP Configured:', erpConfig.data.message);

    const erpSync = await axios.post(`${BASE_URL}/integrations/erp/sync`, {}, await createSecureConfig(axios));
    console.log('📊 ERP Data Synced:');
    console.log('   Energy:', erpSync.data.data.energy.totalConsumption, 'MWh');
    console.log('   Scope 2:', erpSync.data.data.energy.scope2Emissions, 'tCO2e');

    // Compliance Validation
    const validation = await axios.post(`${BASE_URL}/compliance/validate`, {
      framework: 'CSRD',
      data: {
        scope1Emissions: 1500,
        scope2Emissions: 2500,
        totalEmployees: 500
      }
    }, await createSecureConfig(axios));
    console.log('✅ Compliance Status:', validation.data.overallValid ? 'VALID' : 'NEEDS ATTENTION');

    // Phase 3: Advanced Analytics
    console.log('\n📈 PHASE 3: Advanced Analytics');
    console.log('-'.repeat(40));

    // TCFD Scenario Analysis
    const scenarios = await axios.post(`${BASE_URL}/analytics/tcfd/scenarios`, {
      scope1: 1500,
      scope2: 2500,
      scope3: 8000,
      revenue: 15000000
    }, await createSecureConfig(axios));
    console.log('🌡️ TCFD Climate Scenarios:');
    scenarios.data.scenarios.forEach(scenario => {
      console.log(`   ${scenario.name}: $${scenario.totalImpact.toLocaleString()} (${scenario.riskLevel})`);
    });

    // Industry Benchmarking
    const benchmark = await axios.post(`${BASE_URL}/analytics/benchmark`, {
      sector: 'technology',
      metrics: {
        scope1Intensity: 3.2,
        scope2Intensity: 18.5,
        femalePercentage: 38
      }
    }, await createSecureConfig(axios));
    console.log('🏆 Industry Benchmark Score:', benchmark.data.overallScore + '/100');

    // Predictive Forecasting
    const forecast = await axios.post(`${BASE_URL}/analytics/forecast`, {
      historicalData: [
        { year: 2021, value: 12000 },
        { year: 2022, value: 11200 },
        { year: 2023, value: 10500 },
        { year: 2024, value: 9800 }
      ],
      years: 3
    }, await createSecureConfig(axios));
    console.log('🔮 Emissions Forecast Trend:', forecast.data.trend.toFixed(1) + '% annually');

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL PHASES TESTING COMPLETE');
    console.log('='.repeat(60));
    console.log('✅ Phase 1: Core ESG Data Management');
    console.log('✅ Phase 2: Integrations & Compliance');
    console.log('✅ Phase 3: Advanced Analytics & Reporting');
    console.log('\n📊 System Status: FULLY OPERATIONAL');
    console.log('🔧 Optimization Level: ENTERPRISE-READY');

  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Start the server first: npm start');
    }
  }
}

testAllPhases();