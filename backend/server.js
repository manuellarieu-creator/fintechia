require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const kycRoutes = require('./routes/kyc');
const transactionsRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const budgetsRoutes = require('./routes/budgets');
const beneficiaryRoutes = require('./routes/beneficiaires');
const creditRoutes = require('./routes/credits');
const cartesRoutes = require('./routes/cartes');
const settingsRoutes = require('./routes/settings');
const alertesRoutes = require('./routes/alertes');
const notificationsRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');

// Import services
const notificationsService = require('./services/notifications');

const app = express();
app.set('trust proxy', 1); // Trust first proxy for Vercel rate-limiting
const server = http.createServer(app);

// Configuration CORS des domaines autorisés
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.APP_URL,
  'https://fintechia.co',
  'https://www.fintechia.co'
].filter(Boolean);

// Socket.io configuration (not supported on Vercel Serverless Functions)
if (!process.env.VERCEL) {
  const io = new Server(server, {
    cors: {
      origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error('CORS Socket.io non autorisé'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentification obligatoire des sockets Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1] || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentification Socket.io requise'));
    }
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('./config/jwt');
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.intent) {
        return next(new Error('Token Socket.io invalide'));
      }
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Session Socket.io invalide ou expirée'));
    }
  });

  notificationsService.setIo(io);

  io.on('connection', (socket) => {
    // Rejoint automatiquement la room de l'utilisateur authentifié
    if (socket.user && socket.user.id) {
      socket.join(`user_${socket.user.id}`);
    }

    socket.on('rejoindre', (requestedUserId) => {
      // Un utilisateur ne peut écouter que ses propres notifications (sauf admin)
      if (socket.user && (String(socket.user.id) === String(requestedUserId) || socket.user.role === 'admin')) {
        socket.join(`user_${requestedUserId}`);
      }
    });
  });
}

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(compression());
app.use(cors({
  origin: function(origin, callback) {
    // Requêtes sans en-tête origin (same-origin, curl, applications natives, mobile)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Accès refusé par la politique CORS'), false);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiters — handler renvoie du JSON pour éviter les erreurs de parsing côté client
const rateLimitHandler = (req, res) => {
  res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.', code: 'RATE_LIMITED', status: 429 });
};
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, handler: rateLimitHandler });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, handler: rateLimitHandler });
const resetDemandeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, handler: rateLimitHandler });
const resetValiderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, handler: rateLimitHandler });
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 200, handler: rateLimitHandler });
const virementLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, handler: rateLimitHandler });
const pinLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, handler: rateLimitHandler });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, handler: rateLimitHandler });

// Routes API avec rate limiters spécifiques
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/reset-demande', resetDemandeLimiter);
app.use('/api/auth/reset-valider', resetValiderLimiter);
app.use('/api/auth/verify-pin', pinLimiter);
app.use('/api/auth/pin', pinLimiter);
app.use('/api/auth/otp', otpLimiter);
app.use('/api/transactions/virement', virementLimiter);
app.use('/api/admin', adminLimiter);

// Protection anti-scrapers & bots abusifs sur l'API (économie de temps de calcul Serverless)
const BAD_BOTS = /AhrefsBot|SemrushBot|PetalBot|MJ12bot|DotBot|BLEXBot|DataForSeoBot/i;
app.use('/api', (req, res, next) => {
  const ua = req.get('user-agent') || '';
  if (BAD_BOTS.test(ua)) {
    return res.status(403).json({ error: 'Accès interdit aux robots d\'indexation sur l\'API.' });
  }
  if (!res.getHeader('Cache-Control')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/beneficiaires', beneficiaryRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/cartes', cartesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/alertes', alertesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chat', chatRoutes);
const documentsRoutes = require('./routes/documents');
app.use('/api/documents', documentsRoutes);

// Fichiers statiques et téléchargements sécurisés
// Protection de /uploads : l'accès aux documents nécessite d'être authentifié et soit propriétaire, soit admin
app.get('/uploads/:filename', async (req, res, next) => {
  const rawFilename = path.basename(req.params.filename); // Empêche le path traversal
  if (!/^[a-zA-Z0-9_\.\-]+$/.test(rawFilename)) {
    return res.status(400).json({ error: 'Nom de fichier invalide', code: 'INVALID_FILENAME' });
  }
  const filename = rawFilename;
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentification requise pour accéder aux documents', code: 'UNAUTHORIZED' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('./config/jwt');
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.intent) {
      return res.status(401).json({ error: 'Token invalide', code: 'INVALID_TOKEN' });
    }

    const isAdmin = decoded.role === 'admin';
    if (!isAdmin) {
      // Vérifier si le fichier appartient à l'utilisateur (dans kyc ou credit_documents)
      const db = require('./config/db');
      const [kyc] = await db.query(
        'SELECT id FROM kyc WHERE user_id = ? AND (document_url LIKE ? OR document_verso_url LIKE ? OR selfie_url LIKE ?)',
        [decoded.id, `%/${filename}`, `%/${filename}`, `%/${filename}`]
      );
      const [creditDoc] = await db.query(
        'SELECT cd.id FROM credit_documents cd JOIN credit_requests cr ON cd.credit_request_id = cr.id WHERE cr.user_id = ? AND cd.file_path LIKE ?',
        [decoded.id, `%/${filename}`]
      );

      if (kyc.length === 0 && creditDoc.length === 0) {
        return res.status(403).json({ error: 'Accès interdit à ce document', code: 'FORBIDDEN' });
      }
    }

    const uploadDir = process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads'));
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier introuvable', code: 'NOT_FOUND' });
    }
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(401).json({ error: 'Session invalide ou expirée', code: 'INVALID_TOKEN' });
  }
});

