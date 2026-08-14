const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const crypto = require('crypto');
const notifications = require('../services/notifications');
const multer = require('multer');
const path = require('path');

// Configuration centralisée des types de crédit
const CREDIT_CONFIG = {
  personnel: {
    label: 'Prêt personnel',
    minAmount: 5000, maxAmount: 120000,
    minDuration: 3, maxDuration: 60,
    rates: [
      { max: 50000, rate: 3.0 },
      { max: 120000, rate: 2.5 }
    ]
  },
  consommation: {
    label: 'Crédit de consommation',
    minAmount: 5000, maxAmount: 30000,
    minDuration: 3, maxDuration: 60,
    rates: [{ max: 30000, rate: 3.0 }]
  },
  immobilier: {
    label: 'Crédit immobilier',
    minAmount: 70000, maxAmount: 1000000,
    minDuration: 24, maxDuration: 300,
    rates: [
      { max: 500000, rate: 2.5 },
      { max: 1000000, rate: 2.0 }
    ]
  },
  grands_projets: {
    label: 'Financement grands projets',
    minAmount: 1000000, maxAmount: 5000000,
    minDuration: 24, maxDuration: 360,
    rates: [
      { max: 2000000, rate: 2.0 },
      { max: 5000000, rate: 1.5 }
    ]
  }
};

function getCreditRate(type, amount) {
  const config = CREDIT_CONFIG[type];
  if (!config) return 3.0;
  for (const bracket of config.rates) {
    if (amount <= bracket.max) return bracket.rate;
  }
  return config.rates[config.rates.length - 1].rate;
}

// Auto-migration silencieuse
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS credit_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        compte_id INT,
        montant DECIMAL(15,2) NOT NULL,
        duree_mois INT NOT NULL,
        taux DECIMAL(5,2) NOT NULL,
        mensualite DECIMAL(15,2) NOT NULL,
        type_credit VARCHAR(100),
        motif VARCHAR(255) NOT NULL,
        message TEXT,
        nom VARCHAR(100),
        prenom VARCHAR(100),
        email VARCHAR(255),
        telephone VARCHAR(50),
        profession VARCHAR(100),
        revenu_mensuel DECIMAL(15,2),
        statut VARCHAR(50) DEFAULT 'en_attente',
        reference VARCHAR(50) UNIQUE NOT NULL,
        contrat_data JSON,
        contrat_signe_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS credit_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        credit_request_id INT NOT NULL,
        type_document VARCHAR(100) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        statut VARCHAR(50) DEFAULT 'recu',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (credit_request_id) REFERENCES credit_requests(id) ON DELETE CASCADE
      )
    `);
    // Ajouter les colonnes contrat si elles n'existent pas déjà
    try {
      await db.query(`ALTER TABLE credit_requests ADD COLUMN contrat_data JSON`);
    } catch (e) { /* colonne existe déjà */ }
    try {
      await db.query(`ALTER TABLE credit_requests ADD COLUMN contrat_signe_at TIMESTAMP NULL`);
    } catch (e) { /* colonne existe déjà */ }
  } catch (e) { console.error('[credits] Migration error:', e.message); }
})();

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
    const creditType = type_credit || motif;

    // Validation par type de crédit
    const config = CREDIT_CONFIG[creditType];
    if (config) {
      if (m < config.minAmount || m > config.maxAmount) {
        return res.status(400).json({ 
          error: `Montant invalide pour ${config.label}. Min: ${config.minAmount}€, Max: ${config.maxAmount}€.`, 
          code: 'INVALID_AMOUNT', 
          status: 400 
        });
      }
      if (d < config.minDuration || d > config.maxDuration) {
        return res.status(400).json({ 
          error: `Durée invalide pour ${config.label}. Min: ${config.minDuration} mois, Max: ${config.maxDuration} mois.`, 
          code: 'INVALID_DURATION', 
          status: 400 
        });
      }
    } else {
      // Validation générique si type inconnu
      if (isNaN(m) || m < 5000 || m > 5000000) {
        return res.status(400).json({ error: 'Montant invalide.', code: 'INVALID_AMOUNT', status: 400 });
      }
      if (isNaN(d) || d < 3 || d > 360) {
        return res.status(400).json({ error: 'Durée invalide.', code: 'INVALID_DURATION', status: 400 });
      }
    }
    
    // Taux dynamique selon type et montant
    const taux = getCreditRate(creditType, m);

    const r = (taux / 100) / 12;
    const mensualite = m * r * Math.pow(1 + r, d) / (Math.pow(1 + r, d) - 1);
    
    const reference = 'CRE-' + crypto.randomUUID().slice(0, 8).toUpperCase();

    const [result] = await db.query(
      `INSERT INTO credit_requests (user_id, montant, duree_mois, taux, mensualite, motif, prenom, nom, email, telephone, message, profession, revenu_mensuel, type_credit, reference) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, m, d, taux, mensualite, motif, prenom, nom, email, telephone, message || null, profession || null, revenu_mensuel || null, creditType, reference]
    );

    const creditId = result.insertId;

    await notifications.envoyer(req.user.id, 'Demande de crédit', `Votre demande de crédit de ${m}€ (Réf: ${reference}) est en cours d'analyse.`, 'info');
    await notifications.envoyer(1, 'Nouvelle Demande de Crédit', `L\'utilisateur ${req.user.id} a demandé un crédit de ${m}€ (Réf: ${reference}).`, 'info');

    res.json({ success: true, reference, id: creditId, message: 'Votre demande a bien été enregistrée.' });
  } catch (err) {
    next(err);
  }
});

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

    if (type_document === 'contrat_signe') {
        const contratData = JSON.stringify({
            type: 'inconnu',
            formData: { modeSignature: 'imprimer' }
        });
        await db.query(
          "UPDATE credit_requests SET contrat_data = ?, contrat_signe_at = NOW(), statut = 'etude' WHERE id = ?", 
          [contratData, id]
        );
        // Notification Admin
        await notifications.envoyer(1, 'Contrat Scanné Reçu', `L'utilisateur a uploadé son contrat scanné pour la demande #${id}.`, 'info');
    }

    res.json({ success: true, message: 'Document uploadé avec succès.', filePath });
  } catch (err) {
    next(err);
  }
});

