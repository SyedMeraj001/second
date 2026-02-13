import { useState } from 'react';
import { ChartCapture } from '../utils/chartCapture';
import { generateProfessionalWhitePaper } from '../professionalWhitePaperPDF';

export const usePDFWithCharts = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generatePDFWithCharts = async (framework, data, chartSelectors = {}, options = {}) => {
    setIsGenerating(true);
    setProgress(10);

    try {
      setProgress(30);
      const chartImages = {};
      
      const defaultSelectors = {
        esgScoreWheel: '.esg-score-chart',
        trendChart: '.trend-chart',
        categoryChart: '.category-chart',
        performanceChart: '.performance-chart',
        ...chartSelectors
      };

      setProgress(40);
      
      for (const [key, selector] of Object.entries(defaultSelectors)) {
        const image = await ChartCapture.captureChart(selector);
        if (image) {
          chartImages[key] = image;
        }
      }

      setProgress(60);

      const pdf = await generateProfessionalWhitePaper(framework, data, {
        ...options,
        chartImages
      });

      setProgress(90);
      pdf.save(`ESG_Report_${framework}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setProgress(100);
      setIsGenerating(false);
      
      return { success: true, chartsCaptured: Object.keys(chartImages).length };
    } catch (error) {
      console.error('Error generating PDF with charts:', error);
      setIsGenerating(false);
      setProgress(0);
      return { success: false, error: error.message };
    }
  };

  const generatePDFWithChartRefs = async (framework, data, chartRefs = {}, options = {}) => {
    setIsGenerating(true);
    setProgress(10);

    try {
      setProgress(30);
      const chartImages = {};

      for (const [key, ref] of Object.entries(chartRefs)) {
        const image = ChartCapture.getChartImage(ref);
        if (image) {
          chartImages[key] = image;
        }
      }

      setProgress(60);

      const pdf = await generateProfessionalWhitePaper(framework, data, {
        ...options,
        chartImages
      });

      setProgress(90);
      pdf.save(`ESG_Report_${framework}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setProgress(100);
      setIsGenerating(false);
      
      return { success: true, chartsCaptured: Object.keys(chartImages).length };
    } catch (error) {
      console.error('Error generating PDF with chart refs:', error);
      setIsGenerating(false);
      setProgress(0);
      return { success: false, error: error.message };
    }
  };

  return {
    generatePDFWithCharts,
    generatePDFWithChartRefs,
    isGenerating,
    progress
  };
};

export default usePDFWithCharts;
