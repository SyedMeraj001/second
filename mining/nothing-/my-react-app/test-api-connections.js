// Test script to verify API and database connections with lazy loading
let fetch;
const loadDependencies = async () => {
  if (!fetch && typeof window === 'undefined') {
    // Node.js environment - lazy load node-fetch
    fetch = (await import('node-fetch')).default;
  } else if (typeof window !== 'undefined') {
    // Browser environment - use native fetch
    fetch = window.fetch;
  }
};

// CSRF token management
let csrfToken = null;
const getCsrfToken = async (apiBase) => {
  if (!csrfToken) {
    try {
      const response = await fetch(`${apiBase}/api/csrf-token`);
      const data = await response.json();
      csrfToken = data.csrfToken;
    } catch (error) {
      console.warn('CSRF token not available, proceeding without it');
    }
  }
  return csrfToken;
};

const testConnections = async () => {
  await loadDependencies();
  
  const API_BASE = 'http://localhost:5000';
  
  console.log('🔍 Testing API and Database Connections...\n');
  
  // Test 1: Health Check
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data.status);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return;
  }
  
  // Test 2: KPI Endpoint
  try {
    const response = await fetch(`${API_BASE}/api/kpi/1`);
    const data = await response.json();
    console.log('✅ KPI Endpoint:', data.success ? 'Working' : 'Failed');
    console.log('   Overall Score:', data.data?.overall || 0);
    console.log('   Environmental:', data.data?.environmental || 0);
    console.log('   Social:', data.data?.social || 0);
    console.log('   Governance:', data.data?.governance || 0);
  } catch (error) {
    console.log('❌ KPI Endpoint Failed:', error.message);
  }
  
  // Test 3: Create Sample Data with CSRF protection
  try {
    const sampleData = {
      companyId: 1,
      wasteType: 'plastic',
      quantity: 100,
      unit: 'kg',
      disposalMethod: 'recycling',
      recyclingRate: 80,
      reportingPeriod: '2024-Q1'
    };
    
    // Get CSRF token and add to request
    const token = await getCsrfToken(API_BASE);
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    if (token) {
      headers['X-CSRF-Token'] = token;
      sampleData._csrf = token;
    }
    
    const response = await fetch(`${API_BASE}/api/esg/waste-data`, {
      method: 'POST',
      headers,
      body: JSON.stringify(sampleData)
    });
    
    const data = await response.json();
    console.log('✅ Sample Data Creation:', data.success ? 'Success' : 'Failed');
  } catch (error) {
    console.log('❌ Sample Data Creation Failed:', error.message);
  }
  
  // Test 4: Retrieve Data
  try {
    const response = await fetch(`${API_BASE}/api/esg/waste-data/1`);
    const data = await response.json();
    console.log('✅ Data Retrieval:', data.success ? 'Success' : 'Failed');
    console.log('   Records Found:', data.data?.length || 0);
  } catch (error) {
    console.log('❌ Data Retrieval Failed:', error.message);
  } finally {
    // Cleanup
    csrfToken = null;
  }
  
  console.log('\n🎯 Test Complete!');
};

// Run tests based on environment
if (typeof window === 'undefined') {
  // Node.js environment
  testConnections().catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
} else {
  // Browser environment
  window.testConnections = testConnections;
  console.log('Run testConnections() in browser console to test APIs');
}

export default testConnections;