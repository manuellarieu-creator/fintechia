const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// === VISITOR ROUTES ===

// Initialiser un chat visiteur
router.post('/visitor/init', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) return res.status(400).json({ error: 'Infos manquantes' });

    // Créer une nouvelle conversation
    const [result] = await db.query(
      'INSERT INTO chat_conversations (visitor_name, visitor_email, visitor_phone) VALUES (?, ?, ?)',
      [name, email, phone]
    );
    
    res.json({ conversation_id: result.insertId, name, email });
  } catch (err) {
    console.error('Erreur init visitor:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les messages visiteur
router.get('/visitor/:conv_id/messages', async (req, res) => {
  try {
    const { conv_id } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conv_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer un message visiteur
router.post('/visitor/:conv_id/message', async (req, res) => {
  try {
    const { conv_id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Message vide' });

    await db.query(
      'INSERT INTO chat_messages (conversation_id, sender_type, content) VALUES (?, "visitor", ?)',
      [conv_id, content]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// === USER ROUTES ===

// Initialiser / Récupérer chat utilisateur connecté
router.post('/user/init', authMiddleware, async (req, res) => {
  try {
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
    // TODO: Verify ownership
    const [rows] = await db.query(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conv_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/user/:conv_id/message', authMiddleware, async (req, res) => {
  try {
    const { conv_id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    if (!content) return res.status(400).json({ error: 'Message vide' });

    await db.query(
      'INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content) VALUES (?, "user", ?, ?)',
      [conv_id, userId, content]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// === ADMIN ROUTES ===

router.get('/admin/conversations', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    
    // Récupérer les conversations avec le dernier message
    const [rows] = await db.query(`
      SELECT c.*, 
        u.prenom, u.nom, u.email as user_email,
        (SELECT content FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_date
      FROM chat_conversations c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY last_message_date DESC
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
    
    const [rows] = await db.query(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conv_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/admin/:conv_id/message', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    const { conv_id } = req.params;
    const { content } = req.body;
    const adminId = req.user.id;
    
    await db.query(
      'INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content) VALUES (?, "admin", ?, ?)',
      [conv_id, adminId, content]
    );
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
