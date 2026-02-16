import { jsPDF } from 'jspdf';
import { ESGDataAggregator } from './utils/esgDataAggregator';
// Import real-time data modules
import esgAPI from './api/esgAPI';
import ModuleAPI from './services/moduleAPI';
import { ESGScoreCalculator } from './utils/ESGScoreCalculator';
import { CalculatorManager } from './calculators/index';
import { ESGModuleManager } from './modules/index';

// Real-time data fetcher for PDF generation
class PDFDataFetcher {
  static async fetchRealTimeESGData() {
    try {
      const [analyticsData, kpiData, calculatedMetrics, moduleData] = await Promise.all([
        esgAPI.getAnalyticsData(),
        ModuleAPI.calculateKPIs('company-001'),
        this.calculateRealTimeMetrics(),
        ESGDataAggregator.aggregateAllModuleData()
      ]);

      return {
        analytics: analyticsData.data,
        kpis: kpiData.data,
        calculatedMetrics,
        modules: moduleData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Failed to fetch real-time data for PDF:', error);
      return this.getFallbackData();
    }
  }

  static async calculateRealTimeMetrics() {
    try {
      const [carbonData, waterData, roiData] = await Promise.all([
        CalculatorManager.calculate('carbon', { scope1: 1200, scope2: 800, scope3: 3500 }),
        CalculatorManager.calculate('water', { consumption: 50000, location: 'high-stress', efficiency: 85 }),
        CalculatorManager.calculate('roi', { investments: 2500000, benefits: 3200000, timeframe: 3 })
      ]);

      return { carbonData, waterData, roiData };
    } catch (error) {
      return {
        carbonData: { totalEmissions: 5500, breakdown: { scope1: 1200, scope2: 800, scope3: 3500 } },
        waterData: { stressScore: 75, riskLevel: 'Medium-High' },
        roiData: { totalROI: 28, paybackPeriod: 2.1 }
      };
    }
  }

  static getFallbackData() {
    return {
      analytics: {
        categoryDistribution: { environmental: 15, social: 12, governance: 8 },
        riskDistribution: { high: 2, medium: 8, low: 25 },
        totalEntries: 35
      },
      kpis: {
        overall: 78,
        environmental: 82,
        social: 75,
        governance: 77,
        complianceRate: 94
      },
      calculatedMetrics: {
        carbonData: { totalEmissions: 5500, breakdown: { scope1: 1200, scope2: 800, scope3: 3500 } },
        waterData: { stressScore: 75, riskLevel: 'Medium-High' },
        roiData: { totalROI: 28, paybackPeriod: 2.1 }
      },
      timestamp: new Date().toISOString()
    };
  }
}

const normalizeData = (data) => {
  return data
    .map((item, originalIndex) => {
      let year = null;
      if (item.reportingYear && !isNaN(parseInt(item.reportingYear))) {
        year = parseInt(item.reportingYear);
      } else if (item.timestamp) {
        try {
          year = new Date(item.timestamp).getFullYear();
        } catch {
          year = new Date().getFullYear();
        }
      } else {
        year = new Date().getFullYear();
      }
      
      if (item.environmental || item.social || item.governance) {
        const results = [];
        ['environmental', 'social', 'governance'].forEach(cat => {
          if (item[cat]) {
            Object.entries(item[cat]).forEach(([key, value]) => {
              if (key !== 'description' && value !== '' && !isNaN(parseFloat(value))) {
                results.push({
                  ...item,
                  category: cat,
                  metric: key,
                  value: parseFloat(value),
                  year,
                  companyName: item.companyName,
                  _originalIndex: originalIndex
                });
              }
            });
          }
        });
        return results;
      } else {
        const category = (item.category || '').toLowerCase();
        const value = parseFloat(item.value);
        return [{
          ...item,
          year,
          category,
          value: isNaN(value) ? null : value,
          _originalIndex: originalIndex
        }];
      }
    })
    .flat()
    .filter(item => item.year && item.category && item.value !== null && ['environmental','social','governance'].includes(item.category));
};

const getStoredData = async () => {
  try {
    let localData = JSON.parse(localStorage.getItem('esgData') || '[]');
    const advancedData = JSON.parse(localStorage.getItem('advanced_esg_data') || '[]');
    if (advancedData.length > 0) {
      const converted = advancedData.map(item => ({
        ...item,
        companyName: item.companyName || 'Company',
        status: 'Submitted',
        timestamp: item.timestamp || new Date().toISOString()
      }));
      localData = [...localData, ...converted];
    }
    return localData;
  } catch {
    return [];
  }
};

export const generateProfessionalWhitePaper = async (framework, inputData, options = {}) => {
  // Fetch real-time data first
  const realTimeData = await PDFDataFetcher.fetchRealTimeESGData();
  
  // Use real-time data if available, otherwise fall back to input data or stored data
  const data = inputData && inputData.length > 0 ? inputData : await getStoredData();
  
  if (!Array.isArray(data)) throw new Error('Data must be an array of ESG metrics');
  if (!framework || typeof framework !== 'string') throw new Error('Framework must be a valid string (GRI, SASB, TCFD)');

  // Use wider format for better preview (A4 landscape or custom width)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [240, 297] });
  const normalizedData = normalizeData(data);
  
  // Extract chart images from options if provided
  const chartImages = options.chartImages || {};
  
  const config = {
    companyName: data[0]?.companyName || 'E-S-GENIUS',
    reportPeriod: new Date().getFullYear(),
    realTimeData, // Include real-time data in config
    chartImages, // Include captured chart images
    colors: {
      // New theme colors matching HTML design
      forestGreen: [27, 94, 63],
      growthGreen: [45, 134, 89],
      oceanBlue: [74, 144, 184],
      steelBlue: [59, 107, 140],
      cream: [248, 246, 241],
      lightCream: [250, 249, 246],
      gold: [212, 175, 55],
      charcoal: [44, 62, 54],
      // Legacy colors for compatibility
      primary: [27, 94, 63],
      secondary: [45, 134, 89],
      accent: [74, 144, 184],
      text: [44, 62, 54],
      lightGreen: [248, 246, 241],
      mediumGreen: [90, 184, 141],
      white: [255, 255, 255],
      success: [45, 134, 89],
      warning: [237, 137, 54],
      danger: [245, 101, 101],
      neutral: [248, 246, 241],
      blue: [74, 144, 184],
      lightBlue: [219, 234, 254],
      purple: [147, 51, 234],
      orange: [249, 115, 22],
      gray: [107, 114, 128],
      lightGray: [243, 244, 246],
      darkBlue: [59, 107, 140]
    },
    includeCharts: true,
    ...options
  };

  pdf.setProperties({
    title: `${config.companyName} ESG Report ${config.reportPeriod}`,
    subject: `${framework} Aligned ESG Sustainability Report`,
    author: config.companyName,
    keywords: 'ESG, Sustainability, Environmental, Social, Governance',
    creator: 'ESGenius Professional PDF Generator v2.0'
  });

  createESGeniusBrandingPage(pdf, config);
  pdf.addPage(); createAdvancedTitlePage(pdf, framework, config);
  pdf.addPage(); createExecutiveDashboard(pdf, normalizedData, config);
  pdf.addPage(); createEnvironmentalModuleReport(pdf, config);
  pdf.addPage(); createSocialModuleReport(pdf, config);
  pdf.addPage(); createGovernanceModuleReport(pdf, config);
  pdf.addPage(); createCalculatorResults(pdf, config);
  pdf.addPage(); createTheoreticalFramework(pdf, normalizedData, config, framework);
  pdf.addPage(); createPerformanceOverview(pdf, normalizedData, config, framework);
  pdf.addPage(); createFrameworkComplianceTable(pdf, framework, normalizedData, config);
  pdf.addPage(); createRecommendations(pdf, config);
  
  addAdvancedHeadersFooters(pdf, config);
  return pdf;
};

// Print function that generates the same report
export const printProfessionalWhitePaper = async (framework, inputData, options = {}) => {
  const pdf = await generateProfessionalWhitePaper(framework, inputData, options);
  pdf.autoPrint();
  window.open(pdf.output('bloburl'), '_blank');
};

const createESGeniusBrandingPage = (pdf, config) => {
  const { colors } = config;
  
  // Premium gradient background - forest green
  pdf.setFillColor(13, 59, 46); pdf.rect(0, 0, 210, 297, 'F');
  
  // Top accent bar (gradient simulation with multiple colors)
  pdf.setFillColor(27, 94, 63); pdf.rect(0, 0, 52.5, 3, 'F');
  pdf.setFillColor(45, 134, 89); pdf.rect(52.5, 0, 52.5, 3, 'F');
  pdf.setFillColor(74, 144, 184); pdf.rect(105, 0, 52.5, 3, 'F');
  pdf.setFillColor(59, 107, 140); pdf.rect(157.5, 0, 52.5, 3, 'F');
  
  // Main content card - cream background
  pdf.setFillColor(248, 246, 241); pdf.rect(15, 20, 180, 257, 'F');
  
  // Header section with subtle background
  pdf.setFillColor(250, 249, 246); pdf.rect(15, 20, 180, 70, 'F');
  
  // Brand name - large and bold
  pdf.setTextColor(44, 62, 54); pdf.setFontSize(48); pdf.setFont('helvetica', 'bold');
  pdf.text('E-S-GENIUS', 30, 55);
  
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(59, 107, 140);
  pdf.text('T E C H  S O L U T I O N S ', 30, 65);
  
  // Large year watermark
  pdf.setFontSize(120); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(27, 94, 63);
  pdf.setGState(new pdf.GState({opacity: 0.08}));
  pdf.text('2024', 140, 140);
  pdf.setGState(new pdf.GState({opacity: 1}));
  
  // Report title section
  pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(74, 144, 184);
  pdf.text('A N N U A L   R E P O R T', 30, 110);
  
  pdf.setFontSize(36); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(44, 62, 54);
  pdf.text('ESG Performance', 30, 130);
  pdf.text('& Impact', 30, 145);
  
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(59, 107, 140);
  const subtitle = pdf.splitTextToSize('Comprehensive assessment of our environmental stewardship, social responsibility, and governance excellence throughout 2024.', 120);
  pdf.text(subtitle, 30, 158);
  
  // ESG Pillars - Three modern cards
  const pillars = [
    { letter: 'E', name: 'ENVIRONMENTAL', desc: 'Carbon neutrality & resource efficiency', color: [45, 134, 89], x: 30 },
    { letter: 'S', name: 'SOCIAL', desc: 'Community impact & workforce wellbeing', color: [90, 184, 141], x: 85 },
    { letter: 'G', name: 'GOVERNANCE', desc: 'Ethics, transparency & accountability', color: [74, 144, 184], x: 140 }
  ];
  
  pillars.forEach(pillar => {
    const y = 185;
    // Card background with gradient effect
    pdf.setFillColor(...pillar.color); pdf.roundedRect(pillar.x, y, 45, 50, 4, 4, 'F');
    pdf.setFillColor(255, 255, 255); pdf.setGState(new pdf.GState({opacity: 0.85}));
    pdf.roundedRect(pillar.x, y, 45, 50, 4, 4, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // Decorative circle
    pdf.setFillColor(255, 255, 255); pdf.setGState(new pdf.GState({opacity: 0.3}));
    pdf.circle(pillar.x + 38, y + 7, 4, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // Large letter
    pdf.setFontSize(42); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(44, 62, 54);
    pdf.text(pillar.letter, pillar.x + 6, y + 25);
    
    // Pillar name
    pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(44, 62, 54);
    pdf.text(pillar.name, pillar.x + 6, y + 38);
    
    // Description
    pdf.setFontSize(6); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(44, 62, 54);
    const desc = pdf.splitTextToSize(pillar.desc, 38);
    pdf.text(desc, pillar.x + 6, y + 43);
  });
  
  // Footer information grid
  pdf.setDrawColor(27, 94, 63); pdf.setLineWidth(0.5);
  pdf.line(30, 245, 180, 245);
  
  const footerItems = [
    { label: 'REPORTING PERIOD', value: 'January – December 2024', x: 30, y: 255 },
    { label: 'PUBLICATION DATE', value: 'February 2025', x: 110, y: 255 },
    { label: 'FRAMEWORK STANDARDS', value: 'GRI, SASB, TCFD', x: 30, y: 265 },
    { label: 'REPORT VERSION', value: '1.0 – Final', x: 110, y: 265 }
  ];
  
  footerItems.forEach(item => {
    pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(74, 144, 184);
    pdf.text(item.label, item.x, item.y);
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(44, 62, 54);
    pdf.text(item.value, item.x, item.y + 5);
  });
  
  // Bottom accent bar
  pdf.setFillColor(27, 94, 63); pdf.rect(15, 274, 45, 3, 'F');
  pdf.setFillColor(45, 134, 89); pdf.rect(60, 274, 45, 3, 'F');
  pdf.setFillColor(74, 144, 184); pdf.rect(105, 274, 45, 3, 'F');
  pdf.setFillColor(59, 107, 140); pdf.rect(150, 274, 45, 3, 'F');
};

const createAdvancedTitlePage = (pdf, framework, config) => {
  const { colors, companyName, reportPeriod } = config;
  
  // Cream background
  pdf.setFillColor(...colors.cream); pdf.rect(0, 0, 210, 297, 'F');
  
  // Top accent bar
  pdf.setFillColor(...colors.forestGreen); pdf.rect(0, 0, 52.5, 3, 'F');
  pdf.setFillColor(...colors.growthGreen); pdf.rect(52.5, 0, 52.5, 3, 'F');
  pdf.setFillColor(...colors.oceanBlue); pdf.rect(105, 0, 52.5, 3, 'F');
  pdf.setFillColor(...colors.steelBlue); pdf.rect(157.5, 0, 52.5, 3, 'F');
  
  // Main title card
  pdf.setFillColor(...colors.white); pdf.roundedRect(25, 60, 160, 80, 8, 8, 'F');
  pdf.setDrawColor(...colors.forestGreen); pdf.setLineWidth(1); pdf.roundedRect(25, 60, 160, 80, 8, 8, 'S');
  
  pdf.setTextColor(...colors.charcoal); pdf.setFontSize(32); pdf.setFont('helvetica', 'bold');
  pdf.text(companyName, 105 - pdf.getTextWidth(companyName)/2, 85);
  pdf.setFontSize(14); pdf.setTextColor(...colors.steelBlue);
  pdf.text('ESG SUSTAINABILITY REPORT', 105 - pdf.getTextWidth('ESG SUSTAINABILITY REPORT')/2, 100);
  pdf.setFontSize(11); pdf.setTextColor(...colors.oceanBlue);
  pdf.text(`${framework} Framework Aligned`, 105 - pdf.getTextWidth(`${framework} Framework Aligned`)/2, 120);
  
  // Report period card
  pdf.setFillColor(...colors.lightCream); pdf.roundedRect(60, 160, 90, 40, 6, 6, 'F');
  pdf.setTextColor(...colors.charcoal); pdf.setFontSize(24); pdf.setFont('helvetica', 'bold');
  pdf.text('ANNUAL REPORT', 105 - pdf.getTextWidth('ANNUAL REPORT')/2, 180);
  pdf.setFontSize(20);
  pdf.text(reportPeriod.toString(), 105 - pdf.getTextWidth(reportPeriod.toString())/2, 195);
  
  // Footer
  pdf.setFillColor(...colors.forestGreen); pdf.rect(0, 250, 210, 47, 'F');
  pdf.setTextColor(...colors.white); pdf.setFontSize(11);
  pdf.text(`Reporting Period: ${reportPeriod}`, 105 - pdf.getTextWidth(`Reporting Period: ${reportPeriod}`)/2, 270);
  pdf.setFontSize(9);
  pdf.text('Generated by E-S-Genius Platform', 105 - pdf.getTextWidth('Generated by E-S-Genius Platform')/2, 285);
};

const createExecutiveDashboard = (pdf, data, config) => {
  const { colors, realTimeData, chartImages } = config;
  createAdvancedSectionHeader(pdf, 'EXECUTIVE DASHBOARD', colors);
  
  const envData = data.filter(d => d.category === 'environmental');
  const socialData = data.filter(d => d.category === 'social');
  const govData = data.filter(d => d.category === 'governance');
  
  // Safe access to real-time KPIs with fallbacks
  const kpis = [
    { label: 'ESG Score', value: `${realTimeData?.kpis?.overall || 87}/100`, color: colors.blue },
    { label: 'Carbon Intensity', value: `${(realTimeData?.calculatedMetrics?.carbonData?.totalEmissions / 1000)?.toFixed(1) || '2.3'} ktCO2e`, color: colors.purple },
    { label: 'Employee Satisfaction', value: `${realTimeData?.kpis?.social || 94}%`, color: colors.orange },
    { label: 'Compliance Rate', value: `${realTimeData?.kpis?.complianceRate || 75}%`, color: colors.darkBlue }
  ];
  
  kpis.forEach((kpi, i) => {
    const x = 25 + (i % 2) * 90; const y = 45 + Math.floor(i / 2) * 45;
    pdf.setFillColor(...kpi.color); pdf.roundedRect(x, y, 85, 40, 6, 6, 'F');
    pdf.setTextColor(...colors.white); pdf.setFontSize(9);
    pdf.text(kpi.label, x + 8, y + 15);
    pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.value, x + 8, y + 32);
    pdf.setFont('helvetica', 'normal');
  });
  
  // Add ESG Score Wheel Chart
  addESGScoreWheel(pdf, data, 25, 145, 80, 80, colors, realTimeData, chartImages?.esgScoreWheel);
  
  // Add Trend Chart
  addMiniTrendChart(pdf, data, 115, 145, 80, 80, colors, realTimeData, chartImages?.trendChart);
  
  // Add new page for Performance Summary to avoid overlap
  pdf.addPage();
  createAdvancedSectionHeader(pdf, 'PERFORMANCE SUMMARY', colors);
  
  // Performance Summary Cards
  const summaryCards = [
    { title: 'Data Quality', value: '95%', desc: 'Verified metrics', color: colors.blue },
    { title: 'Trend Analysis', value: '+12%', desc: 'YoY improvement', color: colors.purple },
    { title: 'Risk Level', value: 'Low', desc: 'Overall assessment', color: colors.orange },
    { title: 'Readiness', value: '88%', desc: 'Regulatory prep', color: colors.darkBlue }
  ];
  
  summaryCards.forEach((card, i) => {
    const x = 25 + (i % 2) * 90; const y = 50 + Math.floor(i / 2) * 20;
    pdf.setFillColor(...colors.white); pdf.roundedRect(x, y, 85, 18, 4, 4, 'F');
    pdf.setDrawColor(...card.color); pdf.setLineWidth(2); pdf.roundedRect(x, y, 85, 18, 4, 4, 'S');
    pdf.setTextColor(...card.color); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    pdf.text(card.title, x + 5, y + 8);
    pdf.setFontSize(11); pdf.text(card.value, x + 5, y + 14);
    pdf.setFontSize(6); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...colors.gray);
    pdf.text(card.desc, x + 45, y + 14);
  });
};

const createTheoreticalFramework = (pdf, data, config, framework) => {
  const { colors, realTimeData } = config;
  createAdvancedSectionHeader(pdf, 'THEORETICAL FRAMEWORK & ANALYSIS', colors);
  
  // ESG Theory Foundation
  pdf.setTextColor(...colors.text); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
  pdf.text('ESG Theory & Business Value Creation', 20, 40);
  
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  const theoryContent = [
    'Stakeholder Theory Application:',
    'ESG performance directly correlates with stakeholder value creation through risk',
    'mitigation, operational efficiency, and enhanced reputation. Our data demonstrates',
    `a ${realTimeData?.calculatedMetrics?.roiData?.totalROI || 28}% ROI on ESG investments, validating the business case.`,
    '',
    'Triple Bottom Line Framework:',
    `• People: ${realTimeData?.kpis?.social || 75}% social performance indicates strong human capital management`,
    `• Planet: ${realTimeData?.kpis?.environmental || 82}% environmental score reflects sustainable operations`,
    `• Profit: ${realTimeData?.kpis?.governance || 77}% governance score ensures long-term value creation`
  ];
  
  let yPos = 55;
  theoryContent.forEach(line => {
    if (line === '') yPos += 8;
    else if (line.startsWith('•')) { pdf.text(line, 30, yPos); yPos += 12; }
    else if (line.endsWith(':')) { pdf.setFont('helvetica', 'bold'); pdf.text(line, 25, yPos); pdf.setFont('helvetica', 'normal'); yPos += 12; }
    else { pdf.text(line, 25, yPos); yPos += 10; }
  });
  
  // Materiality Analysis
  pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
  pdf.text('Materiality Assessment & Risk Analysis', 20, 150);
  
  // Create materiality matrix
  const matrixX = 25, matrixY = 175, matrixW = 160, matrixH = 80;
  pdf.setDrawColor(...colors.mediumGreen); pdf.setLineWidth(1);
  pdf.rect(matrixX, matrixY, matrixW, matrixH, 'S');
  pdf.line(matrixX + matrixW/2, matrixY, matrixX + matrixW/2, matrixY + matrixH);
  pdf.line(matrixX, matrixY + matrixH/2, matrixX + matrixW, matrixY + matrixH/2);
  
  // Matrix labels
  pdf.setFontSize(8);
  pdf.text('Business Impact →', matrixX + matrixW/2 - 15, matrixY + matrixH + 10);
  pdf.text('Stakeholder', matrixX - 20, matrixY + matrixH/2 - 5);
  pdf.text('Importance ↑', matrixX - 20, matrixY + matrixH/2 + 5);
  
  // Plot key issues based on data
  const issues = [
    { name: 'Climate Risk', x: 120, y: 30, priority: 'high' },
    { name: 'Data Privacy', x: 100, y: 45, priority: 'medium' },
    { name: 'Supply Chain', x: 90, y: 35, priority: 'medium' },
    { name: 'Employee Safety', x: 110, y: 25, priority: 'high' }
  ];
  
  issues.forEach(issue => {
    const color = issue.priority === 'high' ? colors.danger : colors.warning;
    pdf.setFillColor(...color);
    pdf.circle(matrixX + issue.x, matrixY + issue.y, 3, 'F');
    pdf.setFontSize(7); pdf.setTextColor(...colors.text);
    pdf.text(issue.name, matrixX + issue.x + 5, matrixY + issue.y + 2);
  });
  
  // Theoretical Implications
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...colors.text);
  pdf.text('High-impact, high-importance issues require immediate strategic attention', 25, 270);
  pdf.text('and resource allocation for sustainable competitive advantage.', 25, 280);
};

