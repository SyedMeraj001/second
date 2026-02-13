import React, { useState } from 'react';
import generateTechVisionReport from '../utils/techVisionReportGenerator';

const TechVisionReportGenerator = () => {
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const data = JSON.parse(localStorage.getItem('esgData') || '[]');
      const advancedData = JSON.parse(localStorage.getItem('advanced_esg_data') || '[]');
      
      const reportData = {
        kpis: { overall: 85 },
        metrics: {
          carbonReduction: 15,
          employeeSatisfaction: 92,
          boardDiversity: 40
        },
        environmental: {
          emissions: 12450,
          energy: 45000,
          water: 125000,
          recycling: 75
        },
        social: {
          engagement: 87,
          training: 24500,
          diversity: 45,
          safety: 0.12
        },
        governance: {
          independence: 75,
          ethics: 98,
          audit: 94,
          compliance: 99.2
        }
      };

      const pdf = await generateTechVisionReport(reportData, {
        companyName: 'TechVision',
        year: 2024
      });

      pdf.save('TechVision_ESG_Report_2024.pdf');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">TechVision ESG Report Generator</h2>
      <button
        onClick={generateReport}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate TechVision Report'}
      </button>
    </div>
  );
};

export default TechVisionReportGenerator;
