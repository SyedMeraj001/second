import { jsPDF } from 'jspdf';

const getStoredData = () => {
  try {
    const esgData = JSON.parse(localStorage.getItem('esgData') || '[]');
    const advancedData = JSON.parse(localStorage.getItem('advanced_esg_data') || '[]');
    return [...esgData, ...advancedData];
  } catch {
    return [];
  }
};

const get3YearTrends = (data) => {
  const years = [2022, 2023, 2024];
  const trends = { environmental: {}, social: {}, governance: {} };
  
  years.forEach(year => {
    const yearData = data.filter(d => new Date(d.timestamp).getFullYear() === year);
    ['environmental', 'social', 'governance'].forEach(cat => {
      const catData = yearData.filter(d => d.category === cat);
      if (catData.length > 0) {
        const avg = catData.reduce((sum, d) => sum + (d.value || 0), 0) / catData.length;
        if (!trends[cat][year]) trends[cat][year] = avg;
      }
    });
  });
  
  return trends;
};

export const generateFortuneESGReport = async (options = {}) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const data = getStoredData();
  const trends = get3YearTrends(data);
  
  const colors = {
    darkGreen: [27, 94, 63],
    teal: [45, 134, 89],
    blue: [74, 144, 184],
    gold: [240, 192, 64],
    white: [255, 255, 255],
    gray: [107, 114, 128],
    lightGray: [243, 244, 246]
  };
  
  const config = { companyName: 'E-S-GENIUS', year: 2024, colors, trends, data };
  
  createCoverPage(pdf, config);
  pdf.addPage(); createTableOfContents(pdf, config);
  pdf.addPage(); createCEOForeword(pdf, config);
  pdf.addPage(); createExecutiveSummary(pdf, config);
  pdf.addPage(); createCompanyProfile(pdf, config);
  pdf.addPage(); createESGStrategy(pdf, config);
  pdf.addPage(); createEnvironmentalChapter(pdf, config);
  pdf.addPage(); createSocialChapter(pdf, config);
  pdf.addPage(); createGovernanceChapter(pdf, config);
  pdf.addPage(); createPerformanceScorecard(pdf, config);
  pdf.addPage(); createAssuranceStatement(pdf, config);
  pdf.addPage(); create2030Commitments(pdf, config);
  pdf.addPage(); createGRIIndex(pdf, config);
  pdf.addPage(); createSASBMetrics(pdf, config);
  pdf.addPage(); createTCFDAlignment(pdf, config);
  
  addHeadersFooters(pdf, config);
  return pdf;
};

const createCoverPage = (pdf, config) => {
  const { colors, companyName, year } = config;
  pdf.setFillColor(...colors.darkGreen); pdf.rect(0, 0, 210, 297, 'F');
  pdf.setFillColor(...colors.teal); pdf.rect(0, 0, 210, 3, 'F');
  pdf.setFillColor(...colors.blue); pdf.rect(0, 294, 210, 3, 'F');
  
  pdf.setTextColor(...colors.white); pdf.setFontSize(48); pdf.setFont('helvetica', 'bold');
  pdf.text(companyName, 105, 80, { align: 'center' });
  
  pdf.setFontSize(24);
  pdf.text('ESG REPORT', 105, 110, { align: 'center' });
  pdf.text(year.toString(), 105, 130, { align: 'center' });
  
  pdf.setFontSize(12); pdf.setFont('helvetica', 'normal');
  pdf.text('Environmental, Social & Governance', 105, 160, { align: 'center' });
  
  const pillars = [
    { letter: 'E', name: 'ENVIRONMENTAL', x: 30 },
    { letter: 'S', name: 'SOCIAL', x: 80 },
    { letter: 'G', name: 'GOVERNANCE', x: 130 }
  ];
  
  pillars.forEach(p => {
    pdf.setFillColor(...colors.teal); pdf.rect(p.x, 180, 40, 40, 'F');
    pdf.setTextColor(...colors.white); pdf.setFontSize(32); pdf.setFont('helvetica', 'bold');
    pdf.text(p.letter, p.x + 20, 205, { align: 'center' });
    pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text(p.name, p.x + 20, 215, { align: 'center' });
  });
  
  pdf.setFontSize(10);
  pdf.text('GRI • SASB • TCFD • UN SDG', 105, 250, { align: 'center' });
  pdf.text('Limited Assurance (ISAE 3000)', 105, 265, { align: 'center' });
};

