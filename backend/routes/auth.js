const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const audit = require('../services/audit');
const notifications = require('../services/notifications');
const mailer = require('../services/mailer');

const validateReq = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation échouée', code: 'VALIDATION_ERROR', status: 400, details: errors.array() });
  }
  next();
};

// POST /api/auth/register
router.post('/register', [
  body('prenom').trim().notEmpty().withMessage('Le prénom est requis'),
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('telephone').optional().trim(),
  body('adresse').optional().trim(),
  body('profession').optional().trim(),
  body('revenus').optional().trim(),
  body('password').isLength({ min: 6 }).withMessage('Minimum 6 caractères'),
  body('type_compte').optional().isIn(['credit', 'epargne', 'courant']).withMessage('Type de compte invalide')
], validateReq, async (req, res, next) => {
  const { prenom, nom, email, telephone, adresse, profession, revenus, password } = req.body;
  const type_compte = req.body.type_compte || 'courant';

  // Auto-migration silencieuse via le pool (ne casse pas la transaction)
  try { await db.query("ALTER TABLE users ADD COLUMN adresse VARCHAR(255) DEFAULT NULL"); } catch(e) {}
  try { await db.query("ALTER TABLE users ADD COLUMN profession VARCHAR(100) DEFAULT NULL"); } catch(e) {}
  try { await db.query("ALTER TABLE users ADD COLUMN revenus VARCHAR(100) DEFAULT NULL"); } catch(e) {}
  try { await db.query("ALTER TABLE users ADD COLUMN telephone_code VARCHAR(10) DEFAULT NULL"); } catch(e) {}
  try { await db.query("ALTER TABLE users ADD COLUMN telephone_verifie BOOLEAN DEFAULT FALSE"); } catch(e) {}

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Email déjà utilisé', code: 'EMAIL_EXISTS', status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const telephone_code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

    const [userRes] = await connection.query(
      'INSERT INTO users (prenom, nom, email, telephone, adresse, profession, revenus, telephone_code, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        prenom || null, 
        nom || null, 
        email || null, 
        telephone || null, 
        adresse || null, 
        profession || null, 
        revenus || null, 
        telephone_code, 
        password_hash
      ]
    );
    const userId = userRes.insertId;

    const [accRes] = await connection.query(
      'INSERT INTO accounts (user_id, type_compte, statut) VALUES (?, ?, ?)',
      [userId, type_compte, 'en_attente']
    );
    
    await connection.commit();

    await audit.log({
      acteur_id: userId, acteur_email: email, acteur_role: 'client',
      action: audit.ACTIONS.INSCRIPTION, categorie: audit.CATEGORIES.compte,
      cible_type: 'user', cible_id: userId,
      cible_detail: `Nouveau compte ${type_compte}`,
      req
    });

    await notifications.envoyer(userId, 'Bienvenue chez Fintechia', 'Votre compte a été créé avec succès.', 'succes');

    const token = jwt.sign({ id: userId, email, role: 'client' }, process.env.JWT_SECRET || 'FintechiaSecretKey2026!', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    
    res.json({ token, telephone_code, user: { id: userId, prenom, nom, email, role: 'client' }, account: { id: accRes.insertId, statut: 'en_attente' } });
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (e) {}
    }
    next(err);
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/auth/verify-phone
router.post('/verify-phone', authMiddleware, async (req, res, next) => {
  try {
    const { code } = req.body;
    const [users] = await db.query('SELECT telephone_code FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable', status: 404 });
    
    if (users[0].telephone_code !== code) {
      return res.status(400).json({ error: 'Code incorrect', code: 'INVALID_CODE', status: 400 });
    }

    // Le code n'est pas effacé, comme demandé
    await db.query('UPDATE users SET telephone_verifie = TRUE WHERE id = ?', [req.user.id]);

    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: req.user.role,
      action: 'telephone_verifie', categorie: audit.CATEGORIES.securite,
      cible_type: 'user', cible_id: req.user.id,
      cible_detail: `Téléphone vérifié avec le code ${code}`, req
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], validateReq, async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      await audit.log({
        acteur_email: email, acteur_role: 'client',
        action: audit.ACTIONS.CONNEXION_ECHOUEE, categorie: audit.CATEGORIES.securite,
        statut: 'echec', detail: `Tentative échouée pour ${email}`, req
      });
      return res.status(401).json({ error: 'Identifiants invalides', code: 'INVALID_CREDS', status: 401 });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    
    if (!match) {
      await audit.log({
        acteur_email: email, acteur_role: 'client',
        action: audit.ACTIONS.CONNEXION_ECHOUEE, categorie: audit.CATEGORIES.securite,
        statut: 'echec', detail: `Mot de passe incorrect pour ${email}`, req
      });
      return res.status(401).json({ error: 'Identifiants invalides', code: 'INVALID_CREDS', status: 401 });
    }

    const [accounts] = await db.query('SELECT id, solde, statut, type_compte FROM accounts WHERE user_id = ?', [user.id]);
    const account = accounts.length > 0 ? accounts[0] : null;

    if (account && account.statut === 'bloque') {
      await audit.log({
        acteur_email: email, acteur_role: 'client',
        action: audit.ACTIONS.CONNEXION_ECHOUEE, categorie: audit.CATEGORIES.securite,
        statut: 'echec', detail: `Connexion refusée (compte bloqué) pour ${email}`, req
      });
      return res.status(403).json({ error: 'Votre compte est bloqué. Veuillez contacter le support.', code: 'ACCOUNT_BLOCKED', status: 403 });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'FintechiaSecretKey2026!', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

    await audit.log({
      acteur_id: user.id, acteur_email: user.email, acteur_role: user.role,
      action: audit.ACTIONS.CONNEXION_REUSSIE, categorie: audit.CATEGORIES.auth,
      cible_type: 'user', cible_id: user.id,
      cible_detail: `Connexion depuis ${req.headers['x-forwarded-for'] || 'IP inconnue'}`, req
    });

    res.json({
      token,
      user: { id: user.id, prenom: user.prenom, nom: user.nom, email: user.email, role: user.role },
      account
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const [users] = await db.query('SELECT id, prenom, nom, email, telephone, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND', status: 404 });
    const user = users[0];
    
    const [accounts] = await db.query('SELECT * FROM accounts WHERE user_id = ?', [user.id]);
    const account = accounts.length > 0 ? accounts[0] : null;

    const [kycs] = await db.query('SELECT statut FROM kyc WHERE user_id = ? ORDER BY soumis_le DESC LIMIT 1', [user.id]);
    const kyc_statut = kycs.length > 0 ? kycs[0].statut : null;

    res.json({ user, account, kyc_statut });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/auth/profile
router.patch('/profile', [
  authMiddleware,
  body('prenom').optional().trim().notEmpty(),
  body('nom').optional().trim().notEmpty(),
  body('telephone').optional().trim()
], validateReq, async (req, res, next) => {
  const { prenom, nom, telephone } = req.body;
  try {
    let query = 'UPDATE users SET ';
    const params = [];
    
    if (prenom) { query += 'prenom = ?, '; params.push(prenom); }
    if (nom) { query += 'nom = ?, '; params.push(nom); }
    if (telephone !== undefined) { query += 'telephone = ?, '; params.push(telephone); }
    
    // Enlever la dernière virgule
    if (params.length === 0) return res.json({ success: true });
    query = query.slice(0, -2) + ' WHERE id = ?';
    params.push(req.user.id);

    await db.query(query, params);

    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email,
      action: audit.ACTIONS.PROFIL_MIS_A_JOUR, categorie: audit.CATEGORIES.compte,
      cible_type: 'user', cible_id: req.user.id, req
    });

    res.json({ success: true, message: 'Profil mis à jour' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/auth/password
router.patch('/password', [
  authMiddleware,
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 })
], validateReq, async (req, res, next) => {
  const { current_password, new_password } = req.body;
  try {
    const [users] = await db.query('SELECT password_hash, prenom, email FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ error: 'User non trouvé', code: 'NOT_FOUND', status: 404 });
    
    const match = await bcrypt.compare(current_password, users[0].password_hash);
    if (!match) return res.status(400).json({ error: 'Mot de passe actuel incorrect', code: 'INVALID_PASSWORD', status: 400 });

    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'inconnue';
    await mailer.envoyerConfirmationMdp(users[0].email, users[0].prenom, ip);

    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email,
      action: audit.ACTIONS.MOT_DE_PASSE_CHANGE, categorie: audit.CATEGORIES.securite,
      cible_type: 'user', cible_id: req.user.id, req
    });

    await notifications.envoyer(req.user.id, 'Sécurité', 'Votre mot de passe a été modifié.', 'info');

    res.json({ success: true, message: 'Mot de passe mis à jour' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-demande
router.post('/reset-demande', [
  body('email').isEmail().normalizeEmail()
], validateReq, async (req, res, next) => {
  const { email } = req.body;
  try {
    const [users] = await db.query('SELECT id, prenom FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      const user = users[0];
      const token = crypto.randomBytes(48).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

      await db.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE', [user.id]);
      await db.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, token, expires]);

      const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
      await mailer.envoyerResetMdp(email, user.prenom, resetLink);

      await audit.log({
        acteur_id: user.id, acteur_email: email,
        action: audit.ACTIONS.RESET_MDP_DEMANDE, categorie: audit.CATEGORIES.securite,
        cible_type: 'user', cible_id: user.id, req
      });
    }
    // Always return OK
    res.json({ success: true, message: 'Si cet email existe, un lien a été envoyé.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/reset-verifier
router.get('/reset-verifier', async (req, res, next) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token manquant', code: 'BAD_REQUEST', status: 400 });

  try {
    const [tokens] = await db.query(
      'SELECT t.user_id, t.expires_at, t.used, u.prenom, u.email FROM password_reset_tokens t JOIN users u ON t.user_id = u.id WHERE t.token = ?',
      [token]
    );

    if (tokens.length === 0 || tokens[0].used || new Date() > new Date(tokens[0].expires_at)) {
      return res.status(400).json({ error: 'Token invalide ou expiré', code: 'INVALID_TOKEN', status: 400, expired: true });
    }

    const { prenom, email } = tokens[0];
    const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length));
    
    res.json({ valid: true, prenom, email: maskedEmail });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-valider
router.post('/reset-valider', [
  body('token').notEmpty(),
  body('new_password').isLength({ min: 6 })
], validateReq, async (req, res, next) => {
  const { token, new_password } = req.body;
  try {
    const [tokens] = await db.query('SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = ?', [token]);
    if (tokens.length === 0 || tokens[0].used || new Date() > new Date(tokens[0].expires_at)) {
      return res.status(400).json({ error: 'Token invalide', code: 'INVALID_TOKEN', status: 400 });
    }

    const userId = tokens[0].user_id;
    const hash = await bcrypt.hash(new_password, 10);
    
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
    await db.query('UPDATE password_reset_tokens SET used = TRUE WHERE token = ?', [token]);
    await db.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE', [userId]);

    const [users] = await db.query('SELECT email, prenom FROM users WHERE id = ?', [userId]);
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'inconnue';
    await mailer.envoyerConfirmationMdp(users[0].email, users[0].prenom, ip);

    await audit.log({
      acteur_id: userId, acteur_email: users[0].email,
      action: audit.ACTIONS.RESET_MDP_VALIDE, categorie: audit.CATEGORIES.securite,
      cible_type: 'user', cible_id: userId, req
    });

    res.json({ success: true, message: 'Mot de passe réinitialisé' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
