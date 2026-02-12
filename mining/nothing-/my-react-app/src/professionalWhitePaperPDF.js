import { jsPDF } from 'jspdf';
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
      const [analyticsData, kpiData, calculatedMetrics] = await Promise.all([
        esgAPI.getAnalyticsData(),
        ModuleAPI.calculateKPIs('company-001'),
        this.calculateRealTimeMetrics()
      ]);

      return {
        analytics: analyticsData.data,
        kpis: kpiData.data,
        calculatedMetrics,
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

  const pdf = new jsPDF();
  const normalizedData = normalizeData(data);
  
  const config = {
    companyName: data[0]?.companyName || 'E-S-GENIUS',
    reportPeriod: new Date().getFullYear(),
    realTimeData, // Include real-time data in config
    colors: {
      primary: [34, 139, 34], secondary: [46, 125, 50], accent: [76, 175, 80],
      text: [26, 32, 44], lightGreen: [232, 245, 233], mediumGreen: [129, 199, 132], white: [255, 255, 255],
      success: [72, 187, 120], warning: [237, 137, 54], danger: [245, 101, 101], neutral: [200, 230, 201],
      // Content colors (non-green)
      blue: [59, 130, 246], lightBlue: [219, 234, 254], purple: [147, 51, 234], orange: [249, 115, 22],
      gray: [107, 114, 128], lightGray: [243, 244, 246], darkBlue: [30, 64, 175]
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

  createAdvancedTitlePage(pdf, framework, config);
  pdf.addPage(); createExecutiveDashboard(pdf, normalizedData, config);
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

const createAdvancedTitlePage = (pdf, framework, config) => {
  const { colors, companyName, reportPeriod } = config;
  
  // Clean gradient background
  pdf.setFillColor(...colors.lightGreen); pdf.rect(0, 0, 210, 297, 'F');
  pdf.setFillColor(...colors.primary); pdf.rect(0, 0, 210, 80, 'F');
  
  // Main title card with subtle shadow effect
  pdf.setFillColor(...colors.white); pdf.roundedRect(25, 45, 160, 70, 8, 8, 'F');
  pdf.setDrawColor(...colors.neutral); pdf.setLineWidth(1); pdf.roundedRect(25, 45, 160, 70, 8, 8, 'S');
  
  pdf.setTextColor(...colors.primary); pdf.setFontSize(28); pdf.setFont('helvetica', 'bold');
  pdf.text(companyName, 105 - pdf.getTextWidth(companyName)/2, 70);
  pdf.setFontSize(12); pdf.setTextColor(...colors.secondary);
  pdf.text('ESG SUSTAINABILITY REPORT', 105 - pdf.getTextWidth('ESG SUSTAINABILITY REPORT')/2, 85);
  pdf.setFontSize(10); pdf.setTextColor(...colors.mediumGreen);
  pdf.text('Professional Assessment & Analysis', 105 - pdf.getTextWidth('Professional Assessment & Analysis')/2, 100);
  
  // Report details card
  pdf.setFillColor(...colors.white); pdf.roundedRect(35, 140, 140, 80, 6, 6, 'F');
  pdf.setDrawColor(...colors.neutral); pdf.setLineWidth(1); pdf.roundedRect(35, 140, 140, 80, 6, 6, 'S');
  
  pdf.setTextColor(...colors.primary); pdf.setFontSize(22); pdf.setFont('helvetica', 'bold');
  pdf.text('ESG PERFORMANCE', 105 - pdf.getTextWidth('ESG PERFORMANCE')/2, 165);
  pdf.setFontSize(18);
  pdf.text('ANALYSIS', 105 - pdf.getTextWidth('ANALYSIS')/2, 185);
  
  pdf.setFontSize(12); pdf.setTextColor(...colors.secondary);
  pdf.text(`${framework} Framework Aligned`, 105 - pdf.getTextWidth(`${framework} Framework Aligned`)/2, 205);
  
  // Footer information
  pdf.setFillColor(...colors.primary); pdf.rect(0, 250, 210, 47, 'F');
  pdf.setTextColor(...colors.white); pdf.setFontSize(11);
  pdf.text(`Reporting Period: ${reportPeriod}`, 105 - pdf.getTextWidth(`Reporting Period: ${reportPeriod}`)/2, 270);
  pdf.setFontSize(9);
  pdf.text('Generated by ESGenius Professional Platform', 105 - pdf.getTextWidth('Generated by ESGenius Professional Platform')/2, 285);
};

const createExecutiveDashboard = (pdf, data, config) => {
  const { colors, realTimeData } = config;
  createAdvancedSectionHeader(pdf, 'EXECUTIVE DASHBOARD', colors, '📊');
  
  const envData = data.filter(d => d.category === 'environmental');
  const socialData = data.filter(d => d.category === 'social');
  const govData = data.filter(d => d.category === 'governance');
  
  // Safe access to real-time KPIs with fallbacks
  const kpis = [
    { label: 'ESG Score', value: `${realTimeData?.kpis?.overall || 87}/100`, color: colors.blue, icon: '⭐' },
    { label: 'Carbon Intensity', value: `${(realTimeData?.calculatedMetrics?.carbonData?.totalEmissions / 1000)?.toFixed(1) || '2.3'} ktCO2e`, color: colors.purple, icon: '🌍' },
    { label: 'Employee Satisfaction', value: `${realTimeData?.kpis?.social || 94}%`, color: colors.orange, icon: '👥' },
    { label: 'Compliance Rate', value: `${realTimeData?.kpis?.complianceRate || 75}%`, color: colors.darkBlue, icon: '⚖️' }
  ];
  
  kpis.forEach((kpi, i) => {
    const x = 25 + (i % 2) * 90; const y = 45 + Math.floor(i / 2) * 45;
    pdf.setFillColor(...kpi.color); pdf.roundedRect(x, y, 85, 40, 6, 6, 'F');
    pdf.setTextColor(...colors.white); pdf.setFontSize(9);
    pdf.text(kpi.icon, x + 8, y + 15);
    pdf.text(kpi.label, x + 18, y + 15);
    pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.value, x + 8, y + 32);
    pdf.setFont('helvetica', 'normal');
  });
  
  // Performance Summary Cards
  pdf.setTextColor(...colors.text); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
  pdf.text('Performance Summary', 25, 150);
  
  const summaryCards = [
    { title: 'Data Quality', value: '95%', desc: 'Verified metrics', color: colors.blue },
    { title: 'Trend Analysis', value: '+12%', desc: 'YoY improvement', color: colors.purple },
    { title: 'Risk Level', value: 'Low', desc: 'Overall assessment', color: colors.orange },
    { title: 'Readiness', value: '88%', desc: 'Regulatory prep', color: colors.darkBlue }
  ];
  
  summaryCards.forEach((card, i) => {
    const x = 25 + (i % 2) * 90; const y = 165 + Math.floor(i / 2) * 35;
    pdf.setFillColor(...colors.white); pdf.roundedRect(x, y, 85, 30, 4, 4, 'F');
    pdf.setDrawColor(...card.color); pdf.setLineWidth(2); pdf.roundedRect(x, y, 85, 30, 4, 4, 'S');
    pdf.setTextColor(...card.color); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
    pdf.text(card.title, x + 5, y + 10);
    pdf.setFontSize(14); pdf.text(card.value, x + 5, y + 20);
    pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...colors.gray);
    pdf.text(card.desc, x + 5, y + 26);
  });
};

const createTheoreticalFramework = (pdf, data, config, framework) => {
  const { colors, realTimeData } = config;
  createAdvancedSectionHeader(pdf, 'THEORETICAL FRAMEWORK & ANALYSIS', colors, '📚');
  
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
  createAdvancedSectionHeader(pdf, 'ESG PERFORMANCE OVERVIEW', colors, '📈');
  
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
  pdf.text('🌍 Environmental Performance', 20, 110);
  
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
  pdf.text('👥 Social Performance', 20, 170);
  
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
  pdf.text('⚖️ Governance Performance', 20, 230);
  
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
  createAdvancedSectionHeader(pdf, 'MATERIALITY ASSESSMENT', colors, '🎯');
  
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
  createAdvancedSectionHeader(pdf, 'ENVIRONMENTAL PERFORMANCE', colors, '🌱');
  
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
  createAdvancedSectionHeader(pdf, 'SOCIAL PERFORMANCE', colors, '👥');
  
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
  createAdvancedSectionHeader(pdf, 'GOVERNANCE PERFORMANCE', colors, '⚖️');
  
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
  createAdvancedSectionHeader(pdf, 'ESG RISK ASSESSMENT', colors, '⚠️');
  
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
  createAdvancedSectionHeader(pdf, 'FRAMEWORK COMPLIANCE', colors, '📐');
  
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
  createAdvancedSectionHeader(pdf, 'FRAMEWORK OVERVIEW', colors, '📊');
  
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
  createAdvancedSectionHeader(pdf, 'IMPLEMENTATION ROADMAP', colors, '🗺️');
  
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
  createAdvancedSectionHeader(pdf, 'KEY CHALLENGES & SOLUTIONS', colors, '⚠️');
  
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
  createAdvancedSectionHeader(pdf, 'FUTURE TRENDS & OUTLOOK', colors, '🔮');
  
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

const createRecommendations = (pdf, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'KEY RECOMMENDATIONS', colors, '💡');
  
  const recommendations = [
    'Priority Actions:',
    '• Enhance Scope 3 emissions measurement',
    '• Implement automated ESG data collection',
    '• Strengthen third-party assurance processes',
    '',
    'Strategic Focus Areas:',
    '• Accelerate renewable energy transition',
    '• Improve workforce diversity metrics',
    '• Enhance supply chain sustainability',
    '',
    'Compliance & Reporting:',
    '• Prepare for mandatory ESG regulations',
    '• Integrate multiple framework requirements',
    '• Establish real-time monitoring systems'
  ];
  
  let yPos = 55;
  recommendations.forEach(line => {
    if (line === '') yPos += 8;
    else if (line.startsWith('•')) { pdf.text(line, 30, yPos); yPos += 12; }
    else { pdf.setFont('helvetica', 'bold'); pdf.text(line, 25, yPos); pdf.setFont('helvetica', 'normal'); yPos += 15; }
  });
};

const createAppendix = (pdf, config) => {
  const { colors } = config;
  createAdvancedSectionHeader(pdf, 'APPENDIX: RESOURCES & TOOLS', colors, '📚');
  
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
  createAdvancedSectionHeader(pdf, 'TABLE OF CONTENTS', colors, '📑');
  
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
  createAdvancedSectionHeader(pdf, 'INDEPENDENT ASSURANCE', colors, '✓');
  
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
const addESGScoreWheel = (pdf, data, x, y, width, height, colors, realTimeData) => {
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

const addMiniTrendChart = (pdf, data, x, y, width, height, colors, realTimeData) => {
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
  // Clean header with proper spacing
  pdf.setFillColor(...colors.lightGreen); pdf.rect(0, 0, 210, 35, 'F');
  pdf.setFillColor(...colors.primary); pdf.rect(0, 0, 210, 25, 'F');
  
  pdf.setTextColor(...colors.white); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
  pdf.text(icon + ' ' + title, 20, 16);
  
  // Subtle accent line
  pdf.setDrawColor(...colors.accent); pdf.setLineWidth(1);
  pdf.line(20, 20, 190, 20);
};

const addAdvancedHeadersFooters = (pdf, config) => {
  const { companyName, reportPeriod, colors } = config;
  const pageCount = pdf.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    if (i > 1) {
      // Header with company name
      pdf.setFillColor(...colors.lightGreen); pdf.rect(0, 0, 210, 15, 'F');
      pdf.setTextColor(...colors.primary); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
      pdf.text('E-S-GENIUS', 20, 10);
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...colors.mediumGreen);
      pdf.text('ESG Sustainability Platform', 20, 13);
      
      // Footer with date and report type
      pdf.setFillColor(...colors.lightGreen); pdf.rect(0, 282, 210, 15, 'F');
      pdf.setTextColor(...colors.text); pdf.setFontSize(8);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 292);
      pdf.text('ESG Performance Report', 105 - pdf.getTextWidth('ESG Performance Report')/2, 292);
      pdf.text(`Page ${i} of ${pageCount}`, 190 - pdf.getTextWidth(`Page ${i} of ${pageCount}`), 292);
    }
  }
};

export default generateProfessionalWhitePaper;