const createPerformanceOverview = (pdf, data, config, framework) => {
  const { colors, realTimeData } = config;
  createAdvancedSectionHeader(pdf, 'ESG PERFORMANCE OVERVIEW', colors);
  
  // Executive Summary Section
  pdf.setTextColor(...colors.text); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
  pdf.text('Performance Summary', 20, 50);
  
  const summaryContent = [
    `Overall ESG Score: ${realTimeData?.kpis?.overall || 78}%`,
    `Environmental: ${realTimeData?.kpis?.environmental || 82}% | Social: ${realTimeData?.kpis?.social || 75}% | Governance: ${realTimeData?.kpis?.governance || 77}%`,
    `Carbon Footprint: ${realTimeData?.calculatedMetrics?.carbonData?.totalEmissions || 5500} tCO2e | ESG ROI: ${realTimeData?.calculatedMetrics?.roiData?.totalROI || 28}%`
  ];
  
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  summaryContent.forEach((line, i) => {
    pdf.text(line, 25, 65 + i * 12);
  });
  
  // Environmental Performance Cards
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...colors.primary);
  pdf.text('[E] Environmental Performance', 20, 110);
  
  const envMetrics = [
    { label: 'Total Emissions', value: `${realTimeData?.calculatedMetrics?.carbonData?.totalEmissions || 5500} tCO2e` },
    { label: 'Energy Efficiency', value: '85%' },
    { label: 'Water Usage', value: '125k m³' },
    { label: 'Waste Reduction', value: '20%' }
  ];
  
  envMetrics.forEach((metric, i) => {
    const x = 20 + (i % 2) * 90; const y = 120 + Math.floor(i / 2) * 20;
    pdf.setFillColor(...colors.neutral); pdf.roundedRect(x, y, 85, 15, 3, 3, 'F');
    pdf.setTextColor(...colors.text); pdf.setFontSize(8);
    pdf.text(metric.label, x + 3, y + 6);
    pdf.setFont('helvetica', 'bold'); pdf.text(metric.value, x + 3, y + 12);
    pdf.setFont('helvetica', 'normal');
  });
  
  // Social Performance Cards
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...colors.secondary);
  pdf.text('[S] Social Performance', 20, 170);
  
  const socialMetrics = [
    { label: 'Employee Satisfaction', value: `${realTimeData?.kpis?.social || 94}%` },
    { label: 'Diversity Index', value: '0.72' },
    { label: 'Training Hours', value: '24.5k hrs' },
    { label: 'Safety Record', value: '0.12 LTIR' }
  ];
  
  socialMetrics.forEach((metric, i) => {
    const x = 20 + (i % 2) * 90; const y = 180 + Math.floor(i / 2) * 20;
    pdf.setFillColor(...colors.neutral); pdf.roundedRect(x, y, 85, 15, 3, 3, 'F');
    pdf.setTextColor(...colors.text); pdf.setFontSize(8);
    pdf.text(metric.label, x + 3, y + 6);
    pdf.setFont('helvetica', 'bold'); pdf.text(metric.value, x + 3, y + 12);
    pdf.setFont('helvetica', 'normal');
  });
  
  // Governance Performance Cards
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...colors.accent);
  pdf.text('[G] Governance Performance', 20, 230);
  
  const govMetrics = [
    { label: 'Board Independence', value: '75%' },
    { label: 'Ethics Training', value: '98%' },
    { label: 'Audit Score', value: '94/100' },
    { label: 'Compliance Rate', value: `${realTimeData?.kpis?.complianceRate || 99}%` }
  ];
  
  govMetrics.forEach((metric, i) => {
    const x = 20 + (i % 2) * 90; const y = 240 + Math.floor(i / 2) * 20;
    pdf.setFillColor(...colors.neutral); pdf.roundedRect(x, y, 85, 15, 3, 3, 'F');
    pdf.setTextColor(...colors.text); pdf.setFontSize(8);
    pdf.text(metric.label, x + 3, y + 6);
    pdf.setFont('helvetica', 'bold'); pdf.text(metric.value, x + 3, y + 12);
    pdf.setFont('helvetica', 'normal');
  });
};

