const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const crypto = require('crypto');
const notifications = require('../services/notifications');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// POST /api/credits/demande
router.post('/demande', authMiddleware, async (req, res, next) => {
  try {
    const { montant, duree_mois, motif, prenom, nom, email, telephone, message, profession, revenu_mensuel, type_credit } = req.body;
    
    if (!montant || !duree_mois || !motif || !prenom || !nom || !email || !telephone) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs requis.', code: 'MISSING_FIELDS', status: 400 });
    }

    const m = parseFloat(montant);
    const d = parseInt(duree_mois, 10);
    
    // Taux dynamique
    let taux = 3.9;
    if (m >= 5000 && m <= 50000) taux = 3.0;
    else if (m > 50000 && m <= 500000) taux = 2.5;
    else if (m > 500000) taux = 2.0;
    
    if (isNaN(m) || m < 5000 || m > 2000000) {
      return res.status(400).json({ error: 'Montant invalide.', code: 'INVALID_AMOUNT', status: 400 });
    }
    if (isNaN(d) || d < 12 || d > 300) {
      return res.status(400).json({ error: 'Durée invalide.', code: 'INVALID_DURATION', status: 400 });
    }

    const r = (taux / 100) / 12;
    const mensualite = m * r * Math.pow(1 + r, d) / (Math.pow(1 + r, d) - 1);
    
    const reference = 'CRE-' + crypto.randomUUID().slice(0, 8).toUpperCase();

    const [result] = await db.query(
      `INSERT INTO credit_requests (user_id, montant, duree_mois, taux, mensualite, motif, prenom, nom, email, telephone, message, profession, revenu_mensuel, type_credit, reference) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, m, d, taux, mensualite, motif, prenom, nom, email, telephone, message || null, profession || null, revenu_mensuel || null, type_credit || motif, reference]
    );

    const creditId = result.insertId;

    await notifications.envoyer(req.user.id, 'Demande de crédit', `Votre demande de crédit de ${m}€ (Réf: ${reference}) est en cours d'analyse.`, 'info');

    res.json({ success: true, reference, id: creditId, message: 'Votre demande a bien été enregistrée.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/credits/:id/documents
// POST /api/credits/:id/documents
router.post('/:id/documents', authMiddleware, upload.single('document'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type_document } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé.', code: 'MISSING_FILE', status: 400 });
    }

    const [rows] = await db.query('SELECT user_id FROM credit_requests WHERE id = ?', [id]);
    if (rows.length === 0 || rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé.', code: 'FORBIDDEN', status: 403 });
    }

    const filePath = '/uploads/' + req.file.filename;

    await db.query(
      'INSERT INTO credit_documents (credit_request_id, type_document, file_path) VALUES (?, ?, ?)',
      [id, type_document, filePath]
    );

    res.json({ success: true, message: 'Document uploadé avec succès.', filePath });
  } catch (err) {
    next(err);
  }
});

// GET /api/credits/mes-demandes
router.get('/mes-demandes', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, montant, duree_mois, taux, mensualite, motif, type_credit, statut, reference, created_at FROM credit_requests WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    
    // Fetch documents pour chaque demande
    for (let row of rows) {
      const [docs] = await db.query(
        'SELECT id, type_document, file_path, statut, created_at FROM credit_documents WHERE credit_request_id = ?',
        [row.id]
      );
      row.documents = docs;
    }

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
