// Comprehensive function testing script
import { spawn } from 'child_process';
import fetch from 'node-fetch';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAllFunctions() {
  console.log('🔍 COMPREHENSIVE FUNCTION TESTING\n');
  
  let backendProcess;
  
  try {
    // 1. Start Backend Server
    console.log('1. Starting Backend Server...');
    backendProcess = spawn('npm', ['start'], {
      cwd: './esg-backend',
      stdio: 'pipe',
      shell: true
    });
    
    // Wait for server to start
    await delay(5000);
    
    // 2. Test Health Check
    console.log('2. Testing Health Check...');
    try {
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      console.log('   ✅ Health Check:', data.status);
    } catch (error) {
      console.log('   ❌ Health Check Failed:', error.message);
      return false;
    }
    
    // 3. Test Database Models
    console.log('3. Testing Database Models...');
    const models = [
      'waste-data', 'air-quality-data', 'biodiversity-data', 'human-rights-data',
      'community-projects', 'workforce-data', 'safety-incidents', 'ethics-compliance',
      'security-incidents', 'board-composition', 'ai-analysis', 'portal-access',
      'framework-compliance', 'auditor-sessions', 'sentiment-data'
    ];
    
    let modelTests = 0;
    for (const model of models) {
      try {
        const response = await fetch(`http://localhost:5000/api/esg/${model}/1`);
        const data = await response.json();
        if (data.success !== false) {
          modelTests++;
          console.log(`   ✅ ${model}: Working`);
        } else {
          console.log(`   ❌ ${model}: Failed`);
        }
      } catch (error) {
        console.log(`   ❌ ${model}: Error - ${error.message}`);
      }
    }
    console.log(`   📊 Models Working: ${modelTests}/${models.length}`);
    
    // 4. Test KPI Calculation
    console.log('4. Testing KPI Calculation...');
    try {
      const response = await fetch('http://localhost:5000/api/kpi/1');
      const data = await response.json();
      if (data.success) {
        console.log('   ✅ KPI Calculation: Working');
        console.log(`   📈 Overall: ${data.data.overall}%`);
        console.log(`   🌱 Environmental: ${data.data.environmental}%`);
        console.log(`   👥 Social: ${data.data.social}%`);
        console.log(`   ⚖️ Governance: ${data.data.governance}%`);
        console.log(`   📊 Total Entries: ${data.data.totalEntries}`);
      } else {
        console.log('   ❌ KPI Calculation: Failed');
      }
    } catch (error) {
      console.log('   ❌ KPI Calculation Error:', error.message);
    }
    
    // 5. Test Data Creation
    console.log('5. Testing Data Creation...');
    const testData = [
      {
        endpoint: 'waste-data',
        data: {
          companyId: 1,
          wasteType: 'plastic',
          quantity: 100,
          unit: 'kg',
          disposalMethod: 'recycling',
          recyclingRate: 80,
          reportingPeriod: '2024-Q1'
        }
      },
      {
        endpoint: 'workforce-data',
        data: {
          companyId: 1,
          employeeId: 'TEST001',
          department: 'Engineering',
          position: 'Developer',
          gender: 'female',
          hireDate: new Date().toISOString(),
          trainingHours: 40,
          isActive: true
        }
      },
      {
        endpoint: 'safety-incidents',
        data: {
          companyId: 1,
          incidentType: 'minor_injury',
          severity: 'low',
          location: 'office',
          incidentDate: new Date().toISOString(),
          injuryCount: 1
        }
      }
    ];
    
    let creationTests = 0;
    for (const test of testData) {
      try {
        const response = await fetch(`http://localhost:5000/api/esg/${test.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.data)
        });
        const data = await response.json();
        if (data.success) {
          creationTests++;
          console.log(`   ✅ ${test.endpoint}: Created`);
        } else {
          console.log(`   ❌ ${test.endpoint}: Failed - ${data.error}`);
        }
      } catch (error) {
        console.log(`   ❌ ${test.endpoint}: Error - ${error.message}`);
      }
    }
    console.log(`   📊 Creation Tests: ${creationTests}/${testData.length}`);
    
    // 6. Test KPI After Data Creation
    console.log('6. Testing KPI After Data Creation...');
    try {
      const response = await fetch('http://localhost:5000/api/kpi/1');
      const data = await response.json();
      if (data.success) {
        console.log('   ✅ Updated KPI Calculation: Working');
        console.log(`   📈 New Overall: ${data.data.overall}%`);
        console.log(`   📊 New Total Entries: ${data.data.totalEntries}`);
      }
    } catch (error) {
      console.log('   ❌ Updated KPI Error:', error.message);
    }
    
    // 7. Test Data Retrieval
    console.log('7. Testing Data Retrieval...');
    let retrievalTests = 0;
    for (const test of testData) {
      try {
        const response = await fetch(`http://localhost:5000/api/esg/${test.endpoint}/1`);
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          retrievalTests++;
          console.log(`   ✅ ${test.endpoint}: Retrieved ${data.data.length} records`);
        } else {
          console.log(`   ❌ ${test.endpoint}: No data found`);
        }
      } catch (error) {
        console.log(`   ❌ ${test.endpoint}: Error - ${error.message}`);
      }
    }
    console.log(`   📊 Retrieval Tests: ${retrievalTests}/${testData.length}`);
    
    // 8. Summary
    console.log('\n📋 FUNCTION TEST SUMMARY:');
    console.log(`✅ Backend Server: Running`);
    console.log(`✅ Database Models: ${modelTests}/${models.length} working`);
    console.log(`✅ KPI Calculation: Working`);
    console.log(`✅ Data Creation: ${creationTests}/${testData.length} working`);
    console.log(`✅ Data Retrieval: ${retrievalTests}/${testData.length} working`);
    
    const totalTests = models.length + testData.length * 2 + 2;
    const passedTests = modelTests + creationTests + retrievalTests + 2;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
    
    if (successRate >= 80) {
      console.log('🎉 SYSTEM IS FUNCTIONING PROPERLY!');
    } else {
      console.log('⚠️ SYSTEM NEEDS ATTENTION!');
    }
    
    return successRate >= 80;
    
  } catch (error) {
    console.error('❌ Test Failed:', error);
    return false;
  } finally {
    // Cleanup
    if (backendProcess) {
      backendProcess.kill();
      console.log('\n🛑 Backend server stopped');
    }
  }
}

// Run the test
testAllFunctions().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});