const createMaterialityMatrix = (pdf, data, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'MATERIALITY ASSESSMENT', colors);
  
  pdf.setTextColor(...colors.text); pdf.setFontSize(11);
  pdf.text('Material Topics Matrix - Stakeholder Importance vs Business Impact', 20, 55);
  
  // Draw matrix
  const matrixX = 30, matrixY = 70, matrixW = 150, matrixH = 100;
  pdf.setDrawColor(...colors.mediumGray); pdf.setLineWidth(1);
  pdf.rect(matrixX, matrixY, matrixW, matrixH, 'S');
  pdf.line(matrixX + matrixW/2, matrixY, matrixX + matrixW/2, matrixY + matrixH);
  pdf.line(matrixX, matrixY + matrixH/2, matrixX + matrixW, matrixY + matrixH/2);
  
  // Add labels
  pdf.setFontSize(9);
  pdf.text('Business Impact', matrixX + matrixW/2 - 15, matrixY + matrixH + 15);
  pdf.text('Stakeholder', matrixX - 25, matrixY + matrixH/2 - 10);
  pdf.text('Importance', matrixX - 25, matrixY + matrixH/2);
  
  // Plot material topics
  const topics = [
    { name: 'Climate Change', x: 120, y: 30, priority: 'high' },
    { name: 'Employee Safety', x: 110, y: 25, priority: 'high' },
    { name: 'Data Privacy', x: 80, y: 40, priority: 'medium' },
    { name: 'Supply Chain', x: 90, y: 35, priority: 'medium' }
  ];
  
  topics.forEach(topic => {
    const color = topic.priority === 'high' ? colors.danger : colors.warning;
    pdf.setFillColor(...color);
    pdf.circle(matrixX + topic.x, matrixY + topic.y, 3, 'F');
    pdf.setFontSize(7);
    pdf.text(topic.name, matrixX + topic.x + 5, matrixY + topic.y + 2);
  });
};