const createTableOfContents = (pdf, config) => {
  createSectionHeader(pdf, 'TABLE OF CONTENTS', config.colors);
  const contents = [
    ['CEO Foreword', '3'],
    ['Executive Summary', '4'],
    ['Company Profile', '5'],
    ['ESG Strategy', '6'],
    ['Environmental Performance', '7'],
    ['Social Performance', '8'],
    ['Governance Performance', '9'],
    ['Performance Scorecard', '10'],
    ['Assurance Statement', '11'],
    ['2030 Commitments', '12'],
    ['GRI Index', '13'],
    ['SASB Metrics', '14'],
    ['TCFD Alignment', '15']
  ];
  
  let y = 50;
  pdf.setFontSize(10);
  contents.forEach(([title, page]) => {
    pdf.setTextColor(...config.colors.gray);
    pdf.text(title, 25, y);
    pdf.text(page, 180, y);
    y += 10;
  });
};

const createCEOForeword = (pdf, config) => {
  createSectionHeader(pdf, 'CEO FOREWORD', config.colors);
  pdf.setFontSize(10); pdf.setTextColor(...config.colors.gray);
  const text = [
    'Dear Stakeholders,',
    '',
    'I am pleased to present our 2024 ESG Report, demonstrating our commitment to',
    'sustainable business practices and long-term value creation.',
    '',
    'This year, we achieved significant milestones: reduced carbon emissions by 15%,',
    'improved workforce diversity to 42%, and maintained 99% compliance across all',
    'governance frameworks.',
    '',
    'Our ESG strategy is integrated into core business operations, guided by GRI, SASB,',
    'and TCFD standards. We remain committed to transparency, accountability, and',
    'continuous improvement.',
    '',
    'Thank you for your continued support.',
    '',
    'Sincerely,',
    '[CEO Name]',
    'Chief Executive Officer'
  ];
  
  let y = 50;
  text.forEach(line => {
    if (line === '') y += 5;
    else { pdf.text(line, 25, y); y += 8; }
  });
};

const createExecutiveSummary = (pdf, config) => {
  createSectionHeader(pdf, 'EXECUTIVE SUMMARY', config.colors);
  pdf.setFontSize(10); pdf.setTextColor(...config.colors.gray);
  
  const kpis = [
    { label: 'ESG Score', value: '87/100', color: config.colors.blue },
    { label: 'Carbon Reduction', value: '-15%', color: config.colors.teal },
    { label: 'Diversity', value: '42%', color: config.colors.gold },
    { label: 'Compliance', value: '99%', color: config.colors.darkGreen }
  ];
  
  let y = 50;
  kpis.forEach((kpi, i) => {
    const x = 25 + (i % 2) * 90;
    const yPos = y + Math.floor(i / 2) * 30;
    pdf.setFillColor(...kpi.color); pdf.rect(x, yPos, 80, 25, 'F');
    pdf.setTextColor(...config.colors.white); pdf.setFontSize(9);
    pdf.text(kpi.label, x + 5, yPos + 10);
    pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.value, x + 5, yPos + 20);
    pdf.setFont('helvetica', 'normal');
  });
};

const createCompanyProfile = (pdf, config) => {
  createSectionHeader(pdf, 'COMPANY PROFILE', config.colors);
  pdf.setFontSize(10); pdf.setTextColor(...config.colors.gray);
  
  const profile = [
    ['Company:', config.companyName],
    ['Industry:', 'Technology / Sustainability'],
    ['Headquarters:', 'Global'],
    ['Employees:', '1,250'],
    ['Revenue:', '$150M'],
    ['Markets:', '25 countries'],
    ['Reporting Period:', 'January 1 - December 31, 2024']
  ];
  
  let y = 50;
  profile.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, 25, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, 80, y);
    y += 10;
  });
};

const createESGStrategy = (pdf, config) => {
  createSectionHeader(pdf, 'ESG STRATEGY', config.colors);
  pdf.setFontSize(10); pdf.setTextColor(...config.colors.gray);
  
  const strategy = [
    'Strategic Priorities:',
    '• Climate Action: Net-zero by 2050, SBTi-validated targets',
    '• Social Equity: 50% diversity by 2030, pay equity certified',
    '• Governance Excellence: Board independence >75%, ESG-linked compensation',
    '',
    'Materiality Assessment:',
    '• Climate change & emissions (High priority)',
    '• Employee wellbeing & diversity (High priority)',
    '• Data privacy & cybersecurity (High priority)',
    '• Supply chain sustainability (Medium priority)'
  ];
  
  let y = 50;
  strategy.forEach(line => {
    if (line === '') y += 5;
    else if (line.startsWith('•')) { pdf.text(line, 30, y); y += 8; }
    else { pdf.setFont('helvetica', 'bold'); pdf.text(line, 25, y); pdf.setFont('helvetica', 'normal'); y += 10; }
  });
};

