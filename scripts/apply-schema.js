const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  try {
    await adminClient.connect();
    console.log('Connecté à postgres (admin)');

    // Terminer les connexions actives pour pouvoir supprimer la base
    await adminClient.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'epa_budget'
        AND pid <> pg_backend_pid();
    `);

    await adminClient.query(`DROP DATABASE IF EXISTS epa_budget`);
    console.log('Ancienne base de données supprimée.');
    
    await adminClient.query(`CREATE DATABASE epa_budget`);
    console.log('Nouvelle base de données epa_budget créée.');
  } catch (err) {
    console.error('Erreur de création DB:', err);
  } finally {
    await adminClient.end();
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'epa_budget',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  try {
    await client.connect();
    console.log('Connecté à epa_budget');

    const schemaPath = path.join(__dirname, '..', 'database', 'schema_v2.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schemaSql);
    console.log('Schéma V2 appliqué avec succès !');

  } catch (err) {
    console.error("Erreur lors de l'application du schéma:", err);
  } finally {
    await client.end();
  }
}

run();
