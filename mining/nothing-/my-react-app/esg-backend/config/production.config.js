// Production Infrastructure Configuration
const productionConfig = {
  // Multi-Region Setup
  regions: {
    primary: {
      name: 'us-east-1',
      endpoint: 'https://api-us-east.esg-platform.com',
      database: 'postgresql://primary-db.esg-platform.com:5432/esg',
      backup: 'postgresql://backup-us-east.esg-platform.com:5432/esg'
    },
    secondary: {
      name: 'eu-west-1',
      endpoint: 'https://api-eu-west.esg-platform.com',
      database: 'postgresql://secondary-db.esg-platform.com:5432/esg',
      backup: 'postgresql://backup-eu-west.esg-platform.com:5432/esg'
    },
    tertiary: {
      name: 'ap-southeast-1',
      endpoint: 'https://api-ap-southeast.esg-platform.com',
      database: 'postgresql://tertiary-db.esg-platform.com:5432/esg',
      backup: 'postgresql://backup-ap-southeast.esg-platform.com:5432/esg'
    }
  },

  // Load Balancing
  loadBalancer: {
    algorithm: 'round-robin', // round-robin, least-connections, ip-hash
    healthCheck: {
      interval: 30000, // 30 seconds
      timeout: 5000,
      unhealthyThreshold: 3,
      healthyThreshold: 2
    },
    stickySession: true,
    sessionTimeout: 3600000 // 1 hour
  },

  // Auto-Scaling
  autoScaling: {
    enabled: true,
    minInstances: 2,
    maxInstances: 10,
    targetCPU: 70, // percentage
    targetMemory: 80, // percentage
    scaleUpCooldown: 300, // 5 minutes
    scaleDownCooldown: 600 // 10 minutes
  },

  // Uptime Monitoring
  monitoring: {
    uptimeTarget: 99.9, // 99.9% uptime
    checkInterval: 60000, // 1 minute
    alertThreshold: 99.5, // Alert if below 99.5%
    endpoints: [
      '/health',
      '/api/health',
      '/api/esg/health'
    ],
    notifications: {
      email: ['ops@company.com', 'devops@company.com'],
      slack: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      pagerduty: 'YOUR_PAGERDUTY_KEY'
    }
  },

  // Backup Configuration
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 12,
      yearly: 5
    },
    encryption: true,
    compression: true,
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1']
  },

  // Disaster Recovery
  disasterRecovery: {
    rpo: 3600, // Recovery Point Objective: 1 hour
    rto: 7200, // Recovery Time Objective: 2 hours
    failoverAutomatic: true,
    backupSites: ['eu-west-1', 'ap-southeast-1']
  },

  // Performance
  performance: {
    caching: {
      enabled: true,
      ttl: 300, // 5 minutes
      maxSize: '1GB'
    },
    cdn: {
      enabled: true,
      provider: 'cloudflare',
      regions: ['global']
    },
    compression: {
      enabled: true,
      level: 6
    }
  }
};

module.exports = productionConfig;
