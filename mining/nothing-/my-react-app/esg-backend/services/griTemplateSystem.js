// Lazy loading singleton
let dbInstance = null;

const getDb = async () => {
  if (!dbInstance) {
    const { default: db } = await import('../database/db.js');
    dbInstance = db;
  }
  return dbInstance;
};

class GRITemplateSystem {
  static GRI_TEMPLATES = {
    'GRI-102': {
      name: 'General Disclosures',
      sections: {
        'organizational-profile': [
          { code: '102-1', name: 'Name of the organization', type: 'text', required: true },
          { code: '102-2', name: 'Activities, brands, products, and services', type: 'textarea', required: true },
          { code: '102-3', name: 'Location of headquarters', type: 'text', required: true },
          { code: '102-4', name: 'Location of operations', type: 'textarea', required: true },
          { code: '102-5', name: 'Ownership and legal form', type: 'text', required: true },
          { code: '102-6', name: 'Markets served', type: 'textarea', required: true },
          { code: '102-7', name: 'Scale of the organization', type: 'number', required: true },
          { code: '102-8', name: 'Information on employees and other workers', type: 'number', required: true },
          { code: '102-9', name: 'Supply chain', type: 'textarea', required: false }
        ],
        'strategy': [
          { code: '102-14', name: 'Statement from senior decision-maker', type: 'textarea', required: true },
          { code: '102-15', name: 'Key impacts, risks, and opportunities', type: 'textarea', required: false }
        ],
        'ethics-integrity': [
          { code: '102-16', name: 'Values, principles, standards, and norms of behavior', type: 'textarea', required: true },
          { code: '102-17', name: 'Mechanisms for advice and concerns about ethics', type: 'textarea', required: false }
        ]
      }
    },
    'GRI-200': {
      name: 'Economic Performance',
      sections: {
        'economic-performance': [
          { code: '201-1', name: 'Direct economic value generated and distributed', type: 'currency', required: true },
          { code: '201-2', name: 'Financial implications of climate change', type: 'currency', required: false },
          { code: '201-3', name: 'Defined benefit plan obligations', type: 'currency', required: false }
        ],
        'procurement': [
          { code: '204-1', name: 'Proportion of spending on local suppliers', type: 'percentage', required: false }
        ],
        'anti-corruption': [
          { code: '205-1', name: 'Operations assessed for risks related to corruption', type: 'number', required: false },
          { code: '205-2', name: 'Communication and training about anti-corruption', type: 'number', required: false },
          { code: '205-3', name: 'Confirmed incidents of corruption', type: 'number', required: true }
        ]
      }
    },
    'GRI-300': {
      name: 'Environmental Performance',
      sections: {
        'materials': [
          { code: '301-1', name: 'Materials used by weight or volume', type: 'number', unit: 'tonnes', required: true },
          { code: '301-2', name: 'Recycled input materials used', type: 'percentage', required: false }
        ],
        'energy': [
          { code: '302-1', name: 'Energy consumption within the organization', type: 'number', unit: 'MWh', required: true },
          { code: '302-2', name: 'Energy consumption outside of the organization', type: 'number', unit: 'MWh', required: false },
          { code: '302-3', name: 'Energy intensity', type: 'number', unit: 'MWh/unit', required: true },
          { code: '302-4', name: 'Reduction of energy consumption', type: 'number', unit: 'MWh', required: false }
        ],
        'water': [
          { code: '303-3', name: 'Water withdrawal', type: 'number', unit: 'm³', required: true },
          { code: '303-4', name: 'Water discharge', type: 'number', unit: 'm³', required: true },
          { code: '303-5', name: 'Water consumption', type: 'number', unit: 'm³', required: true }
        ],
        'emissions': [
          { code: '305-1', name: 'Direct (Scope 1) GHG emissions', type: 'number', unit: 'tCO2e', required: true },
          { code: '305-2', name: 'Energy indirect (Scope 2) GHG emissions', type: 'number', unit: 'tCO2e', required: true },
          { code: '305-3', name: 'Other indirect (Scope 3) GHG emissions', type: 'number', unit: 'tCO2e', required: false },
          { code: '305-4', name: 'GHG emissions intensity', type: 'number', unit: 'tCO2e/unit', required: true }
        ],
        'waste': [
          { code: '306-3', name: 'Waste generated', type: 'number', unit: 'tonnes', required: true },
          { code: '306-4', name: 'Waste diverted from disposal', type: 'number', unit: 'tonnes', required: false },
          { code: '306-5', name: 'Waste directed to disposal', type: 'number', unit: 'tonnes', required: true }
        ]
      }
    },
    'GRI-400': {
      name: 'Social Performance',
      sections: {
        'employment': [
          { code: '401-1', name: 'New employee hires and employee turnover', type: 'number', required: true },
          { code: '401-2', name: 'Benefits provided to full-time employees', type: 'text', required: false }
        ],
        'occupational-health-safety': [
          { code: '403-9', name: 'Work-related injuries', type: 'number', required: true },
          { code: '403-10', name: 'Work-related ill health', type: 'number', required: true }
        ],
        'training-education': [
          { code: '404-1', name: 'Average hours of training per year per employee', type: 'number', unit: 'hours', required: true },
          { code: '404-2', name: 'Programs for upgrading employee skills', type: 'text', required: false }
        ],
        'diversity-equal-opportunity': [
          { code: '405-1', name: 'Diversity of governance bodies and employees', type: 'percentage', required: true },
          { code: '405-2', name: 'Ratio of basic salary and remuneration of women to men', type: 'ratio', required: false }
        ],
        'local-communities': [
          { code: '413-1', name: 'Operations with local community engagement', type: 'percentage', required: true },
          { code: '413-2', name: 'Operations with significant negative impacts on local communities', type: 'number', required: true }
        ]
      }
    },
    'GRI-14': {
      name: 'Mining and Metals Sector',
      sections: {
        'tailings-management': [
          { code: '14-1', name: 'Number of tailings storage facilities', type: 'number', required: true },
          { code: '14-2', name: 'Tailings storage facilities risk classification', type: 'select', options: ['low', 'significant', 'high', 'extreme'], required: true },
          { code: '14-3', name: 'Tailings storage facilities monitoring', type: 'select', options: ['continuous', 'daily', 'weekly', 'monthly'], required: true }
        ],
        'biodiversity': [
          { code: '14-4', name: 'Total land disturbed', type: 'number', unit: 'hectares', required: true },
          { code: '14-5', name: 'Land rehabilitated', type: 'number', unit: 'hectares', required: true },
          { code: '14-6', name: 'Operations in or adjacent to protected areas', type: 'number', required: true }
        ],
        'closure-rehabilitation': [
          { code: '14-7', name: 'Closure and rehabilitation provisions', type: 'currency', required: true },
          { code: '14-8', name: 'Mine closure plans', type: 'text', required: true }
        ]
      }
    }
  };