// POST /api/credits/:id/contrat — Sauvegarder les données du contrat
router.post('/:id/contrat', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, formData, signedAt } = req.body;

    // Vérifier que le crédit appartient à l'utilisateur
    const [rows] = await db.query('SELECT user_id, reference FROM credit_requests WHERE id = ?', [id]);
    if (rows.length === 0 || rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé.', code: 'FORBIDDEN', status: 403 });
    }

    const contratData = JSON.stringify({
      type,
      formData,
      signedAt,
      signedBy: req.user.id
    });

    await db.query(
      'UPDATE credit_requests SET contrat_data = ?, contrat_signe_at = ?, statut = ? WHERE id = ?',
      [contratData, signedAt || new Date().toISOString(), 'valide_succes', id]
    );

    // Notification
    await notifications.envoyer(req.user.id, 'Contrat signé', `Votre contrat (Réf: ${rows[0].reference}) a été signé avec succès.`, 'info');
    await notifications.envoyer(1, 'Contrat Signé', `L'utilisateur ${req.user.id} a signé son contrat (Réf: ${rows[0].reference}).`, 'info');

    res.json({ success: true, message: 'Contrat signé et enregistré avec succès.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/credits/:id/contrat — Récupérer le contrat
router.get('/:id/contrat', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT user_id, contrat_data, contrat_signe_at FROM credit_requests WHERE id = ?',
      [id]
    );
    if (rows.length === 0 || rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé.', code: 'FORBIDDEN', status: 403 });
    }

    const contrat = rows[0].contrat_data ? (typeof rows[0].contrat_data === 'string' ? JSON.parse(rows[0].contrat_data) : rows[0].contrat_data) : null;
    
    res.json({ 
      contrat, 
      signedAt: rows[0].contrat_signe_at,
      hasSigned: !!rows[0].contrat_signe_at
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/credits/mes-demandes
router.get('/mes-demandes', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, montant, duree_mois, taux, mensualite, motif, type_credit, statut, reference, contrat_signe_at, created_at FROM credit_requests WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    
    // Fetch documents pour chaque demande
    for (let row of rows) {
      const [docs] = await db.query(
        'SELECT id, type_document, file_path, statut, created_at FROM credit_documents WHERE credit_request_id = ?',
        [row.id]
      );
      row.documents = docs;
      row.hasSigned = !!row.contrat_signe_at;
    }

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
