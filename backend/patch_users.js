const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function patch() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fintechia'
    });
    console.log('Connected to DB');
    await conn.query("ALTER TABLE users ADD COLUMN adresse VARCHAR(255) DEFAULT NULL, ADD COLUMN profession VARCHAR(100) DEFAULT NULL, ADD COLUMN revenus VARCHAR(100) DEFAULT NULL, ADD COLUMN telephone_code VARCHAR(10) DEFAULT NULL, ADD COLUMN telephone_verifie BOOLEAN DEFAULT FALSE;");
    console.log('Altered users table successfully');
    await conn.end();
}
patch().catch(console.error);
