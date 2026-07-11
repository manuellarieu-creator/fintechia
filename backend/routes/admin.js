const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const audit = require('../services/audit');
const notifications = require('../services/notifications');

// Auto-migration pour les nouvelles colonnes accounts et account_rules
(async () => {
  try {
    await db.query("ALTER TABLE accounts ADD COLUMN numero_compte VARCHAR(50) UNIQUE").catch(e => console.error("Migration error:", e.message));
    await db.query("ALTER TABLE accounts ADD COLUMN motif_blocage VARCHAR(255) DEFAULT NULL").catch(e => console.error("Migration error:", e.message));
    await db.query("ALTER TABLE accounts ADD COLUMN transfer_allowed BOOLEAN DEFAULT TRUE").catch(e => console.error("Migration error:", e.message));
    await db.query("ALTER TABLE accounts ADD COLUMN max_transfer_amount DECIMAL(15,2) DEFAULT NULL").catch(e => console.error("Migration error:", e.message));
    await db.query(`
      CREATE TABLE IF NOT EXISTS account_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        account_id INT NOT NULL,
        trigger_min_balance DECIMAL(15,2),
        trigger_min_transfer DECIMAL(15,2),
        popup_message TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `);
  } catch(e) {}
})();

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
        (SELECT SUM(solde) FROM accounts) as total_soldes,
        (SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURDATE()) as tx_jour,
        (SELECT SUM(montant) FROM transactions WHERE DATE(created_at) = CURDATE()) as volume_jour,
        (SELECT COUNT(*) FROM audit_logs WHERE categorie = 'securite' AND statut = 'echec' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as alertes_fraude
    `);
    
    // Si la DB n'a pas encore la modif ENUM pour 'restreint', on gère l'erreur silencieusement à l'usage
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
      SELECT a.*, u.prenom, u.nom, u.email, u.transfer_types, k.statut as kyc_statut, a.motif_blocage 
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
    const { statut, commentaire, motif_blocage } = req.body;
    const { accountId } = req.params;
    
    if (statut === 'restreindre') {
      await db.query('UPDATE accounts SET transfer_allowed = FALSE WHERE id = ?', [accountId]);
    } else {
      const transferAllowed = statut === 'actif' ? true : false; // Reset to true if reactivated
      await db.query('UPDATE accounts SET statut = ?, motif_blocage = ?, transfer_allowed = IF(statut = \'actif\', TRUE, transfer_allowed) WHERE id = ?', 
      [statut, statut === 'bloque' ? (motif_blocage || 'Indéfini') : null, accountId]);
    }
    const [accounts] = await db.query('SELECT user_id FROM accounts WHERE id = ?', [accountId]);
    
    if (accounts.length > 0) {
      await audit.log({
        acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
        action: audit.ACTIONS[`COMPTE_${statut.toUpperCase()}`] || 'compte_statut_change',
        categorie: audit.CATEGORIES.admin,
        cible_type: 'account', cible_id: accountId,
        cible_detail: `Statut → ${statut}`,
        details: { commentaire, motif_blocage, new_status: statut }, req
      });
      await notifications.envoyer(accounts[0].user_id, 'Mise à jour du compte', `Votre compte est maintenant : ${statut}`, 'info');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:userId/transfer-types
router.patch('/users/:userId/transfer-types', [guard, body('transfer_types').isString()], validateReq, async (req, res, next) => {
  try {
    const { transfer_types } = req.body;
    await db.query('UPDATE users SET transfer_types = ? WHERE id = ?', [transfer_types, req.params.userId]);
    res.json({ success: true, message: 'Types de virements mis à jour' });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/comptes/:accountId/audit
router.get('/comptes/:accountId/audit', guard, async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const [logs] = await db.query(`
      SELECT action, categorie, cible_detail, details, acteur_role, created_at
      FROM audit_logs
      WHERE cible_type = 'account' AND cible_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [accountId]);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/comptes/:id/activer
