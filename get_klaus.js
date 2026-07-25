const db = require('./backend/config/db');

async function getKlaus() {
  try {
    const [rows] = await db.query("SELECT id, email, password, role FROM users WHERE prenom='Klaus'");
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

getKlaus();