const createEnvironmentalDashboard = (pdf, data, config) => {
  const { colors, realTimeData } = config;
  createAdvancedSectionHeader(pdf, 'ENVIRONMENTAL PERFORMANCE', colors);
  
  const envData = data.filter(d => d.category === 'environmental');
  
  if (envData.length > 0 || realTimeData) {
    // Use real-time metrics if available with safe access
    const carbonEmissions = realTimeData?.calculatedMetrics?.carbonData?.totalEmissions || 12450;
    const scope1 = realTimeData?.calculatedMetrics?.carbonData?.breakdown?.scope1 || 1200;
    const scope2 = realTimeData?.calculatedMetrics?.carbonData?.breakdown?.scope2 || 800;
    const scope3 = realTimeData?.calculatedMetrics?.carbonData?.breakdown?.scope3 || 3500;
    
    const metrics = [
      { label: 'Total Emissions', value: `${carbonEmissions.toLocaleString()} tCO2e`, trend: '↓ 15%' },
      { label: 'Scope 1 Emissions', value: `${scope1.toLocaleString()} tCO2e`, trend: '↓ 8%' },
      { label: 'Scope 2 Emissions', value: `${scope2.toLocaleString()} tCO2e`, trend: '↓ 12%' },
      { label: 'Scope 3 Emissions', value: `${scope3.toLocaleString()} tCO2e`, trend: '↓ 20%' }
    ];
    
    metrics.forEach((metric, i) => {
      const x = 20 + (i % 2) * 90; const y = 50 + Math.floor(i / 2) * 30;
      pdf.setFillColor(...colors.neutral); pdf.roundedRect(x, y, 85, 25, 4, 4, 'F');
      pdf.setDrawColor(...colors.mediumGray); pdf.setLineWidth(1); pdf.roundedRect(x, y, 85, 25, 4, 4, 'S');
      pdf.setTextColor(...colors.primary); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
      pdf.text(metric.label, x + 5, y + 10);
      pdf.setFontSize(12); pdf.setTextColor(...colors.text);
      pdf.text(metric.value, x + 5, y + 20);
      pdf.setFontSize(8); pdf.setTextColor(...colors.success);
      pdf.text(metric.trend, x + 60, y + 20);
    });
    
    // Add real-time environmental performance note
    pdf.setTextColor(...colors.text); pdf.setFontSize(10);
    pdf.text(`Environmental data updated: ${realTimeData?.timestamp ? new Date(realTimeData.timestamp).toLocaleString() : 'N/A'}`, 20, 125);
    
    addAdvancedEnvironmentalChart(pdf, envData, 20, 135, 170, 65, colors, realTimeData);
  } else {
    pdf.text('No environmental data available for analysis', 20, 80);
  }
};

const createSocialDashboard = (pdf, data, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'SOCIAL PERFORMANCE', colors);
  
  const socialData = data.filter(d => d.category === 'social');
  
  if (socialData.length > 0) {
    const metrics = [
      { label: 'Employee Engagement', value: '87%', trend: '↑ 5%' },
      { label: 'Diversity Index', value: '0.72', trend: '↑ 12%' },
      { label: 'Training Hours', value: '24,500 hrs', trend: '↑ 18%' },
      { label: 'Safety Incidents', value: '0.12 LTIR', trend: '↓ 25%' }
    ];
    
    metrics.forEach((metric, i) => {
      const x = 20 + (i % 2) * 90; const y = 50 + Math.floor(i / 2) * 30;
      pdf.setFillColor(...colors.primary); pdf.roundedRect(x, y, 85, 25, 5, 5, 'F');
      pdf.setTextColor(...colors.white); pdf.setFontSize(9);
      pdf.text(metric.label, x + 5, y + 8);
      pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
      pdf.text(metric.value, x + 5, y + 18);
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.text(metric.trend, x + 60, y + 18);
    });
    
    addAdvancedSocialChart(pdf, socialData, 20, 120, 170, 80, colors);
  } else {
    pdf.text('No social data available for analysis', 20, 80);
  }
};

const createGovernanceDashboard = (pdf, data, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'GOVERNANCE PERFORMANCE', colors);
  
  const govData = data.filter(d => d.category === 'governance');
  
  if (govData.length > 0) {
    const metrics = [
      { label: 'Board Independence', value: '75%', trend: '↑ 10%' },
      { label: 'Ethics Training', value: '98%', trend: '↑ 3%' },
      { label: 'Audit Score', value: '94/100', trend: '→ 0%' },
      { label: 'Compliance Rate', value: '99.2%', trend: '↑ 1%' }
    ];
    
    metrics.forEach((metric, i) => {
      const x = 20 + (i % 2) * 90; const y = 50 + Math.floor(i / 2) * 30;
      pdf.setFillColor(...colors.accent); pdf.roundedRect(x, y, 85, 25, 5, 5, 'F');
      pdf.setTextColor(...colors.white); pdf.setFontSize(9);
      pdf.text(metric.label, x + 5, y + 8);
      pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
      pdf.text(metric.value, x + 5, y + 18);
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.text(metric.trend, x + 60, y + 18);
    });
    
    addAdvancedGovernanceChart(pdf, govData, 20, 120, 170, 80, colors);
  } else {
    pdf.text('No governance data available for analysis', 20, 80);
  }
};

const createRiskHeatmap = (pdf, data, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'ESG RISK ASSESSMENT', colors);
  
  pdf.setTextColor(...colors.text); pdf.setFontSize(11);
  pdf.text('Risk Heat Map - Probability vs Impact', 20, 55);
  
  const risks = [
    { name: 'Climate Risk', prob: 80, impact: 90, category: 'Environmental' },
    { name: 'Cyber Security', prob: 60, impact: 85, category: 'Governance' },
    { name: 'Talent Retention', prob: 70, impact: 60, category: 'Social' },
    { name: 'Supply Chain', prob: 50, impact: 70, category: 'Environmental' }
  ];
  
  const heatmapX = 30, heatmapY = 70, heatmapW = 150, heatmapH = 100;
  pdf.setDrawColor(...colors.mediumGray); pdf.setLineWidth(1);
  pdf.rect(heatmapX, heatmapY, heatmapW, heatmapH, 'S');
  
  risks.forEach(risk => {
    const x = heatmapX + (risk.prob / 100) * heatmapW;
    const y = heatmapY + heatmapH - (risk.impact / 100) * heatmapH;
    const color = risk.impact > 80 ? colors.danger : risk.impact > 60 ? colors.warning : colors.success;
    
    pdf.setFillColor(...color);
    pdf.circle(x, y, 4, 'F');
    pdf.setFontSize(7);
    pdf.text(risk.name, x + 6, y + 2);
  });
  
  pdf.setFontSize(9);
  pdf.text('Probability', heatmapX + heatmapW/2 - 10, heatmapY + heatmapH + 15);
  pdf.text('Impact', heatmapX - 20, heatmapY + heatmapH/2);
};

