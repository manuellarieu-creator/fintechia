require('dotenv').config();

// Le secret JWT est OBLIGATOIRE : aucune valeur de repli n'est tolérée,
// sinon n'importe qui pourrait forger un token (y compris admin).
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    '[SECURITE] JWT_SECRET manquant ou trop court (32 caractères minimum). ' +
    'Définissez-le dans .env / dans les variables d\'environnement Vercel.'
  );
}

module.exports = { JWT_SECRET };