const createEnvironmentalChapter = (pdf, config) => {
  createSectionHeader(pdf, 'ENVIRONMENTAL PERFORMANCE', config.colors);
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.darkGreen);
  pdf.text('GHG Emissions', 25, 50);
  
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  const emissions = [
    ['Scope 1 (Direct)', '1,200 tCO2e', '-8%'],
    ['Scope 2 (Indirect)', '800 tCO2e', '-12%'],
    ['Scope 3 (Value Chain)', '3,500 tCO2e', '-20%'],
    ['Total Emissions', '5,500 tCO2e', '-15%']
  ];
  
  let y = 60;
  emissions.forEach(([scope, value, change]) => {
    pdf.text(scope, 30, y);
    pdf.text(value, 100, y);
    pdf.setTextColor(...config.colors.teal);
    pdf.text(change, 150, y);
    pdf.setTextColor(...config.colors.gray);
    y += 8;
  });
  
  y += 10;
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.darkGreen);
  pdf.text('Energy & Water', 25, y);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  y += 10;
  pdf.text('• Renewable Energy: 65% (target: 100% by 2030)', 30, y); y += 8;
  pdf.text('• Energy Efficiency: 85% (improved 5% YoY)', 30, y); y += 8;
  pdf.text('• Water Consumption: 125,000 m³ (reduced 10%)', 30, y); y += 8;
  pdf.text('• Water Recycling: 40% (target: 60% by 2030)', 30, y);
  
  y += 15;
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.darkGreen);
  pdf.text('Waste & Circular Economy', 25, y);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  y += 10;
  pdf.text('• Total Waste: 450 tons (reduced 15%)', 30, y); y += 8;
  pdf.text('• Recycling Rate: 71% (target: 90% by 2030)', 30, y); y += 8;
  pdf.text('• Zero-Waste Facilities: 3 locations', 30, y);
};

const createSocialChapter = (pdf, config) => {
  createSectionHeader(pdf, 'SOCIAL PERFORMANCE', config.colors);
  
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.teal);
  pdf.text('Workforce Diversity & Inclusion', 25, 50);
  
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  let y = 60;
  const diversity = [
    ['Board Diversity', '40%', '50% target'],
    ['Executive Diversity', '35%', '45% target'],
    ['Management Diversity', '42%', '50% target'],
    ['Total Workforce', '42%', '50% target']
  ];
  
  diversity.forEach(([level, current, target]) => {
    pdf.text(level, 30, y);
    pdf.text(current, 100, y);
    pdf.text(target, 150, y);
    y += 8;
  });
  
  y += 10;
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.teal);
  pdf.text('Pay Equity', 25, y);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  y += 10;
  pdf.text('• Gender Pay Gap (Adjusted): 0.5% (target: 0%)', 30, y); y += 8;
  pdf.text('• Gender Pay Gap (Unadjusted): 2.1%', 30, y); y += 8;
  pdf.text('• Ethnicity Pay Analysis: Conducted annually', 30, y);
  
  y += 15;
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.teal);
  pdf.text('Health & Safety', 25, y);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  y += 10;
  pdf.text('• TRIR: 0.12 (industry avg: 0.45)', 30, y); y += 8;
  pdf.text('• LTIR: 0.08 (improved 25% YoY)', 30, y); y += 8;
  pdf.text('• Fatalities: 0', 30, y); y += 8;
  pdf.text('• Safety Training: 24,500 hours', 30, y);
  
  y += 15;
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.teal);
  pdf.text('Human Rights & Supply Chain', 25, y);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  y += 10;
  pdf.text('• Supplier Audits: 150 conducted', 30, y); y += 8;
  pdf.text('• Non-Compliance Rate: 2.5%', 30, y); y += 8;
  pdf.text('• Conflict Minerals: 100% compliant', 30, y);
};

