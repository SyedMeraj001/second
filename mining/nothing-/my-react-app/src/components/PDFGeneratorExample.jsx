import React, { useRef } from 'react';
import { usePDFWithCharts } from '../hooks/usePDFWithCharts';

/**
 * Example component showing how to generate PDF with captured charts
 * 
 * Usage in your Reports/Analytics component:
 * 
 * 1. Add CSS classes or IDs to your chart containers:
 *    <div className="esg-score-chart">
 *      <YourChartComponent />
 *    </div>
 * 
 * 2. Use the hook to generate PDF:
 *    const { generatePDFWithCharts, isGenerating, progress } = usePDFWithCharts();
 * 
 * 3. Call the function with chart selectors:
 *    await generatePDFWithCharts('GRI', esgData, {
 *      esgScoreWheel: '.esg-score-chart',
 *      trendChart: '.trend-chart'
 *    });
 */

export const PDFGeneratorExample = ({ framework, data }) => {
  const { generatePDFWithCharts, isGenerating, progress } = usePDFWithCharts();

  const handleGeneratePDF = async () => {
    // Define which charts to capture
    const chartSelectors = {
      esgScoreWheel: '.esg-score-chart',
      trendChart: '.trend-chart',
      categoryChart: '.category-distribution-chart',
      performanceChart: '.performance-overview-chart'
    };

    const result = await generatePDFWithCharts(framework, data, chartSelectors);
    
    if (result.success) {
      console.log(`PDF generated with ${result.chartsCaptured} charts captured`);
    } else {
      console.error('PDF generation failed:', result.error);
    }
  };

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={isGenerating}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isGenerating ? `Generating... ${progress}%` : 'Generate PDF with Charts'}
      </button>
    </div>
  );
};

/**
 * Alternative: Using Chart.js refs directly
 */
export const PDFGeneratorWithRefs = ({ framework, data }) => {
  const { generatePDFWithChartRefs, isGenerating, progress } = usePDFWithCharts();
  
  // Create refs for your Chart.js instances
  const esgScoreChartRef = useRef(null);
  const trendChartRef = useRef(null);

  const handleGeneratePDF = async () => {
    const chartRefs = {
      esgScoreWheel: esgScoreChartRef,
      trendChart: trendChartRef
    };

    const result = await generatePDFWithChartRefs(framework, data, chartRefs);
    
    if (result.success) {
      console.log(`PDF generated with ${result.chartsCaptured} charts`);
    }
  };

  return (
    <div>
      {/* Pass refs to your Chart components */}
      {/* <Chart ref={esgScoreChartRef} ... /> */}
      
      <button
        onClick={handleGeneratePDF}
        disabled={isGenerating}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {isGenerating ? `Generating... ${progress}%` : 'Generate PDF'}
      </button>
    </div>
  );
};

export default PDFGeneratorExample;
