// Group Customization Service
class GroupCustomizationService {
  constructor() {
    this.config = {
      companyName: '',
      logo: '',
      primaryColor: '#1e40af',
      secondaryColor: '#3b82f6',
      customTaxonomy: {},
      policyDocuments: [],
      boardTemplates: []
    };
  }

  async setBranding(branding) {
    this.config.companyName = branding.companyName;
    this.config.logo = branding.logo;
    this.config.primaryColor = branding.primaryColor;
    this.config.secondaryColor = branding.secondaryColor;
    this.applyBranding();
    return { success: true };
  }

  applyBranding() {
    document.documentElement.style.setProperty('--primary-color', this.config.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', this.config.secondaryColor);
  }

  async setCustomTaxonomy(taxonomy) {
    this.config.customTaxonomy = taxonomy;
    return { success: true };
  }

  getCustomTaxonomy() {
    return this.config.customTaxonomy;
  }

  async addPolicyDocument(policy) {
    this.config.policyDocuments.push({
      id: Date.now(),
      name: policy.name,
      category: policy.category,
      url: policy.url,
      version: policy.version,
      effectiveDate: policy.effectiveDate
    });
    return { success: true };
  }

  getPolicyDocuments() {
    return this.config.policyDocuments;
  }

  async addBoardTemplate(template) {
    this.config.boardTemplates.push({
      id: Date.now(),
      name: template.name,
      type: template.type,
      sections: template.sections,
      frequency: template.frequency
    });
    return { success: true };
  }

  getBoardTemplates() {
    return this.config.boardTemplates;
  }

  generateBoardReport(templateId, data) {
    const template = this.config.boardTemplates.find(t => t.id === templateId);
    if (!template) return null;

    return {
      title: template.name,
      generatedAt: new Date().toISOString(),
      sections: template.sections.map(section => ({
        title: section.title,
        content: this.generateSectionContent(section, data)
      }))
    };
  }

  generateSectionContent(section, data) {
    switch (section.type) {
      case 'executive-summary':
        return { overallScore: data.esgScore || 0, highlights: data.highlights || [] };
      case 'key-metrics':
        return { environmental: data.environmental || {}, social: data.social || {}, governance: data.governance || {} };
      default:
        return section.defaultContent;
    }
  }
}

export default new GroupCustomizationService();
