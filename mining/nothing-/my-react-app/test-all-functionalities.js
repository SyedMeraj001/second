const axios = require('axios');
const fs = require('fs');

// Comprehensive ESG Platform Functionality Test
console.log('🧪 ESG PLATFORM COMPREHENSIVE FUNCTIONALITY TEST');
console.log('='.repeat(60));

const BASE_URL = 'http://localhost:3001';
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(category, test, status, details = '') {
  testResults.total++;
  const result = { category, test, status, details };
  
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${test}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${test} - ${details}`);
  }
  
  testResults.details.push(result);
}

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const config = { method, url: `${BASE_URL}${endpoint}` };
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: error.response?.status || 'NO_RESPONSE' 
    };
  }
}

async function runTests() {
  console.log('\n🔌 1. SERVER CONNECTIVITY');
  console.log('-'.repeat(30));
  
  // Test server health
  const health = await testAPI('/api/health');
  logTest('Connectivity', 'Server Health Check', 
    health.success ? 'PASS' : 'FAIL', 
    health.success ? `Status: ${health.status}` : health.error
  );

  console.log('\n👤 2. AUTHENTICATION & RBAC');
  console.log('-'.repeat(30));
  
  // Test login
  const login = await testAPI('/api/auth/login', 'POST', {
    username: 'admin@company.com',
    password: 'admin123'
  });
  logTest('Auth', 'User Login', 
    login.success ? 'PASS' : 'FAIL',
    login.success ? 'Login successful' : login.error
  );

  // Test RBAC endpoints
  const rbac = await testAPI('/api/auth/permissions');
  logTest('RBAC', 'Permission Check', 
    rbac.success ? 'PASS' : 'FAIL',
    rbac.success ? 'RBAC working' : rbac.error
  );

  console.log('\n📊 3. ESG DATA COLLECTION');
  console.log('-'.repeat(30));
  
  // Test data entry
  const dataEntry = await testAPI('/api/esg/data', 'POST', {
    companyId: 1,
    reportingYear: 2024,
    environmental: { scope1Emissions: 1000, scope2Emissions: 500 },
    social: { totalEmployees: 100, femaleEmployeesPercentage: 45 },
    governance: { boardSize: 8, independentDirectors: 5 }
  });
  logTest('Data Collection', 'ESG Data Entry', 
    dataEntry.success ? 'PASS' : 'FAIL',
    dataEntry.success ? 'Data saved' : dataEntry.error
  );

  // Test data validation
  const validation = await testAPI('/api/esg/validate', 'POST', {
    data: { scope1Emissions: -100 }
  });
  logTest('Data Collection', 'Data Validation', 
    validation.success ? 'PASS' : 'FAIL',
    validation.success ? 'Validation working' : validation.error
  );

  console.log('\n📈 4. REPORTING & FRAMEWORKS');
  console.log('-'.repeat(30));
  
  // Test GRI templates
  const griTemplates = await testAPI('/api/phase4/gri/templates');
  logTest('Reporting', 'GRI Templates', 
    griTemplates.success ? 'PASS' : 'FAIL',
    griTemplates.success ? `${griTemplates.data?.length || 0} templates` : griTemplates.error
  );

  // Test report generation
  const reportGen = await testAPI('/api/reporting/generate', 'POST', {
    companyId: 1,
    framework: 'GRI',
    year: 2024
  });
  logTest('Reporting', 'Report Generation', 
    reportGen.success ? 'PASS' : 'FAIL',
    reportGen.success ? 'Report generated' : reportGen.error
  );

  console.log('\n🔍 5. AUDIT & APPROVAL WORKFLOWS');
  console.log('-'.repeat(30));
  
  // Test audit trail
  const auditTrail = await testAPI('/api/audit/trail');
  logTest('Audit', 'Audit Trail', 
    auditTrail.success ? 'PASS' : 'FAIL',
    auditTrail.success ? 'Audit trail accessible' : auditTrail.error
  );

  // Test approval workflow
  const workflow = await testAPI('/api/workflow/approvals');
  logTest('Audit', 'Approval Workflow', 
    workflow.success ? 'PASS' : 'FAIL',
    workflow.success ? 'Workflow accessible' : workflow.error
  );

  console.log('\n🔐 6. SECURITY & COMPLIANCE');
  console.log('-'.repeat(30));
  
  // Test 2FA
  const twoFA = await testAPI('/api/auth/2fa/setup', 'POST', {
    userId: 1
  });
  logTest('Security', 'Two-Factor Authentication', 
    twoFA.success ? 'PASS' : 'FAIL',
    twoFA.success ? '2FA setup available' : twoFA.error
  );

  // Test security compliance
  const compliance = await testAPI('/api/security/compliance/dashboard');
  logTest('Security', 'Security Compliance Dashboard', 
    compliance.success ? 'PASS' : 'FAIL',
    compliance.success ? 'Compliance dashboard working' : compliance.error
  );

  console.log('\n🔗 7. INTEGRATIONS');
  console.log('-'.repeat(30));
  
  // Test ERP integration
  const erpIntegration = await testAPI('/api/integrations/erp/status');
  logTest('Integration', 'ERP Integration', 
    erpIntegration.success ? 'PASS' : 'FAIL',
    erpIntegration.success ? 'ERP integration ready' : erpIntegration.error
  );

  // Test IoT data processing
  const iotData = await testAPI('/api/integrations/iot/devices');
  logTest('Integration', 'IoT Data Processing', 
    iotData.success ? 'PASS' : 'FAIL',
    iotData.success ? 'IoT integration ready' : iotData.error
  );

  console.log('\n⛏️ 8. MINING-SPECIFIC MODULES');
  console.log('-'.repeat(30));
  
  // Test tailings management
  const tailings = await testAPI('/api/mining/tailings');
  logTest('Mining', 'Tailings Management', 
    tailings.success ? 'PASS' : 'FAIL',
    tailings.success ? 'Tailings module working' : tailings.error
  );

  // Test biodiversity tracking
  const biodiversity = await testAPI('/api/mining/biodiversity');
  logTest('Mining', 'Biodiversity Tracking', 
    biodiversity.success ? 'PASS' : 'FAIL',
    biodiversity.success ? 'Biodiversity module working' : biodiversity.error
  );

  console.log('\n📱 9. MOBILE & PWA FEATURES');
  console.log('-'.repeat(30));
  
  // Test mobile data collection
  const mobileData = await testAPI('/api/mobile/data-collection');
  logTest('Mobile', 'Mobile Data Collection', 
    mobileData.success ? 'PASS' : 'FAIL',
    mobileData.success ? 'Mobile API working' : mobileData.error
  );

  // Test offline sync
  const offlineSync = await testAPI('/api/mobile/sync/status');
  logTest('Mobile', 'Offline Sync Service', 
    offlineSync.success ? 'PASS' : 'FAIL',
    offlineSync.success ? 'Sync service working' : offlineSync.error
  );

  console.log('\n📊 10. ADVANCED ANALYTICS');
  console.log('-'.repeat(30));
  
  // Test TCFD scenarios
  const tcfd = await testAPI('/api/advanced/tcfd/scenarios');
  logTest('Analytics', 'TCFD Scenario Analysis', 
    tcfd.success ? 'PASS' : 'FAIL',
    tcfd.success ? 'TCFD scenarios available' : tcfd.error
  );

  // Test benchmarking
  const benchmarking = await testAPI('/api/advanced/benchmarking');
  logTest('Analytics', 'Peer Benchmarking', 
    benchmarking.success ? 'PASS' : 'FAIL',
    benchmarking.success ? 'Benchmarking working' : benchmarking.error
  );

  console.log('\n👥 11. STAKEHOLDER ENGAGEMENT');
  console.log('-'.repeat(30));
  
  // Test stakeholder module
  const stakeholders = await testAPI('/api/phase4/stakeholder/surveys');
  logTest('Stakeholder', 'Survey Management', 
    stakeholders.success ? 'PASS' : 'FAIL',
    stakeholders.success ? 'Stakeholder module working' : stakeholders.error
  );

  console.log('\n💾 12. DATA IMPORT/EXPORT');
  console.log('-'.repeat(30));
  
  // Test data export
  const dataExport = await testAPI('/api/phase4/data/export/excel', 'POST', {
    companyId: 1,
    year: 2024
  });
  logTest('Data Management', 'Excel Export', 
    dataExport.success ? 'PASS' : 'FAIL',
    dataExport.success ? 'Export working' : dataExport.error
  );

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passRate = Math.round((testResults.passed / testResults.total) * 100);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} (${passRate}%)`);
  console.log(`Failed: ${testResults.failed} (${100 - passRate}%)`);

  // Group by category
  const categories = {};
  testResults.details.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = { total: 0, passed: 0 };
    }
    categories[test.category].total++;
    if (test.status === 'PASS') categories[test.category].passed++;
  });

  console.log('\n📈 RESULTS BY CATEGORY:');
  Object.keys(categories).forEach(category => {
    const cat = categories[category];
    const rate = Math.round((cat.passed / cat.total) * 100);
    console.log(`${category}: ${cat.passed}/${cat.total} (${rate}%)`);
  });

  console.log('\n❌ FAILED TESTS:');
  testResults.details
    .filter(test => test.status === 'FAIL')
    .forEach(test => {
      console.log(`- ${test.test} (${test.category}): ${test.details}`);
    });

  console.log('\n🎯 OVERALL STATUS:');
  if (passRate >= 90) {
    console.log('🎉 EXCELLENT: Platform is fully functional');
  } else if (passRate >= 75) {
    console.log('✅ GOOD: Platform is mostly functional with minor issues');
  } else if (passRate >= 50) {
    console.log('⚠️ FAIR: Platform has significant issues');
  } else {
    console.log('❌ POOR: Platform requires major fixes');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test completed! 🧪');
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});