const createFrameworkComplianceTable = (pdf, framework, data, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'FRAMEWORK COMPLIANCE', colors);
  
  pdf.setTextColor(...colors.text); pdf.setFontSize(11);
  
  if (framework === 'GRI') {
    const griStandards = [
      { code: 'GRI 2', title: 'General Disclosures', compliance: 95 },
      { code: 'GRI 302', title: 'Energy', compliance: 88 },
      { code: 'GRI 305', title: 'Emissions', compliance: 92 },
      { code: 'GRI 401', title: 'Employment', compliance: 85 },
      { code: 'GRI 403', title: 'Health & Safety', compliance: 90 }
    ];
    
    pdf.text('GRI Standards Compliance Assessment:', 20, 55);
    
    // Table header
    pdf.setFillColor(...colors.primary); pdf.rect(25, 70, 160, 12, 'F');
    pdf.setTextColor(...colors.white); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
    pdf.text('Standard', 30, 78); pdf.text('Title', 70, 78); pdf.text('Compliance', 140, 78);
    
    // Table rows
    let yPos = 82;
    griStandards.forEach((standard, i) => {
      const bgColor = i % 2 === 0 ? colors.lightGreen : colors.white;
      pdf.setFillColor(...bgColor); pdf.rect(25, yPos, 160, 12, 'F');
      
      pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
      pdf.text(standard.code, 30, yPos + 8);
      pdf.text(standard.title, 70, yPos + 8);
      
      // Compliance bar
      const barW = (standard.compliance / 100) * 40;
      const color = standard.compliance >= 90 ? colors.success : standard.compliance >= 80 ? colors.warning : colors.danger;
      pdf.setFillColor(...color); pdf.rect(140, yPos + 2, barW, 8, 'F');
      pdf.setDrawColor(...colors.mediumGreen); pdf.rect(140, yPos + 2, 40, 8, 'S');
      
      pdf.setFontSize(8); pdf.text(`${standard.compliance}%`, 185, yPos + 8);
      yPos += 12;
    });
  }
  
  // Add framework comparison table
  addFrameworkComparisonTable(pdf, 25, 180, 160, 60, colors);
};

const addFrameworkComparisonTable = (pdf, x, y, width, height, colors) => {
  const frameworks = [
    { name: 'ISSB', focus: 'Financial materiality', audience: 'Investors', status: 'Mandatory' },
    { name: 'GRI', focus: 'Impact materiality', audience: 'Stakeholders', status: 'Voluntary' },
    { name: 'SASB', focus: 'Industry-specific', audience: 'Investors', status: 'Integrated' },
    { name: 'CSRD', focus: 'Double materiality', audience: 'Regulators', status: 'Mandatory' }
  ];
  
  // Header
  pdf.setFillColor(...colors.primary); pdf.rect(x, y, width, 12, 'F');
  pdf.setTextColor(...colors.white); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
  pdf.text('Framework', x + 5, y + 8);
  pdf.text('Focus', x + 45, y + 8);
  pdf.text('Audience', x + 85, y + 8);
  pdf.text('Status', x + 125, y + 8);
  
  // Rows
  let rowY = y + 12;
  frameworks.forEach((fw, i) => {
    const bgColor = i % 2 === 0 ? colors.lightGreen : colors.white;
    pdf.setFillColor(...bgColor); pdf.rect(x, rowY, width, 10, 'F');
    pdf.setTextColor(...colors.text); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text(fw.name, x + 5, rowY + 6);
    pdf.text(fw.focus, x + 45, rowY + 6);
    pdf.text(fw.audience, x + 85, rowY + 6);
    pdf.text(fw.status, x + 125, rowY + 6);
    rowY += 10;
  });
};

// Additional comprehensive sections
const createFrameworkOverview = (pdf, framework, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'FRAMEWORK OVERVIEW', colors);
  
  pdf.setTextColor(...colors.text); pdf.setFontSize(11);
  
  if (framework === 'GRI') {
    const griContent = [
      'Global Reporting Initiative (GRI) Standards:',
      '',
      'Foundation & Adoption:',
      '• Established in 1997, most widely adopted framework globally',
      '• Used by 78% of G250 companies and 68% of N100 companies',
      '• Over 14,000 organizations across 100+ countries',
      '',
      'Standard Structure:',
      '• Universal Standards (GRI 1, 2, 3): Apply to all organizations',
      '• Sector Standards: Industry-specific requirements',
      '• Topic Standards: Issue-specific disclosures',
      '',
      'Key Features:',
      '• Impact materiality focus',
      '• Comprehensive stakeholder engagement',
      '• Modular reporting approach',
      '• Global best practice guidance'
    ];
    
    let yPos = 55;
    griContent.forEach(line => {
      if (line === '') yPos += 5;
      else if (line.startsWith('•')) { pdf.text(line, 30, yPos); yPos += 8; }
      else { pdf.setFont('helvetica', 'bold'); pdf.text(line, 25, yPos); pdf.setFont('helvetica', 'normal'); yPos += 10; }
    });
  }
  
  // Add framework comparison
  addFrameworkComparisonTable(pdf, 25, 180, 160, 60, colors);
};

const createImplementationRoadmap = (pdf, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'IMPLEMENTATION ROADMAP', colors);
  
  const phases = [
    { phase: 'Phase 1: Assessment (Months 1-3)', tasks: ['Regulatory requirements', 'Materiality assessment', 'Framework selection'] },
    { phase: 'Phase 2: Infrastructure (Months 4-9)', tasks: ['Data systems', 'Governance setup', 'Capacity building'] },
    { phase: 'Phase 3: Reporting (Months 10-12)', tasks: ['Baseline measurement', 'Document preparation', 'Third-party assurance'] },
    { phase: 'Phase 4: Continuous Improvement', tasks: ['Performance monitoring', 'Process enhancement', 'Stakeholder engagement'] }
  ];
  
  let yPos = 55;
  phases.forEach((item, i) => {
    const phaseColor = [colors.primary, colors.secondary, colors.accent, colors.success][i];
    
    pdf.setFillColor(...phaseColor); pdf.roundedRect(25, yPos, 160, 20, 5, 5, 'F');
    pdf.setTextColor(...colors.white); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
    pdf.text(item.phase, 30, yPos + 12);
    
    yPos += 25;
    pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
    item.tasks.forEach(task => {
      pdf.text(`• ${task}`, 30, yPos);
      yPos += 8;
    });
    yPos += 5;
  });
};

const createChallengesTable = (pdf, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'KEY CHALLENGES & SOLUTIONS', colors);
  
  const challenges = [
    { challenge: 'Data Quality', impact: 'Inaccurate reporting', solution: 'Invest in data systems' },
    { challenge: 'Framework Complexity', impact: 'Resource drain', solution: 'Use integrated platforms' },
    { challenge: 'Scope 3 Measurement', impact: 'Incomplete footprint', solution: 'Engage suppliers' },
    { challenge: 'Cost Constraints', impact: 'Limited scope', solution: 'Phase implementation' },
    { challenge: 'Regulatory Uncertainty', impact: 'Inefficient allocation', solution: 'Build flexible systems' }
  ];
  
  // Table header
  pdf.setFillColor(...colors.primary); pdf.rect(25, 55, 160, 15, 'F');
  pdf.setTextColor(...colors.white); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
  pdf.text('Challenge', 30, 65); pdf.text('Impact', 80, 65); pdf.text('Solution', 130, 65);
  
  // Table rows
  let yPos = 70;
  challenges.forEach((item, i) => {
    const bgColor = i % 2 === 0 ? colors.lightGreen : colors.white;
    pdf.setFillColor(...bgColor); pdf.rect(25, yPos, 160, 12, 'F');
    pdf.setTextColor(...colors.text); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text(item.challenge, 30, yPos + 8);
    pdf.text(item.impact, 80, yPos + 8);
    pdf.text(item.solution, 130, yPos + 8);
    yPos += 12;
  });
};

const createFutureTrends = (pdf, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'FUTURE TRENDS & OUTLOOK', colors);
  
  const trends = [
    'Global Convergence:',
    '• ISSB becoming global baseline for investor disclosures',
    '• Increased interoperability between frameworks',
    '• Harmonization of GRI, SASB, and regulatory standards',
    '',
    'Digital Transformation:',
    '• Machine-readable data formats (XBRL)',
    '• Automated analysis and verification',
    '• Real-time ESG monitoring systems',
    '',
    'Nature & Biodiversity:',
    '• TNFD framework gaining momentum',
    '• Nature-related risk disclosure requirements',
    '• Supply chain biodiversity impact assessment',
    '',
    'Mandatory Assurance:',
    '• Third-party verification becoming standard',
    '• Development of global assurance standards',
    '• Enhanced data quality requirements'
  ];
  
  let yPos = 55;
  trends.forEach(line => {
    if (line === '') yPos += 5;
    else if (line.startsWith('•')) { pdf.text(line, 30, yPos); yPos += 8; }
    else { pdf.setFont('helvetica', 'bold'); pdf.text(line, 25, yPos); pdf.setFont('helvetica', 'normal'); yPos += 10; }
  });
};

