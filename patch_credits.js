require('dotenv').config({path: './backend/.env'});
const db = require('./backend/config/db');

async function run() {
  try {
    console.log('Updating credit_requests table...');
    // Add columns if they don't exist
    const [columns] = await db.query("SHOW COLUMNS FROM credit_requests");
    const columnNames = columns.map(c => c.Field);
    
    let alterQuery = "ALTER TABLE credit_requests ";
    let alterations = [];
    
    if (!columnNames.includes('profession')) {
      alterations.push("ADD COLUMN profession VARCHAR(100)");
    }
    if (!columnNames.includes('revenu_mensuel')) {
      alterations.push("ADD COLUMN revenu_mensuel DECIMAL(15,2)");
    }
    if (!columnNames.includes('type_credit')) {
      alterations.push("ADD COLUMN type_credit VARCHAR(100)");
    }
    if (!columnNames.includes('compte_id')) {
      alterations.push("ADD COLUMN compte_id INT");
    }

    if (alterations.length > 0) {
      alterQuery += alterations.join(", ");
      await db.query(alterQuery);
      console.log('Added columns to credit_requests.');
    } else {
      console.log('Columns already exist in credit_requests.');
    }

    console.log('Creating credit_documents table...');
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
    console.log('Created credit_documents table.');

    console.log('Done!');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