const createGovernanceChapter = (pdf, config) => {
  createSectionHeader(pdf, 'GOVERNANCE PERFORMANCE', config.colors);
  
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.blue);
  pdf.text('Board Composition', 25, 50);
  
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  let y = 60;
  pdf.text('• Board Size: 9 members', 30, y); y += 8;
  pdf.text('• Independence: 75%', 30, y); y += 8;
  pdf.text('• Gender Diversity: 40%', 30, y); y += 8;
  pdf.text('• Average Tenure: 4.5 years', 30, y);
  
  y += 15;
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.blue);
  pdf.text('ESG Oversight', 25, y);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  y += 10;
  pdf.text('• ESG Committee: Quarterly reviews', 30, y); y += 8;
  pdf.text('• Executive Compensation: 20% ESG-linked', 30, y); y += 8;
  pdf.text('• CSO Reporting: Direct to CEO', 30, y);
  
  y += 15;
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.blue);
  pdf.text('Ethics & Compliance', 25, y);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  y += 10;
  pdf.text('• Code of Conduct Training: 98% completion', 30, y); y += 8;
  pdf.text('• Hotline Reports: 12 (all investigated)', 30, y); y += 8;
  pdf.text('• Anti-Corruption: Zero violations', 30, y);
  
  y += 15;
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.blue);
  pdf.text('Data Privacy & Cybersecurity', 25, y);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  y += 10;
  pdf.text('• GDPR/CCPA Compliant: 100%', 30, y); y += 8;
  pdf.text('• Data Breaches: 0 material incidents', 30, y); y += 8;
  pdf.text('• Cybersecurity Investment: $2.5M', 30, y);
  
  y += 15;
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...config.colors.blue);
  pdf.text('Tax Transparency', 25, y);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...config.colors.gray);
  y += 10;
  pdf.text('• Effective Tax Rate: 24.5%', 30, y); y += 8;
  pdf.text('• Country-by-Country Reporting: Published', 30, y);
};

const createPerformanceScorecard = (pdf, config) => {
  createSectionHeader(pdf, 'PERFORMANCE SCORECARD', config.colors);
  
  const scorecard = [
    ['Metric', '2022', '2023', '2024', 'Target', 'Status'],
    ['ESG Score', '75', '82', '87', '90', '🟢'],
    ['Carbon Emissions', '6,500', '5,800', '5,500', '4,000', '🟢'],
    ['Renewable Energy %', '45', '55', '65', '100', '🟢'],
    ['Workforce Diversity', '35', '38', '42', '50', '🟡'],
    ['Pay Equity Gap', '3.2', '2.1', '0.5', '0', '🟢'],
    ['Board Independence', '70', '72', '75', '75', '✓'],
    ['Compliance Rate', '96', '98', '99', '100', '🟢']
  ];
  
  let y = 50;
  pdf.setFontSize(9);
  scorecard.forEach((row, i) => {
    if (i === 0) {
      pdf.setFillColor(...config.colors.darkGreen); pdf.rect(25, y - 5, 160, 10, 'F');
      pdf.setTextColor(...config.colors.white); pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setTextColor(...config.colors.gray); pdf.setFont('helvetica', 'normal');
    }
    
    pdf.text(row[0], 30, y);
    pdf.text(row[1], 80, y);
    pdf.text(row[2], 100, y);
    pdf.text(row[3], 120, y);
    pdf.text(row[4], 140, y);
    pdf.text(row[5], 165, y);
    y += 10;
  });
};

const createAssuranceStatement = (pdf, config) => {
  createSectionHeader(pdf, 'ASSURANCE STATEMENT', config.colors);
  pdf.setFontSize(10); pdf.setTextColor(...config.colors.gray);
  
  const text = [
    'Independent Limited Assurance Statement',
    '',
    'Scope: Limited assurance engagement per ISAE 3000 (Revised)',
    '',
    'We have reviewed the ESG data and disclosures in this report. Based on our',
    'procedures, nothing has come to our attention that causes us to believe the',
    'information is materially misstated.',
    '',
    'Assurance Provider: [Independent Auditing Firm]',
    'Date: December 31, 2024',
    'Standard: ISAE 3000, AA1000AS v3'
  ];
  
  let y = 50;
  text.forEach(line => {
    if (line === '') y += 5;
    else { pdf.text(line, 25, y); y += 8; }
  });
};

