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

module.exports = router;
