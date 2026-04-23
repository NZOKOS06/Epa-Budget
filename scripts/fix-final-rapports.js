const pool = require('../server/config/database');

async function fixFinalRapports() {
  try {
    console.log('Correction finale de la table rapports...');
    
    // Vérifier la structure actuelle
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'rapports' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('Colonnes actuelles:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    // Ajouter la colonne type si elle n'existe pas
    const hasTypeColumn = columnsResult.rows.some(col => col.column_name === 'type');
    if (!hasTypeColumn) {
      await pool.query(`ALTER TABLE rapports ADD COLUMN type VARCHAR(50)`);
      console.log('Colonne "type" ajoutée');
    }
    
    // Mettre à jour les valeurs NULL avec des valeurs par défaut
    await pool.query(`
      UPDATE rapports 
      SET type = COALESCE(type_rapport, 'COMPTES_ADMINISTRATIFS')
      WHERE type IS NULL
    `);
    
    // Rendre la colonne NOT NULL
    await pool.query(`ALTER TABLE rapports ALTER COLUMN type SET NOT NULL`);
    
    console.log('Table rapports corrigée définitivement!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la correction finale:', error);
    process.exit(1);
  }
}

fixFinalRapports();
