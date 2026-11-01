const bcrypt = require('bcrypt');

/**
 * Vérifie un code PIN candidat contre un PIN stocké (haché bcrypt ou texte brut hérité).
 * @param {string} candidate - Le PIN fourni par l'utilisateur
 * @param {string} stored - Le PIN stocké en BDD
 * @returns {Promise<boolean>}
 */
async function verifyPin(candidate, stored) {
  if (!candidate || !stored) return false;
  const strCandidate = String(candidate).trim();
  const strStored = String(stored).trim();
  if (strStored.startsWith('$2b$') || strStored.startsWith('$2a$')) {
    return await bcrypt.compare(strCandidate, strStored);
  }
  return strCandidate === strStored;
}

/**
 * Hache un code PIN avec bcrypt.
 * @param {string} pin
 * @returns {Promise<string>}
 */
async function hashPin(pin) {
  return await bcrypt.hash(String(pin).trim(), 10);
}

module.exports = {
  verifyPin,
  hashPin
};

