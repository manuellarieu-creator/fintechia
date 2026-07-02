CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  prenom        VARCHAR(80)  NOT NULL,
  nom           VARCHAR(80)  NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  telephone     VARCHAR(30),
  adresse       VARCHAR(255),
  profession    VARCHAR(100),
  revenus       VARCHAR(100),
  telephone_code VARCHAR(10),
  telephone_verifie BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('client','admin') DEFAULT 'client',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  iban         VARCHAR(34) UNIQUE,
  bic          VARCHAR(12) DEFAULT 'FINTEFR22XXX',
  type_compte  ENUM('credit','epargne','courant') DEFAULT 'credit',
  solde        DECIMAL(15,2) DEFAULT 0.00,
  statut       ENUM('en_attente','actif','kyc_requis','bloque','cloture') DEFAULT 'en_attente',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kyc (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  type_document  ENUM('cni','passeport','permis','sejour') NOT NULL,
  document_url   VARCHAR(500),
  selfie_url     VARCHAR(500),
  statut         ENUM('en_attente','en_cours','valide','rejete') DEFAULT 'en_attente',
  commentaire    TEXT,
  soumis_le      DATETIME DEFAULT CURRENT_TIMESTAMP,
  traite_le      DATETIME,
  traite_par     INT,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (traite_par) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS beneficiaires (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  nom         VARCHAR(160) NOT NULL,
  iban        VARCHAR(34)  NOT NULL,
  bic         VARCHAR(11),
  nom_banque  VARCHAR(100),
  statut      ENUM('en_attente','valide','rejete') DEFAULT 'en_attente',
  valide_par  INT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (valide_par) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  account_id       INT NOT NULL,
  type             ENUM('credit','debit','virement_emis','virement_recu') NOT NULL,
  montant          DECIMAL(15,2) NOT NULL,
  solde_avant      DECIMAL(15,2) NOT NULL,
  solde_apres      DECIMAL(15,2) NOT NULL,
  libelle          VARCHAR(255),
  motif            VARCHAR(255),
  iban_dest        VARCHAR(34),
  nom_dest         VARCHAR(160),
  nom_banque_dest  VARCHAR(100),
  reference        VARCHAR(50) UNIQUE,
  statut           ENUM('en_attente','valide','rejete','annule') DEFAULT 'en_attente',
  valide_par       INT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  traite_le        DATETIME,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (valide_par) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  titre      VARCHAR(160) NOT NULL,
  message    TEXT NOT NULL,
  type       ENUM('info','succes','alerte','erreur') DEFAULT 'info',
  lu         BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token   (token),
  INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  acteur_id    INT,
  acteur_email VARCHAR(160),
  acteur_role  ENUM('client','admin','system') DEFAULT 'client',
  action       VARCHAR(100) NOT NULL,
  categorie    ENUM('auth','compte','kyc','virement','beneficiaire','admin','securite') NOT NULL,
  cible_type   VARCHAR(50),
  cible_id     INT,
  cible_detail VARCHAR(255),
  statut       ENUM('succes','echec','tentative') DEFAULT 'succes',
  detail       TEXT,
  ip_address   VARCHAR(45),
  user_agent   VARCHAR(500),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_acteur   (acteur_id),
  INDEX idx_action   (action),
  INDEX idx_categorie(categorie),
  INDEX idx_date     (created_at),
  FOREIGN KEY (acteur_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT IGNORE INTO users (prenom, nom, email, password_hash, role)
VALUES ('Super', 'Admin', 'admin@fintechia.fr',
'$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  categorie VARCHAR(100) NOT NULL,
  limite DECIMAL(15,2) NOT NULL,
  couleur VARCHAR(20) DEFAULT 'blue',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
