import html2canvas from 'html2canvas';

/**
 * Captures chart elements as base64 images for PDF generation
 */
export class ChartCapture {
  /**
   * Capture a single chart element by ID or class
   * @param {string} selector - CSS selector for the chart element
   * @returns {Promise<string>} Base64 image data
   */
  static async captureChart(selector) {
    try {
      const element = document.querySelector(selector);
      if (!element) {
        console.warn(`Chart element not found: ${selector}`);
        return null;
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error(`Error capturing chart ${selector}:`, error);
      return null;
    }
  }

  /**
   * Capture multiple charts at once
   * @param {Array<string>} selectors - Array of CSS selectors
   * @returns {Promise<Object>} Object with selector keys and base64 image values
   */
  static async captureMultipleCharts(selectors) {
    const results = {};
    
    for (const selector of selectors) {
      results[selector] = await this.captureChart(selector);
    }
    
    return results;
  }

  /**
   * Capture all Chart.js canvas elements on the page
   * @returns {Promise<Array<string>>} Array of base64 images
   */
  static async captureAllChartJsCharts() {
    const canvases = document.querySelectorAll('canvas');
    const images = [];

    for (const canvas of canvases) {
      try {
        // Check if it's a Chart.js canvas
        if (canvas.chart || canvas.getContext) {
          images.push(canvas.toDataURL('image/png'));
        }
      } catch (error) {
        console.warn('Could not capture canvas:', error);
      }
    }

    return images;
  }

  /**
   * Get chart instance and convert to base64
   * @param {Object} chartRef - React ref to Chart.js instance
   * @returns {string|null} Base64 image data
   */
  static getChartImage(chartRef) {
    try {
      if (chartRef?.current) {
        return chartRef.current.toBase64Image();
      }
      return null;
    } catch (error) {
      console.error('Error getting chart image:', error);
      return null;
    }
  }
}

export default ChartCapture;
