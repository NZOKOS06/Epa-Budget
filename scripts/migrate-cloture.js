const pool = require('../server/config/database');

async function migrateCloture() {
  try {
    console.log('Création de la table workflow_cloture...');
    
    // Création de la table workflow_cloture
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_cloture (
          id SERIAL PRIMARY KEY,
          epa_id INTEGER REFERENCES epa(id),
          annee INTEGER NOT NULL,
          nom VARCHAR(255) NOT NULL,
          statut VARCHAR(50) NOT NULL DEFAULT 'EN_ATTENTE',
          date TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(epa_id, annee, id)
      )
    `);

    // Ajout des colonnes manquantes à la table rapports
    await pool.query(`
      ALTER TABLE rapports 
      ADD COLUMN IF NOT EXISTS date_certification TIMESTAMP,
      ADD COLUMN IF NOT EXISTS date_soumission_ccdb TIMESTAMP
    `);

    // Index pour performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_workflow_cloture_epa_annee ON workflow_cloture(epa_id, annee)
    `);

    // Insertion des étapes de clôture par défaut
    const currentYear = new Date().getFullYear();
    const epaResult = await pool.query('SELECT id FROM epa');
    
    for (const epa of epaResult.rows) {
      const existingSteps = await pool.query(
        'SELECT COUNT(*) as count FROM workflow_cloture WHERE epa_id = $1 AND annee = $2',
        [epa.id, currentYear]
      );

      if (parseInt(existingSteps.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO workflow_cloture (epa_id, annee, nom, statut) 
          VALUES 
            ($1, $2, 'Génération Comptes Administratifs', 'EN_ATTENTE'),
            ($1, $2, 'Génération Comptes Financiers', 'EN_ATTENTE'),
            ($1, $2, 'Certification e-signature', 'EN_ATTENTE'),
            ($1, $2, 'Soumission CCDB', 'EN_ATTENTE')
        `, [epa.id, currentYear]);
      }
    }

    console.log('Migration workflow_cloture terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrateCloture();
