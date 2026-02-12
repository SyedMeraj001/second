import express from 'express';
const router = express.Router();

// In-memory storage for demo (replace with database later)
let tickets = [];
let ticketCounter = 1;

// Get all tickets
router.get('/tickets', (req, res) => {
  try {
    res.json({
      success: true,
      tickets: tickets,
      count: tickets.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Create ticket
router.post('/tickets', (req, res) => {
  try {
    const { subject, description, priority, category } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description required' });
    }

    const ticket = {
      id: `TKT-${Date.now()}-${ticketCounter++}`,
      subject,
      description,
      priority: priority || 'medium',
      category: category || 'technical',
      status: 'open',
      user_id: 'user123',
      user_email: 'user@company.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sla_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      comments: []
    };

    tickets.push(ticket);

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

// Get specific ticket
router.get('/tickets/:ticketId', (req, res) => {
  try {
    const ticket = tickets.find(t => t.id === req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Update ticket
router.patch('/tickets/:ticketId', (req, res) => {
  try {
    const ticket = tickets.find(t => t.id === req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    Object.assign(ticket, req.body, { updated_at: new Date().toISOString() });

    res.json({
      success: true,
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Add comment
router.post('/tickets/:ticketId/comments', (req, res) => {
  try {
    const ticket = tickets.find(t => t.id === req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const comment = {
      id: Date.now(),
      user_id: 'user123',
      comment: req.body.text,
      created_at: new Date().toISOString()
    };

    ticket.comments.push(comment);

    res.json({
      success: true,
      message: 'Comment added successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get stats
router.get('/stats', (req, res) => {
  try {
    const stats = {
      total: tickets.length,
      byStatus: {
        open: tickets.filter(t => t.status === 'open').length,
        'in-progress': tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length
      },
      byPriority: {
        critical: tickets.filter(t => t.priority === 'critical').length,
        high: tickets.filter(t => t.priority === 'high').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        low: tickets.filter(t => t.priority === 'low').length
      },
      slaViolations: 0
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