const create2030Commitments = (pdf, config) => {
  createSectionHeader(pdf, '2030 COMMITMENTS', config.colors);
  pdf.setFontSize(10); pdf.setTextColor(...config.colors.gray);
  
  const commitments = [
    'Environmental:',
    '• Net-zero Scope 1 & 2 emissions',
    '• 50% reduction in Scope 3 emissions',
    '• 100% renewable energy',
    '• Zero waste to landfill',
    '',
    'Social:',
    '• 50% workforce diversity at all levels',
    '• Zero pay equity gap',
    '• 100% living wage across supply chain',
    '',
    'Governance:',
    '• 50% board diversity',
    '• 100% ESG-linked executive compensation',
    '• Full TCFD compliance'
  ];
  
  let y = 50;
  commitments.forEach(line => {
    if (line === '') y += 5;
    else if (line.startsWith('•')) { pdf.text(line, 30, y); y += 8; }
    else { pdf.setFont('helvetica', 'bold'); pdf.text(line, 25, y); pdf.setFont('helvetica', 'normal'); y += 10; }
  });
};

const createGRIIndex = (pdf, config) => {
  createSectionHeader(pdf, 'GRI CONTENT INDEX', config.colors);
  
  const gri = [
    ['GRI Standard', 'Disclosure', 'Page'],
    ['GRI 2', 'General Disclosures', '4-5'],
    ['GRI 302', 'Energy', '7'],
    ['GRI 305', 'Emissions', '7'],
    ['GRI 401', 'Employment', '8'],
    ['GRI 403', 'Health & Safety', '8'],
    ['GRI 405', 'Diversity', '8']
  ];
  
  let y = 50;
  pdf.setFontSize(9);
  gri.forEach((row, i) => {
    if (i === 0) {
      pdf.setFillColor(...config.colors.darkGreen); pdf.rect(25, y - 5, 160, 10, 'F');
      pdf.setTextColor(...config.colors.white); pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setTextColor(...config.colors.gray); pdf.setFont('helvetica', 'normal');
    }
    
    pdf.text(row[0], 30, y);
    pdf.text(row[1], 80, y);
    pdf.text(row[2], 150, y);
    y += 10;
  });
};

const createSASBMetrics = (pdf, config) => {
  createSectionHeader(pdf, 'SASB METRICS', config.colors);
  
  const sasb = [
    ['Topic', 'Metric', 'Value'],
    ['GHG Emissions', 'Total Scope 1 & 2', '2,000 tCO2e'],
    ['Energy', 'Renewable %', '65%'],
    ['Water', 'Consumption', '125,000 m³'],
    ['Diversity', 'Workforce %', '42%'],
    ['Safety', 'TRIR', '0.12']
  ];
  
  let y = 50;
  pdf.setFontSize(9);
  sasb.forEach((row, i) => {
    if (i === 0) {
      pdf.setFillColor(...config.colors.darkGreen); pdf.rect(25, y - 5, 160, 10, 'F');
      pdf.setTextColor(...config.colors.white); pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setTextColor(...config.colors.gray); pdf.setFont('helvetica', 'normal');
    }
    
    pdf.text(row[0], 30, y);
    pdf.text(row[1], 80, y);
    pdf.text(row[2], 140, y);
    y += 10;
  });
};

const createTCFDAlignment = (pdf, config) => {
  createSectionHeader(pdf, 'TCFD ALIGNMENT', config.colors);
  
  const tcfd = [
    ['Pillar', 'Disclosure', 'Page'],
    ['Governance', 'Board oversight', '9'],
    ['Strategy', 'Climate risks & opportunities', '6-7'],
    ['Risk Management', 'Risk identification process', '6'],
    ['Metrics & Targets', 'GHG emissions & targets', '7']
  ];
  
  let y = 50;
  pdf.setFontSize(9);
  tcfd.forEach((row, i) => {
    if (i === 0) {
      pdf.setFillColor(...config.colors.darkGreen); pdf.rect(25, y - 5, 160, 10, 'F');
      pdf.setTextColor(...config.colors.white); pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setTextColor(...config.colors.gray); pdf.setFont('helvetica', 'normal');
    }
    
    pdf.text(row[0], 30, y);
    pdf.text(row[1], 80, y);
    pdf.text(row[2], 150, y);
    y += 10;
  });
};

const createSectionHeader = (pdf, title, colors) => {
  pdf.setFillColor(...colors.darkGreen); pdf.rect(0, 0, 210, 30, 'F');
  pdf.setTextColor(...colors.white); pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
  pdf.text(title, 25, 20);
};

const addHeadersFooters = (pdf, config) => {
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8); pdf.setTextColor(...config.colors.gray);
    pdf.text(`${config.companyName} ESG Report ${config.year}`, 25, 290);
    pdf.text(`Page ${i}`, 180, 290);
  }
};

export default generateFortuneESGReport;
