// Data Retention Policy Service
const cron = require('node-cron');

class DataRetentionService {
  constructor(db) {
    this.db = db;
    this.policies = {
      esgData: { years: 5, category: 'operational' },
      reports: { years: 7, category: 'compliance' },
      auditLogs: { years: 7, category: 'security' },
      userActivity: { years: 3, category: 'operational' },
      financialData: { years: 7, category: 'compliance' },
      incidents: { years: 5, category: 'operational' },
      evidence: { years: 7, category: 'compliance' }
    };
  }

  start() {
    // Run daily at 3 AM
    cron.schedule('0 3 * * *', () => {
      this.enforceRetention();
    });
    
    console.log('✅ Data retention service started');
  }

  async enforceRetention() {
    console.log('🗄️ Enforcing data retention policies...');
    
    for (const [dataType, policy] of Object.entries(this.policies)) {
      await this.archiveOldData(dataType, policy);
    }
    
    await this.cleanupArchives();
    await this.generateRetentionReport();
  }

  async archiveOldData(dataType, policy) {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.years);

    try {
      // Get old records
      const oldRecords = await this.db.query(
        `SELECT * FROM ${dataType} WHERE created_at < $1 AND archived = false`,
        [cutoffDate]
      );

      if (oldRecords.rows.length === 0) {
        console.log(`No records to archive for ${dataType}`);
        return;
      }

      // Archive records
      await this.db.query(
        `INSERT INTO ${dataType}_archive SELECT * FROM ${dataType} WHERE created_at < $1`,
        [cutoffDate]
      );

      // Mark as archived
      await this.db.query(
        `UPDATE ${dataType} SET archived = true WHERE created_at < $1`,
        [cutoffDate]
      );

      console.log(`✅ Archived ${oldRecords.rows.length} records from ${dataType}`);
    } catch (error) {
      console.error(`Failed to archive ${dataType}:`, error);
    }
  }

  async cleanupArchives() {
    // Delete archived records older than retention + 1 year
    for (const [dataType, policy] of Object.entries(this.policies)) {
      const deleteDate = new Date();
      deleteDate.setFullYear(deleteDate.getFullYear() - (policy.years + 1));

      try {
        const result = await this.db.query(
          `DELETE FROM ${dataType}_archive WHERE created_at < $1`,
          [deleteDate]
        );

        if (result.rowCount > 0) {
          console.log(`🗑️ Deleted ${result.rowCount} old archives from ${dataType}`);
        }
      } catch (error) {
        console.error(`Failed to cleanup ${dataType}:`, error);
      }
    }
  }

  async generateRetentionReport() {
    const report = {
      timestamp: new Date().toISOString(),
      policies: this.policies,
      statistics: {}
    };

    for (const dataType of Object.keys(this.policies)) {
      try {
        const active = await this.db.query(
          `SELECT COUNT(*) FROM ${dataType} WHERE archived = false`
        );
        const archived = await this.db.query(
          `SELECT COUNT(*) FROM ${dataType}_archive`
        );

        report.statistics[dataType] = {
          active: parseInt(active.rows[0].count),
          archived: parseInt(archived.rows[0].count)
        };
      } catch (error) {
        console.error(`Failed to get stats for ${dataType}:`, error);
      }
    }

    // Save report
    await this.saveReport(report);
    return report;
  }

  async saveReport(report) {
    try {
      await this.db.query(
        `INSERT INTO retention_reports (report_date, report_data) VALUES ($1, $2)`,
        [new Date(), JSON.stringify(report)]
      );
    } catch (error) {
      console.error('Failed to save retention report:', error);
    }
  }

  async getRetentionStatus() {
    const status = {};
    
    for (const [dataType, policy] of Object.entries(this.policies)) {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.years);

      try {
        const total = await this.db.query(`SELECT COUNT(*) FROM ${dataType}`);
        const old = await this.db.query(
          `SELECT COUNT(*) FROM ${dataType} WHERE created_at < $1 AND archived = false`,
          [cutoffDate]
        );

        status[dataType] = {
          policy: `${policy.years} years`,
          category: policy.category,
          totalRecords: parseInt(total.rows[0].count),
          pendingArchival: parseInt(old.rows[0].count),
          compliant: parseInt(old.rows[0].count) === 0
        };
      } catch (error) {
        console.error(`Failed to get status for ${dataType}:`, error);
      }
    }

    return status;
  }

  async exportArchive(dataType, startDate, endDate) {
    try {
      const records = await this.db.query(
        `SELECT * FROM ${dataType}_archive WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      return {
        dataType,
        startDate,
        endDate,
        recordCount: records.rows.length,
        data: records.rows
      };
    } catch (error) {
      console.error('Failed to export archive:', error);
      throw error;
    }
  }

  async restoreFromArchive(dataType, recordIds) {
    try {
      await this.db.query(
        `INSERT INTO ${dataType} SELECT * FROM ${dataType}_archive WHERE id = ANY($1)`,
        [recordIds]
      );

      return { success: true, restored: recordIds.length };
    } catch (error) {
      console.error('Failed to restore from archive:', error);
      throw error;
    }
  }
}

module.exports = DataRetentionService;
