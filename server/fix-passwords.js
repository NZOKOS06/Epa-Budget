const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function fixPasswords() {
  try {
    // Générer le hash pour "password123"
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Hash généré pour password123:', hash);
    
    // Vérifier que le hash fonctionne
    const isValid = await bcrypt.compare(password, hash);
    console.log('Vérification du hash:', isValid);
    
    // Mettre à jour tous les utilisateurs (sauf admin)
    const result = await pool.query(
      `UPDATE utilisateurs 
       SET mot_de_passe = $1 
       WHERE email != 'admin@epa-budget.cg'
       RETURNING email`,
      [hash]
    );
    
    console.log('Mots de passe mis à jour pour:', result.rows.map(r => r.email));
    
    // Vérifier un utilisateur
    const user = await pool.query(
      'SELECT email, mot_de_passe FROM utilisateurs WHERE email = $1',
      ['dg@epa001.cg']
    );
    
    if (user.rows.length > 0) {
      const verify = await bcrypt.compare(password, user.rows[0].mot_de_passe);
      console.log('Vérification pour dg@epa001.cg:', verify);
    }
    
    console.log('\n=== MOTS DE PASSE CORRIGÉS ===');
    console.log('Tous les comptes de test : password123');
    console.log('Compte admin : Admin2026!');
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    pool.end();
  }
}

fixPasswords();
