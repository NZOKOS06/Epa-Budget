const pool = require('../server/config/database');
const fs = require('fs');
const path = require('path');

async function applySchemaV2() {
  try {
    console.log('Application du schema_v2.sql...');
    
    // Lire le fichier schema_v2.sql
    const schemaPath = path.join(__dirname, '../database/schema_v2.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Exécuter le schéma
    await pool.query(schemaSQL);
    
    console.log('Schema_v2.sql appliqué avec succès!');
    
    // Créer les tables manquantes pour la clôture
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

    // Ajouter les colonnes manquantes à la table rapports
    await pool.query(`
      ALTER TABLE rapports 
      ADD COLUMN IF NOT EXISTS date_certification TIMESTAMP,
      ADD COLUMN IF NOT EXISTS date_soumission_ccdb TIMESTAMP
    `);

    // Création des étapes de clôture par défaut
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

    // Créer quelques articles budgétaires par défaut si nécessaire
    const chapitresResult = await pool.query(`
      SELECT cb.id, cb.code, cb.libelle, cb.ae_alloue, cb.cp_alloue, cb.id_budget
      FROM chapitres_budgetaires cb
      WHERE NOT EXISTS (
        SELECT 1 FROM articles_budgetaires ab 
        WHERE ab.id_chapitre = cb.id
      )
      LIMIT 10
    `);

    for (const chapitre of chapitresResult.rows) {
      await pool.query(`
        INSERT INTO articles_budgetaires (id_chapitre, code, libelle, ae_initial, cp_initial)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        chapitre.id,
        `ART-${chapitre.code}-001`,
        `Article par défaut pour ${chapitre.libelle}`,
        chapitre.ae_alloue,
        chapitre.cp_alloue
      ]);
    }

    // Mettre à jour les engagements pour leur assigner un article budgétaire
    await pool.query(`
      UPDATE engagements 
      SET id_article_budgetaire = subquery.article_id
      FROM (
        SELECT 
          e.id as engagement_id,
          ab.id as article_id
        FROM engagements e
        LEFT JOIN articles_budgetaires ab ON 1=1  -- Temporaire, à améliorer avec la vraie logique
        WHERE e.id_article_budgetaire IS NULL
        AND ab.id IS NOT NULL
        LIMIT 100
      ) AS subquery
      WHERE engagements.id = subquery.engagement_id
    `);

    console.log('Migration terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    process.exit(1);
  }
}

applySchemaV2();
