-- Phase 4 Database Schema Extensions

-- GRI Template Data Storage
CREATE TABLE IF NOT EXISTS gri_template_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_code VARCHAR(20) NOT NULL,
    company_id INTEGER NOT NULL,
    section_key VARCHAR(100) NOT NULL,
    field_code VARCHAR(20) NOT NULL,
    field_value TEXT,
    user_id INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(template_code, company_id, section_key, field_code)
);

-- API Integrations
CREATE TABLE IF NOT EXISTS api_integrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    system_type VARCHAR(50) NOT NULL,
    endpoint_url VARCHAR(500) NOT NULL,
    auth_type VARCHAR(20) NOT NULL,
    auth_credentials TEXT NOT NULL,
    sync_frequency VARCHAR(20) DEFAULT 'daily',
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Sync Logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    integration_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    results TEXT,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (integration_id) REFERENCES api_integrations(id)
);

-- Two-Factor Authentication
CREATE TABLE IF NOT EXISTS temp_2fa_secrets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    secret VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS backup_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Stakeholder Engagement
CREATE TABLE IF NOT EXISTS stakeholder_surveys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    survey_type VARCHAR(50) NOT NULL,
    target_stakeholders TEXT NOT NULL,
    questions TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'draft',
    created_by INTEGER NOT NULL,
    launched_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    launched_at DATETIME,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (launched_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    respondent_type VARCHAR(50) NOT NULL,
    respondent_email VARCHAR(255),
    respondent_organization VARCHAR(255),
    responses TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES stakeholder_surveys(id)
);

CREATE TABLE IF NOT EXISTS engagement_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    stakeholder_groups TEXT NOT NULL,
    engagement_methods TEXT NOT NULL,
    frequency VARCHAR(50),
    objectives TEXT,
    success_metrics TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS engagement_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    stakeholder_group VARCHAR(50) NOT NULL,
    description TEXT,
    participants_count INTEGER,
    outcomes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    activity_date DATE,
    logged_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES engagement_plans(id),
    FOREIGN KEY (logged_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS stakeholder_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    stakeholder_type VARCHAR(50) NOT NULL,
    feedback_channel VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open',
    received_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Multi-Framework Mapping
CREATE TABLE IF NOT EXISTS framework_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_framework VARCHAR(20) NOT NULL,
    source_code VARCHAR(50) NOT NULL,
    target_framework VARCHAR(20) NOT NULL,
    target_code VARCHAR(50) NOT NULL,
    mapping_type VARCHAR(20) DEFAULT 'direct',
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- SDG Alignment
CREATE TABLE IF NOT EXISTS sdg_alignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    sdg_number INTEGER NOT NULL CHECK (sdg_number >= 1 AND sdg_number <= 17),
    target_number VARCHAR(10),
    alignment_level VARCHAR(20) DEFAULT 'contributing',
    contribution_description TEXT,
    metrics_tracked TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Compliance Calendar
CREATE TABLE IF NOT EXISTS compliance_calendar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    framework VARCHAR(50) NOT NULL,
    requirement_name VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    frequency VARCHAR(20) DEFAULT 'annual',
    status VARCHAR(20) DEFAULT 'pending',
    assigned_to INTEGER,
    reminder_sent BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Insert default framework mappings
INSERT OR IGNORE INTO framework_mappings (source_framework, source_code, target_framework, target_code, mapping_type) VALUES
('GRI', '305-1', 'SDG', '13.2.1', 'direct'),
('GRI', '305-2', 'SDG', '13.2.1', 'direct'),
('GRI', '303-3', 'SDG', '6.4.2', 'direct'),
('GRI', '401-1', 'SDG', '8.5.2', 'contributing'),
('GRI', '405-1', 'SDG', '5.5.2', 'direct'),
('GRI', '403-9', 'SDG', '8.8.1', 'direct'),
('GRI', '413-1', 'SDG', '11.3.2', 'contributing');

-- Insert default compliance calendar items
INSERT OR IGNORE INTO compliance_calendar (company_id, framework, requirement_name, due_date, frequency) VALUES
(1, 'CSRD', 'Annual Sustainability Report', '2025-04-30', 'annual'),
(1, 'GRI', 'GRI Standards Report', '2025-03-31', 'annual'),
(1, 'TCFD', 'Climate Risk Disclosure', '2025-06-30', 'annual'),
(1, 'SEC', 'Climate Disclosure Filing', '2025-03-31', 'annual');

-- Create indexes for Phase 4 tables
CREATE INDEX IF NOT EXISTS idx_gri_template_data_company ON gri_template_data(company_id, template_code);
CREATE INDEX IF NOT EXISTS idx_api_integrations_company ON api_integrations(company_id, active);
CREATE INDEX IF NOT EXISTS idx_stakeholder_surveys_company ON stakeholder_surveys(company_id, status);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_engagement_plans_company ON engagement_plans(company_id, status);
CREATE INDEX IF NOT EXISTS idx_stakeholder_feedback_company ON stakeholder_feedback(company_id, status);
CREATE INDEX IF NOT EXISTS idx_framework_mappings_source ON framework_mappings(source_framework, source_code);
CREATE INDEX IF NOT EXISTS idx_compliance_calendar_company ON compliance_calendar(company_id, due_date);