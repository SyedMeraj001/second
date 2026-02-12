export class CDPEngine {
  
  static modules = [
    { code: 'C0', name: 'Introduction', questions: 8 },
    { code: 'C1', name: 'Governance', questions: 12 },
    { code: 'C2', name: 'Risks and Opportunities', questions: 15 },
    { code: 'C3', name: 'Business Strategy', questions: 10 },
    { code: 'C4', name: 'Targets and Performance', questions: 18 },
    { code: 'C5', name: 'Emissions Methodology', questions: 14 },
    { code: 'C6', name: 'Emissions Data', questions: 22 },
    { code: 'C7', name: 'Emissions Breakdown', questions: 16 },
    { code: 'C8', name: 'Energy', questions: 20 },
    { code: 'C9', name: 'Additional Metrics', questions: 12 },
    { code: 'C10', name: 'Verification', questions: 8 },
    { code: 'C11', name: 'Carbon Pricing', questions: 10 }
  ];

  static questionTypes = {
    TEXT: 'text',
    NUMBER: 'number',
    CHOICE: 'choice',
    MULTI_CHOICE: 'multi-choice',
    TABLE: 'table',
    FILE: 'file',
    DATE: 'date'
  };

  static sampleQuestions = {
    'C0.1': {
      id: 'C0.1',
      module: 'C0',
      text: 'Give a general description and introduction to your organization',
      type: 'TEXT',
      required: true,
      maxLength: 5000,
      autoFillable: false
    },
    'C0.2': {
      id: 'C0.2',
      module: 'C0',
      text: 'State the start and end date of the year for which you are reporting data',
      type: 'DATE',
      required: true,
      autoFillable: true
    },
    'C6.1': {
      id: 'C6.1',
      module: 'C6',
      text: 'What were your organization\'s gross global Scope 1 emissions in metric tons CO2e?',
      type: 'NUMBER',
      unit: 'metric tons CO2e',
      required: true,
      autoFillable: true
    },
    'C6.2': {
      id: 'C6.2',
      module: 'C6',
      text: 'Describe your gross global Scope 2 emissions in metric tons CO2e',
      type: 'NUMBER',
      unit: 'metric tons CO2e',
      required: true,
      autoFillable: true
    },
    'C6.5': {
      id: 'C6.5',
      module: 'C6',
      text: 'Account for your organization\'s gross global Scope 3 emissions',
      type: 'TABLE',
      columns: ['Category', 'Emissions (tCO2e)', 'Calculation Method'],
      required: true,
      autoFillable: true
    }
  };

  static autoFillFromESGData(questionId, esgData) {
    const question = this.sampleQuestions[questionId];
    if (!question || !question.autoFillable) return null;

    switch (questionId) {
      case 'C0.2':
        return {
          startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
        };
      
      case 'C6.1':
        const scope1 = esgData.find(d => d.metric?.toLowerCase().includes('scope1') || d.metric?.toLowerCase().includes('scope 1'));
        return scope1 ? parseFloat(scope1.value) : null;
      
      case 'C6.2':
        const scope2 = esgData.find(d => d.metric?.toLowerCase().includes('scope2') || d.metric?.toLowerCase().includes('scope 2'));
        return scope2 ? parseFloat(scope2.value) : null;
      
      case 'C6.5':
        const scope3 = esgData.filter(d => d.metric?.toLowerCase().includes('scope3') || d.metric?.toLowerCase().includes('scope 3'));
        return scope3.map(s => ({
          category: s.metric,
          emissions: parseFloat(s.value),
          method: 'Average data method'
        }));
      
      default:
        return null;
    }
  }

  static validateAnswer(questionId, answer) {
    const question = this.sampleQuestions[questionId];
    if (!question) return { valid: false, error: 'Question not found' };

    if (question.required && (!answer || answer === '')) {
      return { valid: false, error: 'This field is required' };
    }

    if (question.type === 'NUMBER' && answer) {
      const num = parseFloat(answer);
      if (isNaN(num)) return { valid: false, error: 'Must be a valid number' };
      if (num < 0) return { valid: false, error: 'Must be a positive number' };
    }

    if (question.type === 'TEXT' && question.maxLength && answer.length > question.maxLength) {
      return { valid: false, error: `Maximum ${question.maxLength} characters` };
    }

    return { valid: true };
  }

  static calculateCompleteness(answers) {
    const totalQuestions = Object.keys(this.sampleQuestions).length;
    const answeredQuestions = Object.keys(answers).filter(k => answers[k] && answers[k] !== '').length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  }

  static exportToORS(questionnaire) {
    // Simplified ORS XML format
    return {
      format: 'CDP ORS XML',
      version: '2024',
      data: {
        organizationId: questionnaire.organizationId,
        reportingYear: questionnaire.year,
        modules: questionnaire.modules.map(m => ({
          code: m.code,
          name: m.name,
          responses: m.questions.map(q => ({
            questionId: q.id,
            answer: q.answer,
            autoFilled: q.autoFilled
          }))
        }))
      }
    };
  }

  static generateSummary(questionnaire) {
    const completeness = this.calculateCompleteness(
      questionnaire.modules.reduce((acc, m) => {
        m.questions.forEach(q => { acc[q.id] = q.answer; });
        return acc;
      }, {})
    );

    const scope1 = questionnaire.modules
      .find(m => m.code === 'C6')?.questions
      .find(q => q.id === 'C6.1')?.answer || 0;

    const scope2 = questionnaire.modules
      .find(m => m.code === 'C6')?.questions
      .find(q => q.id === 'C6.2')?.answer || 0;

    return {
      completeness,
      totalEmissions: parseFloat(scope1) + parseFloat(scope2),
      scope1Emissions: parseFloat(scope1),
      scope2Emissions: parseFloat(scope2),
      modulesCompleted: questionnaire.modules.filter(m => m.completed).length,
      totalModules: questionnaire.modules.length,
      status: completeness === 100 ? 'Ready for Submission' : 'In Progress'
    };
  }
}
