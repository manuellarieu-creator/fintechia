const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Migration DB silencieuse pour la table settings
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL
      )
    `);
    // Insert default activation_fee if it doesn't exist
    await db.query(`
      INSERT IGNORE INTO settings (setting_key, setting_value) 
      VALUES ('activation_fee', '10')
    `);
  } catch(e) {
    console.error("Erreur migration settings:", e.message);
  }
})();

// GET /api/settings/:key (Accessible by authenticated users)
router.get('/:key', authMiddleware.authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', [req.params.key]);
    if (rows.length === 0) return res.status(404).json({ error: 'Setting introuvable' });
    res.json({ key: req.params.key, value: rows[0].setting_value });
  } catch (err) {
    next(err);
  }
});

// POST /api/settings/:key (Admin only)
router.post('/:key', [authMiddleware.authMiddleware, authMiddleware.adminMiddleware], async (req, res, next) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'Value is required' });
    
    await db.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', 
      [req.params.key, String(value), String(value)]
    );
    res.json({ success: true, key: req.params.key, value });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
