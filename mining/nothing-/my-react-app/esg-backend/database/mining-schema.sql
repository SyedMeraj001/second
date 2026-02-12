-- Mining-Specific ESG Tables

-- Tailings Management (GRI 11)
CREATE TABLE IF NOT EXISTS mining_tailings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    facility_count INTEGER NOT NULL,
    total_volume DECIMAL(15,2),
    construction_method VARCHAR(100),
    risk_classification VARCHAR(20) CHECK (risk_classification IN ('low', 'significant', 'high', 'extreme')),
    monitoring_frequency VARCHAR(20) CHECK (monitoring_frequency IN ('continuous', 'daily', 'weekly', 'monthly', 'annual')),
    stability_assessment BOOLEAN DEFAULT FALSE,
    emergency_preparedness BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Biodiversity & Land Use
CREATE TABLE IF NOT EXISTS mining_biodiversity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    total_land_disturbed DECIMAL(10,2), -- hectares
    land_rehabilitated DECIMAL(10,2), -- hectares
    protected_areas_impact INTEGER DEFAULT 0,
    species_at_risk INTEGER DEFAULT 0,
    habitat_restoration DECIMAL(10,2), -- hectares
    biodiversity_offset DECIMAL(10,2), -- hectares
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Community Relations & Indigenous Rights
CREATE TABLE IF NOT EXISTS mining_community (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    consultation_meetings INTEGER DEFAULT 0,
    grievance_mechanism VARCHAR(50) CHECK (grievance_mechanism IN ('implemented', 'partial', 'not_implemented')),
    local_employment_rate DECIMAL(5,2), -- percentage
    community_investment DECIMAL(15,2), -- USD
    indigenous_consultation BOOLEAN DEFAULT FALSE,
    cultural_heritage_sites INTEGER DEFAULT 0,
    resettlement_households INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Water Stewardship
CREATE TABLE IF NOT EXISTS mining_water (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    water_withdrawal DECIMAL(15,2), -- cubic meters
    water_discharge DECIMAL(15,2), -- cubic meters
    water_recycled DECIMAL(15,2), -- cubic meters
    water_quality_incidents INTEGER DEFAULT 0,
    groundwater_monitoring BOOLEAN DEFAULT FALSE,
    watershed_management BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Mining Risk Library
CREATE TABLE IF NOT EXISTS mining_risks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_category VARCHAR(50) NOT NULL,
    risk_name VARCHAR(255) NOT NULL,
    description TEXT,
    likelihood VARCHAR(20) CHECK (likelihood IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    impact VARCHAR(20) CHECK (impact IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    mitigation_measures TEXT,
    regulatory_reference VARCHAR(255),
    active BOOLEAN DEFAULT TRUE
);

-- Mining KPI Library
CREATE TABLE IF NOT EXISTS mining_kpis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kpi_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(50),
    target_value DECIMAL(15,4),
    benchmark_value DECIMAL(15,4),
    calculation_method TEXT,
    gri_reference VARCHAR(20),
    active BOOLEAN DEFAULT TRUE
);

-- Insert default mining risks
INSERT OR IGNORE INTO mining_risks (risk_category, risk_name, description, likelihood, impact, mitigation_measures) VALUES
('Environmental', 'Tailings Dam Failure', 'Catastrophic failure of tailings storage facility', 'low', 'very_high', 'Regular monitoring, emergency response plans, proper design'),
('Environmental', 'Acid Mine Drainage', 'Contamination of water sources from mining operations', 'medium', 'high', 'Water treatment systems, proper waste rock management'),
('Social', 'Community Displacement', 'Forced relocation of local communities', 'medium', 'high', 'Early consultation, fair compensation, resettlement planning'),
('Environmental', 'Biodiversity Loss', 'Impact on local flora and fauna', 'high', 'medium', 'Biodiversity management plans, habitat restoration'),
('Social', 'Indigenous Rights Violations', 'Failure to respect indigenous land rights', 'medium', 'high', 'Free, prior, informed consent processes'),
('Operational', 'Mine Safety Incidents', 'Worker injuries or fatalities', 'medium', 'very_high', 'Safety training, equipment maintenance, incident reporting');

-- Insert default mining KPIs
INSERT OR IGNORE INTO mining_kpis (kpi_name, category, unit, calculation_method, gri_reference) VALUES
('Tailings Facilities Count', 'Environmental', 'count', 'Total number of active tailings facilities', 'GRI-11-1'),
('Land Rehabilitation Rate', 'Environmental', '%', '(Land Rehabilitated / Total Land Disturbed) * 100', 'GRI-11-2'),
('Water Recycling Rate', 'Environmental', '%', '(Water Recycled / Water Withdrawal) * 100', 'GRI-303-3'),
('Local Employment Rate', 'Social', '%', '(Local Employees / Total Employees) * 100', 'GRI-413-1'),
('Community Investment', 'Social', 'USD', 'Total investment in community development programs', 'GRI-413-1'),
('Lost Time Injury Frequency Rate', 'Social', 'rate', '(Lost Time Injuries * 1,000,000) / Total Hours Worked', 'GRI-403-9'),
('Scope 1 Emissions Intensity', 'Environmental', 'tCO2e/tonne', 'Scope 1 Emissions / Production Volume', 'GRI-305-4'),
('Water Quality Incidents', 'Environmental', 'count', 'Number of water quality exceedances', 'GRI-303-3');

-- Create indexes for mining tables
CREATE INDEX IF NOT EXISTS idx_mining_tailings_company ON mining_tailings(company_id);
CREATE INDEX IF NOT EXISTS idx_mining_biodiversity_company ON mining_biodiversity(company_id);
CREATE INDEX IF NOT EXISTS idx_mining_community_company ON mining_community(company_id);
CREATE INDEX IF NOT EXISTS idx_mining_water_company ON mining_water(company_id);