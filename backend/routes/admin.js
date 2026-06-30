const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const audit = require('../services/audit');
const notifications = require('../services/notifications');

const guard = [authMiddleware, adminMiddleware];

const validateReq = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation échouée', code: 'VALIDATION_ERROR', status: 400, details: errors.array() });
  }
  next();
};

// GET /api/admin/dashboard
router.get('/dashboard', guard, async (req, res, next) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients,
        (SELECT COUNT(*) FROM accounts WHERE statut = 'en_attente') as comptes_en_attente,
        (SELECT COUNT(*) FROM accounts WHERE statut = 'actif') as comptes_actifs,
        (SELECT COUNT(*) FROM kyc WHERE statut = 'en_attente') as kyc_en_attente,
        (SELECT COUNT(*) FROM transactions WHERE statut = 'en_attente') as virements_en_attente,
        (SELECT COUNT(*) FROM beneficiaires WHERE statut = 'en_attente') as beneficiaires_en_attente,
        (SELECT SUM(solde) FROM accounts) as total_soldes
    `);
    res.json(stats[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/comptes
router.get('/comptes', guard, async (req, res, next) => {
  try {
    const { statut } = req.query;
    let sql = `
      SELECT a.*, u.prenom, u.nom, u.email, k.statut as kyc_statut 
      FROM accounts a 
      JOIN users u ON a.user_id = u.id 
      LEFT JOIN (SELECT user_id, statut FROM kyc WHERE id IN (SELECT MAX(id) FROM kyc GROUP BY user_id)) k ON k.user_id = u.id
    `;
    const params = [];
    if (statut) {
      sql += ' WHERE a.statut = ?';
      params.push(statut);
    }
    const [comptes] = await db.query(sql, params);
    res.json(comptes);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/comptes/:id/statut
router.patch('/comptes/:accountId/statut', [guard, body('statut').notEmpty()], validateReq, async (req, res, next) => {
  try {
    const { statut, commentaire } = req.body;
    const { accountId } = req.params;
    
    await db.query('UPDATE accounts SET statut = ? WHERE id = ?', [statut, accountId]);
    const [accounts] = await db.query('SELECT user_id FROM accounts WHERE id = ?', [accountId]);
    
    if (accounts.length > 0) {
      await audit.log({
        acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
        action: audit.ACTIONS[`COMPTE_${statut.toUpperCase()}`] || 'compte_statut_change',
        categorie: audit.CATEGORIES.admin,
        cible_type: 'account', cible_id: accountId,
        cible_detail: `Statut → ${statut}`, req
      });
      await notifications.envoyer(accounts[0].user_id, 'Mise à jour du compte', `Votre compte est maintenant : ${statut}`, 'info');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/comptes/:id/activer
router.patch('/comptes/:accountId/activer', [guard, body('iban').trim().notEmpty()], validateReq, async (req, res, next) => {
  try {
    const ibanClean = req.body.iban.replace(/\s+/g, '').toUpperCase();
    const { accountId } = req.params;
    
    const [existing] = await db.query('SELECT id FROM accounts WHERE iban = ? AND id != ?', [ibanClean, accountId]);
    if (existing.length > 0) return res.status(400).json({ error: 'IBAN déjà utilisé', code: 'IBAN_EXISTS', status: 400 });

    await db.query('UPDATE accounts SET statut = "actif", iban = ?, bic = "FINTEFR22XXX" WHERE id = ?', [ibanClean, accountId]);
    
    const [accounts] = await db.query('SELECT user_id FROM accounts WHERE id = ?', [accountId]);
    if (accounts.length > 0) {
      await audit.log({
        acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
        action: audit.ACTIONS.IBAN_ATTRIBUE, categorie: audit.CATEGORIES.admin,
        cible_type: 'account', cible_id: accountId,
        cible_detail: `IBAN ${ibanClean} attribué au compte #${accountId}`,
        detail: { iban: ibanClean, admin: req.user.email }, req
      });
      await notifications.envoyer(accounts[0].user_id, 'Compte activé', `Votre compte est activé. Votre IBAN : ${ibanClean}`, 'succes');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/comptes/:id/crediter
