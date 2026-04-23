const pool = require('../server/config/database');

async function fixRapportsTable() {
  try {
    console.log('Correction de la table rapports...');
    
    // Vérifier si la table rapports existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'rapports'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Création de la table rapports...');
      await pool.query(`
        CREATE TABLE rapports (
            id SERIAL PRIMARY KEY,
            epa_id INTEGER REFERENCES epa(id),
            type_rapport VARCHAR(50) NOT NULL,
            periode VARCHAR(50),
            annee INTEGER,
            fichier_path VARCHAR(500),
            statut VARCHAR(50) DEFAULT 'BROUILLON',
            date_certification TIMESTAMP,
            date_soumission_ccdb TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      console.log('Ajout des colonnes manquantes...');
      // Ajouter les colonnes manquantes si elles n'existent pas
      await pool.query(`ALTER TABLE rapports ADD COLUMN IF NOT EXISTS type_rapport VARCHAR(50)`);
      await pool.query(`ALTER TABLE rapports ADD COLUMN IF NOT EXISTS periode VARCHAR(50)`);
      await pool.query(`ALTER TABLE rapports ADD COLUMN IF NOT EXISTS annee INTEGER`);
      await pool.query(`ALTER TABLE rapports ADD COLUMN IF NOT EXISTS fichier_path VARCHAR(500)`);
      await pool.query(`ALTER TABLE rapports ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'BROUILLON'`);
      await pool.query(`ALTER TABLE rapports ADD COLUMN IF NOT EXISTS date_certification TIMESTAMP`);
      await pool.query(`ALTER TABLE rapports ADD COLUMN IF NOT EXISTS date_soumission_ccdb TIMESTAMP`);
      await pool.query(`ALTER TABLE rapports ADD COLUMN IF NOT EXISTS epa_id INTEGER REFERENCES epa(id)`);
    }
    
    // Créer quelques rapports de test si nécessaire
    const rapportsCount = await pool.query('SELECT COUNT(*) as count FROM rapports');
    if (parseInt(rapportsCount.rows[0].count) === 0) {
      console.log('Création de rapports de test...');
      const currentYear = new Date().getFullYear();
      const epaResult = await pool.query('SELECT id FROM epa LIMIT 1');
      
      if (epaResult.rows.length > 0) {
        await pool.query(`
          INSERT INTO rapports (epa_id, type_rapport, annee, statut)
          VALUES 
            ($1, 'COMPTES_ADMINISTRATIFS', $2, 'GENERE'),
            ($1, 'COMPTES_FINANCIERS', $2, 'GENERE'),
            ($1, 'ANNEXES', $2, 'BROUILLON')
        `, [epaResult.rows[0].id, currentYear]);
      }
    }
    
    console.log('Table rapports corrigée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la correction:', error);
    process.exit(1);
  }
}

fixRapportsTable();
