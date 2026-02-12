import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Lazy loading singleton
let dbInstance = null;

const getDb = async () => {
  if (!dbInstance) {
    const { default: db } = await import('../database/db.js');
    dbInstance = db;
  }
  return dbInstance;
};

// Custom Taxonomies Routes
router.get('/taxonomies', async (req, res) => {
  try {
    const db = await getDb();
    db.all('SELECT * FROM custom_taxonomies ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Failed to fetch taxonomies' });
      } else {
        const taxonomies = rows.map(row => ({
          ...row,
          categories: JSON.parse(row.categories || '[]')
        }));
        res.json(taxonomies);
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/taxonomies', async (req, res) => {
  try {
    const db = await getDb();
    const { name, description, categories } = req.body;
    
    db.run(`INSERT INTO custom_taxonomies (name, description, categories, created_by, created_at) 
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [name, description, JSON.stringify(categories), 1], // Default user ID
      function(err) {
        if (err) {
          res.status(500).json({ error: 'Failed to save taxonomy' });
        } else {
          res.json({ success: true, id: this.lastID });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/taxonomies/:id', authenticateToken, authorizeRole(['admin', 'supervisor']), async (req, res) => {
  try {
    const db = await getDb();
    const { name, description, categories } = req.body;
    
    db.run(`UPDATE custom_taxonomies 
            SET name = ?, description = ?, categories = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      [name, description, JSON.stringify(categories), req.params.id],
      function(err) {
        if (err) {
          res.status(500).json({ error: 'Failed to update taxonomy' });
        } else {
          res.json({ success: true, changes: this.changes });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Risk Assessment Routes
router.get('/risk-assessment', async (req, res) => {
  try {
    const db = await getDb();
    db.all('SELECT * FROM esg_risk_assessments ORDER BY risk_score DESC', (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Failed to fetch risk data' });
      } else {
        res.json(rows);
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/risk-assessment', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { name, category, impact, probability, description, mitigation, owner } = req.body;
    const riskScore = impact * probability;
    
    db.run(`INSERT INTO esg_risk_assessments 
            (name, category, impact, probability, risk_score, description, mitigation, owner, created_by, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [name, category, impact, probability, riskScore, description, mitigation, owner, req.user.id],
      function(err) {
        if (err) {
          res.status(500).json({ error: 'Failed to save risk assessment' });
        } else {
          res.json({ success: true, id: this.lastID, riskScore });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/risk-assessment/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { name, category, impact, probability, description, mitigation, owner } = req.body;
    const riskScore = impact * probability;
    
    db.run(`UPDATE esg_risk_assessments 
            SET name = ?, category = ?, impact = ?, probability = ?, risk_score = ?, 
                description = ?, mitigation = ?, owner = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      [name, category, impact, probability, riskScore, description, mitigation, owner, req.params.id],
      function(err) {
        if (err) {
          res.status(500).json({ error: 'Failed to update risk assessment' });
        } else {
          res.json({ success: true, changes: this.changes, riskScore });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;