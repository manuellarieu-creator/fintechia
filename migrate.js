require('dotenv').config({path: './backend/.env'});
const db = require('./backend/config/db');
async function run() {
  try {
    await db.query('CREATE TABLE IF NOT EXISTS iban_rules (code_pays VARCHAR(2) PRIMARY KEY, longueur INT NOT NULL)');
    await db.query("INSERT IGNORE INTO iban_rules (code_pays, longueur) VALUES ('FR', 27), ('MC', 27), ('BE', 16), ('DE', 22), ('ES', 24), ('IT', 27), ('LU', 20), ('CH', 21), ('GB', 22), ('PT', 25), ('NL', 18)");
    await db.query('ALTER TABLE beneficiaires ADD COLUMN bic VARCHAR(20) DEFAULT NULL').catch(()=>console.log('bic existant'));
    await db.query(`
      CREATE TABLE IF NOT EXISTS credit_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        montant DECIMAL(15,2) NOT NULL,
        duree_mois INT NOT NULL,
        taux DECIMAL(5,2) NOT NULL,
        mensualite DECIMAL(15,2) NOT NULL,
        motif VARCHAR(255) NOT NULL,
        message TEXT,
        nom VARCHAR(100),
        prenom VARCHAR(100),
        email VARCHAR(255),
        telephone VARCHAR(50),
        statut VARCHAR(50) DEFAULT 'en_attente',
        reference VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
