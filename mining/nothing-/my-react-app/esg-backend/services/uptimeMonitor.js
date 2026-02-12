// Uptime Monitoring Service
const axios = require('axios');

class UptimeMonitor {
  constructor(config) {
    this.config = config;
    this.uptimeData = [];
    this.currentStatus = 'healthy';
    this.startTime = Date.now();
    this.downtime = 0;
    this.checkInterval = null;
  }

  start() {
    console.log('🚀 Starting uptime monitoring...');
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
    
    this.performHealthCheck();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  async performHealthCheck() {
    const checks = await Promise.all(
      this.config.endpoints.map(endpoint => this.checkEndpoint(endpoint))
    );

    const allHealthy = checks.every(check => check.healthy);
    const timestamp = Date.now();

    this.uptimeData.push({
      timestamp,
      healthy: allHealthy,
      checks
    });

    if (!allHealthy && this.currentStatus === 'healthy') {
      this.currentStatus = 'unhealthy';
      this.handleDowntime(checks);
    } else if (allHealthy && this.currentStatus === 'unhealthy') {
      this.currentStatus = 'healthy';
      this.handleRecovery();
    }

    this.calculateUptime();
  }

  async checkEndpoint(endpoint) {
    const startTime = Date.now();
    try {
      const response = await axios.get(endpoint, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint,
        healthy: response.status === 200,
        responseTime,
        status: response.status
      };
    } catch (error) {
      return {
        endpoint,
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  calculateUptime() {
    const totalTime = Date.now() - this.startTime;
    const uptime = ((totalTime - this.downtime) / totalTime) * 100;
    
    if (uptime < this.config.alertThreshold) {
      this.sendAlert(uptime);
    }

    return uptime.toFixed(4);
  }

  handleDowntime(checks) {
    console.error('⚠️ System is DOWN!');
    const failedChecks = checks.filter(c => !c.healthy);
    
    this.sendAlert(null, {
      type: 'downtime',
      failedEndpoints: failedChecks.map(c => c.endpoint),
      timestamp: new Date().toISOString()
    });
  }

  handleRecovery() {
    console.log('✅ System recovered!');
    this.sendAlert(null, {
      type: 'recovery',
      timestamp: new Date().toISOString()
    });
  }

  async sendAlert(uptime, incident) {
    const message = incident 
      ? `${incident.type === 'downtime' ? '🔴 SYSTEM DOWN' : '🟢 SYSTEM RECOVERED'}\nTime: ${incident.timestamp}`
      : `⚠️ Uptime Alert: ${uptime}% (Target: ${this.config.uptimeTarget}%)`;

    // Email notification
    if (this.config.notifications.email) {
      await this.sendEmail(message);
    }

    // Slack notification
    if (this.config.notifications.slack) {
      await this.sendSlack(message);
    }

    // PagerDuty
    if (this.config.notifications.pagerduty) {
      await this.sendPagerDuty(incident);
    }
  }

  async sendEmail(message) {
    try {
      await axios.post('/api/notifications/email', {
        to: this.config.notifications.email,
        subject: 'ESG Platform Uptime Alert',
        body: message
      });
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async sendSlack(message) {
    try {
      await axios.post(this.config.notifications.slack, {
        text: message
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  async sendPagerDuty(incident) {
    try {
      await axios.post('https://events.pagerduty.com/v2/enqueue', {
        routing_key: this.config.notifications.pagerduty,
        event_action: incident.type === 'downtime' ? 'trigger' : 'resolve',
        payload: {
          summary: incident.type === 'downtime' ? 'System Down' : 'System Recovered',
          severity: 'critical',
          source: 'ESG Platform Monitor'
        }
      });
    } catch (error) {
      console.error('Failed to send PagerDuty alert:', error);
    }
  }

  getStats() {
    const uptime = this.calculateUptime();
    const totalChecks = this.uptimeData.length;
    const healthyChecks = this.uptimeData.filter(d => d.healthy).length;
    
    return {
      uptime: parseFloat(uptime),
      totalChecks,
      healthyChecks,
      unhealthyChecks: totalChecks - healthyChecks,
      currentStatus: this.currentStatus,
      startTime: new Date(this.startTime).toISOString(),
      runningTime: Date.now() - this.startTime
    };
  }
}

module.exports = UptimeMonitor;
