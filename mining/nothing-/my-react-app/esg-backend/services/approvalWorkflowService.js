const db = require('../database/db');
const AuditService = require('./auditService');

const WORKFLOW_LEVELS = {
  SITE: 1,
  BUSINESS_UNIT: 2,
  GROUP_ESG: 3,
  EXECUTIVE: 4
};

class ApprovalWorkflowService {
  static async submitForApproval(dataId, companyId, submitterId) {
    // Create approval workflow entries for all levels
    const levels = [WORKFLOW_LEVELS.SITE, WORKFLOW_LEVELS.BUSINESS_UNIT, WORKFLOW_LEVELS.GROUP_ESG, WORKFLOW_LEVELS.EXECUTIVE];
    
    for (const level of levels) {
      const approver = await this.getApproverForLevel(companyId, level);
      if (approver) {
        await this.createApprovalEntry(companyId, dataId, level, approver.id);
      }
    }

    // Update data status
    await this.updateDataStatus(dataId, 'submitted');
    
    // Log action
    await AuditService.logAction('esg_data', dataId, 'SUBMIT_FOR_APPROVAL', null, { status: 'submitted' }, submitterId);
    
    return true;
  }

  static async approveData(workflowId, approverId, comments = null) {
    return new Promise((resolve, reject) => {
      // Get workflow details
      db.get('SELECT * FROM approval_workflows WHERE id = ?', [workflowId], async (err, workflow) => {
        if (err) return reject(err);
        if (!workflow) return reject(new Error('Workflow not found'));

        // Update workflow status
        db.run(
          'UPDATE approval_workflows SET status = ?, comments = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['approved', comments, workflowId],
          async (err) => {
            if (err) return reject(err);

            // Check if all required levels are approved
            const allApproved = await this.checkAllLevelsApproved(workflow.data_id);
            
            if (allApproved) {
              await this.updateDataStatus(workflow.data_id, 'approved');
            }

            // Log approval
            await AuditService.logAction('approval_workflows', workflowId, 'APPROVE', 
              { status: 'pending' }, { status: 'approved', comments }, approverId);

            resolve(true);
          }
        );
      });
    });
  }

  static async rejectData(workflowId, approverId, comments) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE approval_workflows SET status = ?, comments = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['rejected', comments, workflowId],
        async (err) => {
          if (err) return reject(err);

          // Get workflow to update data status
          const workflow = await this.getWorkflow(workflowId);
          await this.updateDataStatus(workflow.data_id, 'rejected');

          // Log rejection
          await AuditService.logAction('approval_workflows', workflowId, 'REJECT',
            { status: 'pending' }, { status: 'rejected', comments }, approverId);

          resolve(true);
        }
      );
    });
  }

  static async getPendingApprovals(approverId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT aw.*, ed.metric_name, ed.metric_value, c.name as company_name, u.full_name as submitter_name
        FROM approval_workflows aw
        JOIN esg_data ed ON aw.data_id = ed.id
        JOIN companies c ON aw.company_id = c.id
        JOIN users u ON ed.user_id = u.id
        WHERE aw.approver_id = ? AND aw.status = 'pending'
        ORDER BY aw.created_at ASC
      `;
      
      db.all(query, [approverId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  static createApprovalEntry(companyId, dataId, level, approverId) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO approval_workflows (company_id, data_id, workflow_level, approver_id) VALUES (?, ?, ?, ?)',
        [companyId, dataId, level, approverId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static updateDataStatus(dataId, status) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE esg_data SET status = ? WHERE id = ?', [status, dataId], (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  static checkAllLevelsApproved(dataId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as pending FROM approval_workflows WHERE data_id = ? AND status = "pending"',
        [dataId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result.pending === 0);
        }
      );
    });
  }

  static getApproverForLevel(companyId, level) {
    // Simplified - in production, this would query company hierarchy and role assignments
    return new Promise((resolve, reject) => {
      const roleMap = {
        [WORKFLOW_LEVELS.SITE]: 'viewer',
        [WORKFLOW_LEVELS.BUSINESS_UNIT]: 'verifier',
        [WORKFLOW_LEVELS.GROUP_ESG]: 'approver',
        [WORKFLOW_LEVELS.EXECUTIVE]: 'admin'
      };

      db.get(
        'SELECT * FROM users WHERE role = ? AND status = "approved" LIMIT 1',
        [roleMap[level]],
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });
  }

  static getWorkflow(workflowId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM approval_workflows WHERE id = ?', [workflowId], (err, workflow) => {
        if (err) reject(err);
        else resolve(workflow);
      });
    });
  }
}

module.exports = { ApprovalWorkflowService, WORKFLOW_LEVELS };