// Servir les assets et pages frontend depuis le backend (nécessaire en dev et Codespaces)
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// Middleware pour gérer les URLs multilingues (ex: /en/, /es/app.html)
const supportedLangs = ['fr', 'en', 'es', 'de', 'da', 'hu', 'hr'];
app.use((req, res, next) => {
  const parts = req.path.split('/');
  if (parts.length > 1 && supportedLangs.includes(parts[1])) {
    // Réécrire l'URL pour les routes en dessous
    req.url = req.url.replace('/' + parts[1], '') || '/';
  }
  next();
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/admin.html'));
});
app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/admin-dashboard.html'));
});
app.get('/app.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/app.html'));
});
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/app.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});
app.get('/:page.html', (req, res) => {
  const filePath = path.join(__dirname, '../frontend/pages', req.params.page + '.html');
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send('Page non trouvée');
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date() });
});

// Middleware d'erreur global
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  const status = err.status || 500;
  // Ne pas exposer les messages d'erreur internes (SQL, syntaxe, etc.) en production
  const isDev = process.env.NODE_ENV === 'development';
  const userMessage = (status < 500 || isDev) ? (err.message || 'Erreur requête') : 'Une erreur interne est survenue. Veuillez réessayer plus tard.';
  res.status(status).json({
    error: userMessage,
    code: err.code || 'INTERNAL_ERROR',
    status: status
  });
});

module.exports = app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, async () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    
    // Auto-migration de la base de données au démarrage
    const db = require('./config/db');
    try {
      await db.query("ALTER TABLE users ADD COLUMN adresse VARCHAR(255) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE users ADD COLUMN profession VARCHAR(100) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE users ADD COLUMN revenus VARCHAR(100) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE users ADD COLUMN date_naissance VARCHAR(20) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE users ADD COLUMN nationalite VARCHAR(100) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE users ADD COLUMN telephone_code VARCHAR(10) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE users ADD COLUMN telephone_verifie BOOLEAN DEFAULT FALSE").catch(() => {});
      await db.query("ALTER TABLE users ADD COLUMN transfer_types VARCHAR(255) DEFAULT 'standard,immediat,swift,programme'").catch(() => {});
      
      await db.query("ALTER TABLE accounts ADD COLUMN numero_compte VARCHAR(50) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE accounts ADD UNIQUE (numero_compte)").catch(() => {});
      await db.query("ALTER TABLE accounts ADD COLUMN depot_initial_requis DECIMAL(15,2) DEFAULT 0").catch(() => {});
      await db.query("ALTER TABLE accounts ADD COLUMN custom_type VARCHAR(100) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE accounts MODIFY COLUMN type_compte VARCHAR(50) DEFAULT 'Courant'").catch((e) => console.log('Notice: type_compte already updated or error', e.message));

      await db.query(`
        CREATE TABLE IF NOT EXISTS alertes_fraudes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          transaction_id INT DEFAULT NULL,
          type ENUM('phishing', 'virement_suspect', 'login_anormal', 'kyc_multiple') NOT NULL,
          description TEXT NOT NULL,
          niveau_risque ENUM('low', 'medium', 'high') NOT NULL,
          statut ENUM('en_attente', 'resolu') DEFAULT 'en_attente',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).catch(err => console.error("Erreur création alertes_fraudes:", err.message));

      await db.query(`
        CREATE TABLE IF NOT EXISTS iban_rules (
          code_pays VARCHAR(2) PRIMARY KEY,
          longueur INT NOT NULL
        )
      `).catch(err => console.error("Erreur création iban_rules:", err.message));

      await db.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT DEFAULT NULL,
          type VARCHAR(50) NOT NULL,
          titre VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          lu BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).catch(err => console.error("Erreur création notifications:", err.message));

      await db.query(`
        CREATE TABLE IF NOT EXISTS chat_conversations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT DEFAULT NULL,
          visitor_name VARCHAR(100) DEFAULT NULL,
          visitor_email VARCHAR(100) DEFAULT NULL,
          visitor_phone VARCHAR(50) DEFAULT NULL,
          status ENUM('open', 'closed') DEFAULT 'open',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).catch(err => console.error("Erreur création chat_conversations:", err.message));

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
      `).catch(err => console.error("Erreur création chat_messages:", err.message));

      await db.query(`INSERT IGNORE INTO iban_rules (code_pays, longueur) VALUES 
        ('FR', 27), ('MC', 27), ('BE', 16), ('DE', 22), 
        ('ES', 24), ('IT', 27), ('LU', 20), ('CH', 21), 
        ('GB', 22), ('PT', 25), ('NL', 18)
      `).catch(err => console.error("Erreur insertion iban_rules:", err.message));

      await db.query("ALTER TABLE beneficiaires ADD COLUMN bic VARCHAR(20) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE users MODIFY COLUMN pin_code VARCHAR(100) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE users ADD COLUMN otp_fails INT DEFAULT 0").catch(() => {});
      await db.query("UPDATE fraud_detection_rules SET is_active = TRUE WHERE rule_name = 'Tentative de force brute'").catch(() => {});

      console.log("Auto-migration DB terminée.");
    } catch (err) {
      console.error("Erreur lors de l'auto-migration :", err.message);
    }
  });
}
