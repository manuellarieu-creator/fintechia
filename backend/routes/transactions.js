const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const audit = require('../services/audit');
const notifications = require('../services/notifications');
const FraudEngine = require('../services/fraudEngine');

const validateReq = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation échouée', code: 'VALIDATION_ERROR', status: 400, details: errors.array() });
  }
  next();
};

// GET /api/transactions
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, type, date_debut, date_fin } = req.query;
    const [accounts] = await db.query('SELECT id FROM accounts WHERE user_id = ?', [req.user.id]);
    if (accounts.length === 0) return res.json([]);

    const accountId = accounts[0].id;
    let sql = 'SELECT * FROM transactions WHERE account_id = ?';
    const params = [accountId];

    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (date_debut) { sql += ' AND created_at >= ?'; params.push(date_debut); }
    if (date_fin) { sql += ' AND created_at <= ?'; params.push(date_fin); }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [transactions] = await db.query(sql, params);
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions/virement
router.post('/virement', [
  authMiddleware,
  body('iban_dest').trim().notEmpty(),
  body('bic_dest').trim().notEmpty(),
  body('nom_dest').trim().notEmpty(),
  body('nom_banque_dest').optional().trim(),
  body('montant').isFloat({ gt: 0 }),
  body('motif').trim().notEmpty(),
  body('pin_code').trim().notEmpty(),
  body('type_virement').optional().trim()
], validateReq, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { iban_dest, bic_dest, nom_dest, nom_banque_dest, montant, motif, pin_code, type_virement } = req.body;
    
    await connection.beginTransaction();

    const [users] = await connection.query('SELECT pin_code, transfer_types FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0 || users[0].pin_code !== pin_code) {
      await connection.rollback();
      return res.status(400).json({ error: 'Code secret incorrect.', code: 'INVALID_PIN', status: 400 });
    }

    const [accounts] = await connection.query('SELECT id, solde, statut, transfer_allowed, max_transfer_amount FROM accounts WHERE user_id = ?', [req.user.id]);
    if (accounts.length === 0 || accounts[0].statut !== 'actif') {
      await connection.rollback();
      return res.status(400).json({ error: 'Compte inactif ou inexistant', code: 'ACCOUNT_INVALID', status: 400 });
    }

    const account = accounts[0];
    
    // 1. Vérifier si les transferts sont autorisés
    if (!account.transfer_allowed) {
      await connection.rollback();
      return res.status(403).json({ error: 'Les transferts sont temporairement désactivés sur ce compte.', code: 'TRANSFER_DISABLED', status: 403 });
    }

    const userTransferTypes = users[0].transfer_types ? users[0].transfer_types.split(',') : ['standard','immediat','swift','programme'];
    const requestedType = type_virement || 'immediat';
    if (!userTransferTypes.includes(requestedType)) {
      await connection.rollback();
      return res.status(403).json({ error: `Le type de virement "${requestedType}" n'est pas autorisé pour ce compte.`, code: 'TRANSFER_TYPE_NOT_ALLOWED', status: 403 });
    }

    // 2. Vérifier la limite de montant
    if (requestedType === 'immediat') {
      if (account.max_transfer_amount !== null && parseFloat(montant) > parseFloat(account.max_transfer_amount)) {
        await connection.rollback();
        return res.status(403).json({ error: `L'opération de transfert de fonds n'a pu aboutir: Vous ne pouvez pas virer plus de ${account.max_transfer_amount}€ en virement instantanné. Veuillez contacter votre conseiller pour finaliser cette transaction.`, code: 'TRANSFER_LIMIT_EXCEEDED', status: 403 });
      }

      if (parseFloat(montant) > 900) {
        await connection.rollback();
        return res.status(403).json({ error: `L'opération de transfert de fonds n'a pu aboutir: Vous ne pouvez pas virer plus de 900.00€ en virement instantanné. Veuillez contacter votre conseiller pour finaliser cette transaction.`, code: 'INSTANT_TRANSFER_LIMIT', status: 403 });
      }
    }

    // 3. Vérifier le solde
    if (parseFloat(account.solde) < parseFloat(montant)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Solde insuffisant', code: 'INSUFFICIENT_FUNDS', status: 400 });
    }

    // 4. Vérifier les règles dynamiques de popup (account_rules)
    const [rules] = await connection.query('SELECT * FROM account_rules WHERE account_id = ? AND is_active = TRUE', [account.id]);
    for (const rule of rules) {
      const isBalanceTriggered = rule.trigger_min_balance === null || parseFloat(account.solde) >= parseFloat(rule.trigger_min_balance);
      const isTransferTriggered = rule.trigger_min_transfer === null || parseFloat(montant) >= parseFloat(rule.trigger_min_transfer);
      
      if (isBalanceTriggered && isTransferTriggered) {
        await connection.rollback();
        // On renvoie un code 403 avec un flag isPopupRule pour l'afficher en popup front-end
        return res.status(403).json({ error: rule.popup_message, code: 'ADMIN_POPUP_RULE', isPopupRule: true, status: 403 });
      }
    }

    // 5. Fraud Engine Check
    const fraudResult = await FraudEngine.checkTransaction({
      user_id: req.user.id,
      amount: montant,
      destination_iban: iban_dest,
      ip: req.ip
    });

    if (fraudResult.action === 'block') {
      await connection.rollback();
      return res.status(403).json({ error: `L'opération de transfert d'un montant de ${montant}€ n'a pu aboutir: Veuillez contacter votre gestionnaire de compte pour finaliser cette transaction.`, code: 'FRAUD_BLOCKED', status: 403 });
    }

    const reference = 'VIR-' + crypto.randomUUID().slice(0, 12).toUpperCase().replace(/-/g, '');
    
    let statutVirement = (type_virement === 'immediat') ? 'valide' : 'en_attente';
    
    if (fraudResult.action === 'alert_manual') {
      statutVirement = 'en_attente'; // Force pending status for manual review
    }
    
    let newSolde = account.solde;
    if (statutVirement === 'valide') {
      newSolde = parseFloat(account.solde) - parseFloat(montant);
      await connection.query('UPDATE accounts SET solde = ? WHERE id = ?', [newSolde, account.id]);
    }
    
    const [insertResult] = await connection.query(
      `INSERT INTO transactions 
      (account_id, type, montant, solde_avant, solde_apres, libelle, motif, iban_dest, nom_dest, nom_banque_dest, reference, statut) 
      VALUES (?, 'virement_emis', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [account.id, montant, account.solde, newSolde, motif, motif, iban_dest, nom_dest, nom_banque_dest, reference, statutVirement]
    );

    await connection.commit();

    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email,
      action: audit.ACTIONS.VIREMENT_INITIE, categorie: audit.CATEGORIES.virement,
      cible_type: 'transaction', cible_id: insertResult.insertId,
      cible_detail: `Virement de ${montant}€ vers ${nom_dest} (${iban_dest})`,
      detail: { reference, montant, iban_dest, nom_dest, motif, type_virement }, req
    });

    if (statutVirement === 'valide') {
      await notifications.envoyer(req.user.id, 'Virement validé', 'Votre virement immédiat a été exécuté avec succès.', 'succes');
      res.json({ success: true, reference, message: 'Virement validé avec succès' });
    } else {
      await notifications.envoyer(req.user.id, 'Virement initié', 'Votre virement est en cours de validation.', 'info');
      res.json({ success: true, reference, message: 'Virement en cours de validation' });
    }
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

// GET /api/transactions/beneficiaires
router.get('/beneficiaires', authMiddleware, async (req, res, next) => {
  try {
    const [beneficiaires] = await db.query('SELECT * FROM beneficiaires WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(beneficiaires);
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions/beneficiaires
router.post('/beneficiaires', [
  authMiddleware,
  body('nom').trim().notEmpty(),
  body('iban').trim().notEmpty(),
  body('bic').optional().trim(),
  body('nom_banque').optional().trim()
], validateReq, async (req, res, next) => {
  try {
    let { nom, iban, bic, nom_banque } = req.body;
    const ibanClean = iban.replace(/\s+/g, '').toUpperCase();
    
    if (ibanClean.length < 15) {
      return res.status(400).json({ error: 'IBAN invalide', code: 'INVALID_IBAN', status: 400 });
    }

    const [insertResult] = await db.query(
      'INSERT INTO beneficiaires (user_id, nom, iban, bic, nom_banque, statut) VALUES (?, ?, ?, ?, ?, "en_attente")',
      [req.user.id, nom, ibanClean, bic, nom_banque]
    );

    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email,
      action: audit.ACTIONS.BENEFICIAIRE_AJOUTE, categorie: audit.CATEGORIES.beneficiaire,
      cible_type: 'beneficiaire', cible_id: insertResult.insertId,
      cible_detail: `${nom} — ${ibanClean}`, req
    });

    await notifications.envoyer(req.user.id, 'Nouveau bénéficiaire', 'Le bénéficiaire est en cours de vérification.', 'info');

    res.json({ success: true, message: 'Bénéficiaire en cours de vérification' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/transactions/beneficiaires/:id
router.delete('/beneficiaires/:id', authMiddleware, async (req, res, next) => {
  try {
    const benId = req.params.id;
    const [bens] = await db.query('SELECT statut FROM beneficiaires WHERE id = ? AND user_id = ?', [benId, req.user.id]);
    if (bens.length === 0) return res.status(404).json({ error: 'Non trouvé', code: 'NOT_FOUND', status: 404 });
    
    if (bens[0].statut === 'en_attente') {
      return res.status(400).json({ error: 'Impossible de supprimer en attente', code: 'BAD_REQUEST', status: 400 });
    }

    await db.query('DELETE FROM beneficiaires WHERE id = ?', [benId]);
    
    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email,
      action: audit.ACTIONS.BENEFICIAIRE_SUPPRIME, categorie: audit.CATEGORIES.beneficiaire,
      cible_type: 'beneficiaire', cible_id: benId, req
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/notifications
router.get('/notifications', authMiddleware, async (req, res, next) => {
  try {
    const [notifs] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30', [req.user.id]);
    res.json(notifs);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/transactions/notifications/tout-lu
router.patch('/notifications/tout-lu', authMiddleware, async (req, res, next) => {
  try {
    await db.query('UPDATE notifications SET lu = TRUE WHERE user_id = ? AND lu = FALSE', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/transactions/notifications/:id/lu
router.patch('/notifications/:id/lu', authMiddleware, async (req, res, next) => {
  try {
    await db.query('UPDATE notifications SET lu = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
