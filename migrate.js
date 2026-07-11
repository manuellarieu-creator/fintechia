require('dotenv').config({path: './backend/.env'});
const db = require('./backend/config/db');
async function run() {
  try {
    await db.query('CREATE TABLE IF NOT EXISTS iban_rules (code_pays VARCHAR(2) PRIMARY KEY, longueur INT NOT NULL)');
    await db.query("INSERT IGNORE INTO iban_rules (code_pays, longueur) VALUES ('FR', 27), ('MC', 27), ('BE', 16), ('DE', 22), ('ES', 24), ('IT', 27), ('LU', 20), ('CH', 21), ('GB', 22), ('PT', 25), ('NL', 18)");
    await db.query('ALTER TABLE beneficiaires ADD COLUMN bic VARCHAR(20) DEFAULT NULL').catch(()=>console.log('bic existant'));
    
    await db.query("ALTER TABLE accounts ADD COLUMN numero_compte VARCHAR(50)").catch(e => console.error("Migration error:", e.message));
    await db.query("ALTER TABLE accounts ADD UNIQUE (numero_compte)").catch(e => console.error("Migration error:", e.message));
    await db.query("ALTER TABLE accounts ADD COLUMN motif_blocage VARCHAR(255) DEFAULT NULL").catch(e => console.error("Migration error:", e.message));
    await db.query("ALTER TABLE accounts ADD COLUMN transfer_allowed BOOLEAN DEFAULT TRUE").catch(e => console.error("Migration error:", e.message));
    await db.query("ALTER TABLE accounts ADD COLUMN max_transfer_amount DECIMAL(15,2) DEFAULT NULL").catch(e => console.error("Migration error:", e.message));
    await db.query("ALTER TABLE users ADD COLUMN transfer_types VARCHAR(255) DEFAULT 'standard,immediat,swift,programme'").catch(e => console.error("Migration error:", e.message));

    await db.query(`
      CREATE TABLE IF NOT EXISTS credit_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        compte_id INT,
        montant DECIMAL(15,2) NOT NULL,
        duree_mois INT NOT NULL,
        taux DECIMAL(5,2) NOT NULL,
        mensualite DECIMAL(15,2) NOT NULL,
        type_credit VARCHAR(100),
        motif VARCHAR(255) NOT NULL,
        message TEXT,
        nom VARCHAR(100),
        prenom VARCHAR(100),
        email VARCHAR(255),
        telephone VARCHAR(50),
        profession VARCHAR(100),
        revenu_mensuel DECIMAL(15,2),
        statut VARCHAR(50) DEFAULT 'en_attente',
        reference VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS credit_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        credit_request_id INT NOT NULL,
        type_document VARCHAR(100) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        statut VARCHAR(50) DEFAULT 'recu',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (credit_request_id) REFERENCES credit_requests(id) ON DELETE CASCADE
      )
    `);
    console.log('Done');
    process.exit(0);
  } catch(e){
    console.error(e);
    process.exit(1);
  }
}
run();
