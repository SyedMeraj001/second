-- Enterprise Security & Compliance Schema

-- ISO 27001 Controls
CREATE TABLE IF NOT EXISTS iso27001_controls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id VARCHAR(20) NOT NULL UNIQUE,
    control_name VARCHAR(255) NOT NULL,
    control_category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    implementation_status VARCHAR(20) DEFAULT 'not_implemented' CHECK (implementation_status IN ('not_implemented', 'planned', 'implemented', 'verified')),
    risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    owner_id INTEGER,
    last_assessment_date DATE,
    next_assessment_date DATE,
    evidence_location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- SOC 2 Trust Service Criteria
CREATE TABLE IF NOT EXISTS soc2_controls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id VARCHAR(20) NOT NULL UNIQUE,
    trust_service_category VARCHAR(50) NOT NULL CHECK (trust_service_category IN ('security', 'availability', 'processing_integrity', 'confidentiality', 'privacy')),
    control_description TEXT NOT NULL,
    control_activity TEXT NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually')),
    automated BOOLEAN DEFAULT FALSE,
    owner_id INTEGER NOT NULL,
    testing_status VARCHAR(20) DEFAULT 'not_tested' CHECK (testing_status IN ('not_tested', 'passed', 'failed', 'exception')),
    last_test_date DATE,
    next_test_date DATE,
    evidence_collected BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Security Incidents
CREATE TABLE IF NOT EXISTS security_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id VARCHAR(50) UNIQUE NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'contained', 'resolved', 'closed')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_systems TEXT,
    impact_assessment TEXT,
    detected_at DATETIME NOT NULL,
    reported_by INTEGER,
    assigned_to INTEGER,
    resolved_at DATETIME,
    root_cause TEXT,
    remediation_actions TEXT,
    lessons_learned TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Threat Detection Events
CREATE TABLE IF NOT EXISTS threat_detection_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    threat_level VARCHAR(20) NOT NULL CHECK (threat_level IN ('info', 'low', 'medium', 'high', 'critical')),
    source_ip VARCHAR(45),
    target_ip VARCHAR(45),
    user_agent TEXT,
    request_path VARCHAR(500),
    request_method VARCHAR(10),
    response_code INTEGER,
    payload_size INTEGER,
    detection_rule VARCHAR(255),
    blocked BOOLEAN DEFAULT FALSE,
    false_positive BOOLEAN DEFAULT FALSE,
    investigated BOOLEAN DEFAULT FALSE,
    notes TEXT,
    detected_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Data Encryption Status
CREATE TABLE IF NOT EXISTS encryption_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_type VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    encryption_method VARCHAR(100) NOT NULL,
    key_management VARCHAR(100) NOT NULL,
    encryption_status VARCHAR(20) DEFAULT 'encrypted' CHECK (encryption_status IN ('encrypted', 'not_encrypted', 'in_progress')),
    last_key_rotation DATE,
    next_key_rotation DATE,
    compliance_status VARCHAR(20) DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'non_compliant', 'pending')),
    verified_by INTEGER,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- Security Assessments
CREATE TABLE IF NOT EXISTS security_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_type VARCHAR(50) NOT NULL,
    assessment_scope TEXT NOT NULL,
    assessor_name VARCHAR(255) NOT NULL,
    assessment_date DATE NOT NULL,
    findings_count INTEGER DEFAULT 0,
    critical_findings INTEGER DEFAULT 0,
    high_findings INTEGER DEFAULT 0,
    medium_findings INTEGER DEFAULT 0,
    low_findings INTEGER DEFAULT 0,
    overall_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('planned', 'in_progress', 'completed', 'remediation')),
    report_location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Evidence
CREATE TABLE IF NOT EXISTS compliance_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id VARCHAR(20) NOT NULL,
    framework VARCHAR(20) NOT NULL CHECK (framework IN ('ISO27001', 'SOC2', 'GDPR', 'CCPA')),
    evidence_type VARCHAR(50) NOT NULL,
    evidence_description TEXT NOT NULL,
    file_path VARCHAR(500),
    collected_by INTEGER NOT NULL,
    collection_date DATE NOT NULL,
    retention_period INTEGER DEFAULT 2555, -- 7 years in days
    expiry_date DATE,
    verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collected_by) REFERENCES users(id)
);

-- Security Metrics
CREATE TABLE IF NOT EXISTS security_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    measurement_date DATE NOT NULL,
    target_value DECIMAL(15,4),
    threshold_critical DECIMAL(15,4),
    threshold_warning DECIMAL(15,4),
    status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default ISO 27001 controls