  static async generateTemplate(templateCode, companyId) {
    const template = this.GRI_TEMPLATES[templateCode];
    if (!template) throw new Error('Template not found');

    const formStructure = {
      templateCode,
      templateName: template.name,
      companyId,
      sections: []
    };

    for (const [sectionKey, fields] of Object.entries(template.sections)) {
      const section = {
        sectionKey,
        sectionName: this.formatSectionName(sectionKey),
        fields: fields.map(field => ({
          ...field,
          value: null,
          completed: false
        }))
      };
      formStructure.sections.push(section);
    }

    return formStructure;
  }

  static async saveTemplateData(templateCode, companyId, sectionKey, fieldCode, value, userId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.run(`INSERT OR REPLACE INTO gri_template_data 
        (template_code, company_id, section_key, field_code, field_value, user_id, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [templateCode, companyId, sectionKey, fieldCode, value, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
    });
  }

  static async getTemplateData(templateCode, companyId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM gri_template_data 
        WHERE template_code = ? AND company_id = ?`,
        [templateCode, companyId], (err, rows) => {
          if (err) reject(err);
          else {
            const data = {};
            rows.forEach(row => {
              if (!data[row.section_key]) data[row.section_key] = {};
              data[row.section_key][row.field_code] = row.field_value;
            });
            resolve(data);
          }
        });
    });
  }

  static async generateGRIReport(companyId, templateCodes = ['GRI-102', 'GRI-300', 'GRI-400']) {
    const reportData = {};
    
    for (const templateCode of templateCodes) {
      const data = await this.getTemplateData(templateCode, companyId);
      reportData[templateCode] = data;
    }

    return {
      companyId,
      reportDate: new Date().toISOString(),
      templates: reportData,
      completeness: this.calculateCompleteness(reportData),
      griCompliance: this.assessGRICompliance(reportData)
    };
  }

  static calculateCompleteness(reportData) {
    let totalFields = 0;
    let completedFields = 0;

    Object.entries(reportData).forEach(([templateCode, sections]) => {
      const template = this.GRI_TEMPLATES[templateCode];
      if (template) {
        Object.entries(template.sections).forEach(([sectionKey, fields]) => {
          fields.forEach(field => {
            totalFields++;
            if (sections[sectionKey] && sections[sectionKey][field.code]) {
              completedFields++;
            }
          });
        });
      }
    });

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }

  static assessGRICompliance(reportData) {
    const compliance = {};
    
    Object.entries(reportData).forEach(([templateCode, sections]) => {
      const template = this.GRI_TEMPLATES[templateCode];
      if (template) {
        let requiredFields = 0;
        let completedRequired = 0;

        Object.entries(template.sections).forEach(([sectionKey, fields]) => {
          fields.forEach(field => {
            if (field.required) {
              requiredFields++;
              if (sections[sectionKey] && sections[sectionKey][field.code]) {
                completedRequired++;
              }
            }
          });
        });

        compliance[templateCode] = {
          required: requiredFields,
          completed: completedRequired,
          percentage: requiredFields > 0 ? Math.round((completedRequired / requiredFields) * 100) : 0,
          status: completedRequired === requiredFields ? 'compliant' : 'non-compliant'
        };
      }
    });

    return compliance;
  }

  static formatSectionName(sectionKey) {
    return sectionKey.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  static getAvailableTemplates() {
    return Object.entries(this.GRI_TEMPLATES).map(([code, template]) => ({
      code,
      name: template.name,
      sectionCount: Object.keys(template.sections).length,
      fieldCount: Object.values(template.sections).reduce((sum, fields) => sum + fields.length, 0)
    }));
  }
}

export default GRITemplateSystem;