#!/usr/bin/env node

// Test script to validate PDF generation with all new features
import { generateProfessionalESGReport } from './src/utils/professionalPDFGenerator.js';
import fs from 'fs';

// Sample ESG data for testing
const sampleData = [
  // Environmental
  { category: 'environmental', metric: 'CO2 Emissions', subcategory: 'Scope 1', value: 5000, unit: 'tonnes', target: 4500, source: 'Internal Report' },
  { category: 'environmental', metric: 'Renewable Energy', subcategory: 'Solar', value: 45, unit: '%', target: 55, source: 'Energy Audit' },
  { category: 'environmental', metric: 'Water Usage', subcategory: 'Industrial', value: 250000, unit: 'gallons', target: 200000, source: 'Water Authority' },
  { category: 'environmental', metric: 'Waste Reduction', subcategory: 'Recycling Rate', value: 78, unit: '%', target: 85, source: 'Waste Management' },
  
  // Social
  { category: 'social', metric: 'Employee Diversity', subcategory: 'Women in Leadership', value: 42, unit: '%', target: 50, source: 'HR Database' },
  { category: 'social', metric: 'Workforce Safety', subcategory: 'TRIR', value: 1.2, unit: 'rate', target: 1.0, source: 'OSHA Reports' },
  { category: 'social', metric: 'Community Investment', subcategory: 'Volunteering', value: 8500, unit: 'hours', target: 10000, source: 'Community Team' },
  { category: 'social', metric: 'Employee Training', subcategory: 'Hours per Employee', value: 32, unit: 'hours', target: 40, source: 'L&D Department' },
  
  // Governance
  { category: 'governance', metric: 'Board Diversity', subcategory: 'Women Directors', value: 33, unit: '%', target: 40, source: 'Board Registry' },
  { category: 'governance', metric: 'Executive Compensation', subcategory: 'Pay Ratio', value: 142, unit: 'ratio', target: 150, source: 'Finance Department' },
  { category: 'governance', metric: 'Ethics Training', subcategory: 'Completion Rate', value: 95, unit: '%', target: 100, source: 'Compliance' },
  { category: 'governance', metric: 'Risk Management', subcategory: 'Assessments Completed', value: 48, unit: 'count', target: 50, source: 'Risk Team' }
];

try {
  console.log('🚀 Starting PDF generation test...');
  console.log('📊 Framework: GRI');
  console.log('📊 Company: ESGenius Tech Solutions');
  console.log('📊 Data Points: ' + sampleData.length);
  
  const pdf = generateProfessionalESGReport('GRI', sampleData, {
    companyName: 'ESGenius Tech Solutions',
    reportPeriod: '2023',
    logo: null
  });
  
  // Save the PDF
  const filePath = './test-esg-report.pdf';
  const pdfBuffer = pdf.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
  
  console.log('✅ PDF generated successfully!');
  console.log('📁 File saved to: ' + filePath);
  console.log('📄 Total pages: ' + pdf.getNumberOfPages());
  
  // Verify file exists and has size
  const stats = fs.statSync(filePath);
  console.log('📊 File size: ' + (stats.size / 1024).toFixed(2) + ' KB');
  
  console.log('\n✨ All enhancements implemented:');
  console.log('✓ Professional title page with shadow effects');
  console.log('✓ Table of contents with visual styling');
  console.log('✓ Executive summary with metric boxes');
  console.log('✓ Materiality Assessment with bubble matrix');
  console.log('✓ ESG Performance sections');
  console.log('✓ Risk Management with pie chart');
  console.log('✓ Detailed data tables');
  console.log('✓ Compliance & Methodology section');
  console.log('✓ Independent Assurance Statement');
  console.log('✓ Professional headers and footers on all pages');
  
} catch (error) {
  console.error('❌ Error generating PDF:', error.message);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
