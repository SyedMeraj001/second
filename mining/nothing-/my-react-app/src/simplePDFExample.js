import { generateProfessionalWhitePaper } from './professionalWhitePaperPDF';

// Simple usage example
export const createSimpleReport = async () => {
  const framework = 'GRI';
  const data = [
    { metric: 'Sample Metric 1', value: 100 },
    { metric: 'Sample Metric 2', value: 200 }
  ];

  const options = {
    companyName: 'My Company',
    colors: {
      primary: [0, 102, 204],
      accent: [255, 152, 0],
      text: [51, 51, 51],
      white: [255, 255, 255]
    }
  };

  const pdf = await generateProfessionalWhitePaper(framework, data, options);
  pdf.save('simple-report.pdf');
};

export { createSimpleReport as createSamplePDF };