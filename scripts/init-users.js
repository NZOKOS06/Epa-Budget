const bcrypt = require('bcryptjs');
const pool = require('../server/config/database');
require('dotenv').config();

async function getRoleId(code) {
  const { rows } = await pool.query('SELECT id FROM roles WHERE code = $1', [code]);
  if (!rows[0]) {
    throw new Error(`Rôle introuvable pour le code: ${code}`);
  }
  return rows[0].id;
}

async function getOrCreateEpa(code, nom, secteur) {
  const existing = await pool.query('SELECT id FROM epa WHERE code = $1', [code]);
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const insert = await pool.query(
    'INSERT INTO epa (code, nom, secteur) VALUES ($1, $2, $3) RETURNING id',
    [code, nom, secteur]
  );
  return insert.rows[0].id;
}

async function createOrUpdateUser({ email, nom, prenom, roleCode, epaId, passwordHash }) {
  const roleId = await getRoleId(roleCode);

  await pool.query(
    `INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, role_id, epa_id, statut)
     VALUES ($1, $2, $3, $4, $5, $6, 'actif')
     ON CONFLICT (email) DO UPDATE
       SET mot_de_passe = EXCLUDED.mot_de_passe,
           nom = EXCLUDED.nom,
           prenom = EXCLUDED.prenom,
           role_id = EXCLUDED.role_id,
           epa_id = EXCLUDED.epa_id,
           statut = 'actif'`,
    [email, passwordHash, nom, prenom, roleId, epaId]
  );
}

async function initUsers() {
  try {
    console.log('Initialisation des utilisateurs de test...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // S'assurer qu'un EPA principal existe
    const epa001Id = await getOrCreateEpa(
      'EPA001',
      'Hôpital Central de Brazzaville',
      'Santé'
    );

    const users = [
      {
        email: 'dg@epa001.cg',
        nom: 'Moukoko',
        prenom: 'Jean',
        roleCode: 'DG',
        epaId: epa001Id,
      },
      {
        email: 'daf@epa001.cg',
        nom: 'Kouba',
        prenom: 'Marie',
        roleCode: 'DAF',
        epaId: epa001Id,
      },
      {
        email: 'controleur@epa001.cg',
        nom: 'Mboumba',
        prenom: 'Pierre',
        roleCode: 'CONTROLEUR',
        epaId: epa001Id,
      },
      {
        email: 'comptable@epa001.cg',
        nom: 'Nkouka',
        prenom: 'Sophie',
        roleCode: 'COMPTABLE',
        epaId: epa001Id,
      },
      {
        email: 'service@epa001.cg',
        nom: 'Mabiala',
        prenom: 'Paul',
        roleCode: 'SERVICE',
        epaId: epa001Id,
      },
    ];

    for (const user of users) {
      await createOrUpdateUser({ ...user, passwordHash });
    }

    console.log('Utilisateurs créés/mis à jour avec succès.');
    console.log('\nComptes de test disponibles :');
    console.log('- dg@epa001.cg / password123');
    console.log('- daf@epa001.cg / password123');
    console.log('- controleur@epa001.cg / password123');
    console.log('- comptable@epa001.cg / password123');
    console.log('- service@epa001.cg / password123');
    console.log('- tutelle@minfin.cg / password123');
    console.log('- ccdb@courcomptes.cg / password123');

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l’init des utilisateurs :', error);
    process.exit(1);
  }
}

initUsers();