router.post('/comptes/:accountId/crediter', [guard, body('montant').isFloat({ gt: 0 })], validateReq, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { montant, libelle } = req.body;
    const { accountId } = req.params;
    await connection.beginTransaction();

    const [accounts] = await connection.query('SELECT * FROM accounts WHERE id = ? FOR UPDATE', [accountId]);
    if (accounts.length === 0 || accounts[0].statut !== 'actif') {
      await connection.rollback();
      return res.status(400).json({ error: 'Compte inactif', code: 'ACCOUNT_INVALID', status: 400 });
    }

    const soldeAvant = accounts[0].solde;
    const soldeApres = parseFloat(soldeAvant) + parseFloat(montant);

    await connection.query('UPDATE accounts SET solde = ? WHERE id = ?', [soldeApres, accountId]);
    await connection.query(
      `INSERT INTO transactions (account_id, type, montant, solde_avant, solde_apres, libelle, motif, statut) 
       VALUES (?, 'credit', ?, ?, ?, ?, ?, 'valide')`,
      [accountId, montant, soldeAvant, soldeApres, libelle || 'Crédit', libelle]
    );

    await connection.commit();

    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
      action: audit.ACTIONS.COMPTE_CREDITE, categorie: audit.CATEGORIES.admin,
      cible_type: 'account', cible_id: accountId,
      cible_detail: `Crédit de ${montant}€ — nouveau solde : ${soldeApres}€`,
      detail: { montant, libelle, solde_avant: soldeAvant, solde_apres: soldeApres }, req
    });

    await notifications.envoyer(accounts[0].user_id, 'Crédit reçu', `Vous avez reçu un crédit de ${montant}€.`, 'succes');
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

