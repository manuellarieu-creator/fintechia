const db = require('../config/db');

let io;

function setIo(socketIoInstance) {
  io = socketIoInstance;
}

async function envoyer(userId, titre, message, type = 'info') {
  try {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, titre, message, type) VALUES (?, ?, ?, ?)',
      [userId, titre, message, type]
    );

    const newNotif = {
      id: result.insertId,
      user_id: userId,
      titre,
      message,
      type,
      lu: 0,
      created_at: new Date()
    };

    if (io) {
      io.to(`user_${userId}`).emit('notification', newNotif);
    }
  } catch (err) {
    console.error('[NOTIFICATIONS] Erreur lors de l\'envoi:', err.message);
  }
}

module.exports = {
  setIo,
  envoyer
};
