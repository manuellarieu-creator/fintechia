const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

pool.query(`
  CREATE TABLE IF NOT EXISTS cartes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pan VARCHAR(20) NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    exp_date VARCHAR(5) NOT NULL,
    bloquee BOOLEAN DEFAULT FALSE,
    plafond DECIMAL(15,2) DEFAULT 1500.00,
    cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).catch(err => console.error("Erreur création table cartes:", err));

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [cartes] = await pool.query('SELECT * FROM cartes WHERE user_id = ?', [req.user.id]);
    res.json(cartes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur fetch cartes' });
  }
});

router.patch('/:id/toggle-block', authMiddleware, async (req, res) => {
  const { bloquee } = req.body;
  try {
    await pool.query('UPDATE cartes SET bloquee = ? WHERE id = ? AND user_id = ?', [bloquee ? 1 : 0, req.params.id, req.user.id]);
    res.json({ success: true, bloquee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur update carte' });
  }
});

router.patch('/:id/plafond', authMiddleware, async (req, res) => {
  const { plafond } = req.body;
  try {
    await pool.query('UPDATE cartes SET plafond = ? WHERE id = ? AND user_id = ?', [parseFloat(plafond), req.params.id, req.user.id]);
    res.json({ success: true, plafond });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur update plafond' });
  }
});
// --- Admin Routes ---
router.get('/admin', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const filter = req.query.filter || 'all'; // all, actives, bloquees
    
    let whereClause = '';
    let queryParams = [];
    if (filter === 'actives') {
      whereClause = 'WHERE c.bloquee = 0';
    } else if (filter === 'bloquees') {
      whereClause = 'WHERE c.bloquee = 1';
    }
    
    const countQuery = `SELECT COUNT(*) as total FROM cartes c ${whereClause}`;
    const [countRows] = await pool.query(countQuery, queryParams);
    const total = countRows[0].total;

    const query = `
      SELECT c.*, u.nom, u.prenom 
      FROM cartes c 
      JOIN users u ON c.user_id = u.id 
      ${whereClause}
      ORDER BY c.cree_le DESC 
      LIMIT ? OFFSET ?
    `;
    const [cartes] = await pool.query(query, [...queryParams, limit, offset]);
    
    // Stats
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_emises,
        SUM(CASE WHEN bloquee = 0 THEN 1 ELSE 0 END) as actives,
        SUM(CASE WHEN bloquee = 1 THEN 1 ELSE 0 END) as bloquees
      FROM cartes
    `);

    res.json({
      cartes,
      stats: stats[0],
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur fetch cartes admin' });
  }
});

router.post('/admin/:id/action', [authMiddleware, adminMiddleware], async (req, res) => {
  const { action } = req.body; // 'block', 'unblock', 'renew'
  try {
    if (action === 'block' || action === 'unblock') {
      const bloquee = action === 'block' ? 1 : 0;
      await pool.query('UPDATE cartes SET bloquee = ? WHERE id = ?', [bloquee, req.params.id]);
    } else if (action === 'renew') {
      const exp_date = '12/30'; // Simple mock logic for renewal
      await pool.query('UPDATE cartes SET exp_date = ? WHERE id = ?', [exp_date, req.params.id]);
    }
    res.json({ success: true, action });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur action carte admin' });
  }
});

router.post('/admin/emit', [authMiddleware, adminMiddleware], async (req, res) => {
  const { user_id, type } = req.body;
  try {
    const pan = '45' + Math.floor(Math.random() * 100000000000000).toString().padStart(14, '0');
    const cvv = Math.floor(Math.random() * 900 + 100).toString();
    const exp_date = '12/28';
    const plafond = type === 'Platinum' ? 5000.00 : 1500.00;
    
    await pool.query('INSERT INTO cartes (user_id, pan, cvv, exp_date, plafond) VALUES (?, ?, ?, ?, ?)', [user_id, pan, cvv, exp_date, plafond]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur emission carte admin' });
  }
});

module.exports = router;
