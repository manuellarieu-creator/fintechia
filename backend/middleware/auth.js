const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentification requise', code: 'UNAUTHORIZED', status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Les tokens à usage restreint (2FA, reset PIN, récupération PIN...) portent un champ "intent".
    // Ils ne doivent JAMAIS être acceptés comme jeton de session.
    if (decoded.intent) {
      return res.status(401).json({ error: 'Token invalide ou expiré', code: 'INVALID_TOKEN', status: 401 });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré', code: 'INVALID_TOKEN', status: 401 });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Accès refusé', code: 'FORBIDDEN', status: 403 });
  }
};

module.exports = { authMiddleware, adminMiddleware };
