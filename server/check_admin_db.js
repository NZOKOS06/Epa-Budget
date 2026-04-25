require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'epa_budget',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function checkAdmin() {
  try {
    const res = await pool.query(`
      SELECT u.id, u.email, u.statut, r.code as role 
      FROM utilisateurs u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.code = 'ADMIN'
    `);
    console.log('--- ADMIN ACCOUNTS ---');
    console.log(JSON.stringify(res.rows, null, 2));
    
    if (res.rows.length === 0) {
        console.log('No admin found. Checking if role ADMIN exists...');
        const roleRes = await pool.query("SELECT * FROM roles WHERE code = 'ADMIN'");
        console.log('Role ADMIN:', roleRes.rows);
    }
  } catch (err) {
    console.error('Error checking admin:', err.message);
  } finally {
    await pool.end();
  }
}

checkAdmin();
