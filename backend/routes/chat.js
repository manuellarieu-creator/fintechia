const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const notifications = require('../services/notifications');
const mailer = require('../services/mailer');

const MAX_MESSAGE_LENGTH = 2000;

// Création silencieuse des tables de chat (remplace l'ancienne route publique /test/db)
const schemaReady = (async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        visitor_name VARCHAR(100) DEFAULT NULL,
        visitor_email VARCHAR(100) DEFAULT NULL,
        visitor_phone VARCHAR(50) DEFAULT NULL,
        visitor_token VARCHAR(64) DEFAULT NULL,
        status ENUM('open', 'closed') DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        sender_type ENUM('visitor', 'user', 'admin') NOT NULL,
        sender_id INT DEFAULT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
      )
    `);
    try { await db.query('ALTER TABLE chat_conversations ADD COLUMN visitor_token VARCHAR(64) DEFAULT NULL'); } catch (e) { /* colonne déjà présente */ }
  } catch (err) {
    console.error('[chat] Erreur création des tables:', err.message);
  }
})();

// Vérifie qu'un visiteur possède bien la conversation via son jeton secret
async function visitorOwnsConversation(req, convId) {
  const token = req.headers['x-chat-token'];
  if (!token || typeof token !== 'string' || token.length < 32) return false;
  const [rows] = await db.query(
    'SELECT id FROM chat_conversations WHERE id = ? AND user_id IS NULL AND visitor_token = ?',
    [convId, token]
  );
  return rows.length > 0;
}

// Vérifie qu'un client connecté possède bien la conversation
async function userOwnsConversation(userId, convId) {
  const [rows] = await db.query(
    'SELECT id FROM chat_conversations WHERE id = ? AND user_id = ?',
    [convId, userId]
  );
  return rows.length > 0;
}

function cleanContent(content) {
  if (typeof content !== 'string') return null;
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return null;
  return trimmed;
}

// === VISITOR ROUTES ===

// Initialiser un chat visiteur
router.post('/visitor/init', async (req, res) => {
  try {
    await schemaReady;
    const { name, email, phone } = req.body || {};
    if (typeof name !== 'string' || typeof email !== 'string' || typeof phone !== 'string' ||
        !name.trim() || !email.trim() || !phone.trim()) {
      return res.status(400).json({ error: 'Infos manquantes' });
    }
    if (name.length > 100 || email.length > 100 || phone.length > 50 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Infos invalides' });
    }

    // Jeton secret non devinable : seul le visiteur qui crée la conversation peut la lire / y écrire
    const visitorToken = crypto.randomBytes(32).toString('hex');

    const [result] = await db.query(
      'INSERT INTO chat_conversations (visitor_name, visitor_email, visitor_phone, visitor_token) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), phone.trim(), visitorToken]
    );

    res.json({ conversation_id: result.insertId, token: visitorToken, name: name.trim(), email: email.trim() });
  } catch (err) {
    console.error('Erreur init visitor:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les messages visiteur
router.get('/visitor/:conv_id/messages', async (req, res) => {
  try {
    const { conv_id } = req.params;
    if (!(await visitorOwnsConversation(req, conv_id))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const afterId = parseInt(req.query.after_id, 10) || 0;
    let sql = 'SELECT id, conversation_id, sender_type, sender_id, content, created_at FROM chat_messages WHERE conversation_id = ?';
    const params = [conv_id];
    if (afterId > 0) {
      sql += ' AND id > ?';
      params.push(afterId);
    }
    sql += ' ORDER BY id ASC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer un message visiteur
router.post('/visitor/:conv_id/message', async (req, res) => {
  try {
    const { conv_id } = req.params;
    const content = cleanContent(req.body && req.body.content);
    if (!content) return res.status(400).json({ error: 'Message vide ou trop long' });

    if (!(await visitorOwnsConversation(req, conv_id))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await db.query(
      'INSERT INTO chat_messages (conversation_id, sender_type, content) VALUES (?, "visitor", ?)',
      [conv_id, content]
    );
    try { 
      await notifications.envoyer(1, 'Nouveau message Chat', 'Un visiteur a envoyé un message sur le chat.', 'info'); 
      await mailer.envoyerAlerteAdmin('Nouveau message Chat', `Un visiteur a envoyé un message sur le chat : "${content}"`);
    } catch(e) {}
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// === USER ROUTES ===

// Initialiser / Récupérer chat utilisateur connecté
router.post('/user/init', authMiddleware, async (req, res) => {
  try {
    await schemaReady;
    const userId = req.user.id;
    // Chercher une conversation ouverte
    let [convs] = await db.query('SELECT * FROM chat_conversations WHERE user_id = ? AND status = "open"', [userId]);
    
    let convId;
    if (convs.length > 0) {
      convId = convs[0].id;
    } else {
      // Créer une nouvelle
      const [result] = await db.query('INSERT INTO chat_conversations (user_id) VALUES (?)', [userId]);
      convId = result.insertId;
    }
    
    res.json({ conversation_id: convId });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/user/:conv_id/messages', authMiddleware, async (req, res) => {
  try {
    const { conv_id } = req.params;
    if (!(await userOwnsConversation(req.user.id, conv_id))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const afterId = parseInt(req.query.after_id, 10) || 0;
    let sql = 'SELECT id, conversation_id, sender_type, sender_id, content, created_at FROM chat_messages WHERE conversation_id = ?';
    const params = [conv_id];
    if (afterId > 0) {
      sql += ' AND id > ?';
      params.push(afterId);
    }
    sql += ' ORDER BY id ASC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/user/:conv_id/message', authMiddleware, async (req, res) => {
  try {
    const { conv_id } = req.params;
    const content = cleanContent(req.body && req.body.content);
    if (!content) return res.status(400).json({ error: 'Message vide ou trop long' });

    if (!(await userOwnsConversation(req.user.id, conv_id))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await db.query(
      'INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content) VALUES (?, "user", ?, ?)',
      [conv_id, req.user.id, content]
    );
    try { 
      await notifications.envoyer(1, 'Nouveau message Chat', `L'utilisateur ${req.user.id} a envoyé un message.`, 'info'); 
      await mailer.envoyerAlerteAdmin('Nouveau message Chat Client', `L'utilisateur ${req.user.id} a envoyé : "${content}"`);
    } catch(e) {}
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// === ADMIN ROUTES ===

