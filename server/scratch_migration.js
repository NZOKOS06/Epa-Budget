const pool = require('./config/database');
async function migrate() {
  try {
    await pool.query("ALTER TABLE liquidations ADD COLUMN IF NOT EXISTS date_reception DATE");
    await pool.query("ALTER TABLE liquidations ADD COLUMN IF NOT EXISTS observations TEXT");
    await pool.query("ALTER TABLE liquidations ADD COLUMN IF NOT EXISTS pv_numero VARCHAR(50)");
    console.log("Migration réussie");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
migrate();
