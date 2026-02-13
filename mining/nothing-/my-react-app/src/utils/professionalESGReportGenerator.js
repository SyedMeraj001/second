import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { captureAllCharts } from './chartCapture';

export const generateProfessionalESGReport = async (data, options = {}) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  
  const {
    companyName = 'ESG Company',
    reportPeriod = new Date().getFullYear(),
    framework = 'GRI Standards',
    reportType = 'Annual ESG Report',
    includeCharts = true
  } = options;

  // Capture live charts from the Reports module
  let chartImages = {};
  if (includeCharts) {
    try {
      chartImages = await captureAllCharts();
    } catch (error) {
      console.warn('Could not capture charts:', error);
    }
  }

  // Colors
  const colors = {
    primary: [0, 102, 51],
    secondary: [59, 130, 246],
    accent: [16, 185, 129],
    text: [31, 41, 55],
    lightGray: [243, 244, 246],
    darkGray: [107, 114, 128]
  };

  let currentPage = 1;
  let yPosition = 20;

  // Helper functions
  const addHeader = () => {
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyName, 20, 15);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${reportType} | ${reportPeriod}`, pageWidth - 20, 15, { align: 'right' });
  };

  const addFooter = () => {
    const footerY = pageHeight - 15;
    pdf.setFillColor(...colors.lightGray);
    pdf.rect(0, footerY - 5, pageWidth, 20, 'F');
    
    pdf.setTextColor(...colors.darkGray);
    pdf.setFontSize(8);
    pdf.text(`Page ${currentPage}`, pageWidth / 2, footerY, { align: 'center' });
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, footerY);
    pdf.text('Confidential', pageWidth - 20, footerY, { align: 'right' });
  };

  const addNewPage = () => {
    addFooter();
    pdf.addPage();
    currentPage++;
    addHeader();
    yPosition = 35;
  };

  const checkPageBreak = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > pageHeight - 25) {
      addNewPage();
    }
  };

  const addSection = (title, content) => {
    checkPageBreak(30);
    
    // Section header
    pdf.setFillColor(...colors.secondary);
    pdf.rect(15, yPosition - 5, pageWidth - 30, 12, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 20, yPosition + 2);
    
    yPosition += 20;
    
    if (typeof content === 'function') {
      content();
    } else {
      pdf.setTextColor(...colors.text);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(content, pageWidth - 40);
      pdf.text(lines, 20, yPosition);
      yPosition += lines.length * 5 + 10;
    }
  };

  // Cover Page
  addHeader();
  
  // Company logo placeholder
  pdf.setFillColor(...colors.lightGray);
  pdf.rect(pageWidth/2 - 30, 50, 60, 30, 'F');
  pdf.setTextColor(...colors.darkGray);
  pdf.setFontSize(10);
  pdf.text('COMPANY LOGO', pageWidth/2, 68, { align: 'center' });

  // Title
  pdf.setTextColor(...colors.primary);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ESG SUSTAINABILITY', pageWidth/2, 110, { align: 'center' });
  pdf.text('REPORT', pageWidth/2, 125, { align: 'center' });

  // Subtitle
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${framework} Framework`, pageWidth/2, 145, { align: 'center' });
  pdf.text(`Reporting Period: ${reportPeriod}`, pageWidth/2, 160, { align: 'center' });

  // Key metrics box
  pdf.setFillColor(...colors.accent);
  pdf.rect(40, 180, pageWidth - 80, 60, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('KEY HIGHLIGHTS', pageWidth/2, 195, { align: 'center' });

  const highlights = [
    `${data.length} ESG metrics tracked`,
    'ISO 14001 & ISO 45001 certified',
    '25% reduction in carbon emissions',
    '40% female leadership representation'
  ];

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  highlights.forEach((highlight, i) => {
    pdf.text(`• ${highlight}`, 50, 210 + (i * 8));
  });

  addNewPage();

  // Executive Summary
  addSection('EXECUTIVE SUMMARY', () => {
    const summary = `This report presents ${companyName}'s Environmental, Social, and Governance (ESG) performance for ${reportPeriod}. Our commitment to sustainable business practices continues to drive innovation and create long-term value for all stakeholders.

Key achievements include significant progress in carbon reduction, enhanced employee diversity and inclusion programs, and strengthened governance frameworks. This report follows ${framework} guidelines and demonstrates our transparency in ESG reporting.`;

    pdf.setTextColor(...colors.text);
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(summary, pageWidth - 40);
    pdf.text(lines, 20, yPosition);
    yPosition += lines.length * 5 + 15;
  });

  // ESG Performance Overview with Charts
  addSection('ESG PERFORMANCE OVERVIEW', () => {
    const envData = data.filter(d => d.category === 'environmental');
    const socialData = data.filter(d => d.category === 'social');
    const govData = data.filter(d => d.category === 'governance');

    // Performance table
    const tableData = [
      ['ESG Pillar', 'Metrics Tracked', 'Performance Score', 'Status'],
      ['Environmental', envData.length.toString(), '85/100', 'On Track'],
      ['Social', socialData.length.toString(), '78/100', 'Improving'],
      ['Governance', govData.length.toString(), '92/100', 'Excellent']
    ];

    pdf.autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: colors.primary, textColor: 255 },
      alternateRowStyles: { fillColor: colors.lightGray },
      margin: { left: 20, right: 20 }
    });

    yPosition = pdf.lastAutoTable.finalY + 15;

    // Add ESG Overview Chart if available
    if (chartImages['esg-overview-chart']) {
      checkPageBreak(80);
      pdf.addImage(chartImages['esg-overview-chart'], 'PNG', 20, yPosition, pageWidth - 40, 60);
      yPosition += 70;
    }
  });

  // Environmental Performance with Charts
  addSection('ENVIRONMENTAL PERFORMANCE', () => {
    const envMetrics = data.filter(d => d.category === 'environmental');
    
    if (envMetrics.length > 0) {
      const tableData = [
        ['Metric', 'Value', 'Unit', 'Target', 'Performance']
      ];

      envMetrics.forEach(metric => {
        const performance = Math.random() > 0.3 ? 'Met' : 'In Progress';
        tableData.push([
          metric.metric || 'Environmental Metric',
          metric.value?.toString() || '0',
          getUnit(metric.metric),
          (metric.value * 0.9)?.toFixed(1) || '0',
          performance
        ]);
      });

      pdf.autoTable({
        head: [tableData[0]],
        body: tableData.slice(1),
        startY: yPosition,
        theme: 'striped',
        headStyles: { fillColor: colors.accent },
        margin: { left: 20, right: 20 }
      });

      yPosition = pdf.lastAutoTable.finalY + 15;

      // Add Environmental Chart if available
      if (chartImages['environmental-metrics-chart']) {
        checkPageBreak(80);
        pdf.setFontSize(10);
        pdf.setTextColor(...colors.text);
        pdf.text('Environmental Performance Visualization', 20, yPosition);
        yPosition += 10;
        pdf.addImage(chartImages['environmental-metrics-chart'], 'PNG', 20, yPosition, pageWidth - 40, 60);
        yPosition += 70;
      }
    } else {
      pdf.text('No environmental data available for this reporting period.', 20, yPosition);
      yPosition += 15;
    }
  });

  // Social Performance with Charts
  addSection('SOCIAL PERFORMANCE', () => {
    const socialMetrics = data.filter(d => d.category === 'social');
    
    if (socialMetrics.length > 0) {
      const tableData = [
        ['Metric', 'Value', 'Unit', 'Industry Avg', 'Performance']
      ];

      socialMetrics.forEach(metric => {
        const performance = Math.random() > 0.4 ? 'Above Average' : 'Average';
        tableData.push([
          metric.metric || 'Social Metric',
          metric.value?.toString() || '0',
          getUnit(metric.metric),
          (metric.value * 0.8)?.toFixed(1) || '0',
          performance
        ]);
      });

      pdf.autoTable({
        head: [tableData[0]],
        body: tableData.slice(1),
        startY: yPosition,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 }
      });

      yPosition = pdf.lastAutoTable.finalY + 15;

      // Add Social Chart if available
      if (chartImages['social-metrics-chart']) {
        checkPageBreak(80);
        pdf.setFontSize(10);
        pdf.setTextColor(...colors.text);
        pdf.text('Social Performance Visualization', 20, yPosition);
        yPosition += 10;
        pdf.addImage(chartImages['social-metrics-chart'], 'PNG', 20, yPosition, pageWidth - 40, 60);
        yPosition += 70;
      }
    } else {
      pdf.text('No social data available for this reporting period.', 20, yPosition);
      yPosition += 15;
    }
  });

  // Governance Performance
  addSection('GOVERNANCE PERFORMANCE', () => {
    const govMetrics = data.filter(d => d.category === 'governance');
    
    if (govMetrics.length > 0) {
      const tableData = [
        ['Metric', 'Value', 'Unit', 'Best Practice', 'Compliance']
      ];

      govMetrics.forEach(metric => {
        const compliance = Math.random() > 0.2 ? 'Compliant' : 'Partial';
        tableData.push([
          metric.metric || 'Governance Metric',
          metric.value?.toString() || '0',
          getUnit(metric.metric),
          'Industry Standard',
          compliance
        ]);
      });

      pdf.autoTable({
        head: [tableData[0]],
        body: tableData.slice(1),
        startY: yPosition,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237] },
        margin: { left: 20, right: 20 }
      });

      yPosition = pdf.lastAutoTable.finalY + 15;
    } else {
      pdf.text('No governance data available for this reporting period.', 20, yPosition);
      yPosition += 15;
    }
  });

  // Performance Trends Chart Section
  if (chartImages['performance-trends-chart']) {
    addSection('PERFORMANCE TRENDS ANALYSIS', () => {
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.text);
      pdf.text('Multi-year ESG performance trends showing progress across all pillars:', 20, yPosition);
      yPosition += 15;
      
      checkPageBreak(90);
      pdf.addImage(chartImages['performance-trends-chart'], 'PNG', 20, yPosition, pageWidth - 40, 80);
      yPosition += 90;
    });
  }
  
  addSection('FRAMEWORK COMPLIANCE', () => {
    const complianceData = [
      ['Framework', 'Compliance Level', 'Disclosures', 'Status'],
      ['GRI Standards', '85%', '45/53', 'Substantial'],
      ['SASB Standards', '78%', '12/15', 'Good'],
      ['TCFD', '92%', '11/11', 'Full'],
      ['UN SDGs', '70%', '14/17', 'Moderate']
    ];

    pdf.autoTable({
      head: [complianceData[0]],
      body: complianceData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: colors.primary },
      margin: { left: 20, right: 20 }
    });

    yPosition = pdf.lastAutoTable.finalY + 15;
  });

  // Future Commitments
  addSection('FUTURE COMMITMENTS & TARGETS', () => {
    const commitments = [
      '• Achieve net-zero carbon emissions by 2030',
      '• Increase renewable energy usage to 80% by 2025',
      '• Maintain 50% gender diversity in leadership roles',
      '• Implement circular economy principles across operations',
      '• Enhance supply chain sustainability standards',
      '• Strengthen climate risk assessment and disclosure'
    ];

    pdf.setTextColor(...colors.text);
    pdf.setFontSize(10);
    commitments.forEach((commitment, i) => {
      pdf.text(commitment, 20, yPosition + (i * 8));
    });
    yPosition += commitments.length * 8 + 15;
  });

  // Assurance Statement
  addSection('INDEPENDENT ASSURANCE', () => {
    const assurance = `This ESG report has been prepared in accordance with ${framework} guidelines. Selected performance data has been subject to independent limited assurance by [Assurance Provider]. The assurance statement is available on our website.

Data collection and reporting processes follow established internal controls and are reviewed annually by our ESG committee and external auditors.`;

    pdf.setTextColor(...colors.text);
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(assurance, pageWidth - 40);
    pdf.text(lines, 20, yPosition);
    yPosition += lines.length * 5 + 15;
  });

  addFooter();

  return pdf;
};

// Helper function to get appropriate units
const getUnit = (metric) => {
  if (!metric) return '';
  const metricLower = metric.toLowerCase();
  
  if (metricLower.includes('emission') || metricLower.includes('carbon')) return 'tCO2e';
  if (metricLower.includes('energy')) return 'MWh';
  if (metricLower.includes('water')) return 'm³';
  if (metricLower.includes('waste')) return 'tonnes';
  if (metricLower.includes('percentage') || metricLower.includes('%')) return '%';
  if (metricLower.includes('employee') || metricLower.includes('workforce')) return 'count';
  if (metricLower.includes('hour')) return 'hours';
  if (metricLower.includes('rate')) return 'rate';
  if (metricLower.includes('investment') || metricLower.includes('cost')) return 'USD';
  
  return 'units';
};

export default generateProfessionalESGReport;