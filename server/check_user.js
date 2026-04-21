const pool = require('./config/database');

async function checkUser() {
  try {
    const res = await pool.query("SELECT id, email, epa_id FROM utilisateurs WHERE email LIKE '%dg%'");
    console.log('DG Users:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkUser();