router.get('/admin/conversations', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    
    // Récupérer les conversations avec le dernier message (limité aux 50 plus récentes)
    const [rows] = await db.query(`
      SELECT c.id, c.user_id, c.visitor_name, c.visitor_email, c.visitor_phone, c.status, c.created_at, c.updated_at,
        u.prenom, u.nom, u.email as user_email,
        (SELECT content FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT m.created_at FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_date
      FROM chat_conversations c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY last_message_date DESC
      LIMIT 50
    `);
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/admin/:conv_id/messages', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    const { conv_id } = req.params;
    const afterId = parseInt(req.query.after_id, 10) || 0;
    let sql = 'SELECT id, conversation_id, sender_type, sender_id, content, created_at FROM chat_messages WHERE conversation_id = ?';
    const params = [conv_id];
    if (afterId > 0) {
      sql += ' AND id > ?';
      params.push(afterId);
    }
    sql += ' ORDER BY id ASC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/admin/:conv_id/message', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    const { conv_id } = req.params;
    const content = cleanContent(req.body && req.body.content);
    if (!content) return res.status(400).json({ error: 'Message vide ou trop long' });
    const adminId = req.user.id;
    
    await db.query(
      'INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content) VALUES (?, "admin", ?, ?)',
      [conv_id, adminId, content]
    );
    try {
      const [c] = await db.query('SELECT user_id FROM chat_conversations WHERE id = ?', [conv_id]);
      if (c[0] && c[0].user_id) {
        await notifications.envoyer(c[0].user_id, 'Support Client', 'Vous avez reçu un nouveau message du support sur le Chat.', 'info');
      }
    } catch(e) {}
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/admin/:conv_id/close', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    const { conv_id } = req.params;
    
    await db.query('UPDATE chat_conversations SET status = "closed" WHERE id = ?', [conv_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
