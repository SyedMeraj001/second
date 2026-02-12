const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../database/db');

class DataImportExportSystem {
  // Excel Template Generation
  static generateExcelTemplate(templateType = 'comprehensive') {
    // Sanitize template type to prevent path traversal
    const allowedTypes = ['comprehensive', 'mining'];
    const sanitizedType = allowedTypes.includes(templateType) ? templateType : 'comprehensive';
    
    const templates = {
      comprehensive: {
        'Environmental Data': [
          ['Metric Code', 'Metric Name', 'Value', 'Unit', 'Reporting Year', 'Comments'],
          ['305-1', 'Scope 1 GHG Emissions', '', 'tCO2e', '2024', ''],
          ['305-2', 'Scope 2 GHG Emissions', '', 'tCO2e', '2024', ''],
          ['302-1', 'Energy Consumption', '', 'MWh', '2024', ''],
          ['303-3', 'Water Withdrawal', '', 'm³', '2024', ''],
          ['306-3', 'Waste Generated', '', 'tonnes', '2024', '']
        ],
        'Social Data': [
          ['Metric Code', 'Metric Name', 'Value', 'Unit', 'Reporting Year', 'Comments'],
          ['401-1', 'Employee Turnover Rate', '', '%', '2024', ''],
          ['403-9', 'Lost Time Injury Rate', '', 'rate', '2024', ''],
          ['404-1', 'Training Hours per Employee', '', 'hours', '2024', ''],
          ['405-1', 'Female Employees Percentage', '', '%', '2024', '']
        ],
        'Governance Data': [
          ['Metric Code', 'Metric Name', 'Value', 'Unit', 'Reporting Year', 'Comments'],
          ['102-22', 'Board Size', '', 'count', '2024', ''],
          ['102-22', 'Independent Directors %', '', '%', '2024', ''],
          ['205-3', 'Corruption Incidents', '', 'count', '2024', ''],
          ['418-1', 'Data Breach Incidents', '', 'count', '2024', '']
        ]
      },
      mining: {
        'Mining Specific': [
          ['Metric Code', 'Metric Name', 'Value', 'Unit', 'Reporting Year', 'Comments'],
          ['14-1', 'Tailings Facilities Count', '', 'count', '2024', ''],
          ['14-4', 'Total Land Disturbed', '', 'hectares', '2024', ''],
          ['14-5', 'Land Rehabilitated', '', 'hectares', '2024', ''],
          ['413-1', 'Local Employment Rate', '', '%', '2024', ''],
          ['413-2', 'Community Investment', '', 'USD', '2024', '']
        ]
      }
    };

    const workbook = XLSX.utils.book_new();
    const template = templates[sanitizedType];

    Object.entries(template).forEach(([sheetName, data]) => {
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const filename = `ESG_Import_Template_${sanitizedType}_${Date.now()}.xlsx`;
    const filepath = path.join(process.cwd(), 'templates', path.basename(filename));
    
    // Ensure templates directory exists
    const templatesDir = path.dirname(filepath);
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    XLSX.writeFile(workbook, filepath);
    return { filename, filepath };
  }

  // Excel Data Import with path validation
  static async importExcelData(filepath, companyId, userId) {
    // Validate file path to prevent path traversal
    const sanitizedPath = path.resolve(filepath);
    if (!sanitizedPath.includes('uploads') && !sanitizedPath.includes('temp')) {
      throw new Error('Invalid file path');
    }
    
    const workbook = XLSX.readFile(sanitizedPath);
    const results = { imported: 0, errors: [], warnings: [] };

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      for (const row of data) {
        try {
          await this.processImportRow(row, companyId, userId, sheetName);
          results.imported++;
        } catch (error) {
          results.errors.push(`Row ${results.imported + results.errors.length + 1}: ${error.message}`);
        }
      }
    }

    return results;
  }

  // CSV Data Import
  static async importCSVData(filepath, companyId, userId) {
    return new Promise((resolve, reject) => {
      const results = { imported: 0, errors: [], warnings: [] };
      const rows = [];

      fs.createReadStream(filepath)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', async () => {
          for (const row of rows) {
            try {
              await this.processImportRow(row, companyId, userId, 'CSV');
              results.imported++;
            } catch (error) {
              results.errors.push(`Row ${results.imported + results.errors.length + 1}: ${error.message}`);
            }
          }
          resolve(results);
        })
        .on('error', reject);
    });
  }

  // Process Individual Import Row with SQL injection protection
  static async processImportRow(row, companyId, userId, source) {
    const metricCode = row['Metric Code'] || row.metric_code;
    const metricName = row['Metric Name'] || row.metric_name;
    const value = row['Value'] || row.value;
    const unit = row['Unit'] || row.unit;
    const reportingYear = row['Reporting Year'] || row.reporting_year || new Date().getFullYear();

    if (!metricCode || !value) {
      throw new Error('Missing required fields: Metric Code and Value');
    }

    // Sanitize inputs
    const sanitizedMetricCode = String(metricCode).replace(/[^a-zA-Z0-9-]/g, '');
    const sanitizedMetricName = String(metricName).substring(0, 255);
    const sanitizedValue = parseFloat(value);
    const sanitizedUnit = String(unit || '').substring(0, 50);
    const sanitizedYear = parseInt(reportingYear);
    
    if (isNaN(sanitizedValue) || isNaN(sanitizedYear)) {
      throw new Error('Invalid numeric values');
    }

    const category = this.determineCategory(sanitizedMetricCode);
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT INTO esg_data (company_id, user_id, reporting_year, category, 
        metric_name, metric_value, unit, framework_code, gri_code, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'GRI', ?, 'imported', CURRENT_TIMESTAMP)`);
      
      stmt.run([companyId, userId, sanitizedYear, category, sanitizedMetricName, sanitizedValue, sanitizedUnit, sanitizedMetricCode],
        function(err) {
          stmt.finalize();
          if (err) reject(err);
          else resolve(this.lastID);
        });
    });
  }

  // Excel Data Export
  static async exportToExcel(companyId, options = {}) {
    const data = await this.getExportData(companyId, options);
    const workbook = XLSX.utils.book_new();

    // Group data by category
    const groupedData = this.groupDataByCategory(data);

    Object.entries(groupedData).forEach(([category, records]) => {
      const worksheetData = [
        ['Metric Code', 'Metric Name', 'Value', 'Unit', 'Reporting Year', 'Status', 'Last Updated']
      ];

      records.forEach(record => {
        worksheetData.push([
          record.gri_code || record.framework_code,
          record.metric_name,
          record.metric_value,
          record.unit || '',
          record.reporting_year,
          record.status,
          record.created_at
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, category.charAt(0).toUpperCase() + category.slice(1));
    });

    const filename = `ESG_Export_${companyId}_${Date.now()}.xlsx`;
    const filepath = path.join(__dirname, '../exports', filename);
    
    // Ensure exports directory exists
    const exportsDir = path.dirname(filepath);
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    XLSX.writeFile(workbook, filepath);
    return { filename, filepath };
  }

  // CSV Data Export
  static async exportToCSV(companyId, options = {}) {
    const data = await this.getExportData(companyId, options);
    
    const csvHeaders = ['Metric Code', 'Metric Name', 'Value', 'Unit', 'Category', 'Reporting Year', 'Status', 'Last Updated'];
    const csvRows = [csvHeaders.join(',')];

    data.forEach(record => {
      const row = [
        record.gri_code || record.framework_code || '',
        `"${record.metric_name}"`,
        record.metric_value,
        record.unit || '',
        record.category,
        record.reporting_year,
        record.status,
        record.created_at
      ];
      csvRows.push(row.join(','));
    });

    const filename = `ESG_Export_${companyId}_${Date.now()}.csv`;
    const filepath = path.join(__dirname, '../exports', filename);
    
    const exportsDir = path.dirname(filepath);
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    fs.writeFileSync(filepath, csvRows.join('\n'));
    return { filename, filepath };
  }

  // API Integration Framework with URL validation
  static async setupAPIIntegration(companyId, systemType, config) {
    // Validate endpoint URL to prevent SSRF
    const allowedDomains = ['api.sap.com', 'api.oracle.com', 'api.workday.com', 'localhost'];
    const url = new URL(config.endpointUrl);
    
    if (!allowedDomains.some(domain => url.hostname.includes(domain))) {
      throw new Error('Endpoint URL not in allowed domains');
    }
    
    // Sanitize system type
    const allowedSystemTypes = ['SAP', 'Oracle', 'HR', 'IoT'];
    if (!allowedSystemTypes.includes(systemType)) {
      throw new Error('Invalid system type');
    }
    
    const integrationConfig = {
      company_id: parseInt(companyId),
      system_type: systemType,
      endpoint_url: config.endpointUrl,
      auth_type: config.authType,
      auth_credentials: JSON.stringify(config.credentials),
      sync_frequency: config.syncFrequency || 'daily',
      active: true
    };

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT INTO api_integrations (company_id, system_type, endpoint_url, 
        auth_type, auth_credentials, sync_frequency, active, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`);
      
      stmt.run(Object.values(integrationConfig),
        function(err) {
          stmt.finalize();
          if (err) reject(err);
          else resolve({ id: this.lastID, ...integrationConfig });
        });
    });
  }

  // Automated Data Sync with SSRF protection
  static async syncExternalData(integrationId) {
    const integration = await this.getIntegration(integrationId);
    if (!integration) throw new Error('Integration not found');

    // Validate URL to prevent SSRF
    const url = new URL(integration.endpoint_url);
    const allowedDomains = ['api.sap.com', 'api.oracle.com', 'api.workday.com', 'localhost'];
    
    if (!allowedDomains.some(domain => url.hostname.includes(domain))) {
      throw new Error('Endpoint URL not in allowed domains');
    }

    const credentials = JSON.parse(integration.auth_credentials);
    const headers = this.buildAuthHeaders(integration.auth_type, credentials);

    try {
      const response = await fetch(integration.endpoint_url, { 
        headers,
        timeout: 10000 // 10 second timeout
      });
      const data = await response.json();
      
      const results = await this.processExternalData(data, integration.company_id, integration.system_type);
      
      // Log sync result
      await this.logSyncResult(integrationId, 'success', results);
      return results;
    } catch (error) {
      await this.logSyncResult(integrationId, 'error', { error: error.message });
      throw error;
    }
  }

  // Helper Methods
  static determineCategory(metricCode) {
    if (metricCode.startsWith('30')) return 'environmental';
    if (metricCode.startsWith('40')) return 'social';
    if (metricCode.startsWith('20')) return 'governance';
    if (metricCode.startsWith('14')) return 'mining';
    return 'general';
  }

  static groupDataByCategory(data) {
    return data.reduce((groups, record) => {
      const category = record.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(record);
      return groups;
    }, {});
  }

  static async getExportData(companyId, options) {
    const { category, reportingYear, status } = options;
    
    // Sanitize inputs to prevent SQL injection
    const sanitizedCompanyId = parseInt(companyId);
    if (isNaN(sanitizedCompanyId)) {
      throw new Error('Invalid company ID');
    }
    
    let query = 'SELECT * FROM esg_data WHERE company_id = ?';
    const params = [sanitizedCompanyId];

    if (category) {
      const allowedCategories = ['environmental', 'social', 'governance', 'mining', 'general'];
      if (allowedCategories.includes(category)) {
        query += ' AND category = ?';
        params.push(category);
      }
    }
    
    if (reportingYear) {
      const year = parseInt(reportingYear);
      if (!isNaN(year) && year >= 2000 && year <= 2030) {
        query += ' AND reporting_year = ?';
        params.push(year);
      }
    }
    
    if (status) {
      const allowedStatuses = ['draft', 'submitted', 'approved', 'imported'];
      if (allowedStatuses.includes(status)) {
        query += ' AND status = ?';
        params.push(status);
      }
    }

    query += ' ORDER BY created_at DESC LIMIT 1000';

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(query);
      stmt.all(params, (err, rows) => {
        stmt.finalize();
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  static buildAuthHeaders(authType, credentials) {
    const headers = { 'Content-Type': 'application/json' };
    
    switch (authType) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${credentials.token}`;
        break;
      case 'basic':
        const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
        break;
      case 'api_key':
        headers[credentials.headerName || 'X-API-Key'] = credentials.apiKey;
        break;
    }
    
    return headers;
  }

  static getIntegration(integrationId) {
    return new Promise((resolve, reject) => {
      const sanitizedId = parseInt(integrationId);
      if (isNaN(sanitizedId)) {
        reject(new Error('Invalid integration ID'));
        return;
      }
      
      const stmt = db.prepare('SELECT * FROM api_integrations WHERE id = ?');
      stmt.get([sanitizedId], (err, row) => {
        stmt.finalize();
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static logSyncResult(integrationId, status, results) {
    return new Promise((resolve, reject) => {
      const sanitizedId = parseInt(integrationId);
      const allowedStatuses = ['success', 'error', 'warning'];
      
      if (isNaN(sanitizedId) || !allowedStatuses.includes(status)) {
        reject(new Error('Invalid parameters'));
        return;
      }
      
      const stmt = db.prepare(`INSERT INTO sync_logs (integration_id, status, results, synced_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)`);
      
      stmt.run([sanitizedId, status, JSON.stringify(results)],
        function(err) {
          stmt.finalize();
          if (err) reject(err);
          else resolve(this.lastID);
        });
    });
  }
}

module.exports = DataImportExportSystem;