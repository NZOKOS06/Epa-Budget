const bcrypt = require('bcryptjs');
const pool = require('../server/config/database');
require('dotenv').config();

const EPA_DATA = [
  { code: 'EPA001', nom: 'Hopital Central de Brazzaville', secteur: 'Sante' },
  { code: 'EPA002', nom: 'Universite Marien Ngouabi', secteur: 'Education' },
  { code: 'EPA003', nom: 'Office National des Routes', secteur: 'Infrastructure' }
];

const USERS = [
  { email: 'admin@epa-budget.cg', nom: 'Systeme', prenom: 'Admin', roleCode: 'ADMIN' },
  { email: 'dg@epa001.cg', nom: 'Moukoko', prenom: 'Jean', roleCode: 'DG', epaCode: 'EPA001' },
  { email: 'daf@epa001.cg', nom: 'Kouba', prenom: 'Marie', roleCode: 'DAF', epaCode: 'EPA001' },
  { email: 'controleur@epa001.cg', nom: 'Mboumba', prenom: 'Pierre', roleCode: 'CONTROLEUR', epaCode: 'EPA001' },
  { email: 'comptable@epa001.cg', nom: 'Nkouka', prenom: 'Sophie', roleCode: 'COMPTABLE', epaCode: 'EPA001' },
  { email: 'service.rh@epa001.cg', nom: 'Mabiala', prenom: 'Paul', roleCode: 'SERVICE', epaCode: 'EPA001', idDirection: 1 },
  { email: 'service.appro@epa001.cg', nom: 'Tsiba', prenom: 'Rose', roleCode: 'SERVICE', epaCode: 'EPA001', idDirection: 2 },
  { email: 'dg@epa002.cg', nom: 'Oba', prenom: 'Andre', roleCode: 'DG', epaCode: 'EPA002' },
  { email: 'daf@epa002.cg', nom: 'Mouanda', prenom: 'Claire', roleCode: 'DAF', epaCode: 'EPA002' },
  { email: 'comptable@epa002.cg', nom: 'Koussi', prenom: 'Jeanne', roleCode: 'COMPTABLE', epaCode: 'EPA002' },
  { email: 'service.scolarite@epa002.cg', nom: 'Boukaka', prenom: 'Emmanuel', roleCode: 'SERVICE', epaCode: 'EPA002', idDirection: 3 },
  { email: 'dg@epa003.cg', nom: 'Nganga', prenom: 'Victor', roleCode: 'DG', epaCode: 'EPA003' },
  { email: 'daf@epa003.cg', nom: 'Kibangou', prenom: 'Anne', roleCode: 'DAF', epaCode: 'EPA003' },
  { email: 'tutelle@minfin.cg', nom: 'Tutelle', prenom: 'Admin', roleCode: 'TUTELLE' },
  { email: 'ccdb@courcomptes.cg', nom: 'CCDB', prenom: 'Auditeur', roleCode: 'CCDB' }
];

async function getRoleMap(client) {
  const { rows } = await client.query('SELECT id, code FROM roles');
  const map = new Map(rows.map((row) => [row.code, row.id]));
  return map;
}

async function ensureEpaAndGetMap(client) {
  for (const epa of EPA_DATA) {
    await client.query(
      `INSERT INTO epa (code, nom, secteur, statut)
       VALUES ($1, $2, $3, 'actif')
       ON CONFLICT (code) DO UPDATE
       SET nom = EXCLUDED.nom,
           secteur = EXCLUDED.secteur`,
      [epa.code, epa.nom, epa.secteur]
    );
  }

  const { rows } = await client.query('SELECT id, code FROM epa');
  return new Map(rows.map((row) => [row.code, row.id]));
}

async function upsertUser(client, user, roleMap, epaMap, passwordHash) {
  const roleId = roleMap.get(user.roleCode);
  if (!roleId) {
    return { skipped: true, reason: `Role introuvable: ${user.roleCode}` };
  }

  const epaId = user.epaCode ? epaMap.get(user.epaCode) : null;
  if (user.epaCode && !epaId) {
    throw new Error(`EPA introuvable: ${user.epaCode}`);
  }

  await client.query(
    `INSERT INTO utilisateurs (
      nom, prenom, email, mot_de_passe, statut, id_role, id_epa, id_direction
    ) VALUES ($1, $2, $3, $4, 'actif', $5, $6, $7)
    ON CONFLICT (email) DO UPDATE
      SET nom = EXCLUDED.nom,
          prenom = EXCLUDED.prenom,
          mot_de_passe = EXCLUDED.mot_de_passe,
          statut = EXCLUDED.statut,
          id_role = EXCLUDED.id_role,
          id_epa = EXCLUDED.id_epa,
          id_direction = EXCLUDED.id_direction`,
    [
      user.nom,
      user.prenom,
      user.email.toLowerCase(),
      passwordHash,
      roleId,
      epaId || null,
      user.idDirection || null
    ]
  );
  return { skipped: false };
}

async function initUsers() {
  const client = await pool.connect();
  try {
    console.log('Initialisation des utilisateurs...');
    const passwordHash = await bcrypt.hash('password123', 10);

    await client.query('BEGIN');
    const roleMap = await getRoleMap(client);
    const epaMap = await ensureEpaAndGetMap(client);

    let inserted = 0;
    let skipped = 0;
    for (const user of USERS) {
      const result = await upsertUser(client, user, roleMap, epaMap, passwordHash);
      if (result.skipped) {
        skipped += 1;
        console.warn(`Ignore ${user.email}: ${result.reason}`);
      } else {
        inserted += 1;
      }
    }

    await client.query('COMMIT');
    console.log(`Utilisateurs inseres/mis a jour: ${inserted}`);
    if (skipped > 0) {
      console.log(`Utilisateurs ignores (roles manquants): ${skipped}`);
    }
    console.log('Mot de passe de test: password123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur init-users:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

initUsers();
