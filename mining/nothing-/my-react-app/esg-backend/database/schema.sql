-- ESG Application Database Schema - Phase 1 Enhanced

-- Enhanced Users with RBAC
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'verifier', 'approver', 'viewer')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
    site_access TEXT, -- JSON array of site IDs
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME NULL,
    last_login DATETIME NULL
);

-- Enhanced Companies with hierarchy
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    region VARCHAR(100),
    parent_company_id INTEGER,
    site_level VARCHAR(50) DEFAULT 'corporate' CHECK (site_level IN ('corporate', 'business_unit', 'site')),
    reporting_framework VARCHAR(50) DEFAULT 'GRI',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (parent_company_id) REFERENCES companies(id)
);

-- Enhanced ESG Data with validation
CREATE TABLE IF NOT EXISTS esg_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    reporting_year INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(15,4),
    unit VARCHAR(50),
    framework_code VARCHAR(50),
    gri_code VARCHAR(20),
    data_quality_score INTEGER DEFAULT 0 CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'published')),
    approved_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ESG Scores
CREATE TABLE IF NOT EXISTS esg_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    reporting_year INTEGER NOT NULL,
    environmental_score DECIMAL(5,2) DEFAULT 0,
    social_score DECIMAL(5,2) DEFAULT 0,
    governance_score DECIMAL(5,2) DEFAULT 0,
    overall_score DECIMAL(5,2) DEFAULT 0,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Emissions Data (GHG Protocol)
CREATE TABLE IF NOT EXISTS emissions_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    reporting_year INTEGER NOT NULL,
    scope INTEGER NOT NULL CHECK (scope IN (1, 2, 3)),
    emission_source VARCHAR(255) NOT NULL,
    co2_equivalent DECIMAL(15,4) NOT NULL,
    calculation_method VARCHAR(100),
    verification_status VARCHAR(50) DEFAULT 'unverified',
    data_quality_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Materiality Assessments
CREATE TABLE IF NOT EXISTS materiality_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    topic_id VARCHAR(100) NOT NULL,
    topic_name VARCHAR(255) NOT NULL,
    impact_materiality DECIMAL(3,1) CHECK (impact_materiality >= 1 AND impact_materiality <= 5),
    financial_materiality DECIMAL(3,1) CHECK (financial_materiality >= 1 AND financial_materiality <= 5),
    stakeholder_priority DECIMAL(3,1) CHECK (stakeholder_priority >= 1 AND stakeholder_priority <= 5),
    overall_score DECIMAL(3,1) GENERATED ALWAYS AS ((impact_materiality + financial_materiality + stakeholder_priority) / 3) STORED,
    assessment_year INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT')),
    old_values TEXT,
    new_values TEXT,
    user_id INTEGER NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Validation Rules
CREATE TABLE IF NOT EXISTS validation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    required_unit VARCHAR(50),
    validation_formula TEXT,
    error_message TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- Approval Workflows
CREATE TABLE IF NOT EXISTS approval_workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    data_id INTEGER NOT NULL,
    workflow_level INTEGER NOT NULL CHECK (workflow_level IN (1, 2, 3, 4)), -- site, business_unit, group_esg, executive
    approver_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (data_id) REFERENCES esg_data(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Evidence Storage
CREATE TABLE IF NOT EXISTS evidence_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (data_id) REFERENCES esg_data(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Insert validation rules
INSERT OR IGNORE INTO validation_rules (metric_name, category, min_value, max_value, required_unit, error_message) VALUES
('scope1Emissions', 'environmental', 0, 10000000, 'tCO2e', 'Scope 1 emissions must be between 0 and 10M tCO2e'),
('scope2Emissions', 'environmental', 0, 10000000, 'tCO2e', 'Scope 2 emissions must be between 0 and 10M tCO2e'),
('scope3Emissions', 'environmental', 0, 50000000, 'tCO2e', 'Scope 3 emissions must be between 0 and 50M tCO2e'),
('femaleEmployeesPercentage', 'social', 0, 100, '%', 'Female employees percentage must be between 0 and 100'),
('independentDirectorsPercentage', 'governance', 0, 100, '%', 'Independent directors percentage must be between 0 and 100');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_esg_data_company_year ON esg_data(company_id, reporting_year);
CREATE INDEX IF NOT EXISTS idx_emissions_company_year ON emissions_data(company_id, reporting_year);
CREATE INDEX IF NOT EXISTS idx_audit_trail_table_record ON audit_trail(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_data ON approval_workflows(data_id, status);

-- Insert default admin
INSERT OR IGNORE INTO users (email, password_hash, full_name, role, status, approved_at) 
VALUES ('admin@esgenius.com', '$2b$10$admin123hash', 'ESG Admin', 'admin', 'approved', CURRENT_TIMESTAMP);