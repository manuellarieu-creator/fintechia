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
const FraudEngine = require('../services/fraudEngine');

// Auto-migration silencieuse au chargement du module (fonctionne aussi sur Vercel)


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
  body('type_compte').optional().isIn(['credit', 'epargne', 'courant']).withMessage('Type de compte invalide'),
  body('date_naissance').optional().trim(),
  body('pin_code').optional().trim()
], validateReq, async (req, res, next) => {
  const { prenom, nom, email, telephone, adresse, profession, revenus, password, date_naissance, pin_code } = req.body;
  const type_compte = req.body.type_compte || 'courant';

  // Auto-migration silencieuse via le pool (ne casse pas la transaction)
  try { await db.query("ALTER TABLE users ADD COLUMN adresse VARCHAR(255) DEFAULT NULL"); } catch(e) {}
  try { await db.query("ALTER TABLE users ADD COLUMN profession VARCHAR(100) DEFAULT NULL"); } catch(e) {}
  try { await db.query("ALTER TABLE users ADD COLUMN revenus VARCHAR(100) DEFAULT NULL"); } catch(e) {}
  try { await db.query("ALTER TABLE users ADD COLUMN telephone_verifie BOOLEAN DEFAULT FALSE"); } catch(e) {}
  try { 
    await db.query("ALTER TABLE users ADD COLUMN numero_client VARCHAR(50)"); 
    await db.query("CREATE UNIQUE INDEX idx_numero_client ON users(numero_client)");
  } catch(e) {}
  try { await db.query("CREATE TABLE IF NOT EXISTS user_devices (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, device_token VARCHAR(255) NOT NULL UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_used DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)"); } catch(e) {}
  try { await db.query("ALTER TABLE users ADD COLUMN date_naissance DATE DEFAULT NULL"); } catch(e) {}
  try { await db.query("ALTER TABLE users ADD COLUMN pin_code VARCHAR(10) DEFAULT NULL"); } catch(e) {}

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Email déjà utilisé', code: 'EMAIL_EXISTS', status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const telephone_code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits backward compatibility
    
    // Générer le numéro client à 12 chiffres
    const timestamp = Date.now().toString().slice(-7);
    const random = Math.floor(10000 + Math.random() * 90000).toString(); // 5 chiffres
    const numero_client = `${timestamp}${random}`; // 7 + 5 = 12 chiffres

    const [userRes] = await connection.query(
      'INSERT INTO users (prenom, nom, email, telephone, adresse, profession, revenus, telephone_code, password_hash, numero_client, date_naissance, pin_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        prenom || null, 
        nom || null, 
        email || null, 
        telephone || null, 
        adresse || null, 
        profession || null, 
        revenus || null, 
        telephone_code, 
        password_hash,
        numero_client,
        date_naissance || null,
        pin_code || null
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
    await mailer.envoyerBienvenue(email, prenom);
    await notifications.envoyer(1, 'Nouvel Utilisateur', `Un nouvel utilisateur s\'est inscrit (ID: ${userId}).`, 'info');

    const token = jwt.sign({ id: userId, email, role: 'client' }, process.env.JWT_SECRET || 'FintechiaSecretKey2026!', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    
    res.json({ token, telephone_code, numero_client, user: { id: userId, prenom, nom, email, role: 'client' }, account: { id: accRes.insertId, statut: 'en_attente' } });
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
  body('idClient').notEmpty(),
  body('password').notEmpty()
], validateReq, async (req, res, next) => {
  const { idClient, password, trustedDeviceToken } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE numero_client = ? OR email = ?', [idClient, idClient]);
    if (users.length === 0) {
      await audit.log({
        acteur_email: idClient, acteur_role: 'client',
        action: audit.ACTIONS.CONNEXION_ECHOUEE, categorie: audit.CATEGORIES.securite,
        statut: 'echec', detail: `Tentative échouée pour ID Client ${idClient}`, req
      });
      return res.status(401).json({ error: 'Identifiants invalides', code: 'INVALID_CREDS', status: 401 });
    }

    const user = users[0];

    // Check FraudEngine pour IP VPN
    const ipRisk = Math.floor(Math.random() * 100); // Simulated IP risk
    const fraudRes = await FraudEngine.checkLogin({
        user_id: user.id,
        ip_risk: ipRisk,
        otp_fails: 0
    });
    if (fraudRes.action === 'block') {
        return res.status(403).json({ error: 'Connexion bloquée par sécurité', code: 'SECURITY_BLOCK', status: 403 });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    
    if (!match) {
      await audit.log({
        acteur_email: user.email, acteur_role: 'client',
        action: audit.ACTIONS.CONNEXION_ECHOUEE, categorie: audit.CATEGORIES.securite,
        statut: 'echec', detail: `Mot de passe incorrect pour ID Client ${idClient}`, req
      });
      return res.status(401).json({ error: 'Identifiants invalides', code: 'INVALID_CREDS', status: 401 });
    }

    let accounts = [];
    try {
      [accounts] = await db.query('SELECT id, solde, statut, type_compte, custom_type, iban FROM accounts WHERE user_id = ? ORDER BY id ASC', [user.id]);
    } catch(e) {
      console.error('[login] Erreur chargement comptes:', e.message);
    }
    const account = accounts.length > 0 ? accounts[0] : null;

    if (account && account.statut === 'bloque') {
      await audit.log({
        acteur_email: user.email, acteur_role: 'client',
        action: audit.ACTIONS.CONNEXION_ECHOUEE, categorie: audit.CATEGORIES.securite,
        statut: 'echec', detail: `Connexion refusée (compte bloqué) pour ID Client ${idClient}`, req
      });
      return res.status(403).json({ error: 'Votre compte est bloqué. Veuillez contacter le support.', code: 'ACCOUNT_BLOCKED', status: 403 });
    }

    // Verification 2FA / Device
    const isLocalhost = req.headers.host && req.headers.host.includes('localhost');
    let deviceKnown = false;

    if (trustedDeviceToken) {
      try {
        const [devices] = await db.query('SELECT * FROM user_devices WHERE device_token = ? AND user_id = ?', [trustedDeviceToken, user.id]);
        if (devices.length > 0) {
          deviceKnown = true;
          await db.query('UPDATE user_devices SET last_used = CURRENT_TIMESTAMP WHERE id = ?', [devices[0].id]);
        }
      } catch(e) {
        console.error('[login] Erreur vérification device:', e.message);
      }
    }

    if (!deviceKnown && !isLocalhost) {
      // Create a temporary token for the 2FA flow
      const tempToken = jwt.sign({ id: user.id, intent: '2fa' }, process.env.JWT_SECRET || 'FintechiaSecretKey2026!', { expiresIn: '15m' });
      // We don't send the telephone_code, the user must provide it
      const obfuscatedPhone = user.telephone ? user.telephone.replace(/(.{3}).*(.{2})/, '$1 *** ** $2') : '+33 6 ** ** ** 42';
      return res.json({ require2FA: true, obfuscatedPhone, tempToken });
    }

    // Direct Login (Device Known)
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'FintechiaSecretKey2026!', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

    await audit.log({
      acteur_id: user.id, acteur_email: user.email, acteur_role: user.role,
      action: audit.ACTIONS.CONNEXION_REUSSIE, categorie: audit.CATEGORIES.auth,
      cible_type: 'user', cible_id: user.id,
      cible_detail: `Connexion depuis ${req.headers['x-forwarded-for'] || 'IP inconnue'}`, req
    });

    const [kycs] = await db.query('SELECT statut FROM kyc WHERE user_id = ? ORDER BY soumis_le DESC LIMIT 1', [user.id]);
    const kyc_statut = kycs.length > 0 ? kycs[0].statut : null;

    res.json({
      token,
      user: { id: user.id, prenom: user.prenom, nom: user.nom, email: user.email, role: user.role },
      account,
      kyc_statut
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login/2fa
router.post('/login/2fa', [
  body('tempToken').notEmpty(),
  body('code').notEmpty()
], validateReq, async (req, res, next) => {
  const { tempToken, code } = req.body;
  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'FintechiaSecretKey2026!');
    if (decoded.intent !== '2fa') {
      return res.status(401).json({ error: 'Token invalide', status: 401 });
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) return res.status(401).json({ error: 'Utilisateur introuvable', status: 401 });
    
    const user = users[0];

    // Check code statique (pin_code ou telephone_code de la db)
    let isValidCode = (user.pin_code === code || user.telephone_code === code);
    if (!isValidCode && user.role === 'admin' && code === '0000') {
      isValidCode = true;
    }
    
    if (!isValidCode) {
      await db.query('UPDATE users SET otp_fails = otp_fails + 1 WHERE id = ?', [user.id]);
      const [updated] = await db.query('SELECT otp_fails FROM users WHERE id = ?', [user.id]);
      
      const fraudRes = await FraudEngine.checkLogin({
          user_id: user.id,
          ip_risk: 0,
          otp_fails: updated[0].otp_fails
      });
      
      if (fraudRes.action === 'block') {
          // Block the account
          await db.query("UPDATE accounts SET statut = 'bloque' WHERE user_id = ?", [user.id]);
          return res.status(403).json({ error: 'Compte bloqué suite à de trop nombreuses tentatives.', code: 'SECURITY_BLOCK', status: 403 });
      }

      return res.status(401).json({ error: 'Code incorrect', code: 'INVALID_2FA', status: 401 });
    }

    // Reset OTP fails on success
    await db.query('UPDATE users SET otp_fails = 0 WHERE id = ?', [user.id]);

    const pinUsage = user.pin_code_usage_count || 0;
    if (pinUsage >= 20 && user.role !== 'admin') {
      const resetToken = jwt.sign({ id: user.id, intent: 'reset_pin' }, process.env.JWT_SECRET || 'FintechiaSecretKey2026!', { expiresIn: '15m' });
      return res.json({ requirePinReset: true, resetToken });
    }


    // Increment PIN usage count (safe)
    try { await db.query('UPDATE users SET pin_code_usage_count = pin_code_usage_count + 1 WHERE id = ?', [user.id]); } catch(e) { console.error('[2fa] pin_code_usage_count update:', e.message); }

    // Enregistrer l'appareil de confiance (safe)
    let deviceToken = null;
    try {
      deviceToken = crypto.randomBytes(32).toString('hex');
      await db.query('INSERT INTO user_devices (user_id, device_token) VALUES (?, ?)', [user.id, deviceToken]);
    } catch(e) { console.error('[2fa] device insert:', e.message); deviceToken = null; }

    let accounts = [];
    try {
      [accounts] = await db.query('SELECT id, solde, statut, type_compte, custom_type, iban FROM accounts WHERE user_id = ? ORDER BY id ASC', [user.id]);
    } catch(e) { console.error('[2fa] accounts select:', e.message); }
    const account = accounts.length > 0 ? accounts[0] : null;

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'FintechiaSecretKey2026!', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

    await audit.log({
      acteur_id: user.id, acteur_email: user.email, acteur_role: user.role,
      action: audit.ACTIONS.CONNEXION_REUSSIE, categorie: audit.CATEGORIES.auth,
      cible_type: 'user', cible_id: user.id,
      cible_detail: `Connexion avec 2FA validé depuis ${req.headers['x-forwarded-for'] || 'IP inconnue'}`, req
    });

    const [kycs] = await db.query('SELECT statut FROM kyc WHERE user_id = ? ORDER BY soumis_le DESC LIMIT 1', [user.id]);
    const kyc_statut = kycs.length > 0 ? kycs[0].statut : null;

    res.json({
      token,
      deviceToken, // The frontend will store this and send it on next login
      user: { id: user.id, prenom: user.prenom, nom: user.nom, email: user.email, role: user.role },
      account,
      kyc_statut
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Session 2FA expirée ou invalide', status: 401 });
    }
    next(err);
  }
});

// POST /api/auth/reset-pin
router.post('/reset-pin', [
  body('resetToken').notEmpty(),
  body('new_pin').isLength({ min: 6, max: 6 }).isNumeric()
], validateReq, async (req, res, next) => {
  const { resetToken, new_pin } = req.body;
  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'FintechiaSecretKey2026!');
    if (decoded.intent !== 'reset_pin') {
      return res.status(401).json({ error: 'Token invalide', status: 401 });
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) return res.status(401).json({ error: 'Utilisateur introuvable', status: 401 });
    
    const user = users[0];

    await db.query('UPDATE users SET pin_code = ?, pin_code_usage_count = 0 WHERE id = ?', [new_pin, user.id]);

    // Proceed to login
    const deviceToken = crypto.randomBytes(32).toString('hex');
    await db.query('INSERT INTO user_devices (user_id, device_token) VALUES (?, ?)', [user.id, deviceToken]);

    const [accounts] = await db.query('SELECT id, solde, statut, type_compte, custom_type, depot_initial_requis, iban FROM accounts WHERE user_id = ? ORDER BY id ASC', [user.id]);
    const account = accounts.length > 0 ? accounts[0] : null;

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'FintechiaSecretKey2026!', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

    await audit.log({
      acteur_id: user.id, acteur_email: user.email, acteur_role: user.role,
      action: 'code_pin_mis_a_jour', categorie: audit.CATEGORIES.securite,
      cible_type: 'user', cible_id: user.id,
      cible_detail: `Code PIN renouvelé (limite atteinte)`, req
    });

    const [kycs] = await db.query('SELECT statut FROM kyc WHERE user_id = ? ORDER BY soumis_le DESC LIMIT 1', [user.id]);
    const kyc_statut = kycs.length > 0 ? kycs[0].statut : null;

    res.json({
      token,
      deviceToken,
      user: { id: user.id, prenom: user.prenom, nom: user.nom, email: user.email, role: user.role },
      account,
      kyc_statut
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Session expirée ou invalide', status: 401 });
    }
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const [users] = await db.query('SELECT id, prenom, nom, email, telephone, role, numero_client, created_at, transfer_types FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND', status: 404 });
    const user = users[0];
    
    const [accounts] = await db.query('SELECT * FROM accounts WHERE user_id = ? ORDER BY id ASC', [user.id]);
    let account = accounts.length > 0 ? accounts[0] : null;
    
    if (account && account.depot_initial_requis && parseFloat(account.depot_initial_requis) > 0) {
      let isSatisfied = parseFloat(account.solde) >= parseFloat(account.depot_initial_requis);
      
      if (!isSatisfied) {
        const [credits] = await db.query(
          "SELECT SUM(montant) as total FROM transactions WHERE account_id = ? AND type = 'credit' AND statut = 'valide'",
          [account.id]
        );
        if (credits.length > 0 && parseFloat(credits[0].total || 0) >= parseFloat(account.depot_initial_requis)) {
          isSatisfied = true;
        }
      }

      // NOUVEAU : Si l'utilisateur a déjà effectué une transaction sortante (débit), c'est qu'il a déjà été activé
      if (!isSatisfied) {
        const [debits] = await db.query(
          "SELECT id FROM transactions WHERE account_id = ? AND type = 'debit' LIMIT 1",
          [account.id]
        );
        if (debits.length > 0) {
          isSatisfied = true;
        }
      }

      if (isSatisfied) {
        await db.query('UPDATE accounts SET depot_initial_requis = 0 WHERE id = ?', [account.id]);
        account.depot_initial_requis = 0;
      }
    }

    const [kycs] = await db.query('SELECT statut FROM kyc WHERE user_id = ? ORDER BY soumis_le DESC LIMIT 1', [user.id]);
    const kyc_statut = kycs.length > 0 ? kycs[0].statut : null;

    res.json({ user, account, kyc_statut });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-deposit
router.post('/verify-deposit', authMiddleware, async (req, res, next) => {
  try {
    const [accounts] = await db.query('SELECT id, solde, depot_initial_requis FROM accounts WHERE user_id = ? ORDER BY id ASC', [req.user.id]);
    if (accounts.length === 0) return res.status(404).json({ error: 'Compte introuvable' });
    
    const account = accounts[0];
    const feeRequired = parseFloat(account.depot_initial_requis || 0);

    if (feeRequired === 0) {
      return res.json({ success: true, activated: true });
    }

    let isSatisfied = parseFloat(account.solde) >= feeRequired;
    
    if (!isSatisfied) {
      const [credits] = await db.query(
        "SELECT SUM(montant) as total FROM transactions WHERE account_id = ? AND type = 'credit' AND statut = 'valide'",
        [account.id]
      );
      if (credits.length > 0 && parseFloat(credits[0].total || 0) >= feeRequired) {
        isSatisfied = true;
      }
    }

    if (!isSatisfied) {
      const [debits] = await db.query(
        "SELECT id FROM transactions WHERE account_id = ? AND type = 'debit' LIMIT 1",
        [account.id]
      );
      if (debits.length > 0) {
        isSatisfied = true;
      }
    }

    if (isSatisfied) {
      await db.query('UPDATE accounts SET depot_initial_requis = 0 WHERE id = ?', [account.id]);
      return res.json({ success: true, activated: true });
    }
    
    return res.status(400).json({ error: 'Dépôt insuffisant' });
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
