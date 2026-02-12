import html2canvas from 'html2canvas';

export const captureChartAsImage = async (chartElementId, options = {}) => {
  const element = document.getElementById(chartElementId);
  if (!element) {
    console.warn(`Chart element with ID "${chartElementId}" not found`);
    return null;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      ...options
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
};

export const captureAllCharts = async () => {
  const chartIds = [
    'esg-overview-chart',
    'performance-trends-chart',
    'environmental-metrics-chart',
    'social-metrics-chart',
    'governance-metrics-chart',
    'yearly-performance-chart'
  ];

  const chartImages = {};
  
  for (const chartId of chartIds) {
    const imageData = await captureChartAsImage(chartId);
    if (imageData) {
      chartImages[chartId] = imageData;
    }
  }

  return chartImages;
};