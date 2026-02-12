const API_BASE = 'http://localhost:5000/api';

class ReportsAPI {
  // Get CSRF token from meta tag or cookie
  static getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
           document.cookie.split('; ').find(row => row.startsWith('csrf-token='))?.split('=')[1];
  }

  static async fetchDashboardSummary() {
    try {
      const response = await fetch(`${API_BASE}/reports/dashboard-summary`);
      return response.ok ? await response.json() : { success: false };
    } catch (error) {
      console.warn('ReportsAPI unavailable:', error.message);
      return { success: false };
    }
  }

  static async generateReport(type, data) {
    try {
      const csrfToken = this.getCSRFToken();
      const response = await fetch(`${API_BASE}/reports/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        },
        body: JSON.stringify({ type, data })
      });
      return response.ok ? await response.json() : { success: false };
    } catch (error) {
      console.warn('Report generation failed:', error.message);
      return { success: false };
    }
  }
}

export default ReportsAPI;