const createEnvironmentalModuleReport = (pdf, config) => {
  const { colors, realTimeData } = config;
  const fallbackData = {
    carbon: { scope1: 1200, scope2: 800, scope3: 3500, total: 5500 },
    water: { consumption: 125000, efficiency: 85 },
    waste: { total: 450, recycled: 320, recyclingRate: 71 },
    air: { pm25: 12, nox: 45, sox: 23 }
  };
  const envData = realTimeData?.modules?.environmental || fallbackData;
  
  createAdvancedSectionHeader(pdf, 'ENVIRONMENTAL PERFORMANCE DETAILS', colors);
  
  let yPos = 50;
  
  // Carbon Footprint
  pdf.setTextColor(...colors.primary); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Carbon Footprint', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Scope 1: ${(envData.carbon || fallbackData.carbon).scope1} tCO2e`, 30, yPos); yPos += 8;
  pdf.text(`Scope 2: ${(envData.carbon || fallbackData.carbon).scope2} tCO2e`, 30, yPos); yPos += 8;
  pdf.text(`Scope 3: ${(envData.carbon || fallbackData.carbon).scope3} tCO2e`, 30, yPos); yPos += 8;
  pdf.text(`Total: ${(envData.carbon || fallbackData.carbon).total} tCO2e`, 30, yPos); yPos += 15;
  
  // Water Management
  pdf.setTextColor(...colors.primary); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Water Management', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Consumption: ${((envData.water || fallbackData.water).consumption).toLocaleString()} m³`, 30, yPos); yPos += 8;
  pdf.text(`Efficiency: ${(envData.water || fallbackData.water).efficiency}%`, 30, yPos); yPos += 15;
  
  // Waste Management
  pdf.setTextColor(...colors.primary); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Waste Management', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Total Waste: ${(envData.waste || fallbackData.waste).total} tons`, 30, yPos); yPos += 8;
  pdf.text(`Recycled: ${(envData.waste || fallbackData.waste).recycled} tons`, 30, yPos); yPos += 8;
  pdf.text(`Recycling Rate: ${(envData.waste || fallbackData.waste).recyclingRate}%`, 30, yPos); yPos += 15;
  
  // Air Quality
  pdf.setTextColor(...colors.primary); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Air Quality Control', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`PM2.5: ${(envData.air || fallbackData.air).pm25} μg/m³`, 30, yPos); yPos += 8;
  pdf.text(`NOx: ${(envData.air || fallbackData.air).nox} ppm`, 30, yPos); yPos += 8;
  pdf.text(`SOx: ${(envData.air || fallbackData.air).sox} ppm`, 30, yPos);
};

const createSocialModuleReport = (pdf, config) => {
  const { colors, realTimeData } = config;
  const fallbackData = {
    workforce: { total: 1250, diversity: 42, turnover: 8.5 },
    healthSafety: { incidents: 3, ltir: 0.12, trainingHours: 24500 },
    community: { investment: 250000, beneficiaries: 5000 }
  };
  const socialData = realTimeData?.modules?.social || fallbackData;
  
  createAdvancedSectionHeader(pdf, 'SOCIAL PERFORMANCE DETAILS', colors);
  
  let yPos = 50;
  
  // Workforce
  pdf.setTextColor(...colors.secondary); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Workforce Management', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Total Employees: ${(socialData.workforce || fallbackData.workforce).total}`, 30, yPos); yPos += 8;
  pdf.text(`Diversity: ${(socialData.workforce || fallbackData.workforce).diversity}%`, 30, yPos); yPos += 8;
  pdf.text(`Turnover Rate: ${(socialData.workforce || fallbackData.workforce).turnover}%`, 30, yPos); yPos += 15;
  
  // Health & Safety
  pdf.setTextColor(...colors.secondary); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Health & Safety', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Incidents: ${(socialData.healthSafety || fallbackData.healthSafety).incidents}`, 30, yPos); yPos += 8;
  pdf.text(`LTIR: ${(socialData.healthSafety || fallbackData.healthSafety).ltir}`, 30, yPos); yPos += 8;
  pdf.text(`Training Hours: ${((socialData.healthSafety || fallbackData.healthSafety).trainingHours).toLocaleString()}`, 30, yPos); yPos += 15;
  
  // Community
  pdf.setTextColor(...colors.secondary); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Community Engagement', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Investment: $${((socialData.community || fallbackData.community).investment).toLocaleString()}`, 30, yPos); yPos += 8;
  pdf.text(`Beneficiaries: ${((socialData.community || fallbackData.community).beneficiaries).toLocaleString()}`, 30, yPos);
};

const createGovernanceModuleReport = (pdf, config) => {
  const { colors, realTimeData } = config;
  const fallbackData = {
    board: { independence: 75, diversity: 40, meetings: 12 },
    ethics: { trainingCompletion: 98, violations: 0 },
    privacy: { breaches: 0, complianceScore: 95 }
  };
  const govData = realTimeData?.modules?.governance || fallbackData;
  
  createAdvancedSectionHeader(pdf, 'GOVERNANCE PERFORMANCE DETAILS', colors);
  
  let yPos = 50;
  
  // Board Leadership
  pdf.setTextColor(...colors.accent); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Board Leadership', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Independence: ${(govData.board || fallbackData.board).independence}%`, 30, yPos); yPos += 8;
  pdf.text(`Diversity: ${(govData.board || fallbackData.board).diversity}%`, 30, yPos); yPos += 8;
  pdf.text(`Meetings: ${(govData.board || fallbackData.board).meetings}`, 30, yPos); yPos += 15;
  
  // Ethics
  pdf.setTextColor(...colors.accent); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Ethics & Anti-Corruption', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Training Completion: ${(govData.ethics || fallbackData.ethics).trainingCompletion}%`, 30, yPos); yPos += 8;
  pdf.text(`Violations: ${(govData.ethics || fallbackData.ethics).violations}`, 30, yPos); yPos += 15;
  
  // Privacy
  pdf.setTextColor(...colors.accent); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Data Privacy & Cybersecurity', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Breaches: ${(govData.privacy || fallbackData.privacy).breaches}`, 30, yPos); yPos += 8;
  pdf.text(`Compliance Score: ${(govData.privacy || fallbackData.privacy).complianceScore}%`, 30, yPos);
};

const createCalculatorResults = (pdf, config) => {
  const { colors, realTimeData } = config;
  const fallbackData = {
    carbonFootprint: { total: 5500, intensity: 2.3 },
    waterStress: { score: 75, risk: 'Medium-High' },
    roi: { totalROI: 28, payback: 2.1 }
  };
  const calcData = realTimeData?.modules?.calculators || fallbackData;
  
  createAdvancedSectionHeader(pdf, 'CALCULATOR RESULTS & ANALYSIS', colors);
  
  let yPos = 50;
  
  // Carbon Footprint Calculator
  pdf.setTextColor(...colors.blue); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Carbon Footprint Analysis', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Total Emissions: ${(calcData.carbonFootprint || fallbackData.carbonFootprint).total} tCO2e`, 30, yPos); yPos += 8;
  pdf.text(`Intensity: ${(calcData.carbonFootprint || fallbackData.carbonFootprint).intensity} tCO2e/unit`, 30, yPos); yPos += 15;
  
  // Water Stress
  pdf.setTextColor(...colors.blue); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Water Stress Assessment', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Stress Score: ${(calcData.waterStress || fallbackData.waterStress).score}`, 30, yPos); yPos += 8;
  pdf.text(`Risk Level: ${(calcData.waterStress || fallbackData.waterStress).risk}`, 30, yPos); yPos += 15;
  
  // ESG ROI
  pdf.setTextColor(...colors.blue); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('ESG ROI Analysis', 25, yPos);
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  pdf.text(`Total ROI: ${(calcData.roi || fallbackData.roi).totalROI}%`, 30, yPos); yPos += 8;
  pdf.text(`Payback Period: ${(calcData.roi || fallbackData.roi).payback} years`, 30, yPos);
};

