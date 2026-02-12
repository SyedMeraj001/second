import { generateProfessionalWhitePaper } from './professionalWhitePaperPDF';

// Example usage
export const createReport = async () => {
  const framework = 'GRI';
  const data = [
    { metric: 'Revenue Growth', value: 15 },
    { metric: 'Product Launches', value: 3 },
    { metric: 'Market Expansion', value: 2 },
    { metric: 'Customer Satisfaction', value: 4.8 }
  ];

  const options = {
    companyName: 'Acme Corp',
    reportPeriod: '2024',
    colors: {
      primary: [0, 102, 204],
      accent: [255, 152, 0],
      text: [51, 51, 51],
      white: [255, 255, 255],
      lightGray: [245, 245, 245]
    }
  };

  const pdf = await generateProfessionalWhitePaper(framework, data, options);
  pdf.save('business-report-2024.pdf');
};

// Alternative example with different styling
export const createCustomReport = async () => {
  const framework = 'TCFD';
  const data = [
    { metric: 'System Architecture', value: 'Microservices' },
    { metric: 'Frontend', value: 'React.js' },
    { metric: 'Backend', value: 'Node.js' },
    { metric: 'Database', value: 'PostgreSQL' }
  ];

  const customOptions = {
    companyName: 'Tech Solutions',
    colors: {
      primary: [46, 125, 50],
      accent: [255, 193, 7],
      text: [33, 33, 33],
      white: [255, 255, 255],
      lightGray: [240, 240, 240]
    }
  };

  const pdf = await generateProfessionalWhitePaper(framework, data, customOptions);
  pdf.save('technical-documentation.pdf');
};