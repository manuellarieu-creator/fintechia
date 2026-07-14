const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const audit = require('../services/audit');
const notifications = require('../services/notifications');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const FraudEngine = require('../services/fraudEngine');

// Migration BDD silencieuse pour KYC
(async () => {
  try { await db.query('ALTER TABLE kyc ADD COLUMN document_verso_url VARCHAR(500) AFTER document_url'); } catch(e){}
  try { await db.query('ALTER TABLE kyc ADD COLUMN motif_rejet VARCHAR(500) AFTER statut'); } catch(e){}
})();

// Configuration Cloudinary (si présente dans .env)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim()
  });
}

let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  // Stockage Cloudinary
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'fintechia_kyc',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webm', 'mp4'],
      resource_type: 'auto',
      public_id: (req, file) => `kyc_${req.user.id}_${file.fieldname}_${Date.now()}`
    }
  });
} else {
  // Stockage local (Fallback)
  const uploadDir = process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : './uploads');
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (err) {
    console.warn("Impossible de créer le dossier d'upload (lecture seule ?) :", err.message);
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `kyc_${req.user.id}_${file.fieldname}_${Date.now()}${ext}`);
    }
  });
}

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 20971520 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webm', '.mp4'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format non autorisé'));
    }
  }
});

// POST /api/kyc/submit
router.post('/submit', authMiddleware, upload.fields([{ name: 'document', maxCount: 1 }, { name: 'document_verso', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]), async (req, res, next) => {
  try {
    if (!req.files || !req.files['document'] || !req.files['selfie']) {
      return res.status(400).json({ error: 'Document (recto) et selfie requis', code: 'MISSING_FILES', status: 400 });
    }

    // Récupérer l'URL Cloudinary ou l'URL locale
    const docUrl = req.files['document'][0].path || `/uploads/${req.files['document'][0].filename}`;
    let docVersoUrl = null;
    if (req.files['document_verso']) {
      docVersoUrl = req.files['document_verso'][0].path || `/uploads/${req.files['document_verso'][0].filename}`;
    }
    const selfieUrl = req.files['selfie'][0].path || `/uploads/${req.files['selfie'][0].filename}`;
    const { type_document, instructions_kyc } = req.body; // cni, passeport, permis, sejour

    if (!['cni', 'passeport', 'permis', 'sejour'].includes(type_document)) {
      return res.status(400).json({ error: 'Type de document invalide', code: 'INVALID_TYPE', status: 400 });
    }

    const [existingKyc] = await db.query('SELECT id FROM kyc WHERE user_id = ?', [req.user.id]);
    
    // Check FraudEngine pour Selfie (mocked score)
    const kycScore = Math.floor(Math.random() * 100);
    const fraudRes = await FraudEngine.checkKyc({
        user_id: req.user.id,
        kyc_score: kycScore
    });

    const isFraudBlocked = fraudRes.action === 'block';
    const initialStatus = isFraudBlocked ? 'rejete' : 'en_attente';

    if (existingKyc.length > 0) {
      await db.query(
        'UPDATE kyc SET type_document = ?, document_url = ?, document_verso_url = ?, selfie_url = ?, commentaire = ?, statut = ?, soumis_le = NOW(), motif_rejet = ? WHERE user_id = ?',
        [type_document, docUrl, docVersoUrl, selfieUrl, instructions_kyc || '', initialStatus, isFraudBlocked ? 'Suspicion de fraude (Selfie)' : null, req.user.id]
      );
    } else {
      await db.query(
        'INSERT INTO kyc (user_id, type_document, document_url, document_verso_url, selfie_url, commentaire, statut, motif_rejet) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, type_document, docUrl, docVersoUrl, selfieUrl, instructions_kyc || '', initialStatus, isFraudBlocked ? 'Suspicion de fraude (Selfie)' : null]
      );
    }

    if (isFraudBlocked) {
        return res.status(403).json({ error: 'KYC rejeté automatiquement par le système de sécurité.', status: 403 });
    }

    const [accounts] = await db.query('SELECT statut FROM accounts WHERE user_id = ? ORDER BY id ASC', [req.user.id]);
    if (accounts.length > 0 && accounts[0].statut === 'en_attente') {
      await db.query('UPDATE accounts SET statut = "kyc_requis" WHERE user_id = ?', [req.user.id]);
    }

    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email,
      action: audit.ACTIONS.KYC_SOUMIS, categorie: audit.CATEGORIES.kyc,
      cible_type: 'kyc', cible_id: req.user.id,
      cible_detail: `Document : ${type_document}`, req
    });

    await notifications.envoyer(req.user.id, 'KYC Soumis', 'Documents KYC reçus, délai de traitement 24-48h.', 'info');

    res.json({ success: true, message: 'KYC soumis avec succès' });
  } catch (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR', status: 400 });
    }
    next(err);
  }
});

// GET /api/kyc/status
router.get('/status', authMiddleware, async (req, res, next) => {
  try {
    const [kycs] = await db.query('SELECT statut, commentaire, soumis_le FROM kyc WHERE user_id = ?', [req.user.id]);
    if (kycs.length === 0) {
      return res.json({ statut: 'aucun' });
    }
    res.json(kycs[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
