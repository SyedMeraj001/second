// Pastel ERP Connector
class PastelERPConnector {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://localhost:8080/pastel';
    this.apiKey = config.apiKey;
    this.companyId = config.companyId;
  }

  async connect() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: this.apiKey, companyId: this.companyId })
      });
      return response.ok;
    } catch (error) {
      console.error('Pastel connection failed:', error);
      return false;
    }
  }

  async syncFinancialData(startDate, endDate) {
    const response = await fetch(`${this.baseUrl}/api/financial`, {
      headers: { 'X-API-Key': this.apiKey }
    });
    const data = await response.json();
    return {
      revenue: data.totalRevenue || 0,
      expenses: data.totalExpenses || 0,
      energyCosts: data.utilityCosts?.electricity || 0,
      waterCosts: data.utilityCosts?.water || 0,
      wasteCosts: data.wasteMgmtCosts || 0
    };
  }

  async syncSupplierData() {
    const response = await fetch(`${this.baseUrl}/api/suppliers`, {
      headers: { 'X-API-Key': this.apiKey }
    });
    const suppliers = await response.json();
    return suppliers.map(s => ({
      id: s.supplierId,
      name: s.supplierName,
      category: s.category,
      spend: s.annualSpend
    }));
  }
}

export default PastelERPConnector;
