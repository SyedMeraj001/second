// Lazy load database only when needed
let dbInstance = null;
const getDb = () => {
  if (!dbInstance) {
    try {
      dbInstance = require('../database/db');
    } catch (error) {
      throw new Error(`Failed to load database: ${error.message}`);
    }
  }
  return dbInstance;
};

const validateESGData = async (req, res, next) => {
  const { category, metric, value, unit } = req.body;
  
  const db = getDb();
  const rule = await new Promise((resolve) => {
    db.get('SELECT * FROM validation_rules WHERE metric_name = ? AND category = ?', 
      [metric, category], (err, row) => resolve(row));
  });

  const errors = [];
  
  if (!value || isNaN(value)) errors.push('Invalid value');
  if (rule) {
    if (value < rule.min_value || value > rule.max_value) {
      errors.push(rule.error_message);
    }
    if (rule.required_unit && unit !== rule.required_unit) {
      errors.push(`Expected unit: ${rule.required_unit}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  req.validatedData = { category, metric, value: parseFloat(value), unit };
  next();
};

export { validateESGData };