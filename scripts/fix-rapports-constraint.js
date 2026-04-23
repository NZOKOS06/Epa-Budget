const pool = require('../server/config/database');

async function fixRapportsConstraint() {
  try {
    console.log('Correction des contraintes de la table rapports...');
    
    // Supprimer la contrainte problématique si elle existe
    try {
      await pool.query(`
        ALTER TABLE rapports DROP CONSTRAINT IF EXISTS rapports_epa_id_annee_type_rapport_key
      `);
      console.log('Contrainte existante supprimée');
    } catch (error) {
      console.log('Pas de contrainte à supprimer');
    }
    
    // Ajouter une contrainte unique correcte
    await pool.query(`
      ALTER TABLE rapports 
      ADD CONSTRAINT rapports_unique_epa_annee_type 
      UNIQUE (epa_id, annee, type_rapport)
    `);
    
    console.log('Contrainte unique ajoutée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la correction des contraintes:', error);
    process.exit(1);
  }
}

fixRapportsConstraint();
