const fs = require('fs');
const file = 'c:/Users/ariol/.gemini/fintechia/backend/routes/admin.js';
let content = fs.readFileSync(file, 'utf8');

const newRoutes = `
// PATCH /api/admin/comptes/:accountId/transfer-toggle
router.patch('/comptes/:accountId/transfer-toggle', [guard, body('allowed').isBoolean()], validateReq, async (req, res, next) => {
  try {
    const { allowed } = req.body;
    const { accountId } = req.params;
    
    const [result] = await db.query('UPDATE accounts SET transfer_allowed = ? WHERE id = ?', [allowed, accountId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Compte introuvable' });
    }
    
    const [accounts] = await db.query('SELECT user_id FROM accounts WHERE id = ?', [accountId]);
    
    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
      action: 'transfer_toggle', categorie: audit.CATEGORIES.admin,
      cible_type: 'account', cible_id: accountId,
      cible_detail: \`Virements sortants \${allowed ? 'autorisés' : 'bloqués'}\`, req
    });
    
    if (accounts.length > 0) {
      await notifications.envoyer(accounts[0].user_id, 'Mise à jour des virements', \`Vos virements sortants sont désormais \${allowed ? 'autorisés' : 'bloqués'}.\`, allowed ? 'info' : 'alerte');
    }
    
    res.json({ success: true, allowed });
  } catch (err) {
    next(err);
  }
});

const bcrypt = require('bcryptjs');

// POST /api/admin/users
router.post('/users', [
  guard,
  body('prenom').trim().notEmpty(),
  body('nom').trim().notEmpty(),
  body('email').isEmail(),
  body('mot_de_passe').isLength({ min: 6 }),
  body('telephone').optional().trim(),
  body('adresse').optional().trim()
], validateReq, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { prenom, nom, email, mot_de_passe, telephone, adresse } = req.body;
    
    await connection.beginTransaction();
    
    // Check if email exists
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    
    const [userRes] = await connection.query(
      'INSERT INTO users (prenom, nom, email, mot_de_passe, telephone, adresse, role) VALUES (?, ?, ?, ?, ?, ?, "client")',
      [prenom, nom, email, hashedPassword, telephone || null, adresse || null]
    );
    
    const userId = userRes.insertId;
    
    // Auto-create an account
    const [accRes] = await connection.query(
      'INSERT INTO accounts (user_id, solde, statut) VALUES (?, 0, "en_attente")',
      [userId]
    );
    
    await connection.commit();
    
    await audit.log({
      acteur_id: req.user.id, acteur_email: req.user.email, acteur_role: 'admin',
      action: 'utilisateur_cree', categorie: audit.CATEGORIES.admin,
      cible_type: 'user', cible_id: userId,
      cible_detail: \`Création manuelle de l'utilisateur \${email}\`, req
    });
    
    res.json({ success: true, userId, accountId: accRes.insertId });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});
`;

content = content.replace(
  "// PATCH /api/admin/comptes/:accountId/statut",
  newRoutes + "\n// PATCH /api/admin/comptes/:accountId/statut"
);

fs.writeFileSync(file, content);
console.log('Routes ajoutées');
