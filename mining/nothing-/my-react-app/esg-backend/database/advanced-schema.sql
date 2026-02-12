-- Advanced ESG Features Schema

-- Custom Taxonomies Table
CREATE TABLE IF NOT EXISTS custom_taxonomies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    categories TEXT NOT NULL, -- JSON array of categories and metrics
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ESG Risk Assessments Table
CREATE TABLE IF NOT EXISTS esg_risk_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('environmental', 'social', 'governance', 'operational', 'financial', 'regulatory')),
    impact INTEGER NOT NULL CHECK (impact >= 1 AND impact <= 5),
    probability INTEGER NOT NULL CHECK (probability >= 1 AND probability <= 5),
    risk_score INTEGER GENERATED ALWAYS AS (impact * probability) STORED,
    description TEXT,
    mitigation TEXT,
    owner VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'mitigated', 'closed')),
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_reviewed DATETIME,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Risk Mitigation Actions Table
CREATE TABLE IF NOT EXISTS risk_mitigation_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_id INTEGER NOT NULL,
    action_description TEXT NOT NULL,
    responsible_person VARCHAR(255),
    target_date DATE,
    completion_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (risk_id) REFERENCES esg_risk_assessments(id)
);

-- Taxonomy Usage Tracking
CREATE TABLE IF NOT EXISTS taxonomy_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taxonomy_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    usage_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_entries_count INTEGER DEFAULT 0,
    FOREIGN KEY (taxonomy_id) REFERENCES custom_taxonomies(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_taxonomies_created_by ON custom_taxonomies(created_by);
CREATE INDEX IF NOT EXISTS idx_esg_risk_assessments_category ON esg_risk_assessments(category, risk_score);
CREATE INDEX IF NOT EXISTS idx_esg_risk_assessments_score ON esg_risk_assessments(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_risk_mitigation_actions_risk_id ON risk_mitigation_actions(risk_id);
CREATE INDEX IF NOT EXISTS idx_taxonomy_usage_taxonomy_id ON taxonomy_usage(taxonomy_id);

-- Insert sample custom taxonomy
INSERT OR IGNORE INTO custom_taxonomies (id, name, description, categories, created_by) VALUES
(1, 'Mining Industry Standard', 'Comprehensive ESG taxonomy for mining operations', 
'[
  {
    "id": "environmental",
    "name": "Environmental",
    "description": "Environmental impact metrics",
    "metrics": [
      {"id": "water_usage", "name": "Water Usage", "type": "number", "unit": "m³", "required": true, "griCode": "303-5"},
      {"id": "land_disturbed", "name": "Land Disturbed", "type": "number", "unit": "hectares", "required": true, "griCode": "MM1"},
      {"id": "tailings_facilities", "name": "Tailings Facilities", "type": "number", "unit": "count", "required": true, "griCode": "MM3"}
    ]
  },
  {
    "id": "social",
    "name": "Social",
    "description": "Social responsibility metrics",
    "metrics": [
      {"id": "local_employment", "name": "Local Employment Rate", "type": "percentage", "unit": "%", "required": true, "griCode": "202-2"},
      {"id": "community_investment", "name": "Community Investment", "type": "currency", "unit": "USD", "required": false, "griCode": "413-1"}
    ]
  }
]', 1);

-- Insert sample risk assessments
INSERT OR IGNORE INTO esg_risk_assessments (name, category, impact, probability, description, mitigation, owner, created_by) VALUES
('Climate Change Physical Risk', 'environmental', 5, 4, 'Physical risks from extreme weather events affecting mining operations', 'Climate adaptation strategy, infrastructure hardening', 'Sustainability Team', 1),
('Water Scarcity Risk', 'environmental', 4, 3, 'Limited water availability in mining regions', 'Water recycling systems, alternative water sources', 'Operations Team', 1),
('Community Relations Risk', 'social', 4, 2, 'Potential conflicts with local communities over mining activities', 'Community engagement programs, benefit sharing agreements', 'Community Relations', 1),
('Regulatory Compliance Risk', 'governance', 4, 3, 'Risk of non-compliance with evolving ESG regulations', 'Regular compliance audits, legal monitoring system', 'Legal Team', 1),
('Supply Chain ESG Risk', 'operational', 3, 3, 'ESG-related risks in the supply chain', 'Supplier ESG assessments, sustainable procurement policies', 'Procurement Team', 1);