const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/admin/alertes
router.get('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const filter = req.query.filter || 'all'; // all, pending, resolved
    
    let whereClause = '';
    let queryParams = [];
    if (filter === 'pending') {
      whereClause = 'WHERE a.statut = "en_attente"';
    } else if (filter === 'resolved') {
      whereClause = 'WHERE a.statut = "resolu"';
    }
    
    const countQuery = `SELECT COUNT(*) as total FROM alertes_fraudes a ${whereClause}`;
    const [countRows] = await pool.query(countQuery, queryParams);
    const total = countRows[0].total;

    const query = `
      SELECT a.*, u.nom, u.prenom 
      FROM alertes_fraudes a 
      JOIN users u ON a.user_id = u.id 
      ${whereClause}
      ORDER BY a.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const [alertes] = await pool.query(query, [...queryParams, limit, offset]);
    
    // Stats
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_alertes,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN statut = 'resolu' THEN 1 ELSE 0 END) as resolues,
        SUM(CASE WHEN niveau_risque = 'high' AND statut = 'en_attente' THEN 1 ELSE 0 END) as critiques
      FROM alertes_fraudes
    `);

    res.json({
      alertes,
      stats: stats[0],
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur fetch alertes admin' });
  }
});

// POST /api/admin/alertes/:id/resolve
router.post('/:id/resolve', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    await pool.query('UPDATE alertes_fraudes SET statut = "resolu" WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Alerte résolue avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la résolution de l\'alerte' });
  }
});

// GET /api/admin/alertes/rules
router.get('/rules', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const [rules] = await pool.query('SELECT * FROM fraud_detection_rules ORDER BY id ASC');
    res.json(rules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur fetch rules' });
  }
});

// POST /api/admin/alertes/rules
router.post('/rules', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id, is_active } = req.body;
    await pool.query('UPDATE fraud_detection_rules SET is_active = ? WHERE id = ?', [is_active, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur update rule' });
  }
});

// POST /api/admin/alertes/rules/add
router.post('/rules/add', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { rule_name, description } = req.body;
    if (!rule_name || !description) return res.status(400).json({ error: 'Champs requis' });
    await pool.query('INSERT INTO fraud_detection_rules (rule_name, description, is_active, times_triggered) VALUES (?, ?, TRUE, 0)', [rule_name, description]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur ajout rule' });
  }
});

// DELETE /api/admin/alertes/rules/:id
router.delete('/rules/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    await pool.query('DELETE FROM fraud_detection_rules WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur suppression rule' });
  }
});

// POST /api/admin/alertes/create
router.post('/create', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { user_id, type_alerte, severite, description } = req.body;
    await pool.query(
      'INSERT INTO alertes_fraudes (user_id, type, niveau_risque, description, statut) VALUES (?, ?, ?, ?, "en_attente")', 
      [user_id, type_alerte, severite, description]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur création alerte' });
  }
});

// POST /api/admin/alertes/global-action
router.post('/global-action', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { action } = req.body;
    
    // Get users with active critical/high alerts
    const [activeUsers] = await pool.query(`
      SELECT DISTINCT user_id FROM alertes_fraudes 
      WHERE statut = 'en_attente' AND niveau_risque = 'high'
    `);
    
    if (activeUsers.length === 0) return res.json({ success: true, message: 'Aucun compte ciblé' });
    const userIds = activeUsers.map(u => u.user_id);
    
    if (action === 'block') {
      await pool.query('UPDATE accounts SET statut = "bloque", motif_blocage = "Blocage global fraude" WHERE user_id IN (?)', [userIds]);
    } else if (action === 'notify') {
      // In a real app, send emails here
    }
    
    res.json({ success: true, count: userIds.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur action globale' });
  }
});

module.exports = router;
