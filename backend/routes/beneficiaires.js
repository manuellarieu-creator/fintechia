const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Initialisation de la table si elle n'existe pas
pool.query(`
  CREATE TABLE IF NOT EXISTS beneficiaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nom VARCHAR(255) NOT NULL,
    iban VARCHAR(34) NOT NULL,
    cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).catch(err => console.error("Erreur création table beneficiaires:", err));

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [bens] = await pool.query('SELECT * FROM beneficiaires WHERE user_id = ? ORDER BY nom ASC', [req.user.id]);
    res.json(bens);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur fetch beneficiaires' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { nom } = req.body;
  const iban = req.body.iban ? req.body.iban.replace(/\s+/g, '').toUpperCase() : null;
  if(!nom || !iban) return res.status(400).json({ error: 'Nom et IBAN requis' });
  
  try {
    // 1. Validation de la longueur via BDD
    const codePays = iban.substring(0, 2);
    const [rules] = await pool.query('SELECT longueur FROM iban_rules WHERE code_pays = ?', [codePays]);
    if (rules.length > 0) {
      if (iban.length !== rules[0].longueur) {
        return res.status(400).json({ error: `L'IBAN n'est pas valide (longueur incorrecte pour le pays ${codePays})`, code: 'INVALID_IBAN_LENGTH' });
      }
    }

    // 2. Récupération automatique du BIC via openiban.com
    let bic = null;
    try {
      const ibanResponse = await fetch(`https://openiban.com/validate/${iban}?getBIC=true`);
      if (ibanResponse.ok) {
        const data = await ibanResponse.json();
        if (!data.valid) {
          return res.status(400).json({ error: "L'IBAN n'est pas valide (contrôle de somme ou format incorrect)", code: 'INVALID_IBAN' });
        }
        if (data.bankData && data.bankData.bic) {
          bic = data.bankData.bic;
        }
      }
    } catch (err) {
      console.error("Erreur appel openiban:", err.message);
      // Fallback: on continue même si openiban échoue
    }

    const [r] = await pool.query('INSERT INTO beneficiaires (user_id, nom, iban, bic) VALUES (?, ?, ?, ?)', [req.user.id, nom, iban, bic]);
    res.status(201).json({ id: r.insertId, nom, iban, bic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur ajout beneficiaire' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM beneficiaires WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

module.exports = router;
