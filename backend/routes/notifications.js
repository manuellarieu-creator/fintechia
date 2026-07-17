const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const notificationsService = require('../services/notifications');

// Récupérer les notifications de l'utilisateur connecté (ou admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, id } = req.user;
    let query, params;
    
    if (role === 'admin') {
      // Les admins voient les notifications avec user_id = NULL
      query = 'SELECT * FROM notifications WHERE user_id IS NULL ORDER BY created_at DESC LIMIT 50';
      params = [];
    } else {
      query = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50';
      params = [id];
    }
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Erreur GET /notifications:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer une notification comme lue
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const notifId = req.params.id;
    
    let query, params;
    if (role === 'admin') {
      query = 'UPDATE notifications SET lu = TRUE WHERE id = ? AND user_id IS NULL';
      params = [notifId];
    } else {
      query = 'UPDATE notifications SET lu = TRUE WHERE id = ? AND user_id = ?';
      params = [notifId, userId];
    }
    
    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification introuvable ou non autorisée' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur PATCH /notifications/:id/read:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer toutes les notifications comme lues
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let query, params;
    
    if (role === 'admin') {
      query = 'UPDATE notifications SET lu = TRUE WHERE user_id IS NULL AND lu = FALSE';
      params = [];
    } else {
      query = 'UPDATE notifications SET lu = TRUE WHERE user_id = ? AND lu = FALSE';
      params = [userId];
    }
    
    await db.query(query, params);
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur PATCH /notifications/read-all:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
