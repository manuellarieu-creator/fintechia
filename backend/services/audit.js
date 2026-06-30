const db = require('../config/db');

/*
 * Actions auditables — toutes les constantes
 * utilisées dans l'application
 */
const ACTIONS = {
  // Auth
  CONNEXION_REUSSIE:     'connexion_reussie',
  CONNEXION_ECHOUEE:     'connexion_echouee',
  DECONNEXION:           'deconnexion',
  INSCRIPTION:           'inscription',
  MOT_DE_PASSE_CHANGE:   'mot_de_passe_change',
  RESET_MDP_DEMANDE:     'reset_mdp_demande',
  RESET_MDP_VALIDE:      'reset_mdp_valide',
  SESSION_EXPIREE:       'session_expiree',

  // Compte
  COMPTE_CREE:           'compte_cree',
  COMPTE_ACTIVE:         'compte_active',
  COMPTE_BLOQUE:         'compte_bloque',
  COMPTE_CLOTURE:        'compte_cloture',
  COMPTE_KYC_REQUIS:     'compte_kyc_requis',
  IBAN_ATTRIBUE:         'iban_attribue',
  COMPTE_CREDITE:        'compte_credite',

  // KYC
  KYC_SOUMIS:            'kyc_soumis',
  KYC_DOCUMENT_VALIDE:   'kyc_document_valide',
  KYC_DOCUMENT_REJETE:   'kyc_document_rejete',
  KYC_SELFIE_VALIDE:     'kyc_selfie_valide',
  KYC_SELFIE_REJETE:     'kyc_selfie_rejete',
  KYC_COMPLET:           'kyc_complet',

  // Virement
  VIREMENT_INITIE:       'virement_initie',
  VIREMENT_VALIDE:       'virement_valide',
  VIREMENT_REJETE:       'virement_rejete',
  VIREMENT_ANNULE:       'virement_annule',

  // Bénéficiaire
  BENEFICIAIRE_AJOUTE:   'beneficiaire_ajoute',
  BENEFICIAIRE_VALIDE:   'beneficiaire_valide',
  BENEFICIAIRE_REJETE:   'beneficiaire_rejete',
  BENEFICIAIRE_SUPPRIME: 'beneficiaire_supprime',

  // Admin
  ADMIN_CONNEXION:       'admin_connexion',
  NOTIF_MANUELLE:        'notification_manuelle_envoyee',
  EXPORT_CSV:            'export_csv_transactions',
};

const CATEGORIES = {
  auth:          'auth',
  compte:        'compte',
  kyc:           'kyc',
  virement:      'virement',
  beneficiaire:  'beneficiaire',
  admin:         'admin',
  securite:      'securite',
};

/*
 * Enregistre une entrée dans audit_logs
 *
 * @param {object} params
 */
async function log(params) {
  const {
    acteur_id    = null,
    acteur_email = null,
    acteur_role  = 'client',
    action,
    categorie,
    cible_type   = null,
    cible_id     = null,
    cible_detail = null,
    statut       = 'succes',
    detail       = null,
    req          = null,
  } = params;

  const ip_address = req
    ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null)
    : null;

  const user_agent = req
    ? (req.headers['user-agent'] || null)
    : null;

  try {
    await db.query(
      `INSERT INTO audit_logs
       (acteur_id, acteur_email, acteur_role, action, categorie,
        cible_type, cible_id, cible_detail, statut, detail,
        ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        acteur_id, acteur_email, acteur_role,
        action, categorie,
        cible_type, cible_id, cible_detail,
        statut,
        typeof detail === 'object' ? JSON.stringify(detail) : detail,
        ip_address, user_agent,
      ]
    );
  } catch (err) {
    /* Ne jamais faire crasher l'app à cause d'un log */
    console.error('[AUDIT] Erreur enregistrement audit_log:', err.message);
  }
}

module.exports = { log, ACTIONS, CATEGORIES };
