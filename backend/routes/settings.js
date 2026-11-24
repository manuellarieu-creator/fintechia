const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Migration DB silencieuse pour la table settings
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT NOT NULL
      )
    `);
    try {
      await db.query(`ALTER TABLE settings MODIFY setting_value TEXT`);
    } catch(err) {
      // Ignore if already text or column doesn't exist yet
    }
    // Insert default activation_fee if it doesn't exist
    await db.query(`
      INSERT IGNORE INTO settings (setting_key, setting_value) 
      VALUES ('activation_fee', '10')
    `);
  } catch(e) {
    console.error("Erreur migration settings:", e.message);
  }
})();

// Clés de paramètres accessibles aux clients non-admin
const PUBLIC_SETTINGS = ['activation_fee', 'min_virement', 'max_virement', 'devise', 'app_name', 'support_email'];

// Cache mémoire pour les paramètres (TTL 60s) pour économiser l'Egress et les lectures SQL
let settingsCache = null;
let settingsCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000;

function invalidateSettingsCache() {
  settingsCache = null;
  settingsCacheTime = 0;
}

// GET /api/settings (Accessible by authenticated users: filtré pour non-admins)
router.get('/', authMiddleware.authMiddleware, async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const now = Date.now();
    let rawSettings = settingsCache;
    if (!rawSettings || (now - settingsCacheTime) > CACHE_TTL_MS) {
      const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
      rawSettings = {};
      rows.forEach(r => { rawSettings[r.setting_key] = r.setting_value; });
      settingsCache = rawSettings;
      settingsCacheTime = now;
    }

    const settings = {};
    for (const [key, value] of Object.entries(rawSettings)) {
      if (isAdmin || PUBLIC_SETTINGS.includes(key)) {
        settings[key] = value;
      }
    }
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/settings (Admin only)
router.patch('/', [authMiddleware.authMiddleware, authMiddleware.adminMiddleware], async (req, res, next) => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Invalid payload' });
    
    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', 
        [key, String(value), String(value)]
      );
    }
    invalidateSettingsCache();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});


// GET /api/settings/:key (Accessible by authenticated users)
router.get('/:key', authMiddleware.authMiddleware, async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && !PUBLIC_SETTINGS.includes(req.params.key)) {
      return res.status(403).json({ error: 'Accès non autorisé à ce paramètre', code: 'FORBIDDEN' });
    }
    const now = Date.now();
    let rawSettings = settingsCache;
    if (!rawSettings || (now - settingsCacheTime) > CACHE_TTL_MS) {
      const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
      rawSettings = {};
      rows.forEach(r => { rawSettings[r.setting_key] = r.setting_value; });
      settingsCache = rawSettings;
      settingsCacheTime = now;
    }
    if (!(req.params.key in rawSettings)) {
      return res.status(404).json({ error: 'Setting introuvable' });
    }
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.json({ key: req.params.key, value: rawSettings[req.params.key] });
  } catch (err) {
    next(err);
  }
});

// POST /api/settings/:key (Admin only)
router.post('/:key', [authMiddleware.authMiddleware, authMiddleware.adminMiddleware], async (req, res, next) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'Value is required' });
    
    await db.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', 
      [req.params.key, String(value), String(value)]
    );
    invalidateSettingsCache();
    res.json({ success: true, key: req.params.key, value });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
