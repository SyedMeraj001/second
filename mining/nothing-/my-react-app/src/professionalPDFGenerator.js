import { jsPDF } from 'jspdf';

export const generateProfessionalPDF = (title, content, options = {}) => {
  const pdf = new jsPDF();
  
  const config = {
    companyName: 'Your Company',
    reportPeriod: new Date().getFullYear(),
    colors: {
      primary: [0, 102, 204],
      accent: [255, 152, 0],
      text: [51, 51, 51],
      white: [255, 255, 255],
      lightGray: [245, 245, 245]
    },
    ...options
  };

  // Title Page
  createTitlePage(pdf, title, config);
  
  // Content Pages
  pdf.addPage();
  createContent(pdf, content, config);
  
  return pdf;
};

const createTitlePage = (pdf, title, config) => {
  const { colors, companyName, reportPeriod } = config;
  
  // Background
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, 210, 297, 'F');
  
  // Accent stripe
  pdf.setFillColor(...colors.accent);
  pdf.rect(0, 0, 210, 8, 'F');
  
  // Header box
  pdf.setFillColor(...colors.white);
  pdf.roundedRect(20, 30, 170, 70, 8, 8, 'F');
  pdf.setDrawColor(...colors.accent);
  pdf.setLineWidth(2);
  pdf.roundedRect(20, 30, 170, 70, 8, 8, 'S');
  
  // Company logo placeholder
  pdf.setFillColor(...colors.primary);
  pdf.rect(35, 45, 45, 25, 'F');
  pdf.setTextColor(...colors.white);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(companyName, 40, 60);
  
  // Company name
  pdf.setTextColor(...colors.primary);
  pdf.setFontSize(26);
  pdf.text(companyName, 90, 55);
  
  // Title section
  pdf.setFillColor(...colors.white);
  pdf.roundedRect(30, 130, 150, 65, 8, 8, 'F');
  pdf.setDrawColor(...colors.accent);
  pdf.setLineWidth(3);
  pdf.roundedRect(30, 130, 150, 65, 8, 8, 'S');
  
  pdf.setTextColor(...colors.primary);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, 105 - pdf.getTextWidth(title)/2, 165);
  
  // Report period
  pdf.setFillColor(255, 255, 255, 0.95);
  pdf.roundedRect(35, 245, 140, 30, 5, 5, 'F');
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(12);
  pdf.text(`Report Period: ${reportPeriod}`, 105 - pdf.getTextWidth(`Report Period: ${reportPeriod}`)/2, 260);
  
  const date = new Date().toLocaleDateString();
  pdf.setFontSize(10);
  pdf.text(`Published: ${date}`, 105 - pdf.getTextWidth(`Published: ${date}`)/2, 270);
};

const createContent = (pdf, content, config) => {
  const { colors } = config;
  
  // Header
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, 210, 25, 'F');
  pdf.setTextColor(...colors.white);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONTENT', 20, 17);
  
  // Content
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const lines = content.split('\n');
  let yPos = 45;
  
  lines.forEach(line => {
    if (yPos > 270) {
      pdf.addPage();
      yPos = 30;
    }
    
    if (line.trim() === '') {
      yPos += 5;
    } else if (line.startsWith('#')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(line.substring(1).trim(), 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      yPos += 12;
    } else if (line.startsWith('-')) {
      pdf.text(line, 25, yPos);
      yPos += 8;
    } else {
      pdf.text(line, 20, yPos);
      yPos += 8;
    }
  });
};