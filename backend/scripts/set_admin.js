/**
 * Crée ou met à jour le compte administrateur avec des identifiants que VOUS choisissez.
 * Neutralise aussi l'ancien compte seedé "admin@fintechia.fr" s'il a encore le mot de passe "password".
 *
 * Usage (PowerShell) :
 *   $env:ADMIN_EMAIL="vous@exemple.com"; $env:ADMIN_PASSWORD="un-mot-de-passe-long-et-unique"; $env:ADMIN_PIN="123456"
 *   node backend/scripts/set_admin.js
 *
 * Admin DÉJÀ existant : ADMIN_PASSWORD est optionnel. Sans lui, seul le code PIN 2FA est mis à jour
 * et le mot de passe actuel est conservé (même compte, même historique).
 *
 * ADMIN_PIN = code à 6 chiffres demandé à la 2e étape de connexion admin (remplace l'ancien "0000").
 */
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { hashPin } = require('../services/pinHelper');

const LEGACY_EMAIL = 'admin@fintechia.fr';

async function main() {
  await db.query('ALTER TABLE users MODIFY COLUMN pin_code VARCHAR(100) DEFAULT NULL').catch(() => {});
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const pin = process.env.ADMIN_PIN || '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('ADMIN_EMAIL invalide');
  if (!/^\d{6}$/.test(pin) || pin === '000000') throw new Error('ADMIN_PIN doit être composé de 6 chiffres (pas 000000)');

  const [existing] = await db.query('SELECT id, role FROM users WHERE email = ?', [email]);
  const isExistingAdmin = existing.length > 0 && existing[0].role === 'admin';

  if (existing.length > 0 && !isExistingAdmin) throw new Error(`Un compte non-admin existe déjà avec l'email ${email}`);
  if (password && password.length < 12) throw new Error('ADMIN_PASSWORD doit contenir au moins 12 caractères');
  if (!isExistingAdmin && !password) throw new Error('ADMIN_PASSWORD est requis pour créer un nouvel admin');

  const hashedPin = await hashPin(pin);

  if (isExistingAdmin) {
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await db.query('UPDATE users SET password_hash = ?, pin_code = ? WHERE id = ?', [hash, hashedPin, existing[0].id]);
      console.log(`Admin mis à jour (mot de passe + PIN) : ${email}`);
    } else {
      await db.query('UPDATE users SET pin_code = ? WHERE id = ?', [hashedPin, existing[0].id]);
      console.log(`Admin mis à jour (PIN uniquement, mot de passe conservé) : ${email}`);
    }
  } else {
    const hash = await bcrypt.hash(password, 12);
    await db.query(
      "INSERT INTO users (prenom, nom, email, password_hash, role, pin_code) VALUES ('Super', 'Admin', ?, ?, 'admin', ?)",
      [email, hash, hashedPin]
    );
    console.log(`Admin créé : ${email}`);
  }

  // Neutralise l'ancien admin seedé s'il utilise encore le mot de passe connu
  if (email !== LEGACY_EMAIL) {
    const [legacy] = await db.query('SELECT id, password_hash FROM users WHERE email = ?', [LEGACY_EMAIL]);
    if (legacy.length > 0 && await bcrypt.compare('password', legacy[0].password_hash)) {
      const randomHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      await db.query('UPDATE users SET password_hash = ?, pin_code = NULL, telephone_code = NULL WHERE id = ?', [randomHash, legacy[0].id]);
      console.log(`Ancien compte ${LEGACY_EMAIL} neutralisé (mot de passe par défaut remplacé).`);
    }
  }
}

main()
  .catch(err => { console.error('ERREUR :', err.message); process.exitCode = 1; })
  .finally(() => db.end());
