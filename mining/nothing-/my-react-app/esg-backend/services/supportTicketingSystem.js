// 24/7 Support Ticketing System
class SupportTicketingSystem {
  constructor(db) {
    this.db = db;
    this.priorities = ['low', 'medium', 'high', 'critical'];
    this.statuses = ['open', 'in-progress', 'waiting', 'resolved', 'closed'];
    this.sla = {
      critical: { responseTime: 15, resolutionTime: 240 }, // minutes
      high: { responseTime: 60, resolutionTime: 480 },
      medium: { responseTime: 240, resolutionTime: 1440 },
      low: { responseTime: 1440, resolutionTime: 4320 }
    };
  }

  async createTicket(ticketData) {
    const ticket = {
      id: `TKT-${Date.now()}`,
      subject: ticketData.subject,
      description: ticketData.description,
      priority: ticketData.priority || 'medium',
      category: ticketData.category,
      userId: ticketData.userId,
      userEmail: ticketData.userEmail,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      slaDeadline: this.calculateSLA(ticketData.priority || 'medium'),
      assignedTo: null,
      tags: ticketData.tags || []
    };

    await this.db.query(
      `INSERT INTO support_tickets (id, subject, description, priority, category, user_id, user_email, status, created_at, updated_at, sla_deadline, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [ticket.id, ticket.subject, ticket.description, ticket.priority, ticket.category, 
       ticket.userId, ticket.userEmail, ticket.status, ticket.createdAt, ticket.updatedAt, 
       ticket.slaDeadline, JSON.stringify(ticket.tags)]
    );

    await this.notifySupport(ticket);
    await this.sendConfirmation(ticket);

    return ticket;
  }

  calculateSLA(priority) {
    const sla = this.sla[priority];
    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + sla.resolutionTime);
    return deadline;
  }

  async updateTicket(ticketId, updates) {
    const allowedUpdates = ['status', 'priority', 'assignedTo', 'tags'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) return;

    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(ticketId);

    await this.db.query(
      `UPDATE support_tickets SET ${updateFields.join(', ')} WHERE id = $${paramCount + 1}`,
      values
    );

    await this.notifyUpdate(ticketId, updates);
  }

  async addComment(ticketId, comment) {
    await this.db.query(
      `INSERT INTO ticket_comments (ticket_id, user_id, comment, created_at)
       VALUES ($1, $2, $3, $4)`,
      [ticketId, comment.userId, comment.text, new Date()]
    );

    await this.notifyComment(ticketId, comment);
  }

  async getTicket(ticketId) {
    const result = await this.db.query(
      `SELECT * FROM support_tickets WHERE id = $1`,
      [ticketId]
    );

    if (result.rows.length === 0) return null;

    const ticket = result.rows[0];
    const comments = await this.getComments(ticketId);
    
    return { ...ticket, comments };
  }

  async getComments(ticketId) {
    const result = await this.db.query(
      `SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC`,
      [ticketId]
    );
    return result.rows;
  }

  async getTickets(filters = {}) {
    let query = 'SELECT * FROM support_tickets WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.priority) {
      query += ` AND priority = $${paramCount}`;
      values.push(filters.priority);
      paramCount++;
    }

    if (filters.userId) {
      query += ` AND user_id = $${paramCount}`;
      values.push(filters.userId);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async getSLAViolations() {
    const result = await this.db.query(
      `SELECT * FROM support_tickets 
       WHERE status NOT IN ('resolved', 'closed') 
       AND sla_deadline < NOW()`
    );
    return result.rows;
  }

  async getStats() {
    const stats = {
      total: 0,
      byStatus: {},
      byPriority: {},
      slaViolations: 0,
      avgResolutionTime: 0
    };

    const total = await this.db.query('SELECT COUNT(*) FROM support_tickets');
    stats.total = parseInt(total.rows[0].count);

    for (const status of this.statuses) {
      const result = await this.db.query(
        'SELECT COUNT(*) FROM support_tickets WHERE status = $1',
        [status]
      );
      stats.byStatus[status] = parseInt(result.rows[0].count);
    }

    for (const priority of this.priorities) {
      const result = await this.db.query(
        'SELECT COUNT(*) FROM support_tickets WHERE priority = $1',
        [priority]
      );
      stats.byPriority[priority] = parseInt(result.rows[0].count);
    }

    const violations = await this.getSLAViolations();
    stats.slaViolations = violations.length;

    return stats;
  }

  async notifySupport(ticket) {
    // Send to support team
    await this.sendEmail({
      to: 'support@company.com',
      subject: `New Ticket: ${ticket.subject}`,
      body: `
        Ticket ID: ${ticket.id}
        Priority: ${ticket.priority}
        Category: ${ticket.category}
        User: ${ticket.userEmail}
        
        ${ticket.description}
      `
    });

    // Send to Slack
    if (ticket.priority === 'critical') {
      await this.sendSlack({
        text: `🚨 CRITICAL TICKET: ${ticket.subject} (${ticket.id})`
      });
    }
  }

  async sendConfirmation(ticket) {
    await this.sendEmail({
      to: ticket.userEmail,
      subject: `Ticket Created: ${ticket.id}`,
      body: `
        Your support ticket has been created.
        
        Ticket ID: ${ticket.id}
        Subject: ${ticket.subject}
        Priority: ${ticket.priority}
        Expected Resolution: ${ticket.slaDeadline.toLocaleString()}
        
        We'll respond within ${this.sla[ticket.priority].responseTime} minutes.
      `
    });
  }

  async notifyUpdate(ticketId, updates) {
    const ticket = await this.getTicket(ticketId);
    await this.sendEmail({
      to: ticket.user_email,
      subject: `Ticket Updated: ${ticketId}`,
      body: `Your ticket has been updated: ${JSON.stringify(updates)}`
    });
  }

  async notifyComment(ticketId, comment) {
    const ticket = await this.getTicket(ticketId);
    await this.sendEmail({
      to: ticket.user_email,
      subject: `New Comment on Ticket: ${ticketId}`,
      body: comment.text
    });
  }

  async sendEmail(email) {
    // Email sending logic
    console.log('Sending email:', email.subject);
  }

  async sendSlack(message) {
    // Slack notification logic
    console.log('Sending Slack:', message.text);
  }
}

module.exports = SupportTicketingSystem;
