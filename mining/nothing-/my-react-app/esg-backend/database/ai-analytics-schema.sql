-- AI ESG Scoring and Science-Based Targets Schema
-- Phase 4C - AI & Advanced Analytics

CREATE TABLE IF NOT EXISTS ai_esg_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    overall_score INTEGER NOT NULL,
    rating TEXT NOT NULL,
    environmental_score INTEGER NOT NULL,
    social_score INTEGER NOT NULL,
    governance_score INTEGER NOT NULL,
    score_data TEXT NOT NULL, -- JSON containing detailed scoring breakdown
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS sbti_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('absolute', 'intensity', 'renewable')),
    scope TEXT NOT NULL CHECK (scope IN ('scope1', 'scope2', 'scope1+2', 'scope3')),
    pathway TEXT NOT NULL CHECK (pathway IN ('1.5C', '2C')),
    baseline_year INTEGER NOT NULL,
    baseline_emissions REAL NOT NULL,
    target_year INTEGER NOT NULL,
    target_emissions REAL NOT NULL,
    reduction_percent REAL NOT NULL,
    annual_reduction_rate REAL NOT NULL,
    sbti_approved BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'active', 'achieved')),
    sector TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS sbti_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id INTEGER NOT NULL,
    reporting_year INTEGER NOT NULL,
    current_emissions REAL NOT NULL,
    progress_actual REAL NOT NULL, -- % of target achieved
    progress_expected REAL NOT NULL, -- % expected by this year
    on_track BOOLEAN NOT NULL,
    years_remaining INTEGER NOT NULL,
    required_annual_reduction REAL NOT NULL, -- % per year needed
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_id) REFERENCES sbti_targets(id),
    UNIQUE(target_id, reporting_year)
);

CREATE TABLE IF NOT EXISTS ai_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('esg_score', 'emissions', 'risk')),
    target_year INTEGER NOT NULL,
    predicted_value REAL NOT NULL,
    confidence_level REAL NOT NULL, -- 0-1 scale
    model_version TEXT NOT NULL,
    input_data TEXT NOT NULL, -- JSON containing input parameters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS materiality_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    topic TEXT NOT NULL,
    business_impact REAL NOT NULL, -- 1-5 scale
    stakeholder_concern REAL NOT NULL, -- 1-5 scale
    materiality_score REAL NOT NULL, -- calculated score
    priority_level TEXT NOT NULL CHECK (priority_level IN ('high', 'medium', 'low')),
    assessment_method TEXT NOT NULL, -- 'ai_analysis', 'stakeholder_survey', 'expert_review'
    assessment_year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(company_id, topic, assessment_year)
);

CREATE TABLE IF NOT EXISTS esg_risk_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    risk_category TEXT NOT NULL CHECK (risk_category IN ('environmental', 'social', 'governance')),
    risk_type TEXT NOT NULL,
    probability REAL NOT NULL, -- 0-1 scale
    impact_severity REAL NOT NULL, -- 1-5 scale
    risk_score REAL NOT NULL, -- calculated risk score
    time_horizon TEXT NOT NULL CHECK (time_horizon IN ('short', 'medium', 'long')),
    mitigation_strategies TEXT, -- JSON array of strategies
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS performance_optimization (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    metric_name TEXT NOT NULL,
    current_value REAL NOT NULL,
    target_value REAL NOT NULL,
    optimization_potential REAL NOT NULL, -- % improvement possible
    recommended_actions TEXT NOT NULL, -- JSON array of actions
    estimated_cost REAL,
    estimated_timeline INTEGER, -- months
    priority_score REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Insert sample AI model configurations
INSERT OR IGNORE INTO ai_predictions (company_id, prediction_type, target_year, predicted_value, confidence_level, model_version, input_data) VALUES
(1, 'esg_score', 2025, 72.5, 0.85, 'v1.0', '{"environmental": 68, "social": 75, "governance": 74}'),
(1, 'emissions', 2030, 150000, 0.78, 'v1.0', '{"baseline": 200000, "reduction_rate": 0.045}');

-- Insert sample materiality topics
INSERT OR IGNORE INTO materiality_assessments (company_id, topic, business_impact, stakeholder_concern, materiality_score, priority_level, assessment_method, assessment_year) VALUES
(1, 'Climate Change', 4.8, 4.9, 4.85, 'high', 'ai_analysis', 2024),
(1, 'Water Management', 4.2, 4.1, 4.15, 'high', 'ai_analysis', 2024),
(1, 'Biodiversity', 3.8, 4.3, 4.05, 'high', 'ai_analysis', 2024),
(1, 'Workplace Safety', 4.5, 4.2, 4.35, 'high', 'ai_analysis', 2024),
(1, 'Community Relations', 3.9, 4.0, 3.95, 'medium', 'ai_analysis', 2024),
(1, 'Supply Chain', 3.5, 3.8, 3.65, 'medium', 'ai_analysis', 2024);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_esg_scores_company ON ai_esg_scores(company_id, calculated_at);
CREATE INDEX IF NOT EXISTS idx_sbti_targets_company ON sbti_targets(company_id, status);
CREATE INDEX IF NOT EXISTS idx_sbti_progress_target ON sbti_progress(target_id, reporting_year);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_company ON ai_predictions(company_id, prediction_type);
CREATE INDEX IF NOT EXISTS idx_materiality_company_year ON materiality_assessments(company_id, assessment_year);
CREATE INDEX IF NOT EXISTS idx_esg_risks_company ON esg_risk_predictions(company_id, risk_category);