INSERT OR IGNORE INTO iso27001_controls (control_id, control_name, control_category, description, risk_level) VALUES
('A.5.1.1', 'Information Security Policy', 'Information Security Policies', 'Management direction and support for information security', 'high'),
('A.6.1.1', 'Information Security Roles and Responsibilities', 'Organization of Information Security', 'Allocation of information security responsibilities', 'high'),
('A.8.1.1', 'Inventory of Assets', 'Asset Management', 'Assets associated with information and information processing facilities', 'medium'),
('A.9.1.1', 'Access Control Policy', 'Access Control', 'Business requirement of access control', 'high'),
('A.10.1.1', 'Cryptographic Policy', 'Cryptography', 'Policy on the use of cryptographic controls', 'high'),
('A.12.1.1', 'Operating Procedures', 'Operations Security', 'Documented operating procedures', 'medium'),
('A.13.1.1', 'Network Controls', 'Communications Security', 'Network security management', 'high'),
('A.14.1.1', 'Security in Development', 'System Acquisition', 'Information security requirements analysis', 'medium'),
('A.16.1.1', 'Incident Response', 'Information Security Incident Management', 'Responsibilities and procedures', 'critical'),
('A.17.1.1', 'Business Continuity', 'Information Security Aspects of BCM', 'Planning information security continuity', 'high');

-- Insert default SOC 2 controls
INSERT OR IGNORE INTO soc2_controls (control_id, trust_service_category, control_description, control_activity, frequency, automated, owner_id) VALUES
('CC1.1', 'security', 'Control Environment', 'Management demonstrates commitment to integrity and ethical values', 'continuous', FALSE, 1),
('CC2.1', 'security', 'Communication and Information', 'Management obtains or generates relevant, quality information', 'continuous', FALSE, 1),
('CC3.1', 'security', 'Risk Assessment', 'Management specifies objectives with sufficient clarity', 'quarterly', FALSE, 1),
('CC4.1', 'security', 'Monitoring Activities', 'Management selects, develops, and performs ongoing evaluations', 'monthly', TRUE, 1),
('CC5.1', 'security', 'Control Activities', 'Management selects and develops control activities', 'continuous', FALSE, 1),
('CC6.1', 'security', 'Logical and Physical Access', 'Management implements logical access security measures', 'daily', TRUE, 1),
('CC7.1', 'security', 'System Operations', 'Management designs and implements controls', 'continuous', TRUE, 1),
('CC8.1', 'security', 'Change Management', 'Management authorizes, designs, develops and configures changes', 'continuous', FALSE, 1),
('A1.1', 'availability', 'Availability Monitoring', 'System availability is monitored', 'continuous', TRUE, 1),
('PI1.1', 'processing_integrity', 'Data Processing', 'Processing integrity controls are implemented', 'continuous', TRUE, 1);

-- Insert default security metrics
INSERT OR IGNORE INTO security_metrics (metric_name, metric_value, metric_unit, measurement_date, target_value, threshold_warning, threshold_critical) VALUES
('Failed Login Attempts', 0, 'count/day', DATE('now'), 10, 50, 100),
('System Uptime', 99.9, 'percentage', DATE('now'), 99.9, 99.5, 99.0),
('Patch Compliance', 95.0, 'percentage', DATE('now'), 98.0, 90.0, 85.0),
('Vulnerability Scan Score', 8.5, 'score/10', DATE('now'), 9.0, 7.0, 6.0),
('Incident Response Time', 15, 'minutes', DATE('now'), 30, 60, 120),
('Data Backup Success Rate', 100.0, 'percentage', DATE('now'), 100.0, 95.0, 90.0);

-- Create indexes for security tables
CREATE INDEX IF NOT EXISTS idx_iso27001_controls_status ON iso27001_controls(implementation_status, risk_level);
CREATE INDEX IF NOT EXISTS idx_soc2_controls_category ON soc2_controls(trust_service_category, testing_status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity, status, detected_at);
CREATE INDEX IF NOT EXISTS idx_threat_events_level ON threat_detection_events(threat_level, detected_at);
CREATE INDEX IF NOT EXISTS idx_encryption_status_type ON encryption_status(data_type, encryption_status);
CREATE INDEX IF NOT EXISTS idx_security_metrics_date ON security_metrics(metric_name, measurement_date);