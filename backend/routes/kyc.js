const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const audit = require('../services/audit');
const notifications = require('../services/notifications');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `kyc_${req.user.id}_${file.fieldname}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format non autorisé'));
    }
  }
});

// POST /api/kyc/submit
router.post('/submit', authMiddleware, upload.fields([{ name: 'document', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]), async (req, res, next) => {
  try {
    if (!req.files || !req.files['document'] || !req.files['selfie']) {
      return res.status(400).json({ error: 'Document et selfie requis', code: 'MISSING_FILES', status: 400 });
    }

    const docUrl = `/uploads/${req.files['document'][0].filename}`;
    const selfieUrl = `/uploads/${req.files['selfie'][0].filename}`;
    const { type_document } = req.body; // cni, passeport, permis, sejour

    if (!['cni', 'passeport', 'permis', 'sejour'].includes(type_document)) {
      return res.status(400).json({ error: 'Type de document invalide', code: 'INVALID_TYPE', status: 400 });
    }

    const [existingKyc] = await db.query('SELECT id FROM kyc WHERE user_id = ?', [req.user.id]);
    if (existingKyc.length > 0) {
      await db.query(
        'UPDATE kyc SET type_document = ?, document_url = ?, selfie_url = ?, statut = "en_attente", soumis_le = NOW() WHERE user_id = ?',
        [type_document, docUrl, selfieUrl, req.user.id]
      );
    } else {
      await db.query(
        'INSERT INTO kyc (user_id, type_document, document_url, selfie_url, statut) VALUES (?, ?, ?, ?, "en_attente")',
        [req.user.id, type_document, docUrl, selfieUrl]
      );
    }

    const [accounts] = await db.query('SELECT statut FROM accounts WHERE user_id = ?', [req.user.id]);
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
