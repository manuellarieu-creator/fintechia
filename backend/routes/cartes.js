const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

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
    if(cartes.length === 0) {
      // Create a default virtual card
      const pan = '45' + Math.floor(Math.random() * 100000000000000).toString().padStart(14, '0');
      const cvv = Math.floor(Math.random() * 900 + 100).toString();
      const exp_date = '12/28';
      const [r] = await pool.query('INSERT INTO cartes (user_id, pan, cvv, exp_date) VALUES (?, ?, ?, ?)', [req.user.id, pan, cvv, exp_date]);
      return res.json([{ id: r.insertId, pan, cvv, exp_date, bloquee: 0, plafond: 1500.00 }]);
    }
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

module.exports = router;
