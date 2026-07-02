const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function patch() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fintechia'
    });
    console.log('Connected to DB');
    await conn.query("ALTER TABLE accounts MODIFY COLUMN statut ENUM('en_attente','actif','kyc_requis','bloque','restreint','cloture') DEFAULT 'en_attente'");
    console.log('Altered accounts table ENUM successfully');
    await conn.end();
}
patch().catch(console.error);
