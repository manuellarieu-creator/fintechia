const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function patch() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fintechia',
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });
    console.log('Connected to DB');
    
    try {
        await conn.query("ALTER TABLE users ADD COLUMN must_change_pin BOOLEAN DEFAULT FALSE;");
        console.log('Added column must_change_pin successfully');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column must_change_pin already exists');
        } else {
            console.error('Error adding column:', e);
        }
    }
    
    await conn.end();
}
patch().catch(console.error);
