require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

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

// Import services
const notificationsService = require('./services/notifications');

const app = express();
app.set('trust proxy', 1); // Trust first proxy for Vercel rate-limiting
const server = http.createServer(app);

// Socket.io configuration (not supported on Vercel Serverless Functions)
if (!process.env.VERCEL) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST']
    }
  });
  notificationsService.setIo(io);

  io.on('connection', (socket) => {
    socket.on('rejoindre', (userId) => {
      socket.join(`user_${userId}`);
    });
  });
}

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (same-origin, mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow the configured frontend URL
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
    // Allow same-host requests (Vercel serves frontend and backend on same domain)
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiters — handler renvoie du JSON pour éviter les erreurs de parsing côté client
const rateLimitHandler = (req, res) => {
  res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.', code: 'RATE_LIMITED', status: 429 });
};
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, handler: rateLimitHandler });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, handler: rateLimitHandler });
const resetDemandeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, handler: rateLimitHandler });
const resetValiderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, handler: rateLimitHandler });
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 200, handler: rateLimitHandler });

// Routes API avec rate limiters spǸcifiques
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/reset-demande', resetDemandeLimiter);
app.use('/api/auth/reset-valider', resetValiderLimiter);
app.use('/api/admin', adminLimiter);

// Setup routes
app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); res.setHeader('Pragma', 'no-cache'); res.setHeader('Expires', '0'); next(); });
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

// Fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir les assets et pages frontend depuis le backend (nécessaire en dev et Codespaces)
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
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
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
    code: err.code || 'INTERNAL_ERROR',
    status: err.status || 500
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
      await db.query("ALTER TABLE users ADD COLUMN telephone_code VARCHAR(10) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE users ADD COLUMN telephone_verifie BOOLEAN DEFAULT FALSE").catch(() => {});
      
      await db.query("ALTER TABLE accounts ADD COLUMN numero_compte VARCHAR(50) DEFAULT NULL").catch(() => {});
      await db.query("ALTER TABLE accounts ADD UNIQUE (numero_compte)").catch(() => {});
      await db.query("ALTER TABLE accounts ADD COLUMN depot_initial_requis DECIMAL(15,2) DEFAULT 0").catch(() => {});

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

      await db.query(`INSERT IGNORE INTO iban_rules (code_pays, longueur) VALUES 
        ('FR', 27), ('MC', 27), ('BE', 16), ('DE', 22), 
        ('ES', 24), ('IT', 27), ('LU', 20), ('CH', 21), 
        ('GB', 22), ('PT', 25), ('NL', 18)
      `).catch(err => console.error("Erreur insertion iban_rules:", err.message));

      await db.query("ALTER TABLE beneficiaires ADD COLUMN bic VARCHAR(20) DEFAULT NULL").catch(() => {});

      console.log("Auto-migration DB terminée.");
    } catch (err) {
      console.error("Erreur lors de l'auto-migration :", err.message);
    }
  });
}
