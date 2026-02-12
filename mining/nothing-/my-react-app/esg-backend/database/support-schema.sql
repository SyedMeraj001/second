-- Support Ticketing System Database Schema

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in-progress', 'waiting', 'resolved', 'closed')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sla_deadline DATETIME NOT NULL,
  assigned_to TEXT,
  tags TEXT,
  resolved_at DATETIME,
  closed_at DATETIME
);

-- Ticket Comments Table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_internal BOOLEAN DEFAULT 0,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- Support Team Members Table
CREATE TABLE IF NOT EXISTS support_team (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('agent', 'senior-agent', 'manager', 'admin')),
  shift TEXT NOT NULL CHECK(shift IN ('morning', 'afternoon', 'night', 'flexible')),
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'busy', 'offline')),
  max_tickets INTEGER DEFAULT 10,
  current_tickets INTEGER DEFAULT 0,
  specializations TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Support Shifts Schedule Table
CREATE TABLE IF NOT EXISTS support_shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK(shift_type IN ('morning', 'afternoon', 'night')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'active', 'completed', 'cancelled')),
  FOREIGN KEY (agent_id) REFERENCES support_team(id)
);

-- Ticket Escalations Table
CREATE TABLE IF NOT EXISTS ticket_escalations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  escalated_from TEXT,
  escalated_to TEXT NOT NULL,
  reason TEXT NOT NULL,
  escalated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- SLA Tracking Table
CREATE TABLE IF NOT EXISTS sla_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  first_response_at DATETIME,
  resolution_time_minutes INTEGER,
  sla_met BOOLEAN,
  violation_reason TEXT,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_sla ON support_tickets(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_shifts_agent ON support_shifts(agent_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON support_shifts(shift_date);

-- Insert sample support team (24/7 coverage)
INSERT OR IGNORE INTO support_team (id, name, email, role, shift, timezone, specializations) VALUES
  ('agent-001', 'John Smith', 'john.smith@support.com', 'senior-agent', 'morning', 'UTC+0', 'technical,integration'),
  ('agent-002', 'Sarah Johnson', 'sarah.johnson@support.com', 'agent', 'morning', 'UTC+0', 'account,data'),
  ('agent-003', 'Mike Chen', 'mike.chen@support.com', 'agent', 'afternoon', 'UTC+8', 'technical,training'),
  ('agent-004', 'Emily Davis', 'emily.davis@support.com', 'senior-agent', 'afternoon', 'UTC+8', 'integration,data'),
  ('agent-005', 'David Wilson', 'david.wilson@support.com', 'agent', 'night', 'UTC-5', 'technical,account'),
  ('agent-006', 'Lisa Brown', 'lisa.brown@support.com', 'agent', 'night', 'UTC-5', 'training,other'),
  ('manager-001', 'Robert Taylor', 'robert.taylor@support.com', 'manager', 'flexible', 'UTC+0', 'all'),
  ('admin-001', 'Jennifer Lee', 'jennifer.lee@support.com', 'admin', 'flexible', 'UTC+0', 'all');
