const express = require('express');
const router = express.Router();
const SupportTicketingSystem = require('../services/supportTicketingSystem');

// Initialize ticketing system (will be injected with DB)
let ticketingSystem;

const initTicketingSystem = (db) => {
  ticketingSystem = new SupportTicketingSystem(db);
};

// Middleware to check authentication
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Add user info to request
  req.user = { id: 'user123', email: 'user@company.com' }; // Simplified
  next();
};

// Create a new ticket
router.post('/tickets', authenticate, async (req, res) => {
  try {
    const { subject, description, priority, category, tags } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const ticket = await ticketingSystem.createTicket({
      subject,
      description,
      priority: priority || 'medium',
      category: category || 'technical',
      userId: req.user.id,
      userEmail: req.user.email,
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      ticket,
      message: 'Ticket created successfully'
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get all tickets for current user
router.get('/tickets', authenticate, async (req, res) => {
  try {
    const { status, priority } = req.query;
    
    const filters = {
      userId: req.user.id
    };

    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const tickets = await ticketingSystem.getTickets(filters);

    res.json({
      success: true,
      tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get specific ticket
router.get('/tickets/:ticketId', authenticate, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await ticketingSystem.getTicket(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user owns the ticket
    if (ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Update ticket
router.patch('/tickets/:ticketId', authenticate, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const updates = req.body;

    await ticketingSystem.updateTicket(ticketId, updates);

    res.json({
      success: true,
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Add comment to ticket
router.post('/tickets/:ticketId/comments', authenticate, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    await ticketingSystem.addComment(ticketId, {
      userId: req.user.id,
      text
    });

    res.json({
      success: true,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get support statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await ticketingSystem.getStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get SLA violations
router.get('/sla-violations', authenticate, async (req, res) => {
  try {
    const violations = await ticketingSystem.getSLAViolations();

    res.json({
      success: true,
      violations,
      count: violations.length
    });
  } catch (error) {
    console.error('Get SLA violations error:', error);
    res.status(500).json({ error: 'Failed to fetch SLA violations' });
  }
});

// Admin: Get all tickets (for support team)
router.get('/admin/tickets', authenticate, async (req, res) => {
  try {
    // Check if user is admin/support
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, priority } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const tickets = await ticketingSystem.getTickets(filters);

    res.json({
      success: true,
      tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('Admin get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Admin: Assign ticket
router.post('/admin/tickets/:ticketId/assign', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { ticketId } = req.params;
    const { assignedTo } = req.body;

    await ticketingSystem.updateTicket(ticketId, { assignedTo });

    res.json({
      success: true,
      message: 'Ticket assigned successfully'
    });
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ error: 'Failed to assign ticket' });
  }
});

module.exports = { router, initTicketingSystem };
