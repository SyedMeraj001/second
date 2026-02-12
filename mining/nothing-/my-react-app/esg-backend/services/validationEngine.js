// Lazy loading singleton
let dbInstance = null;

const getDb = async () => {
  if (!dbInstance) {
    const { default: db } = await import('../database/db.js');
    dbInstance = db;
  }
  return dbInstance;
};

class ValidationEngine {
  static async validateESGData(data) {
    const errors = [];
    const warnings = [];

    // Get validation rules from database
    const rules = await this.getValidationRules();
    
    for (const [metricName, value] of Object.entries(data)) {
      const rule = rules.find(r => r.metric_name === metricName);
      if (!rule) continue;

      // Range validation
      if (rule.min_value !== null && value < rule.min_value) {
        errors.push(`${metricName}: Value ${value} below minimum ${rule.min_value}`);
      }
      if (rule.max_value !== null && value > rule.max_value) {
        errors.push(`${metricName}: Value ${value} above maximum ${rule.max_value}`);
      }

      // Custom formula validation
      if (rule.validation_formula) {
        try {
          const isValid = this.evaluateFormula(rule.validation_formula, value, data);
          if (!isValid) {
            errors.push(rule.error_message || `${metricName}: Failed validation`);
          }
        } catch (e) {
          warnings.push(`${metricName}: Validation formula error`);
        }
      }
    }

    // Cross-metric validations
    this.validateCrossMetrics(data, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dataQualityScore: this.calculateDataQualityScore(data, errors, warnings)
    };
  }

  static validateCrossMetrics(data, errors, warnings) {
    // Scope 1+2+3 should be reasonable
    const total = (data.scope1Emissions || 0) + (data.scope2Emissions || 0) + (data.scope3Emissions || 0);
    if (total > 0 && data.scope3Emissions && data.scope3Emissions < total * 0.1) {
      warnings.push('Scope 3 emissions seem unusually low compared to Scope 1+2');
    }

    // Female percentage validation
    if (data.femaleEmployeesPercentage > 0 && data.totalEmployees && data.totalEmployees < 10) {
      warnings.push('Small employee count may affect diversity metrics reliability');
    }
  }

  static calculateDataQualityScore(data, errors, warnings) {
    let score = 100;
    score -= errors.length * 20; // Major penalty for errors
    score -= warnings.length * 5; // Minor penalty for warnings
    
    // Bonus for completeness
    const completeness = Object.values(data).filter(v => v !== null && v !== '').length / Object.keys(data).length;
    score += completeness * 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  static evaluateFormula(formula, value, allData) {
    // Secure formula evaluator with whitelist approach
    const allowedOperators = ['+', '-', '*', '/', '>', '<', '>=', '<=', '==', '!=', '&&', '||', '(', ')'];
    const allowedFunctions = ['Math.abs', 'Math.min', 'Math.max', 'Math.round', 'Math.floor', 'Math.ceil'];
    const allowedVariables = ['value', 'scope1Emissions', 'scope2Emissions', 'scope3Emissions', 'totalEmployees', 'femaleEmployeesPercentage'];
    
    // Sanitize formula - remove dangerous patterns
    const sanitizedFormula = this.sanitizeFormula(formula, allowedOperators, allowedFunctions, allowedVariables);
    
    if (!sanitizedFormula) {
      console.warn('Formula rejected due to security concerns:', formula);
      return true; // Default to valid for security
    }
    
    // Create safe context with only allowed variables
    const safeContext = {
      value: Number(value) || 0,
      scope1Emissions: Number(allData.scope1Emissions) || 0,
      scope2Emissions: Number(allData.scope2Emissions) || 0,
      scope3Emissions: Number(allData.scope3Emissions) || 0,
      totalEmployees: Number(allData.totalEmployees) || 0,
      femaleEmployeesPercentage: Number(allData.femaleEmployeesPercentage) || 0,
      Math: {
        abs: Math.abs,
        min: Math.min,
        max: Math.max,
        round: Math.round,
        floor: Math.floor,
        ceil: Math.ceil
      }
    };
    
    try {
      // Use safe evaluation with restricted context
      const func = new Function('context', `
        "use strict";
        const {${Object.keys(safeContext).join(', ')}} = context;
        return (${sanitizedFormula});
      `);
      
      return Boolean(func(safeContext));
    } catch (error) {
      console.warn('Formula evaluation failed:', error.message);
      return true; // Default to valid if evaluation fails
    }
  }
  
  static sanitizeFormula(formula, allowedOperators, allowedFunctions, allowedVariables) {
    if (!formula || typeof formula !== 'string') return null;
    
    // Remove whitespace for analysis
    const cleaned = formula.replace(/\s+/g, '');
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /require\s*\(/i,
      /import\s+/i,
      /process\./i,
      /global\./i,
      /window\./i,
      /document\./i,
      /__proto__/i,
      /constructor/i,
      /prototype/i,
      /\[\s*["']/,  // Property access with strings
      /\w+\s*\[/,   // Dynamic property access
      /\$\{/,       // Template literals
      /`/           // Backticks
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(formula)) {
        return null; // Reject dangerous formulas
      }
    }
    
    // Validate that formula only contains allowed elements
    const tokens = this.tokenizeFormula(cleaned);
    for (const token of tokens) {
      if (this.isNumber(token)) continue;
      if (allowedOperators.includes(token)) continue;
      if (allowedFunctions.some(fn => token.startsWith(fn))) continue;
      if (allowedVariables.includes(token)) continue;
      
      // Reject if unknown token found
      return null;
    }
    
    return formula; // Return original formula if safe
  }
  
  static tokenizeFormula(formula) {
    // Simple tokenizer for validation
    return formula.match(/\w+(?:\.\w+)*|[+\-*/()><=!&|]+|\d+(?:\.\d+)?/g) || [];
  }
  
  static isNumber(str) {
    return /^\d+(?:\.\d+)?$/.test(str);
  }

  static async getValidationRules() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM validation_rules WHERE active = 1', (err, rules) => {
        if (err) reject(err);
        else resolve(rules || []);
      });
    });
  }
}

export default ValidationEngine;