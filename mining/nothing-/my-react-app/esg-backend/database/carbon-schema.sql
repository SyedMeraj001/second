-- Carbon Emissions Tracking Schema
-- GHG Protocol Compliant Carbon Footprint Management

CREATE TABLE IF NOT EXISTS carbon_emissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('scope1', 'scope2', 'scope3')),
    total_emissions REAL NOT NULL,
    breakdown TEXT NOT NULL, -- JSON data for detailed breakdown
    period TEXT NOT NULL, -- YYYY-MM-DD format
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP NULL,
    verifier_id INTEGER NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(company_id, scope, period)
);

CREATE TABLE IF NOT EXISTS emission_factors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL, -- scope1, scope2, scope3
    fuel_type TEXT NOT NULL,
    emission_factor REAL NOT NULL,
    unit TEXT NOT NULL,
    region TEXT DEFAULT 'global',
    source TEXT NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carbon_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('absolute', 'intensity', 'renewable')),
    scope TEXT NOT NULL CHECK (scope IN ('scope1', 'scope2', 'scope3', 'total')),
    baseline_year INTEGER NOT NULL,
    baseline_emissions REAL NOT NULL,
    target_year INTEGER NOT NULL,
    target_reduction_percent REAL NOT NULL,
    target_absolute_value REAL NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'revised', 'cancelled')),
    sbti_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS carbon_offsets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    project_name TEXT NOT NULL,
    project_type TEXT NOT NULL, -- forestry, renewable, methane, etc.
    offset_amount REAL NOT NULL, -- tCO2e
    vintage_year INTEGER NOT NULL,
    standard TEXT NOT NULL, -- VCS, Gold Standard, etc.
    registry_id TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    retirement_date DATE NULL,
    cost_per_tonne REAL NULL,
    total_cost REAL NULL,
    status TEXT DEFAULT 'purchased' CHECK (status IN ('purchased', 'retired', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Insert default emission factors
INSERT OR IGNORE INTO emission_factors (category, fuel_type, emission_factor, unit, source, valid_from) VALUES
-- Scope 1 factors (tCO2e per unit)
('scope1', 'natural_gas', 0.0053, 'tCO2e/kWh', 'EPA 2023', '2023-01-01'),
('scope1', 'diesel', 2.68, 'tCO2e/liter', 'IPCC 2023', '2023-01-01'),
('scope1', 'gasoline', 2.31, 'tCO2e/liter', 'IPCC 2023', '2023-01-01'),
('scope1', 'coal', 2.42, 'tCO2e/kg', 'IPCC 2023', '2023-01-01'),
('scope1', 'propane', 1.51, 'tCO2e/liter', 'EPA 2023', '2023-01-01'),

-- Scope 2 factors (tCO2e per MWh)
('scope2', 'grid_average', 0.4, 'tCO2e/MWh', 'IEA 2023', '2023-01-01'),
('scope2', 'renewable', 0.0, 'tCO2e/MWh', 'RE100', '2023-01-01'),
('scope2', 'coal', 0.82, 'tCO2e/MWh', 'IPCC 2023', '2023-01-01'),
('scope2', 'natural_gas', 0.35, 'tCO2e/MWh', 'IPCC 2023', '2023-01-01'),

-- Scope 3 factors
('scope3', 'business_travel', 0.21, 'tCO2e/km', 'DEFRA 2023', '2023-01-01'),
('scope3', 'employee_commuting', 0.17, 'tCO2e/km', 'DEFRA 2023', '2023-01-01'),
('scope3', 'waste_disposal', 0.57, 'tCO2e/tonne', 'EPA 2023', '2023-01-01'),
('scope3', 'purchased_goods', 2.1, 'tCO2e/$1000', 'Exiobase 2023', '2023-01-01');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_carbon_emissions_company_period ON carbon_emissions(company_id, period);
CREATE INDEX IF NOT EXISTS idx_carbon_emissions_scope ON carbon_emissions(scope);
CREATE INDEX IF NOT EXISTS idx_emission_factors_category ON emission_factors(category, fuel_type);
CREATE INDEX IF NOT EXISTS idx_carbon_targets_company ON carbon_targets(company_id);
CREATE INDEX IF NOT EXISTS idx_carbon_offsets_company ON carbon_offsets(company_id);