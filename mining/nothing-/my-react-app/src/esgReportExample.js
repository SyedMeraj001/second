import { generateProfessionalWhitePaper } from './professionalWhitePaperPDF';

// Example usage
export const createESGReport = async () => {
  const framework = 'GRI';
  const data = [
    { metric: 'Carbon Emissions', value: 1250, unit: 'tCO2e' },
    { metric: 'Water Usage', value: 45000, unit: 'liters' },
    { metric: 'Employee Safety', value: 0.2, unit: 'incidents/1000 hours' },
    { metric: 'Board Diversity', value: 40, unit: '% women' }
  ];

  const options = {
    companyName: 'Green Tech Solutions',
    reportPeriod: 2024,
    colors: {
      primary: [0, 102, 204],
      secondary: [46, 125, 50],
      accent: [255, 152, 0],
      text: [51, 51, 51],
      lightGray: [245, 245, 245],
      mediumGray: [158, 158, 158],
      white: [255, 255, 255]
    },
    includeCharts: true
  };

  try {
    const pdf = await generateProfessionalWhitePaper(framework, data, options);
    pdf.save('esg-sustainability-report.pdf');
    console.log('ESG Report generated successfully!');
  } catch (error) {
    console.error('Error generating report:', error);
  }
};

// Quick test function
export const testPDFGeneration = async () => {
  const testData = [
    { metric: 'Test Metric 1', value: 100 },
    { metric: 'Test Metric 2', value: 200 }
  ];

  const pdf = await generateProfessionalWhitePaper('TCFD', testData);
  pdf.save('test-report.pdf');
};