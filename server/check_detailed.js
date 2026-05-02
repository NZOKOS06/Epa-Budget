const pool = require('./config/database');

async function checkDetailed() {
  try {
    const res = await pool.query("SELECT id, statut, date_modification as updated_at, id_epa as epa_id, id_validateur_dg FROM engagements WHERE statut = 'valide'");
    console.log('Engagements validés:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkDetailed();
