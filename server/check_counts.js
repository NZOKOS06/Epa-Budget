const pool = require('./config/database');

async function checkData() {
  try {
    const valides = await pool.query("SELECT COUNT(*) FROM engagements WHERE statut = 'valide'");
    console.log('Engagements validés:', valides.rows[0].count);
    
    const total = await pool.query("SELECT COUNT(*) FROM engagements");
    console.log('Engagements total:', total.rows[0].count);

    const progs = await pool.query("SELECT COUNT(*) FROM chapitres_budgetaires");
    console.log('Programmes:', progs.rows[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkData();