// GET /api/admin/kyc
router.get('/kyc', guard, async (req, res, next) => {
  try {
    const { statut } = req.query;
    let sql = `SELECT k.*, u.prenom, u.nom, u.email FROM kyc k JOIN users u ON k.user_id = u.id`;
    const params = [];
    if (statut) {
      sql += ' WHERE k.statut = ?';
      params.push(statut);
    }
    const [kycs] = await db.query(sql, params);
    res.json(kycs);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/kyc/:id/document
router.patch('/kyc/:kycId/document', guard, async (req, res, next) => {
  try {
    const { decision, commentaire } = req.body;
    const { kycId } = req.params;
    const nouveauStatut = decision === 'valide' ? 'valide' : 'rejete';
    
    await db.query('UPDATE kyc SET statut = ?, commentaire = ?, traite_le = NOW(), traite_par = ? WHERE id = ?', 
      [nouveauStatut, commentaire, req.user.id, kycId]);

    const [kycs] = await db.query('SELECT user_id FROM kyc WHERE id = ?', [kycId]);
    if (kycs.length > 0) {
      await audit.log({
        acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
        action: decision === 'valide' ? audit.ACTIONS.KYC_DOCUMENT_VALIDE : audit.ACTIONS.KYC_DOCUMENT_REJETE,
        categorie: audit.CATEGORIES.kyc, cible_type: 'kyc', cible_id: kycId,
        cible_detail: commentaire || null, req
      });
      await notifications.envoyer(kycs[0].user_id, 'Mise à jour KYC', `Votre document a été ${nouveauStatut}.`, 'info');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/kyc/:id/selfie
router.patch('/kyc/:kycId/selfie', guard, async (req, res, next) => {
  try {
    const { decision, commentaire } = req.body;
    const { kycId } = req.params;
    
    const [kycs] = await db.query('SELECT user_id FROM kyc WHERE id = ?', [kycId]);
    if (kycs.length > 0) {
      const userId = kycs[0].user_id;
      if (decision === 'valide') {
        // En vrai l'activation se fait souvent via l'assignation IBAN, mais simplifions
        await notifications.envoyer(userId, 'KYC Validé', `Votre identité a été validée.`, 'succes');
      } else {
        await notifications.envoyer(userId, 'KYC Rejeté', `Votre selfie a été rejeté : ${commentaire}`, 'erreur');
      }
      await audit.log({
        acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
        action: decision === 'valide' ? audit.ACTIONS.KYC_SELFIE_VALIDE : audit.ACTIONS.KYC_SELFIE_REJETE,
        categorie: audit.CATEGORIES.kyc, cible_type: 'kyc', cible_id: kycId,
        cible_detail: commentaire || null, req
      });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/virements
router.get('/virements', guard, async (req, res, next) => {
  try {
    const { statut } = req.query;
    let sql = `
      SELECT t.*, a.iban as iban_source, u.nom, u.prenom 
      FROM transactions t 
      JOIN accounts a ON t.account_id = a.id 
      JOIN users u ON a.user_id = u.id 
      WHERE t.type = 'virement_emis'
    `;
    const params = [];
    if (statut) {
      sql += ' AND t.statut = ?';
      params.push(statut);
    }
    const [virements] = await db.query(sql, params);
    res.json(virements);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/virements/:id
router.patch('/virements/:id', guard, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { decision, commentaire } = req.body;
    const txId = req.params.id;
    await connection.beginTransaction();

    const [txs] = await connection.query('SELECT * FROM transactions WHERE id = ? FOR UPDATE', [txId]);
    if (txs.length === 0 || txs[0].statut !== 'en_attente') {
      await connection.rollback();
      return res.status(400).json({ error: 'Transaction invalide', code: 'BAD_TX', status: 400 });
    }
    const tx = txs[0];

    if (decision === 'valide') {
      const [accounts] = await connection.query('SELECT solde, user_id FROM accounts WHERE id = ? FOR UPDATE', [tx.account_id]);
      if (parseFloat(accounts[0].solde) < parseFloat(tx.montant)) {
        await connection.rollback();
        return res.status(400).json({ error: 'Solde client insuffisant', code: 'NO_FUNDS', status: 400 });
      }
      const nouveauSolde = parseFloat(accounts[0].solde) - parseFloat(tx.montant);
      await connection.query('UPDATE accounts SET solde = ? WHERE id = ?', [nouveauSolde, tx.account_id]);
      await connection.query('UPDATE transactions SET statut = "valide", solde_avant = ?, solde_apres = ?, traite_le = NOW(), valide_par = ? WHERE id = ?', 
        [accounts[0].solde, nouveauSolde, req.user.id, txId]);
      
      await notifications.envoyer(accounts[0].user_id, 'Virement validé', `Votre virement de ${tx.montant}€ a été envoyé.`, 'succes');
    } else {
      await connection.query('UPDATE transactions SET statut = "rejete", traite_le = NOW(), valide_par = ?, motif = ? WHERE id = ?', 
        [req.user.id, commentaire, txId]);
      
      const [accounts] = await connection.query('SELECT user_id FROM accounts WHERE id = ?', [tx.account_id]);
      await notifications.envoyer(accounts[0].user_id, 'Virement rejeté', `Votre virement a été rejeté.`, 'erreur');
    }

    await connection.commit();

    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
      action: decision === 'valide' ? audit.ACTIONS.VIREMENT_VALIDE : audit.ACTIONS.VIREMENT_REJETE,
      categorie: audit.CATEGORIES.virement, cible_type: 'transaction', cible_id: txId,
      cible_detail: `${tx.montant}€ vers ${tx.nom_dest} — Ref: ${tx.reference}`,
      detail: { decision, commentaire, admin: req.user.email }, req
    });

    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

// GET /api/admin/beneficiaires
router.get('/beneficiaires', guard, async (req, res, next) => {
  try {
    const [bens] = await db.query(`
      SELECT b.*, u.nom as client_nom, u.prenom as client_prenom, u.email as client_email 
      FROM beneficiaires b JOIN users u ON b.user_id = u.id 
      WHERE b.statut = 'en_attente'
    `);
    res.json(bens);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/beneficiaires/:id
router.patch('/beneficiaires/:id', guard, async (req, res, next) => {
  try {
    const { decision, commentaire } = req.body;
    const statut = decision === 'valide' ? 'valide' : 'rejete';
    
    await db.query('UPDATE beneficiaires SET statut = ?, valide_par = ? WHERE id = ?', [statut, req.user.id, req.params.id]);
    
    const [bens] = await db.query('SELECT * FROM beneficiaires WHERE id = ?', [req.params.id]);
    if (bens.length > 0) {
      await audit.log({
        acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
        action: decision === 'valide' ? audit.ACTIONS.BENEFICIAIRE_VALIDE : audit.ACTIONS.BENEFICIAIRE_REJETE,
        categorie: audit.CATEGORIES.beneficiaire, cible_type: 'beneficiaire', cible_id: req.params.id,
        cible_detail: `${bens[0].nom} — ${bens[0].iban}`, req
      });
      await notifications.envoyer(bens[0].user_id, 'Bénéficiaire mis à jour', `Le bénéficiaire ${bens[0].nom} a été ${statut}.`, 'info');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/audit
router.get('/audit', guard, async (req, res, next) => {
  try {
    const { categorie, action, acteur_id, statut } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (categorie) { sql += ' AND categorie=?'; params.push(categorie); }
    if (action) { sql += ' AND action=?'; params.push(action); }
    if (acteur_id) { sql += ' AND acteur_id=?'; params.push(acteur_id); }
    if (statut) { sql += ' AND statut=?'; params.push(statut); }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/notifier
router.post('/notifier', guard, async (req, res, next) => {
  try {
    const { user_id, titre, message, type } = req.body;
    await notifications.envoyer(user_id, titre, message, type);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
