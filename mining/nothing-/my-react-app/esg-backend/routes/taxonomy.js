import express from 'express';
import { requirePermission, PERMISSIONS } from '../middleware/rbac.js';
import { models } from '../models/index.js';

const router = express.Router();

// Create Custom Taxonomy
router.post('/', requirePermission(PERMISSIONS.ADD_DATA), async (req, res) => {
  try {
    const { name, category, parent_id, metrics, mapped_frameworks, validation_rules } = req.body;
    
    const taxonomy = await models.CustomTaxonomy.create({
      name,
      category,
      parent_id,
      metrics,
      mapped_frameworks,
      validation_rules,
      created_by: req.user.userId
    });
    
    res.json({ message: 'Taxonomy created', taxonomy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Taxonomies (Tree Structure)
router.get('/', requirePermission(PERMISSIONS.READ_DATA), async (req, res) => {
  try {
    const taxonomies = await models.CustomTaxonomy.findAll();
    
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item.toJSON(),
          children: buildTree(items, item.id)
        }));
    };
    
    res.json(buildTree(taxonomies));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Taxonomy
router.get('/:id', requirePermission(PERMISSIONS.READ_DATA), async (req, res) => {
  try {
    const taxonomy = await models.CustomTaxonomy.findByPk(req.params.id);
    if (!taxonomy) return res.status(404).json({ error: 'Not found' });
    res.json(taxonomy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Taxonomy
router.put('/:id', requirePermission(PERMISSIONS.EDIT_DATA), async (req, res) => {
  try {
    const taxonomy = await models.CustomTaxonomy.findByPk(req.params.id);
    if (!taxonomy) return res.status(404).json({ error: 'Not found' });
    
    await taxonomy.update(req.body);
    res.json({ message: 'Updated', taxonomy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Taxonomy
router.delete('/:id', requirePermission(PERMISSIONS.DELETE_DATA), async (req, res) => {
  try {
    const deleted = await models.CustomTaxonomy.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Map to Framework
router.post('/:id/map', requirePermission(PERMISSIONS.EDIT_DATA), async (req, res) => {
  try {
    const { framework, mapping } = req.body;
    const taxonomy = await models.CustomTaxonomy.findByPk(req.params.id);
    
    const frameworks = taxonomy.mapped_frameworks || [];
    frameworks.push({ framework, mapping, date: new Date() });
    
    await taxonomy.update({ mapped_frameworks: frameworks });
    res.json({ message: 'Mapped to framework', taxonomy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
