import jsPDF from 'jspdf';

// Minimal professional PDF generator
export default function generateProfessionalESGReport(framework, data, options = {}) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { companyName = 'ESG Report', reportPeriod = new Date().getFullYear() } = options;

  // Cover Page
  pdf.setFontSize(32);
  pdf.text('ESG Report', 105, 100, { align: 'center' });
  pdf.setFontSize(16);
  pdf.text(companyName, 105, 120, { align: 'center' });
  pdf.text(`${reportPeriod}`, 105, 140, { align: 'center' });

  return pdf;
}
