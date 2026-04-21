const pool = require('./config/database');

async function initRapports() {
  try {
    // 1. Créer la table rapports
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rapports (
        id SERIAL PRIMARY KEY,
        epa_id INTEGER REFERENCES epa(id),
        type VARCHAR(50) NOT NULL, -- RAP_TRIMESTRIEL, COMPTES_ANNUELS
        periode VARCHAR(50),
        statut VARCHAR(20) DEFAULT 'BROUILLON', -- BROUILLON, VALIDE, TRANSMIS
        chemin_fichier VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES utilisateurs(id)
      )
    `);
    console.log('Table rapports créée ou déjà existante');

    // 2. Insérer des données de test si vide
    const check = await pool.query('SELECT COUNT(*) FROM rapports');
    if (parseInt(check.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO rapports (epa_id, type, periode, statut)
        VALUES 
        (1, 'RAP_TRIMESTRIEL', 'T1 2026', 'BROUILLON'),
        (1, 'COMPTES_ANNUELS', '2025', 'VALIDE'),
        (1, 'RAP_TRIMESTRIEL', 'T4 2025', 'TRANSMIS')
      `);
      console.log('Données de test insérées dans rapports');
    }
  } catch (err) {
    console.error('Erreur initialisation rapports:', err);
  } finally {
    process.exit();
  }
}

initRapports();
