const pool = require('../server/config/database');

async function migrateMissingTables() {
  try {
    console.log('Création des tables manquantes...');
    
    // Création de la table articles_budgetaires
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles_budgetaires (
          id SERIAL PRIMARY KEY,
          id_chapitre INTEGER REFERENCES chapitres_budgetaires(id),
          code VARCHAR(50) NOT NULL,
          libelle VARCHAR(255) NOT NULL,
          ae_alloue DECIMAL(15,2) DEFAULT 0,
          cp_alloue DECIMAL(15,2) DEFAULT 0,
          ae_engage DECIMAL(15,2) DEFAULT 0,
          cp_liquide DECIMAL(15,2) DEFAULT 0,
          cp_paye DECIMAL(15,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Création de la table liquidations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS liquidations (
          id SERIAL PRIMARY KEY,
          id_engagement INTEGER REFERENCES engagements(id),
          montant_facture DECIMAL(15,2) NOT NULL,
          montant_liquide DECIMAL(15,2) NOT NULL,
          statut VARCHAR(50) DEFAULT 'en_attente',
          facture_path VARCHAR(500),
          pv_service_fait_path VARCHAR(500),
          id_validateur_ac UUID REFERENCES utilisateurs(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Mise à jour de la table engagements
    await pool.query(`
      ALTER TABLE engagements 
      ADD COLUMN IF NOT EXISTS id_article_budgetaire INTEGER REFERENCES articles_budgetaires(id)
    `);

    // Mise à jour de la table paiements
    await pool.query(`
      ALTER TABLE paiements 
      ADD COLUMN IF NOT EXISTS id_liquidation INTEGER REFERENCES liquidations(id),
      ADD COLUMN IF NOT EXISTS id_agent_comptable UUID REFERENCES utilisateurs(id),
      ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(50) DEFAULT 'virement'
    `);

    // Création de quelques articles budgétaires par défaut
    const chapitresResult = await pool.query(`
      SELECT cb.id, cb.code, cb.libelle, cb.ae_alloue, cb.cp_alloue
      FROM chapitres_budgetaires cb
      WHERE NOT EXISTS (
        SELECT 1 FROM articles_budgetaires ab 
        WHERE ab.id_chapitre = cb.id
      )
      LIMIT 10
    `);

    for (const chapitre of chapitresResult.rows) {
      await pool.query(`
        INSERT INTO articles_budgetaires (id_chapitre, code, libelle, ae_alloue, cp_alloue)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        chapitre.id,
        `ART-${chapitre.code}-001`,
        `Article par défaut pour ${chapitre.libelle}`,
        chapitre.ae_alloue,
        chapitre.cp_alloue
      ]);
    }

    // Mise à jour des engagements pour leur assigner un article budgétaire
    await pool.query(`
      UPDATE engagements 
      SET id_article_budgetaire = subquery.article_id
      FROM (
        SELECT 
          e.id as engagement_id,
          ab.id as article_id
        FROM engagements e
        LEFT JOIN programmes p ON e.programme_id = p.id
        LEFT JOIN chapitres_budgetaires cb ON p.id = cb.id_programme
        LEFT JOIN articles_budgetaires ab ON cb.id = ab.id_chapitre
        WHERE e.id_article_budgetaire IS NULL
        AND ab.id IS NOT NULL
        LIMIT 100
      ) AS subquery
      WHERE engagements.id = subquery.engagement_id
    `);

    console.log('Migration des tables manquantes terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrateMissingTables();
