export class AlertEngine {
  
  static triggerTypes = [
    { id: 'threshold', name: 'Data Threshold Exceeded', icon: '📊' },
    { id: 'deadline', name: 'Deadline Approaching', icon: '⏰' },
    { id: 'missing-data', name: 'Missing Data Detected', icon: '❌' },
    { id: 'anomaly', name: 'Anomaly Detected', icon: '⚠️' },
    { id: 'target-risk', name: 'Target at Risk', icon: '🎯' },
    { id: 'compliance-gap', name: 'Compliance Gap', icon: '📋' },
    { id: 'audit-due', name: 'Audit Due', icon: '🔍' },
    { id: 'report-pending', name: 'Report Pending', icon: '📄' },
    { id: 'stakeholder-feedback', name: 'Stakeholder Feedback', icon: '💬' },
    { id: 'regulatory-update', name: 'Regulatory Update', icon: '⚖️' }
  ];

  static severityLevels = [
    { id: 'low', name: 'Low', color: 'blue' },
    { id: 'medium', name: 'Medium', color: 'yellow' },
    { id: 'high', name: 'High', color: 'orange' },
    { id: 'critical', name: 'Critical', color: 'red' }
  ];

  static channels = [
    { id: 'in-app', name: 'In-App Notification', icon: '🔔' },
    { id: 'email', name: 'Email', icon: '📧' },
    { id: 'sms', name: 'SMS', icon: '📱' },
    { id: 'slack', name: 'Slack', icon: '💬' }
  ];

  static evaluateRule(rule, data) {
    if (!rule.active) return false;

    switch (rule.trigger) {
      case 'threshold':
        return this.checkThreshold(rule.conditions, data);
      case 'deadline':
        return this.checkDeadline(rule.conditions);
      case 'missing-data':
        return this.checkMissingData(rule.conditions, data);
      case 'anomaly':
        return this.checkAnomaly(rule.conditions, data);
      default:
        return false;
    }
  }

  static checkThreshold(conditions, data) {
    return conditions.every(condition => {
      const value = data[condition.field];
      if (value === undefined) return false;

      switch (condition.operator) {
        case '>': return value > condition.value;
        case '<': return value < condition.value;
        case '>=': return value >= condition.value;
        case '<=': return value <= condition.value;
        case '==': return value == condition.value;
        default: return false;
      }
    });
  }

  static checkDeadline(conditions) {
    const now = new Date();
    return conditions.some(condition => {
      const deadline = new Date(condition.date);
      const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      return daysUntil <= condition.daysBeforeAlert;
    });
  }

  static checkMissingData(conditions, data) {
    return conditions.some(condition => {
      return !data[condition.field] || data[condition.field] === null;
    });
  }

  static checkAnomaly(conditions, data) {
    return conditions.some(condition => {
      const values = data[condition.field];
      if (!Array.isArray(values) || values.length < 3) return false;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
      const latest = values[values.length - 1];
      const zScore = Math.abs((latest - mean) / stdDev);

      return zScore > (condition.threshold || 2.5);
    });
  }

