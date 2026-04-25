require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'epa_budget',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const migration = `
-- 1. Ajouter colonne 'statut' à la table EPA (si absente)
ALTER TABLE epa ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'actif';

-- 2. Initialiser le statut pour les EPA existantes
UPDATE epa SET statut = 'actif' WHERE statut IS NULL;

-- 3. S'assurer que le rôle ADMIN existe
INSERT INTO roles (code, nom, description, permissions) VALUES
('ADMIN', 'Administrateur Système', 'Gestion complète de la plateforme : EPA, utilisateurs, configuration',
  '{"gerer_epa": true, "gerer_utilisateurs": true, "gerer_roles": true, "voir_journal_global": true, "configurer_systeme": true}'::jsonb)
ON CONFLICT (code) DO UPDATE
  SET permissions = EXCLUDED.permissions,
      description = EXCLUDED.description;

-- 4. Créer le compte Administrateur par défaut
-- Mot de passe : Admin2026! (hash bcrypt $2a$10$...)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id, statut)
SELECT
  'Système',
  'Admin',
  'admin@epa-budget.cg',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHG',
  r.id,
  'actif'
FROM roles r
WHERE r.code = 'ADMIN'
ON CONFLICT (email) DO NOTHING;
`;

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Connexion à la base de données...');
    await client.query('BEGIN');
    await client.query(migration);
    await client.query('COMMIT');
    console.log('✅ Migration Admin réussie !');
    console.log('');
    console.log('📋 Compte Admin créé :');
    console.log('   Email    : admin@epa-budget.cg');
    console.log('   Mot de passe : Admin2026!');
    console.log('   ⚠️  CHANGEZ CE MOT DE PASSE IMMÉDIATEMENT !');

    // Vérification
    const check = await client.query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.statut, r.code as role
       FROM utilisateurs u JOIN roles r ON u.role_id = r.id
       WHERE r.code = 'ADMIN'`
    );
    console.log('');
    console.log('🔍 Comptes ADMIN en base :');
    check.rows.forEach(row => {
      console.log(`   - ${row.prenom} ${row.nom} | ${row.email} | statut: ${row.statut}`);
    });

    // Vérifier colonne statut EPA
    const epaCheck = await client.query(`SELECT id, code, nom, COALESCE(statut, 'actif') as statut FROM epa LIMIT 5`);
    console.log('');
    console.log('🏛️  EPA existantes :');
    epaCheck.rows.forEach(row => {
      console.log(`   - [${row.code}] ${row.nom} | statut: ${row.statut}`);
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur migration :', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
