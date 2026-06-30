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
const beneficiairesRoutes = require('./routes/beneficiaires');
const cartesRoutes = require('./routes/cartes');

// Import services
const notificationsService = require('./services/notifications');

const app = express();
const server = http.createServer(app);

// Socket.io configuration
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

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json({ limit: '10mb' }));

// Rate limiters
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 3 });
const resetDemandeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3 });
const resetValiderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3 });
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 100 });

// Routes API avec rate limiters spécifiques
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/reset-demande', resetDemandeLimiter);
app.use('/api/auth/reset-valider', resetValiderLimiter);
app.use('/api/admin', adminLimiter);

// Setup routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/beneficiaires', beneficiairesRoutes);
app.use('/api/cartes', cartesRoutes);

// Fichiers statiques (en production configuré via Nginx internal)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes frontend (SPA)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/admin.html'));
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
  server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
}
