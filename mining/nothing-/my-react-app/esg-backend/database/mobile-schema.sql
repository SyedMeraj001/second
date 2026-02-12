-- Mobile Offline Data Management Schema

-- Offline Data Storage
CREATE TABLE IF NOT EXISTS offline_data_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    offline_id VARCHAR(50) UNIQUE NOT NULL,
    company_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    device_id VARCHAR(100),
    data_type VARCHAR(50) NOT NULL,
    form_data TEXT NOT NULL,
    location_data TEXT,
    created_offline_at DATETIME NOT NULL,
    synced_at DATETIME,
    sync_attempts INTEGER DEFAULT 0,
    last_sync_attempt DATETIME,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'conflict')),
    conflict_resolution TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Mobile Device Registration
CREATE TABLE IF NOT EXISTS mobile_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    os_version VARCHAR(50),
    app_version VARCHAR(20),
    push_token VARCHAR(500),
    last_active DATETIME,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sync Logs for Mobile
CREATE TABLE IF NOT EXISTS mobile_sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id VARCHAR(100) NOT NULL,
    user_id INTEGER NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    sync_duration INTEGER,
    error_details TEXT,
    sync_status VARCHAR(20) DEFAULT 'completed',
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Mobile Form Templates Cache
CREATE TABLE IF NOT EXISTS mobile_form_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_code VARCHAR(50) NOT NULL,
    template_version VARCHAR(20) NOT NULL,
    template_data TEXT NOT NULL,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    UNIQUE(template_code, template_version)
);

-- Location-based Data Collection
CREATE TABLE IF NOT EXISTS location_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_entry_id INTEGER NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy DECIMAL(8, 2),
    altitude DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(8, 2),
    timestamp DATETIME NOT NULL,
    address TEXT,
    site_name VARCHAR(255),
    FOREIGN KEY (data_entry_id) REFERENCES esg_data(id)
);

-- Mobile App Settings
CREATE TABLE IF NOT EXISTS mobile_app_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, device_id, setting_key)
);

-- Photo/Document Attachments for Mobile
CREATE TABLE IF NOT EXISTS mobile_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_entry_id INTEGER NOT NULL,
    offline_id VARCHAR(50),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    file_path VARCHAR(500),
    thumbnail_path VARCHAR(500),
    upload_status VARCHAR(20) DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'failed')),
    captured_at DATETIME,
    uploaded_at DATETIME,
    metadata TEXT,
    FOREIGN KEY (data_entry_id) REFERENCES esg_data(id)
);

-- Mobile Notifications
CREATE TABLE IF NOT EXISTS mobile_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_id VARCHAR(100),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    sent_at DATETIME,
    delivered_at DATETIME,
    read_at DATETIME,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Field Data Collection Sessions
CREATE TABLE IF NOT EXISTS field_data_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    company_id INTEGER NOT NULL,
    site_name VARCHAR(255),
    session_type VARCHAR(50) NOT NULL,
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    total_entries INTEGER DEFAULT 0,
    synced_entries INTEGER DEFAULT 0,
    session_status VARCHAR(20) DEFAULT 'active' CHECK (session_status IN ('active', 'completed', 'abandoned')),
    location_data TEXT,
    weather_data TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create indexes for mobile tables
CREATE INDEX IF NOT EXISTS idx_offline_data_user_status ON offline_data_entries(user_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_offline_data_offline_id ON offline_data_entries(offline_id);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_user ON mobile_devices(user_id, active);
CREATE INDEX IF NOT EXISTS idx_mobile_sync_logs_device ON mobile_sync_logs(device_id, started_at);
CREATE INDEX IF NOT EXISTS idx_location_data_entry ON location_data(data_entry_id);
CREATE INDEX IF NOT EXISTS idx_mobile_attachments_entry ON mobile_attachments(data_entry_id, upload_status);
CREATE INDEX IF NOT EXISTS idx_mobile_notifications_user ON mobile_notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_field_sessions_user ON field_data_sessions(user_id, session_status);

-- Insert default mobile form templates
INSERT OR IGNORE INTO mobile_form_cache (template_code, template_version, template_data) VALUES
('environmental_quick', '1.0', '{"sections":[{"title":"Environmental","fields":[{"key":"scope1Emissions","label":"Scope 1 Emissions","type":"number","unit":"tCO2e","required":true},{"key":"energyConsumption","label":"Energy Consumption","type":"number","unit":"MWh","required":true}]}]}'),
('social_quick', '1.0', '{"sections":[{"title":"Social","fields":[{"key":"totalEmployees","label":"Total Employees","type":"number","required":true},{"key":"safetyIncidents","label":"Safety Incidents","type":"number","required":true}]}]}'),
('mining_inspection', '1.0', '{"sections":[{"title":"Mining Inspection","fields":[{"key":"tailingsFacilities","label":"Tailings Facilities","type":"number","required":true},{"key":"waterQuality","label":"Water Quality","type":"select","options":["excellent","good","fair","poor"],"required":true}]}]}');

-- Insert default mobile app settings
INSERT OR IGNORE INTO mobile_app_settings (user_id, device_id, setting_key, setting_value) VALUES
(1, 'default', 'auto_sync_enabled', 'true'),
(1, 'default', 'location_tracking_enabled', 'true'),
(1, 'default', 'offline_storage_limit', '100'),
(1, 'default', 'photo_quality', 'medium'),
(1, 'default', 'sync_frequency', '300');