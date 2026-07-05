require('dotenv').config({path: './backend/.env'});
const db = require('./backend/config/db');
async function run() {
  try {
    await db.query('CREATE TABLE IF NOT EXISTS iban_rules (code_pays VARCHAR(2) PRIMARY KEY, longueur INT NOT NULL)');
    await db.query("INSERT IGNORE INTO iban_rules (code_pays, longueur) VALUES ('FR', 27), ('MC', 27), ('BE', 16), ('DE', 22), ('ES', 24), ('IT', 27), ('LU', 20), ('CH', 21), ('GB', 22), ('PT', 25), ('NL', 18)");
    await db.query('ALTER TABLE beneficiaires ADD COLUMN bic VARCHAR(20) DEFAULT NULL').catch(()=>console.log('bic existant'));
    console.log('Done');
    process.exit(0);
  } catch(e){
    console.error(e);
    process.exit(1);
  }
}
run();
