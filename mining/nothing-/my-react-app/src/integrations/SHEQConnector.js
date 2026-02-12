// SHEQ Operations Integration
class SHEQConnector {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async syncSafetyIncidents(startDate, endDate) {
    const response = await fetch(`${this.baseUrl}/api/incidents`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    const incidents = await response.json();
    return incidents.map(i => ({
      date: i.incidentDate,
      type: i.incidentType,
      severity: i.severity,
      description: i.description,
      injuries: i.injuryCount,
      lostTimeDays: i.lostTimeDays
    }));
  }

  async syncTrainingRecords() {
    const response = await fetch(`${this.baseUrl}/api/training`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    const training = await response.json();
    return {
      totalEmployees: training.totalEmployees,
      trainedEmployees: training.trainedCount,
      trainingHours: training.totalHours,
      complianceRate: (training.trainedCount / training.totalEmployees * 100).toFixed(2)
    };
  }

  async syncEnvironmentalData() {
    const response = await fetch(`${this.baseUrl}/api/environmental`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return await response.json();
  }
}

export default SHEQConnector;
