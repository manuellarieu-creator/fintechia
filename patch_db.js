require('dotenv').config();
const db = require('./backend/config/db');

async function patch() {
  try {
    const [res] = await db.query("ALTER TABLE accounts MODIFY COLUMN type_compte VARCHAR(100) DEFAULT 'Courant'");
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

patch();
