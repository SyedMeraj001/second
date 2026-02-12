-- SASB (Sustainability Accounting Standards Board) Integration Schema
-- Industry-specific sustainability metrics and reporting

CREATE TABLE IF NOT EXISTS sasb_compliance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    industry TEXT NOT NULL,
    standards TEXT NOT NULL, -- JSON array of applicable SASB standards
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(company_id, industry)
);

CREATE TABLE IF NOT EXISTS sasb_metric_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_code TEXT NOT NULL UNIQUE,
    topic TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Quantitative', 'Discussion and Analysis')),
    industry TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sasb_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    metric_code TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    topic TEXT NOT NULL,
    value TEXT, -- Can store numbers, text, or JSON
    unit TEXT,
    category TEXT NOT NULL,
    reporting_period TEXT NOT NULL, -- YYYY format
    data_source TEXT,
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'internal', 'external')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (metric_code) REFERENCES sasb_metric_definitions(metric_code),
    UNIQUE(company_id, metric_code, reporting_period)
);

CREATE TABLE IF NOT EXISTS sasb_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    reporting_period TEXT NOT NULL,
    industry TEXT NOT NULL,
    completion_rate REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'review', 'approved', 'published')),
    report_data TEXT, -- JSON containing full report
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    published_at TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(company_id, reporting_period)
);

-- Insert SASB metric definitions for Extractives & Minerals Processing (EM-MM)
INSERT OR IGNORE INTO sasb_metric_definitions (metric_code, topic, metric_name, unit, category, industry) VALUES
-- GHG Emissions
('EM-MM-110a.1', 'GHG Emissions', 'Gross global Scope 1 emissions', 'Metric tons (t) CO₂-e', 'Quantitative', 'extractives-minerals'),
('EM-MM-110a.2', 'GHG Emissions', 'Discussion of long-term and short-term strategy or plan to manage Scope 1 emissions', 'n/a', 'Discussion and Analysis', 'extractives-minerals'),

-- Air Quality
('EM-MM-120a.1', 'Air Quality', 'Air emissions of particulates (PM10, PM2.5), NOx, SOx, volatile organic compounds (VOCs), and hazardous air pollutants (HAPs)', 'Metric tons (t)', 'Quantitative', 'extractives-minerals'),

-- Energy Management
('EM-MM-130a.1', 'Energy Management', 'Total energy consumed, percentage grid electricity, percentage renewable', 'Gigajoules (GJ), Percentage (%)', 'Quantitative', 'extractives-minerals'),

-- Water & Wastewater Management
('EM-MM-140a.1', 'Water & Wastewater Management', 'Total fresh water withdrawn, percentage recycled, percentage in regions with High or Extremely High Baseline Water Stress', 'Thousand cubic meters (m³), Percentage (%)', 'Quantitative', 'extractives-minerals'),
('EM-MM-140a.2', 'Water & Wastewater Management', 'Number of incidents of non-compliance associated with water quality permits, standards, and regulations', 'Number', 'Quantitative', 'extractives-minerals'),

-- Waste & Hazardous Materials Management
('EM-MM-150a.1', 'Waste & Hazardous Materials', 'Total weight of tailings waste, percentage recycled', 'Metric tons (t), Percentage (%)', 'Quantitative', 'extractives-minerals'),
('EM-MM-150a.2', 'Waste & Hazardous Materials', 'Total weight of mineral processing waste, percentage recycled', 'Metric tons (t), Percentage (%)', 'Quantitative', 'extractives-minerals'),
('EM-MM-150a.3', 'Waste & Hazardous Materials', 'Number of tailings impoundments, broken down by MSHA hazard potential', 'Number', 'Quantitative', 'extractives-minerals'),

-- Biodiversity Impacts
('EM-MM-160a.1', 'Biodiversity Impacts', 'Description of environmental management policies and practices for active sites', 'n/a', 'Discussion and Analysis', 'extractives-minerals'),
('EM-MM-160a.2', 'Biodiversity Impacts', 'Percentage of mine sites where acid rock drainage is predicted to occur, the percentage of mine sites where acid rock drainage is actively mitigated, and the percentage of mine sites where acid rock drainage is under treatment or remediation', 'Percentage (%)', 'Quantitative', 'extractives-minerals'),
('EM-MM-160a.3', 'Biodiversity Impacts', 'Percentage of (1) proved and (2) probable reserves in or near sites with protected conservation status or endangered species habitat', 'Percentage (%)', 'Quantitative', 'extractives-minerals'),

-- Security, Human Rights & Rights of Indigenous Peoples
('EM-MM-210a.1', 'Security, Human Rights & Rights of Indigenous Peoples', 'Percentage of reserves in or near areas of conflict', 'Percentage (%)', 'Quantitative', 'extractives-minerals'),
('EM-MM-210a.2', 'Security, Human Rights & Rights of Indigenous Peoples', 'Percentage of reserves in or near indigenous land', 'Percentage (%)', 'Quantitative', 'extractives-minerals'),
('EM-MM-210a.3', 'Security, Human Rights & Rights of Indigenous Peoples', 'Discussion of engagement processes and due diligence practices with respect to human rights, indigenous rights, and operation in areas of conflict', 'n/a', 'Discussion and Analysis', 'extractives-minerals'),

-- Community Relations
('EM-MM-210b.1', 'Community Relations', 'Discussion of process to manage risks and opportunities associated with community rights and interests', 'n/a', 'Discussion and Analysis', 'extractives-minerals'),
('EM-MM-210b.2', 'Community Relations', 'Number and duration of non-technical delays', 'Number, Days', 'Quantitative', 'extractives-minerals'),

-- Labor Relations
('EM-MM-310a.1', 'Labor Relations', 'Percentage of active workforce covered under collective bargaining agreements, broken down by U.S. and foreign employees', 'Percentage (%)', 'Quantitative', 'extractives-minerals'),
('EM-MM-310a.2', 'Labor Relations', 'Number and duration of strikes and lockouts', 'Number, Days', 'Quantitative', 'extractives-minerals'),

-- Workforce Health & Safety
('EM-MM-320a.1', 'Workforce Health & Safety', 'MSHA all-incidence rate, fatality rate, near miss frequency rate (NMFR), and average hours of health, safety, and emergency response training', 'Rate, Hours', 'Quantitative', 'extractives-minerals'),

-- Business Ethics & Transparency
('EM-MM-510a.1', 'Business Ethics & Transparency', 'Description of the management system for prevention of corruption and bribery throughout the value chain', 'n/a', 'Discussion and Analysis', 'extractives-minerals'),
('EM-MM-510a.2', 'Business Ethics & Transparency', 'Production in countries that have the 20 lowest rankings in Transparency International''s Corruption Perception Index', 'Metric tons (t) saleable', 'Quantitative', 'extractives-minerals');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sasb_compliance_company ON sasb_compliance(company_id);
CREATE INDEX IF NOT EXISTS idx_sasb_metrics_company_period ON sasb_metrics(company_id, reporting_period);
CREATE INDEX IF NOT EXISTS idx_sasb_metrics_code ON sasb_metrics(metric_code);
CREATE INDEX IF NOT EXISTS idx_sasb_metrics_topic ON sasb_metrics(topic);
CREATE INDEX IF NOT EXISTS idx_sasb_reports_company ON sasb_reports(company_id, reporting_period);