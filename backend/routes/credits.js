const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { guard } = require('../middleware/auth');
const crypto = require('crypto');
const notifications = require('../services/notifications');
const audit = require('../services/audit');

// POST /api/credits/demande
router.post('/demande', guard, async (req, res, next) => {
  try {
    const { montant, duree_mois, motif, prenom, nom, email, telephone, message } = req.body;
    
    if (!montant || !duree_mois || !motif || !prenom || !nom || !email || !telephone) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs requis.', code: 'MISSING_FIELDS', status: 400 });
    }

    const m = parseFloat(montant);
    const d = parseInt(duree_mois, 10);
    const taux = 3.9; // Taux fixe indicatif
    
    if (isNaN(m) || m < 5000 || m > 250000) {
      return res.status(400).json({ error: 'Montant invalide.', code: 'INVALID_AMOUNT', status: 400 });
    }
    if (isNaN(d) || d < 12 || d > 300) {
      return res.status(400).json({ error: 'Durée invalide.', code: 'INVALID_DURATION', status: 400 });
    }

    const r = (taux / 100) / 12;
    const mensualite = m * r * Math.pow(1 + r, d) / (Math.pow(1 + r, d) - 1);
    
    const reference = 'CRE-' + crypto.randomUUID().slice(0, 8).toUpperCase();

    const [result] = await db.query(
      `INSERT INTO credit_requests (user_id, montant, duree_mois, taux, mensualite, motif, prenom, nom, email, telephone, message, reference) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, m, d, taux, mensualite, motif, prenom, nom, email, telephone, message || null, reference]
    );

    await notifications.envoyer(req.user.id, 'Demande de crédit', `Votre demande de crédit de ${m}€ (Réf: ${reference}) est en cours d'analyse.`, 'info');

    res.json({ success: true, reference, message: 'Votre demande a bien été enregistrée.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/credits/mes-demandes
router.get('/mes-demandes', guard, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, montant, duree_mois, taux, mensualite, motif, statut, reference, created_at FROM credit_requests WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
