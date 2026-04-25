require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'epa_budget',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function test() {
  const res = await pool.query("SELECT * FROM utilisateurs WHERE email = 'admin@epa-budget.cg'");
  
  if (res.rows[0]) {
    const password = 'Admin2026!';
    const newHash = await bcrypt.hash(password, 10);
    await pool.query("UPDATE utilisateurs SET mot_de_passe = $1 WHERE email = 'admin@epa-budget.cg'", [newHash]);
    console.log('✅ Admin password hash updated to properly match Admin2026!');
  }
  process.exit(0);
}
test();