  static createAlert(rule, data) {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      trigger: rule.trigger,
      severity: this.determineSeverity(rule, data),
      title: this.generateTitle(rule, data),
      message: this.generateMessage(rule, data),
      data: data,
      channels: rule.channels,
      recipients: rule.recipients,
      status: 'new',
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
      dismissedAt: null
    };
  }

  static determineSeverity(rule, data) {
    if (rule.trigger === 'threshold') {
      const exceedance = Math.abs(data.value - rule.conditions[0].value) / rule.conditions[0].value;
      if (exceedance > 0.5) return 'critical';
      if (exceedance > 0.3) return 'high';
      if (exceedance > 0.1) return 'medium';
      return 'low';
    }
    return rule.defaultSeverity || 'medium';
  }

  static generateTitle(rule, data) {
    const templates = {
      'threshold': `${data.metric} exceeded threshold`,
      'deadline': `Deadline approaching: ${data.task}`,
      'missing-data': `Missing data: ${data.field}`,
      'anomaly': `Anomaly detected in ${data.metric}`,
      'target-risk': `Target at risk: ${data.target}`,
      'compliance-gap': `Compliance gap identified`,
      'audit-due': `Audit due: ${data.framework}`,
      'report-pending': `Report pending: ${data.report}`,
      'stakeholder-feedback': `New stakeholder feedback`,
      'regulatory-update': `Regulatory update: ${data.regulation}`
    };
    return templates[rule.trigger] || 'Alert triggered';
  }

  static generateMessage(rule, data) {
    const templates = {
      'threshold': `${data.metric} is currently ${data.value}, which exceeds the threshold of ${rule.conditions[0].value}. Immediate action required.`,
      'deadline': `The deadline for ${data.task} is ${data.deadline}. Please complete this task soon.`,
      'missing-data': `Required data field "${data.field}" is missing. Please provide this information.`,
      'anomaly': `An unusual pattern has been detected in ${data.metric}. Current value: ${data.value}, Expected range: ${data.expectedRange}.`,
      'target-risk': `Target "${data.target}" is at risk of not being met. Current progress: ${data.progress}%.`,
      'compliance-gap': `A compliance gap has been identified. Review required.`,
      'audit-due': `${data.framework} audit is due on ${data.dueDate}.`,
      'report-pending': `Report "${data.report}" is pending submission.`,
      'stakeholder-feedback': `New feedback received from ${data.stakeholder}.`,
      'regulatory-update': `New regulatory update for ${data.regulation}.`
    };
    return templates[rule.trigger] || 'An alert has been triggered based on your configured rules.';
  }

  static async deliverAlert(alert) {
    const deliveryResults = {};

    for (const channel of alert.channels) {
      try {
        switch (channel) {
          case 'in-app':
            deliveryResults[channel] = await this.deliverInApp(alert);
            break;
          case 'email':
            deliveryResults[channel] = await this.deliverEmail(alert);
            break;
          case 'sms':
            deliveryResults[channel] = await this.deliverSMS(alert);
            break;
          case 'slack':
            deliveryResults[channel] = await this.deliverSlack(alert);
            break;
        }
      } catch (error) {
        deliveryResults[channel] = { success: false, error: error.message };
      }
    }

    return deliveryResults;
  }

  static async deliverInApp(alert) {
    // Store in local notification queue
    return { success: true, timestamp: new Date().toISOString() };
  }

  static async deliverEmail(alert) {
    // Simulate email delivery
    return { success: true, timestamp: new Date().toISOString(), method: 'email' };
  }

  static async deliverSMS(alert) {
    // Simulate SMS delivery (would integrate with Twilio)
    return { success: true, timestamp: new Date().toISOString(), method: 'sms' };
  }

  static async deliverSlack(alert) {
    // Simulate Slack webhook
    return { success: true, timestamp: new Date().toISOString(), method: 'slack' };
  }

  static checkEscalation(alert, rule) {
    if (!rule.escalation?.enabled) return null;

    const alertAge = Date.now() - new Date(alert.createdAt).getTime();
    
    for (const level of rule.escalation.levels) {
      if (alertAge >= level.delay * 60 * 1000 && alert.status === 'new') {
        return {
          level: level.level,
          recipients: level.recipients,
          message: `ESCALATED: ${alert.title}`
        };
      }
    }

    return null;
  }

  static getAlertStats(alerts) {
    return {
      total: alerts.length,
      new: alerts.filter(a => a.status === 'new').length,
      read: alerts.filter(a => a.status === 'read').length,
      snoozed: alerts.filter(a => a.status === 'snoozed').length,
      dismissed: alerts.filter(a => a.status === 'dismissed').length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      },
      avgResponseTime: this.calculateAvgResponseTime(alerts)
    };
  }

  static calculateAvgResponseTime(alerts) {
    const acknowledged = alerts.filter(a => a.acknowledgedAt);
    if (acknowledged.length === 0) return 0;

    const totalTime = acknowledged.reduce((sum, alert) => {
      const responseTime = new Date(alert.acknowledgedAt) - new Date(alert.createdAt);
      return sum + responseTime;
    }, 0);

    return Math.round(totalTime / acknowledged.length / 1000 / 60); // minutes
  }
}
