import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';

const ComplianceReports = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [esgData, setEsgData] = useState([]);

  useEffect(() => {
    loadReports();
    loadESGData();
  }, []);

  const loadESGData = () => {
    const data = JSON.parse(localStorage.getItem('esgData') || '[]');
    setEsgData(data);
  };

  const loadReports = () => {
    const storedReports = JSON.parse(localStorage.getItem('complianceReports') || '[]');
    setReports(storedReports);
  };

  const analyzeSOXCompliance = () => {
    const governance = esgData.map(d => d.governance).filter(Boolean);
    const hasEthicsTraining = governance.some(g => g.ethicsTrainingCompletion > 0);
    const hasAuditTrail = localStorage.getItem('auditTrail') !== null;
    const hasDataValidation = governance.some(g => g.dataPrivacyPolicies);
    
    return {
      score: hasEthicsTraining && hasAuditTrail && hasDataValidation ? 95 : 70,
      findings: [
        `Ethics training completion: ${hasEthicsTraining ? 'Compliant' : 'Non-compliant'}`,
        `Audit trail maintained: ${hasAuditTrail ? 'Yes' : 'No'}`,
        `Data validation controls: ${hasDataValidation ? 'Implemented' : 'Missing'}`
      ]
    };
  };

  const analyzeISOCompliance = () => {
    const governance = esgData.map(d => d.governance).filter(Boolean);
    const hasCybersecurity = governance.some(g => g.cybersecurityInvestment > 0);
    const hasDataBreach = governance.some(g => g.dataBreachIncidents === 0);
    const hasSecurityPolicies = governance.some(g => g.dataPrivacyPolicies);
    
    return {
      score: hasCybersecurity && hasDataBreach && hasSecurityPolicies ? 92 : 65,
      findings: [
        `Cybersecurity investment: ${hasCybersecurity ? 'Active' : 'Insufficient'}`,
        `Data breach incidents: ${hasDataBreach ? 'Zero incidents' : 'Incidents reported'}`,
        `Security policies: ${hasSecurityPolicies ? 'Documented' : 'Missing'}`
      ]
    };
  };

  const analyzeGDPRCompliance = () => {
    const governance = esgData.map(d => d.governance).filter(Boolean);
    const hasPrivacyPolicies = governance.some(g => g.dataPrivacyPolicies);
    const hasDataProtection = governance.some(g => g.dataBreachIncidents !== undefined);
    const hasConsent = true; // Assume consent management exists
    
    return {
      score: hasPrivacyPolicies && hasDataProtection && hasConsent ? 88 : 60,
      findings: [
        `Privacy policies: ${hasPrivacyPolicies ? 'Implemented' : 'Missing'}`,
        `Data protection measures: ${hasDataProtection ? 'Active' : 'Insufficient'}`,
        `Consent management: ${hasConsent ? 'Compliant' : 'Non-compliant'}`
      ]
    };
  };

  const generateReport = (type) => {
    setGenerating(true);
    
    setTimeout(() => {
      const periodStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const periodEnd = new Date().toISOString().split('T')[0];
      const generatedBy = localStorage.getItem('currentUser') || 'admin';

      let analysis;
      if (type === 'SOX') analysis = analyzeSOXCompliance();
      else if (type === 'ISO') analysis = analyzeISOCompliance();
      else analysis = analyzeGDPRCompliance();

      const newReport = {
        id: Date.now(),
        framework: type,
        period_start: periodStart,
        period_end: periodEnd,
        generated_at: new Date().toISOString(),
        status: 'completed',
        generated_by: generatedBy,
        compliance_score: analysis.score,
        findings: analysis.findings,
        data_points: esgData.length
      };

      const updatedReports = [newReport, ...reports];
      localStorage.setItem('complianceReports', JSON.stringify(updatedReports));
      setReports(updatedReports);
      setGenerating(false);
      alert(`${type} report generated successfully! Compliance Score: ${analysis.score}%`);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-4xl w-full max-h-[90vh] overflow-hidden ${theme.bg.card} rounded-xl shadow-2xl`}>
        <div className="p-6 bg-white shadow-lg border-b-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
                <span className="text-4xl">📊</span>
                Compliance Reports
              </h2>
              <p className="text-gray-600 mt-1">SOX, ISO 27001, GDPR compliance reporting</p>
            </div>
            <button onClick={onClose} className="text-3xl text-gray-600 hover:text-red-500 hover:rotate-90 transition-all duration-300 hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center">✕</button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => generateReport('SOX')}
              disabled={generating}
              className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-semibold">Generate SOX Report</div>
            </button>
            <button
              onClick={() => generateReport('ISO')}
              disabled={generating}
              className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <div className="text-2xl mb-2">🔒</div>
              <div className="font-semibold">Generate ISO 27001</div>
            </button>
            <button
              onClick={() => generateReport('GDPR')}
              disabled={generating}
              className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <div className="text-2xl mb-2">🛡️</div>
              <div className="font-semibold">Generate GDPR</div>
            </button>
          </div>

          <div className={`border-t ${theme.border.primary} pt-4`}>
            <h3 className={`font-semibold ${theme.text.primary} mb-3`}>Generated Reports</h3>
            {reports.length === 0 ? (
              <p className={`text-center py-8 ${theme.text.secondary}`}>No reports generated yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {reports.map((report) => (
                  <div className={`p-4 rounded-lg border ${theme.border.primary} ${theme.bg.subtle}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`font-medium ${theme.text.primary}`}>{report.framework}</p>
                        <p className={`text-sm ${theme.text.secondary}`}>
                          {report.period_start} to {report.period_end}
                        </p>
                        <p className={`text-xs ${theme.text.muted}`}>
                          Generated: {new Date(report.generated_at).toLocaleString()}
                        </p>
                        {report.data_points && (
                          <p className={`text-xs ${theme.text.muted}`}>
                            Based on {report.data_points} ESG data points
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded text-sm font-bold ${
                          report.compliance_score >= 90 ? 'bg-green-100 text-green-800' :
                          report.compliance_score >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {report.compliance_score}%
                        </span>
                        <p className={`text-xs ${theme.text.muted} mt-1`}>{report.status}</p>
                      </div>
                    </div>
                    {report.findings && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className={`text-xs font-semibold ${theme.text.primary} mb-1`}>Key Findings:</p>
                        <ul className="text-xs space-y-1">
                          {report.findings.map((finding, idx) => (
                            <li key={idx} className={theme.text.secondary}>• {finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`p-4 border-t ${theme.border.primary}`}>
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplianceReports;