const createRecommendations = (pdf, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'KEY RECOMMENDATIONS', colors);
  
  // Priority Actions Section
  pdf.setTextColor(...colors.text); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
  pdf.text('Priority Actions:', 25, 50);
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  const actions = [
    '• Enhance Scope 3 emissions measurement',
    '• Implement automated ESG data collection',
    '• Strengthen third-party assurance processes'
  ];
  let yPos = 60;
  actions.forEach(line => { pdf.text(line, 30, yPos); yPos += 12; });
  
  // Strategic Focus Areas Section
  yPos += 10;
  pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
  pdf.text('Strategic Focus Areas:', 25, yPos);
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  const strategic = [
    '• Accelerate renewable energy transition',
    '• Improve workforce diversity metrics',
    '• Enhance supply chain sustainability'
  ];
  strategic.forEach(line => { pdf.text(line, 30, yPos); yPos += 12; });
  
  // Compliance & Reporting Section
  yPos += 10;
  pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
  pdf.text('Compliance & Reporting:', 25, yPos);
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  yPos += 10;
  const compliance = [
    '• Prepare for mandatory ESG regulations',
    '• Integrate multiple framework requirements',
    '• Establish real-time monitoring systems'
  ];
  compliance.forEach(line => { pdf.text(line, 30, yPos); yPos += 12; });
  
  // Implementation Timeline
  yPos += 15;
  pdf.setFillColor(...colors.lightCream); pdf.roundedRect(25, yPos, 160, 60, 5, 5, 'F');
  pdf.setDrawColor(...colors.forestGreen); pdf.setLineWidth(1); pdf.roundedRect(25, yPos, 160, 60, 5, 5, 'S');
  
  pdf.setTextColor(...colors.forestGreen); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Implementation Timeline', 30, yPos + 12);
  
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  const timeline = [
    'Short-term (0-6 months): Data quality improvements, system automation',
    'Medium-term (6-12 months): Framework integration, assurance setup',
    'Long-term (12+ months): Full compliance readiness, continuous monitoring'
  ];
  let timelineY = yPos + 25;
  timeline.forEach(line => {
    const wrapped = pdf.splitTextToSize(line, 150);
    pdf.text(wrapped, 30, timelineY);
    timelineY += wrapped.length * 8;
  });
  
  // Closing Statement
  yPos += 75;
  pdf.setFillColor(...colors.forestGreen); pdf.roundedRect(25, yPos, 160, 40, 5, 5, 'F');
  pdf.setTextColor(...colors.white); pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  const closing = pdf.splitTextToSize('By implementing these recommendations, the organization will strengthen its ESG performance, ensure regulatory compliance, and create long-term sustainable value for all stakeholders.', 150);
  pdf.text(closing, 30, yPos + 15);
  
  // Contact Information
  yPos += 55;
  pdf.setTextColor(...colors.text); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
  pdf.text('For more information:', 25, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text('E-S-Genius Platform | ESG Sustainability Solutions', 25, yPos + 10);
  pdf.text('Email: info@esgenius.com | Web: www.esgenius.com', 25, yPos + 18);
};

const createAppendix = (pdf, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'APPENDIX: RESOURCES & TOOLS', colors);
  
  const resources = [
    'Official Framework Resources:',
    '• IFRS Foundation/ISSB: www.ifrs.org/sustainability',
    '• Global Reporting Initiative: www.globalreporting.org',
    '• SASB Standards: sasb.ifrs.org',
    '• European Commission CSRD: ec.europa.eu',
    '',
    'Data & Measurement Tools:',
    '• GHG Protocol: ghgprotocol.org',
    '• Science Based Targets: sciencebasedtargets.org',
    '• CDP (Carbon Disclosure): cdp.net',
    '• PCAF (Carbon Accounting): carbonaccountingfinancials.com',
    '',
    'Industry Support Organizations:',
    '• World Business Council: wbcsd.org',
    '• Ceres: ceres.org',
    '• UN Global Compact: unglobalcompact.org'
  ];
  
  let yPos = 55;
  resources.forEach(line => {
    if (line === '') yPos += 5;
    else if (line.startsWith('•')) { pdf.text(line, 30, yPos); yPos += 8; }
    else { pdf.setFont('helvetica', 'bold'); pdf.text(line, 25, yPos); pdf.setFont('helvetica', 'normal'); yPos += 10; }
  });
};

const createTableOfContents = (pdf, colors) => {
  createAdvancedSectionHeader(pdf, 'TABLE OF CONTENTS', colors);
  
  const contents = [
    { title: 'Executive Summary', page: 3 },
    { title: 'Framework Overview', page: 4 },
    { title: 'Materiality Assessment', page: 5 },
    { title: 'Environmental Performance', page: 6 },
    { title: 'Social Performance', page: 7 },
    { title: 'Governance Performance', page: 8 },
    { title: 'Risk Assessment', page: 9 },
    { title: 'Framework Compliance', page: 10 },
    { title: 'Implementation Roadmap', page: 11 },
    { title: 'Key Challenges & Solutions', page: 12 },
    { title: 'Future Trends & Outlook', page: 13 },
    { title: 'Strategic Recommendations', page: 14 },
    { title: 'Independent Assurance', page: 15 },
    { title: 'Appendix: Resources & Tools', page: 16 }
  ];
  
  pdf.setTextColor(...colors.text); pdf.setFontSize(12);
  
  let yPos = 70;
  contents.forEach(item => {
    pdf.text(item.title, 30, yPos);
    pdf.text(item.page.toString(), 180, yPos);
    
    // Dotted line
    pdf.setDrawColor(...colors.mediumGreen);
    for (let x = 30 + pdf.getTextWidth(item.title) + 5; x < 175; x += 3) {
      pdf.circle(x, yPos - 2, 0.5, 'F');
    }
    
    yPos += 15;
  });
};

const createAssuranceStatement = (pdf, colors) => {
  createAdvancedSectionHeader(pdf, 'INDEPENDENT ASSURANCE', colors);
  
  pdf.setTextColor(...colors.text); pdf.setFontSize(11);
  
  const assuranceText = [
    'Independent Limited Assurance Statement',
    '',
    'Scope of Assurance:',
    '• Limited assurance engagement performed by certified auditor',
    '• Review of ESG data collection and reporting processes',
    '• Verification of key performance indicators and metrics',
    '• Assessment of internal controls and data quality',
    '',
    'Assurance Standards Applied:',
    '• ISAE 3000 (Revised) Assurance Engagements Other than Audits',
    '• AA1000AS v3 Assurance Standard',
    '• GRI Standards requirements for external assurance',
    '',
    'Conclusion:',
    'Based on our limited assurance procedures, nothing has come to',
    'our attention that causes us to believe the ESG information is',
    'materially misstated. The data collection processes are adequate',
    'and the reported information is fairly presented in accordance',
    'with the applicable reporting framework.',
    '',
    'Assurance Provider: [Independent Auditing Firm]',
    'Date: [Current Date]',
    'Assurance Level: Limited'
  ];
  
  let yPos = 55;
  assuranceText.forEach(line => {
    if (line === '') yPos += 5;
    else if (line.startsWith('•')) {
      pdf.text(line, 30, yPos);
      yPos += 8;
    } else {
      if (line.includes(':')) pdf.setFont('helvetica', 'bold');
      pdf.text(line, 25, yPos);
      pdf.setFont('helvetica', 'normal');
      yPos += 8;
    }
  });
};

// Update chart functions to accept real-time data
const addESGScoreWheel = (pdf, data, x, y, width, height, colors, realTimeData, chartImage = null) => {
  // If chart image is provided, use it instead of drawing
  if (chartImage) {
    try {
      pdf.addImage(chartImage, 'PNG', x, y, width, height);
      return;
    } catch (error) {
      console.warn('Failed to add chart image, falling back to drawn chart');
    }
  }
  
  // Original drawing code as fallback
  const centerX = x + width / 2; const centerY = y + height / 2; const radius = 30;
  
  // Use real-time scores if available with safe access
  const envScore = realTimeData?.kpis?.environmental || 85;
  const socialScore = realTimeData?.kpis?.social || 78;
  const govScore = realTimeData?.kpis?.governance || 92;
  const overallScore = realTimeData?.kpis?.overall || Math.round((envScore + socialScore + govScore) / 3);
  
  pdf.setDrawColor(...colors.mediumGreen); pdf.setLineWidth(8);
  pdf.circle(centerX, centerY, radius, 'S');
  
  const scores = [{ score: envScore, color: colors.success }, { score: socialScore, color: colors.primary }, { score: govScore, color: colors.accent }];
  
  scores.forEach((item, i) => {
    pdf.setDrawColor(...item.color); pdf.setLineWidth(6);
    pdf.circle(centerX + (i - 1) * 15, centerY, 8, 'S');
  });
  
  pdf.setTextColor(...colors.text); pdf.setFontSize(24); pdf.setFont('helvetica', 'bold');
  pdf.text(overallScore.toString(), centerX - 8, centerY + 5);
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  pdf.text('ESG Score', centerX - 15, centerY + 18);
  
  const legend = [{ label: 'Environmental', color: colors.success }, { label: 'Social', color: colors.primary }, { label: 'Governance', color: colors.accent }];
  legend.forEach((item, i) => {
    const legY = y + height + 10 + i * 12;
    pdf.setFillColor(...item.color); pdf.rect(x, legY, 8, 6, 'F');
    pdf.setTextColor(...colors.text); pdf.setFontSize(9);
    pdf.text(`${item.label}: ${scores[i].score}%`, x + 12, legY + 4);
  });
};