router.patch('/comptes/:accountId/activer', [
  guard, 
  body('iban').trim().notEmpty(),
  body('bic').trim().notEmpty(),
  body('numero_compte').trim().notEmpty(),
  body('solde').isFloat({ min: 0 })
], validateReq, async (req, res, next) => {
  try {
    const ibanClean = req.body.iban.replace(/\s+/g, '').toUpperCase();
    const bicClean = req.body.bic.replace(/\s+/g, '').toUpperCase();
    const numeroCompteClean = req.body.numero_compte.trim();
    const soldeInitial = parseFloat(req.body.solde);
    const { accountId } = req.params;
    
    // Fallback auto-migration if the global one failed silently
    try { 
      const [cols] = await db.query("SHOW COLUMNS FROM accounts LIKE 'numero_compte'");
      if (cols.length === 0) {
        await db.query("ALTER TABLE accounts ADD COLUMN numero_compte VARCHAR(50) DEFAULT NULL");
        await db.query("ALTER TABLE accounts ADD UNIQUE (numero_compte)");
      }
      const [colsDepot] = await db.query("SHOW COLUMNS FROM accounts LIKE 'depot_initial_requis'");
      if (colsDepot.length === 0) {
        await db.query("ALTER TABLE accounts ADD COLUMN depot_initial_requis DECIMAL(15,2) DEFAULT 0");
      }
    } catch(e) {
      console.error("Migration error for numero_compte / depot_initial:", e);
    }
    
    // Vérifier l'unicité de l'IBAN et Numéro de compte
    const [existing] = await db.query('SELECT id FROM accounts WHERE (iban = ? OR numero_compte = ?) AND id != ?', [ibanClean, numeroCompteClean, accountId]);
    if (existing.length > 0) return res.status(400).json({ error: 'IBAN ou Numéro de compte déjà utilisé', code: 'ALREADY_EXISTS', status: 400 });

    // Vérifier si le KYC est valide
    const [acc] = await db.query('SELECT user_id FROM accounts WHERE id = ?', [accountId]);
    if (acc.length === 0) return res.status(404).json({ error: 'Compte introuvable', status: 404 });
    const userId = acc[0].user_id;

    const [kyc] = await db.query('SELECT statut FROM kyc WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
    if (!kyc.length || kyc[0].statut !== 'valide') {
      return res.status(403).json({ error: 'Impossible d\'activer ce compte : le KYC n\'est pas validé.', code: 'KYC_NOT_VALID', status: 403 });
    }

    await db.query('UPDATE accounts SET statut = "actif", iban = ?, bic = ?, numero_compte = ?, depot_initial_requis = ? WHERE id = ?', 
      [ibanClean, bicClean, numeroCompteClean, soldeInitial, accountId]);


    const [accounts] = await db.query('SELECT user_id FROM accounts WHERE id = ?', [accountId]);
    if (accounts.length > 0) {
      await audit.log({
        acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
        action: audit.ACTIONS.IBAN_ATTRIBUE, categorie: audit.CATEGORIES.admin,
        cible_type: 'account', cible_id: accountId,
        cible_detail: `Activation du compte #${accountId}`,
        detail: { iban: ibanClean, bic: bicClean, numero_compte: numeroCompteClean, admin: req.user.email }, req
      });
      await notifications.envoyer(accounts[0].user_id, 'Compte activé', `Votre compte est activé. Votre IBAN : ${ibanClean}`, 'succes');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/comptes/:id/crediter
router.post('/comptes/:accountId/crediter', [
  guard, 
  body('montant').isFloat({ gt: 0 }),
  body('transfer_allowed').optional().isBoolean(),
  body('max_transfer_amount').optional()
], validateReq, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { montant, libelle, transfer_allowed, max_transfer_amount } = req.body;
    const { accountId } = req.params;
    await connection.beginTransaction();

    const [accounts] = await connection.query('SELECT * FROM accounts WHERE id = ? FOR UPDATE', [accountId]);
    if (accounts.length === 0 || (accounts[0].statut !== 'actif' && accounts[0].statut !== 'restreint')) {
      await connection.rollback();
      return res.status(400).json({ error: 'Compte inactif', code: 'ACCOUNT_INVALID', status: 400 });
    }

    const soldeAvant = accounts[0].solde;
    const soldeApres = parseFloat(soldeAvant) + parseFloat(montant);

    // Mettre à jour le solde et éventuellement les limites
    let updateQuery = 'UPDATE accounts SET solde = ?';
    let queryParams = [soldeApres];
    
    if (transfer_allowed !== undefined) {
      updateQuery += ', transfer_allowed = ?';
      queryParams.push(transfer_allowed);
    }
    if (max_transfer_amount !== undefined) {
      updateQuery += ', max_transfer_amount = ?';
      queryParams.push(max_transfer_amount !== '' ? max_transfer_amount : null);
    }
    
    updateQuery += ' WHERE id = ?';
    queryParams.push(accountId);

    await connection.query(updateQuery, queryParams);
    
    await connection.query(
      `INSERT INTO transactions (account_id, type, montant, solde_avant, solde_apres, libelle, motif, statut) 
       VALUES (?, 'credit', ?, ?, ?, ?, ?, 'valide')`,
      [accountId, montant, soldeAvant, soldeApres, libelle || 'Crédit Admin', libelle || 'Crédit Admin']
    );

    await connection.commit();

    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
      action: audit.ACTIONS.COMPTE_CREDITE || 'compte_credite', categorie: audit.CATEGORIES.admin,
      cible_type: 'account', cible_id: accountId,
      cible_detail: `Crédit de ${montant}€ — nouveau solde : ${soldeApres}€`,
      detail: { montant, libelle, solde_avant: soldeAvant, solde_apres: soldeApres, transfer_allowed, max_transfer_amount }, req
    });

    await notifications.envoyer(accounts[0].user_id, 'Crédit reçu', `Vous avez reçu un crédit de ${montant}€.`, 'succes');
    res.json({ success: true, nouveau_solde: soldeApres });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

// POST /api/admin/comptes/:id/debiter
router.post('/comptes/:accountId/debiter', [guard, body('montant').isFloat({ gt: 0 })], validateReq, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { montant, libelle } = req.body;
    const { accountId } = req.params;
    await connection.beginTransaction();

    const [accounts] = await connection.query('SELECT * FROM accounts WHERE id = ? FOR UPDATE', [accountId]);
    if (accounts.length === 0 || (accounts[0].statut !== 'actif' && accounts[0].statut !== 'restreint')) {
      await connection.rollback();
      return res.status(400).json({ error: 'Compte inactif', code: 'ACCOUNT_INVALID', status: 400 });
    }

    const soldeAvant = accounts[0].solde;
    if (parseFloat(soldeAvant) < parseFloat(montant)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Solde insuffisant pour ce débit', code: 'NO_FUNDS', status: 400 });
    }

    const soldeApres = parseFloat(soldeAvant) - parseFloat(montant);

    await connection.query('UPDATE accounts SET solde = ? WHERE id = ?', [soldeApres, accountId]);
    await connection.query(
      `INSERT INTO transactions (account_id, type, montant, solde_avant, solde_apres, libelle, motif, statut) 
       VALUES (?, 'debit', ?, ?, ?, ?, ?, 'valide')`,
      [accountId, montant, soldeAvant, soldeApres, libelle || 'Débit Admin', libelle || 'Débit Admin']
    );

    await connection.commit();

    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
      action: 'compte_debite', categorie: audit.CATEGORIES.admin,
      cible_type: 'account', cible_id: accountId,
      cible_detail: `Débit de ${montant}€ — nouveau solde : ${soldeApres}€`,
      detail: { montant, libelle, solde_avant: soldeAvant, solde_apres: soldeApres }, req
    });

    await notifications.envoyer(accounts[0].user_id, 'Débit effectué', `Un débit de ${montant}€ a été effectué sur votre compte.`, 'alerte');
    res.json({ success: true, nouveau_solde: soldeApres });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

// ============================================
// ACCOUNT RULES (POPUPS DYNAMIQUES)
// ============================================

// GET /api/admin/comptes/:id/rules
router.get('/comptes/:accountId/rules', guard, async (req, res, next) => {
  try {
    const [rules] = await db.query('SELECT * FROM account_rules WHERE account_id = ? ORDER BY created_at DESC', [req.params.accountId]);
    res.json(rules);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/comptes/:id/rules
router.post('/comptes/:accountId/rules', [
  guard,
  body('popup_message').trim().notEmpty(),
  body('trigger_min_balance').optional().isFloat({ min: 0 }),
  body('trigger_min_transfer').optional().isFloat({ min: 0 })
], validateReq, async (req, res, next) => {
  try {
    const { trigger_min_balance, trigger_min_transfer, popup_message } = req.body;
    await db.query(
      'INSERT INTO account_rules (account_id, trigger_min_balance, trigger_min_transfer, popup_message) VALUES (?, ?, ?, ?)',
      [req.params.accountId, trigger_min_balance || null, trigger_min_transfer || null, popup_message]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/rules/:id
router.delete('/rules/:ruleId', guard, async (req, res, next) => {
  try {
    await db.query('DELETE FROM account_rules WHERE id = ?', [req.params.ruleId]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/comptes/:id
router.delete('/comptes/:accountId', guard, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { accountId } = req.params;
    await connection.beginTransaction();

    const [accounts] = await connection.query('SELECT user_id FROM accounts WHERE id = ? FOR UPDATE', [accountId]);
    if (accounts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Compte introuvable', status: 404 });
    }

    const userId = accounts[0].user_id;

    // Supprimer l'utilisateur. La contrainte ON DELETE CASCADE va supprimer les comptes, kyc, transactions, etc.
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);

    await connection.commit();

    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
      action: 'utilisateur_supprime', categorie: audit.CATEGORIES.admin,
      cible_type: 'user', cible_id: userId,
      cible_detail: `Suppression complète de l'utilisateur ${userId} et de ses comptes associés.`, req
    });

    res.json({ success: true, message: "Utilisateur supprimé" });
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
    let sql = `SELECT k.*, u.prenom, u.nom, u.email, u.adresse, u.telephone_code, u.created_at as user_created_at FROM kyc k JOIN users u ON k.user_id = u.id`;
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
    
    // We update motif_rejet with the admin's note (commentaire from req.body)
    // but we DO NOT overwrite the db 'commentaire' column because it contains the KYC instructions.
    await db.query('UPDATE kyc SET statut = ?, motif_rejet = ?, traite_le = NOW(), traite_par = ? WHERE id = ?', 
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
      SELECT t.*, a.iban as iban_source, u.nom, u.prenom, u.email
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

// GET /api/admin/alertes
router.get('/alertes', guard, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    let sql = `
      SELECT id, created_at, action, cible_detail as description, acteur_email as utilisateur, detail 
      FROM audit_logs 
      WHERE (categorie = 'securite' AND statut = 'echec')
         OR action LIKE '%bloque%'
         OR action LIKE '%rejet%'
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const params = [limit];

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

// GET /api/admin/credits
router.get('/credits', guard, async (req, res, next) => {
  try {
    const { statut } = req.query;
    let sql = 'SELECT c.*, u.prenom as user_prenom, u.nom as user_nom, u.email as user_email FROM credit_requests c JOIN users u ON c.user_id = u.id';
    const params = [];
    if (statut) {
      sql += ' WHERE c.statut = ?';
      params.push(statut);
    }
    sql += ' ORDER BY c.created_at DESC';
    const [demandes] = await db.query(sql, params);
    
    // Fetch documents pour chaque demande
    for (let d of demandes) {
      const [docs] = await db.query('SELECT id, type_document, file_path, statut, created_at FROM credit_documents WHERE credit_request_id = ?', [d.id]);
      d.documents = docs;
    }
    
    res.json(demandes);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/credits/:id/statut
router.patch('/credits/:id/statut', [guard, body('statut').notEmpty()], validateReq, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { statut, message, compte_id } = req.body;
    const creditId = req.params.id;

    await connection.beginTransaction();

    const [credits] = await connection.query('SELECT * FROM credit_requests WHERE id = ?', [creditId]);
    if (credits.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Demande introuvable', status: 404 });
    }
    const credit = credits[0];

    // Mise à jour de la demande de crédit (statut et compte_id si fourni)
    let updateSql = 'UPDATE credit_requests SET statut = ?';
    let updateParams = [statut];
    
    if (compte_id) {
      updateSql += ', compte_id = ?';
      updateParams.push(compte_id);
    }
    if (message) {
      updateSql += ', message = ?';
      updateParams.push(message);
    }
    
    updateSql += ' WHERE id = ?';
    updateParams.push(creditId);

    await connection.query(updateSql, updateParams);

    // Si le statut est "Credite", on effectue le versement sur le compte
    if (statut === 'credite') {
      const targetCompteId = compte_id || credit.compte_id;
      if (!targetCompteId) {
         await connection.rollback();
         return res.status(400).json({ error: 'Veuillez spécifier le compte à approvisionner.', status: 400 });
      }
      
      const [accounts] = await connection.query('SELECT id, solde FROM accounts WHERE id = ? AND statut = "actif" LIMIT 1', [targetCompteId]);
      if (accounts.length > 0) {
        const acc = accounts[0];
        const newSolde = parseFloat(acc.solde) + parseFloat(credit.montant);
        
        await connection.query('UPDATE accounts SET solde = ? WHERE id = ?', [newSolde, acc.id]);
        
        await connection.query(
          `INSERT INTO transactions (account_id, type, montant, solde_avant, solde_apres, libelle, motif, statut) 
           VALUES (?, 'credit', ?, ?, ?, ?, ?, 'valide')`,
          [acc.id, credit.montant, acc.solde, newSolde, credit.motif || 'Déblocage crédit', 'Déblocage crédit']
        );
      } else {
        await connection.rollback();
        return res.status(400).json({ error: 'Le compte spécifié est invalide ou inactif.', status: 400 });
      }
    }

    await connection.commit();

    // Envoi de notification selon le statut
    let notifTitre = 'Mise à jour Crédit';
    let notifMessage = `Le statut de votre demande de crédit (Réf: ${credit.reference}) est passé à : ${statut}.`;
    let notifType = 'info';
    
    if (statut === 'incomplet') {
      notifTitre = 'Demande de crédit incomplète';
      notifMessage = `Il manque des documents pour votre demande de crédit. Message: ${message || ''}`;
      notifType = 'alerte';
    } else if (statut === 'valide_succes') {
      notifTitre = 'Demande de crédit validée';
      notifMessage = `Votre demande de crédit a été validée avec succès !`;
      notifType = 'succes';
    } else if (statut === 'credite') {
      notifTitre = 'Crédit versé';
      notifMessage = `Le montant de ${credit.montant}€ a été versé sur votre compte !`;
      notifType = 'succes';
    }

    await notifications.envoyer(credit.user_id, notifTitre, notifMessage, notifType);

    res.json({ success: true, message: `Demande de crédit passée au statut ${statut}` });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});


module.exports = router;
