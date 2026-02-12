// Test module integration with database
import ModuleAPI from './services/moduleAPI.js';

const testModuleIntegration = async () => {
  console.log('🧪 Testing Module Integration with Database...\n');
  
  const companyId = '1';
  
  try {
    // Test 1: Waste Management Module
    console.log('1. Testing Waste Management Module...');
    const wasteResult = await ModuleAPI.saveWasteData(companyId, {
      wasteType: 'plastic',
      quantity: 150,
      unit: 'kg',
      disposalMethod: 'recycling',
      recyclingRate: 85,
      reportingPeriod: '2024-Q1'
    });
    console.log('   ✅ Waste data saved:', wasteResult.success);
    
    // Test 2: Workforce Management Module
    console.log('2. Testing Workforce Management Module...');
    const workforceResult = await ModuleAPI.saveWorkforceData(companyId, {
      employeeId: 'EMP001',
      department: 'Engineering',
      position: 'Software Engineer',
      gender: 'female',
      hireDate: new Date(),
      trainingHours: 40,
      isActive: true
    });
    console.log('   ✅ Workforce data saved:', workforceResult.success);
    
    // Test 3: Safety Incident Module
    console.log('3. Testing Safety Incident Module...');
    const safetyResult = await ModuleAPI.saveSafetyIncident(companyId, {
      incidentType: 'minor_injury',
      severity: 'low',
      location: 'office',
      incidentDate: new Date(),
      injuryCount: 1
    });
    console.log('   ✅ Safety incident saved:', safetyResult.success);
    
    // Test 4: KPI Calculation
    console.log('4. Testing KPI Calculation...');
    const kpiResult = await ModuleAPI.calculateKPIs(companyId);
    console.log('   ✅ KPI calculation:', kpiResult.success);
    if (kpiResult.success) {
      console.log('   📊 Overall Score:', kpiResult.data.overall);
      console.log('   🌱 Environmental:', kpiResult.data.environmental);
      console.log('   👥 Social:', kpiResult.data.social);
      console.log('   ⚖️ Governance:', kpiResult.data.governance);
      console.log('   📈 Total Entries:', kpiResult.data.totalEntries);
    }
    
    console.log('\n🎯 Module Integration Test Complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Module Integration Test Failed:', error);
    return false;
  }
};

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
  window.testModuleIntegration = testModuleIntegration;
} else {
  testModuleIntegration();
}

export default testModuleIntegration;