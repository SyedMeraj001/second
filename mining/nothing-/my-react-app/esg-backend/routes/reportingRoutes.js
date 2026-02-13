import express from 'express';
import reportManager from '../reports/index.js';
import path from 'path';
import nodemailer from 'nodemailer';

const router = express.Router();

/**
 * Get dashboard summary (comprehensive + performance)
 */
router.get('/dashboard-summary', async (req, res) => {
  try {
    const [comprehensive, performance] = await Promise.all([
      reportManager.generateComprehensiveReport(),
      reportManager.generateReport('performance')
    ]);
    res.json({
      success: true,
      data: {
        comprehensive,
        performance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get available report types
 */
router.get('/types', (req, res) => {
  try {
    const availableReports = reportManager.getAvailableReports();
    res.json({
      success: true,
      data: availableReports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate comprehensive report
 */
router.get('/comprehensive', async (req, res) => {
  try {
    const report = await reportManager.generateComprehensiveReport();
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate specific report by type
 */
router.get('/:reportType', async (req, res) => {
  try {
    const { reportType } = req.params;
    const { subType } = req.query;
    
    const report = await reportManager.generateReport(reportType, subType);
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate ESG data collection report
 */
router.get('/esg/data-sources', async (req, res) => {
  try {
    await reportManager.initialize();
    const report = await reportManager.esgDataReport.getDataSourcesReport();
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate sustainability metrics report
 */
router.get('/sustainability/environmental', async (req, res) => {
  try {
    await reportManager.initialize();
    const report = await reportManager.sustainabilityReport.getEnvironmentalReport();
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate performance monitoring report
 */
router.get('/performance/summary', async (req, res) => {
  try {
    await reportManager.initialize();
    const report = await reportManager.performanceReport.getPerformanceSummary();
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate security assessment report
 */
router.get('/security/summary', async (req, res) => {
  try {
    await reportManager.initialize();
    const report = await reportManager.securityReport.getSecuritySummary();
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate deployment report
 */
router.get('/deployment/health', async (req, res) => {
  try {
    await reportManager.initialize();
    const report = await reportManager.deploymentReport.getHealthCheckReport();
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate PDF report
 */
router.get('/pdf/comprehensive', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ESG_Report_${timestamp}.pdf`;
    const outputPath = `reports/${filename}`;
    
    const pdfPath = await reportManager.generatePDFReport(outputPath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fs = await import('fs');
    const fileStream = fs.default.createReadStream(pdfPath);
    fileStream.pipe(res);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate and download PDF report
 */
router.post('/pdf/generate', async (req, res) => {
  try {
    const { filename } = req.body;
    const timestamp = new Date().toISOString().split('T')[0];
    const pdfFilename = filename || `ESG_Report_${timestamp}.pdf`;
    const outputPath = `reports/${pdfFilename}`;
    
    const pdfPath = await reportManager.generatePDFReport(outputPath);
    
    res.json({
      success: true,
      message: 'PDF report generated successfully',
      filename: pdfFilename,
      path: pdfPath
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Support Ticket Creation
 */
router.post('/support/ticket', async (req, res) => {
  const { name, email, subject, message, priority } = req.body;
  
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }
  
  const ticketId = `TKT-${Date.now()}`;
  
  // Send email notification (non-blocking)
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'esgeniustechsolutions@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
    
    transporter.sendMail({
      from: 'esgeniustechsolutions@gmail.com',
      to: 'esgeniustechsolutions@gmail.com',
      subject: `New Support Ticket [${ticketId}] - ${subject}`,
      html: `
        <h2>New Support Ticket Received</h2>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Priority:</strong> ${priority || 'medium'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><em>Created: ${new Date().toLocaleString()}</em></p>
      `
    }).catch(err => console.error('[EMAIL ERROR]', err.message));
  } catch (error) {
    console.error('[EMAIL SETUP ERROR]', error.message);
  }
  
  res.json({
    success: true,
    ticketId,
    message: 'Thank you for contacting us! We will get back to you within 24 hours.'
  });
});

export default router;