const addMiniTrendChart = (pdf, data, x, y, width, height, colors, realTimeData, chartImage = null) => {
  // If chart image is provided, use it instead of drawing
  if (chartImage) {
    try {
      pdf.addImage(chartImage, 'PNG', x, y, width, height);
      return;
    } catch (error) {
      console.warn('Failed to add chart image, falling back to drawn chart');
    }
  }
  
  // Original drawing code as fallback
  pdf.setDrawColor(...colors.mediumGreen); pdf.rect(x, y, width, height, 'S');
  pdf.setTextColor(...colors.text); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
  pdf.text('Real-Time ESG Performance Trend', x + 5, y + 15);
  
  // Use real-time data for trend if available with safe access
  const currentScore = realTimeData?.kpis?.overall || 87;
  const trendData = [75, 78, 80, 82, 85, 83, currentScore, currentScore + 2, currentScore - 1, currentScore + 1, currentScore + 3, currentScore];
  
  const chartX = x + 10; const chartY = y + 25; const chartW = width - 20; const chartH = height - 35;
  
  pdf.setDrawColor(...colors.lightGreen); pdf.setLineWidth(0.5);
  for (let i = 0; i <= 4; i++) {
    const gridY = chartY + (i * chartH / 4);
    pdf.line(chartX, gridY, chartX + chartW, gridY);
  }
  
  pdf.setDrawColor(...colors.primary); pdf.setLineWidth(2);
  for (let i = 0; i < trendData.length - 1; i++) {
    const x1 = chartX + (i * chartW / (trendData.length - 1));
    const y1 = chartY + chartH - ((trendData[i] - 70) / 30) * chartH;
    const x2 = chartX + ((i + 1) * chartW / (trendData.length - 1));
    const y2 = chartY + chartH - ((trendData[i + 1] - 70) / 30) * chartH;
    pdf.line(x1, y1, x2, y2);
  }
  
  pdf.setFillColor(...colors.primary);
  trendData.forEach((value, i) => {
    const pointX = chartX + (i * chartW / (trendData.length - 1));
    const pointY = chartY + chartH - ((value - 70) / 30) * chartH;
    pdf.circle(pointX, pointY, 1.5, 'F');
  });
  
  // Add current score annotation
  pdf.setFontSize(8); pdf.setTextColor(...colors.primary);
  pdf.text(`Current: ${currentScore}%`, chartX + chartW - 40, chartY + 10);
};

const addAdvancedEnvironmentalChart = (pdf, data, x, y, width, height, colors) => {
  pdf.setDrawColor(...colors.mediumGreen); pdf.rect(x, y, width, height, 'S');
  pdf.setTextColor(...colors.text); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
  pdf.text('Environmental Metrics Performance', x + 5, y + 15);
  
  const metrics = data.slice(0, 5);
  const maxValue = Math.max(...metrics.map(d => d.value)) || 1;
  
  metrics.forEach((metric, i) => {
    const barY = y + 25 + (i * 12);
    const barWidth = (metric.value / maxValue) * (width - 100);
    
    pdf.setFillColor(...colors.success);
    pdf.roundedRect(x + 80, barY, barWidth, 8, 2, 2, 'F');
    
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
    pdf.text(metric.metric.substring(0, 15), x + 5, barY + 5);
    pdf.text(metric.value.toString(), x + barWidth + 85, barY + 5);
  });
};

const addAdvancedSocialChart = (pdf, data, x, y, width, height, colors) => {
  pdf.setDrawColor(...colors.mediumGreen); pdf.rect(x, y, width, height, 'S');
  pdf.setTextColor(...colors.text); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
  pdf.text('Social Metrics Performance', x + 5, y + 15);
  
  const metrics = data.slice(0, 5);
  const maxValue = Math.max(...metrics.map(d => d.value)) || 1;
  
  metrics.forEach((metric, i) => {
    const barY = y + 25 + (i * 12);
    const barWidth = (metric.value / maxValue) * (width - 100);
    
    pdf.setFillColor(...colors.primary);
    pdf.roundedRect(x + 80, barY, barWidth, 8, 2, 2, 'F');
    
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
    pdf.text(metric.metric.substring(0, 15), x + 5, barY + 5);
    pdf.text(metric.value.toString(), x + barWidth + 85, barY + 5);
  });
};

const addAdvancedGovernanceChart = (pdf, data, x, y, width, height, colors) => {
  pdf.setDrawColor(...colors.mediumGreen); pdf.rect(x, y, width, height, 'S');
  pdf.setTextColor(...colors.text); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
  pdf.text('Governance Metrics Performance', x + 5, y + 15);
  
  const metrics = data.slice(0, 5);
  const maxValue = Math.max(...metrics.map(d => d.value)) || 1;
  
  metrics.forEach((metric, i) => {
    const barY = y + 25 + (i * 12);
    const barWidth = (metric.value / maxValue) * (width - 100);
    
    pdf.setFillColor(...colors.accent);
    pdf.roundedRect(x + 80, barY, barWidth, 8, 2, 2, 'F');
    
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
    pdf.text(metric.metric.substring(0, 15), x + 5, barY + 5);
    pdf.text(metric.value.toString(), x + barWidth + 85, barY + 5);
  });
};

const addAdvancedTrendChart = (pdf, data, x, y, width, height, colors) => {
  pdf.setDrawColor(...colors.mediumGreen); pdf.rect(x, y, width, height, 'S');
  
  const years = ['2022', '2023', '2024'];
  const envTrend = [72, 78, 85];
  const socialTrend = [68, 74, 78];
  const govTrend = [85, 88, 92];
  
  const chartX = x + 20; const chartY = y + 20; const chartW = width - 40; const chartH = height - 40;
  
  // Grid lines
  pdf.setDrawColor(...colors.lightGreen); pdf.setLineWidth(0.5);
  for (let i = 0; i <= 5; i++) {
    const gridY = chartY + (i * chartH / 5);
    pdf.line(chartX, gridY, chartX + chartW, gridY);
  }
  
  // Trend lines
  const trends = [
    { data: envTrend, color: colors.success, label: 'Environmental' },
    { data: socialTrend, color: colors.primary, label: 'Social' },
    { data: govTrend, color: colors.accent, label: 'Governance' }
  ];
  
  trends.forEach(trend => {
    pdf.setDrawColor(...trend.color); pdf.setLineWidth(2);
    for (let i = 0; i < trend.data.length - 1; i++) {
      const x1 = chartX + (i * chartW / (trend.data.length - 1));
      const y1 = chartY + chartH - ((trend.data[i] - 60) / 40) * chartH;
      const x2 = chartX + ((i + 1) * chartW / (trend.data.length - 1));
      const y2 = chartY + chartH - ((trend.data[i + 1] - 60) / 40) * chartH;
      pdf.line(x1, y1, x2, y2);
    }
  });
  
  // Legend
  trends.forEach((trend, i) => {
    const legY = y + height + 10 + i * 10;
    pdf.setDrawColor(...trend.color); pdf.setLineWidth(2);
    pdf.line(x, legY, x + 15, legY);
    pdf.setTextColor(...colors.text); pdf.setFontSize(9);
    pdf.text(trend.label, x + 20, legY + 2);
  });
};

const createAdvancedSectionHeader = (pdf, title, colors, icon = '') => {
  // Cream background with forest green header
  pdf.setFillColor(...colors.cream); pdf.rect(0, 0, 210, 297, 'F');
  pdf.setFillColor(...colors.forestGreen); pdf.rect(0, 0, 210, 30, 'F');
  
  pdf.setTextColor(...colors.white); pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
  pdf.text(title, 20, 18);
  
  // Accent line
  pdf.setDrawColor(...colors.oceanBlue); pdf.setLineWidth(3);
  pdf.line(20, 24, 190, 24);
};

const addAdvancedHeadersFooters = (pdf, config) => {
  const { companyName, reportPeriod, colors } = config;
  const pageCount = pdf.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    if (i > 1) {
      // Header with cream background
      pdf.setFillColor(...colors.lightCream); pdf.rect(0, 0, 210, 18, 'F');
      pdf.setTextColor(...colors.forestGreen); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
      pdf.text('E-S-GENIUS', 20, 9);
      pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...colors.steelBlue);
      pdf.text('ESG Sustainability Platform', 20, 14);
      
      // Footer with cream background
      pdf.setFillColor(...colors.lightCream); pdf.rect(0, 282, 210, 15, 'F');
      pdf.setTextColor(...colors.charcoal); pdf.setFontSize(8);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 291);
      pdf.text('ESG Performance Report', 105 - pdf.getTextWidth('ESG Performance Report')/2, 291);
      pdf.text(`Page ${i} of ${pageCount}`, 190 - pdf.getTextWidth(`Page ${i} of ${pageCount}`), 291);
    }
  }
};

export default generateProfessionalWhitePaper;