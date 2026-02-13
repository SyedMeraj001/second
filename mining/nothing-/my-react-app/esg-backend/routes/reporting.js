import express from 'express';
import { requirePermission, PERMISSIONS } from '../middleware/rbac.js';
import nodemailer from 'nodemailer';
const router = express.Router();

// Multi-Framework Reports
router.get('/frameworks/:framework', requirePermission(PERMISSIONS.READ_DATA), (req, res) => {
  const { framework } = req.params;
  const reports = {
    SASB: { sectors: 77, standards: 'Industry-specific' },
    TCFD: { pillars: ['Governance', 'Strategy', 'Risk Management', 'Metrics'] },
    'EU-Taxonomy': { activities: 'Climate mitigation/adaptation' },
    CDP: { questionnaires: ['Climate', 'Water', 'Forests'] }
  };
  res.json(reports[framework] || {});
});

// EU Taxonomy Navigator
router.get('/eu-taxonomy/navigator/:sector', requirePermission(PERMISSIONS.READ_DATA), (req, res) => {
  const { sector } = req.params;
  const activities = {
    energy: [{ id: '4.1', name: 'Electricity generation using solar PV', criteria: 'Direct emissions <100g CO2e/kWh' }],
    transport: [{ id: '6.3', name: 'Urban and suburban transport', criteria: 'Zero direct emissions' }],
    buildings: [{ id: '7.1', name: 'Construction of new buildings', criteria: 'Primary energy ≤10% below NZEB' }]
  };
  res.json({ sector, activities: activities[sector] || [] });
});

router.get('/eu-taxonomy/technical-criteria/:activityId', requirePermission(PERMISSIONS.READ_DATA), (req, res) => {
  const { activityId } = req.params;
  const criteria = {
    '4.1': { contribution: 'Climate mitigation', threshold: '<100g CO2e/kWh', dnsh: ['Water', 'Circular economy'] },
    '7.1': { contribution: 'Climate mitigation', threshold: '≤10% below NZEB', dnsh: ['Climate adaptation', 'Water resources'] }
  };
  res.json(criteria[activityId] || {});
});

// Regulatory Filing
router.post('/filing/csrd', requirePermission(PERMISSIONS.WRITE_DATA), (req, res) => {
  // CSRF protection: validate request origin
  const origin = req.headers.origin || req.headers.referer;
  const host = req.get('host');
  if (!req.headers['x-requested-with'] && (!origin || !origin.includes(host))) {
    return res.status(403).json({ error: 'Invalid request origin' });
  }
  
  const { companyId, reportingYear } = req.body;
  res.json({
    filingId: `CSRD-${companyId}-${reportingYear}`,
    status: 'submitted',
    submissionDate: new Date().toISOString()
  });
});

// Stakeholder Reports
router.get('/stakeholder/:type', requirePermission(PERMISSIONS.READ_DATA), (req, res) => {
  const { type } = req.params;
  const dashboards = {
    investor: { metrics: ['ROI', 'ESG Score', 'Risk Rating'] },
    customer: { metrics: ['Carbon Footprint', 'Sustainability Initiatives'] },
    employee: { metrics: ['Diversity', 'Safety', 'Training Hours'] }
  };
  res.json(dashboards[type] || {});
});

// Double Materiality Assessment
router.get('/materiality/topics/:sector', requirePermission(PERMISSIONS.READ_DATA), (req, res) => {
  const { sector } = req.params;
  const sectorTopics = {
    mining: [
      { id: 'tailings_management', name: 'Tailings Management', category: 'environmental', esrsCode: 'E3' },
      { id: 'mine_closure', name: 'Mine Closure & Rehabilitation', category: 'environmental', esrsCode: 'E4' },
      { id: 'community_displacement', name: 'Community Displacement', category: 'social', esrsCode: 'S3' },
      { id: 'indigenous_rights', name: 'Indigenous Rights', category: 'social', esrsCode: 'S3' }
    ],
    energy: [
      { id: 'renewable_transition', name: 'Renewable Energy Transition', category: 'environmental', esrsCode: 'E1' },
      { id: 'grid_stability', name: 'Grid Stability & Reliability', category: 'governance', esrsCode: 'G1' }
    ],
    general: []
  };
  res.json({ sectorSpecific: sectorTopics[sector] || [], standard: true });
});

router.post('/materiality/assessment', requirePermission(PERMISSIONS.WRITE_DATA), async (req, res) => {
  const { companyId, assessmentData } = req.body;
  try {
    const db = require('../database/db.js');
    
    // Save materiality assessment
    await db.run(
      'INSERT OR REPLACE INTO materiality_assessments (company_id, assessment_data, created_at) VALUES (?, ?, ?)',
      [companyId, JSON.stringify(assessmentData), new Date().toISOString()]
    );
    
    res.json({ success: true, message: 'Materiality assessment saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/materiality/assessment/:companyId', requirePermission(PERMISSIONS.READ_DATA), async (req, res) => {
  const { companyId } = req.params;
  try {
    const db = require('../database/db.js');
    const assessment = await db.get(
      'SELECT * FROM materiality_assessments WHERE company_id = ? ORDER BY created_at DESC LIMIT 1',
      [companyId]
    );
    
    if (assessment) {
      res.json({ success: true, data: JSON.parse(assessment.assessment_data) });
    } else {
      res.json({ success: false, message: 'No assessment found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Real-time Dashboards
router.get('/dashboard/live', requirePermission(PERMISSIONS.READ_DATA), (req, res) => {
  const liveData = {
    currentEmissions: Math.floor(Math.random() * 1000) + 500,
    energyConsumption: Math.floor(Math.random() * 5000) + 2000,
    waterUsage: Math.floor(Math.random() * 1000) + 300,
    lastUpdated: new Date().toISOString()
  };
  res.json(liveData);
});

// Support Ticket Creation (No auth required)
router.post('/support/ticket', async (req, res) => {
  const { name, email, subject, message, priority } = req.body;
  
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }
  
  const ticketId = `TKT-${Date.now()}`;
  const ticket = {
    id: ticketId,
    name,
    email,
    subject,
    message,
    priority: priority || 'medium',
    status: 'open',
    createdAt: new Date().toISOString()
  };
  
  // Send email notification
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'esgeniustechsolutions@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
    
    await transporter.sendMail({
      from: 'esgeniustechsolutions@gmail.com',
      to: 'esgeniustechsolutions@gmail.com',
      subject: `New Support Ticket [${ticketId}] - ${subject}`,
      html: `
        <h2>New Support Ticket Received</h2>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><em>Created: ${new Date().toLocaleString()}</em></p>
      `
    });
    
    console.log(`[EMAIL SENT] Ticket ${ticketId} notification sent to esgeniustechsolutions@gmail.com`);
  } catch (error) {
    console.error('[EMAIL ERROR]', error.message);
  }
  
  res.json({
    success: true,
    ticketId,
    message: 'Thank you for contacting us! We will get back to you within 24 hours.',
    ticket
  });
});

export default router;