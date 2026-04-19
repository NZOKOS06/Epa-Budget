require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../server/config/database');

const ANNEES = [2024, 2025];
const NOW = new Date();

// Données réalistes pour le seed
const EPA_DATA = [
  { code: 'EPA001', nom: 'Hôpital Central de Brazzaville', secteur: 'Santé' },
  { code: 'EPA002', nom: 'Université Marien Ngouabi', secteur: 'Education' },
  { code: 'EPA003', nom: 'Office National des Routes', secteur: 'Infrastructure' },
  { code: 'EPA004', nom: 'Centre Hospitalier de Pointe-Noire', secteur: 'Santé' },
  { code: 'EPA005', nom: 'Conservatoire National de Musique', secteur: 'Culture' },
];

const PROGRAMMES_DATA = {
  1: [ // Hôpital
    { code: 'P001', libelle: 'Programme Santé Publique', budget: 500000000 },
    { code: 'P002', libelle: 'Programme Équipements Médicaux', budget: 300000000 },
    { code: 'P003', libelle: 'Programme Formation Médicale', budget: 150000000 },
  ],
  2: [ // Université
    { code: 'P001', libelle: 'Programme Formation', budget: 400000000 },
    { code: 'P002', libelle: 'Programme Recherche', budget: 200000000 },
    { code: 'P003', libelle: 'Programme Infrastructure', budget: 300000000 },
  ],
  3: [ // Routes
    { code: 'P001', libelle: 'Programme Entretien Routes', budget: 600000000 },
    { code: 'P002', libelle: 'Programme Construction Routes', budget: 800000000 },
  ],
  4: [ // Centre Hospitalier
    { code: 'P001', libelle: 'Programme Soins Hospitaliers', budget: 450000000 },
    { code: 'P002', libelle: 'Programme Équipements', budget: 250000000 },
  ],
  5: [ // Conservatoire
    { code: 'P001', libelle: 'Programme Enseignement Musical', budget: 120000000 },
    { code: 'P002', libelle: 'Programme Manifestations Culturelles', budget: 80000000 },
  ],
};

const LIGNES_BUDGETAIRES = [
  { code: '70.01', libelle: 'Fournitures médicales', ratio: 0.4 },
  { code: '70.02', libelle: 'Médicaments', ratio: 0.3 },
  { code: '70.03', libelle: 'Équipements médicaux', ratio: 0.3 },
  { code: '60.01', libelle: 'Subventions', ratio: 0.5 },
  { code: '60.02', libelle: 'Bourses étudiantes', ratio: 0.3 },
  { code: '60.03', libelle: 'Fournitures pédagogiques', ratio: 0.2 },
  { code: '61.01', libelle: 'Travaux de génie civil', ratio: 0.6 },
  { code: '61.02', libelle: 'Matériel de travaux', ratio: 0.4 },
  { code: '62.01', libelle: 'Instruments de musique', ratio: 0.5 },
  { code: '62.02', libelle: 'Frais de spectacles', ratio: 0.5 },
];

const OBJETS_ENGAGEMENTS = {
  1: [
    'Achat de médicaments anti-paludisme',
    'Fourniture de matériel chirurgical',
    'Acquisition d\'équipements de radiologie',
    'Achat de consommables médicaux',
    'Formation du personnel médical',
    'Réparation d\'équipements médicaux',
  ],
  2: [
    'Achat de livres pour bibliothèque',
    'Subvention pour recherche universitaire',
    'Fournitures bureautiques',
    'Réparation d\'infrastructure universitaire',
    'Bourses pour étudiants',
  ],
  3: [
    'Réparation route Brazzaville-Pointe-Noire',
    'Asphaltage route secondaire',
    'Acquisition de matériel de travaux',
    'Entretien ponts et ouvrages d\'art',
  ],
  4: [
    'Achat d\'équipements de laboratoire',
    'Fournitures pharmaceutiques',
    'Réparation bâtiments hospitaliers',
  ],
  5: [
    'Achat d\'instruments de musique',
    'Organisation de concerts',
    'Formation des élèves musiciens',
  ],
};

// Fonctions utilitaires
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function getRoleId(code) {
  const { rows } = await pool.query('SELECT id FROM roles WHERE code = $1', [code]);
  return rows[0].id;
}

async function getOrCreateEpa(epaData) {
  const existing = await pool.query('SELECT id FROM epa WHERE code = $1', [epaData.code]);
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const insert = await pool.query(
    'INSERT INTO epa (code, nom, secteur) VALUES ($1, $2, $3) RETURNING id',
    [epaData.code, epaData.nom, epaData.secteur]
  );
  return insert.rows[0].id;
}

async function createEPA() {
  console.log('🏢 Création des EPA...');
  const epaIds = {};

  for (const epaData of EPA_DATA) {
    const epaId = await getOrCreateEpa(epaData);
    epaIds[epaData.code] = epaId;
  }

  console.log(`✅ ${Object.keys(epaIds).length} EPA créés`);
  return epaIds;
}

async function createUsers(epaIds) {
  console.log('📝 Création des utilisateurs...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const roleIds = {
    DG: await getRoleId('DG'),
    DAF: await getRoleId('DAF'),
    CONTROLEUR: await getRoleId('CONTROLEUR'),
    COMPTABLE: await getRoleId('COMPTABLE'),
    SERVICE: await getRoleId('SERVICE'),
    TUTELLE: await getRoleId('TUTELLE'),
    CCDB: await getRoleId('CCDB'),
  };

  const users = [
    { email: 'dg@epa001.cg', nom: 'Moukoko', prenom: 'Jean', role: 'DG', epaCode: 'EPA001' },
    { email: 'daf@epa001.cg', nom: 'Kouba', prenom: 'Marie', role: 'DAF', epaCode: 'EPA001' },
    { email: 'controleur@epa001.cg', nom: 'Mboumba', prenom: 'Pierre', role: 'CONTROLEUR', epaCode: 'EPA001' },
    { email: 'comptable@epa001.cg', nom: 'Nkouka', prenom: 'Sophie', role: 'COMPTABLE', epaCode: 'EPA001' },
    { email: 'service@epa001.cg', nom: 'Mabiala', prenom: 'Paul', role: 'SERVICE', epaCode: 'EPA001' },
    { email: 'dg@epa002.cg', nom: 'Poaty', prenom: 'Henri', role: 'DG', epaCode: 'EPA002' },
    { email: 'daf@epa002.cg', nom: 'Nguesso', prenom: 'Lucie', role: 'DAF', epaCode: 'EPA002' },
    { email: 'controleur@epa002.cg', nom: 'Tchicaya', prenom: 'Alain', role: 'CONTROLEUR', epaCode: 'EPA002' },
    { email: 'comptable@epa002.cg', nom: 'Itoua', prenom: 'Claire', role: 'COMPTABLE', epaCode: 'EPA002' },
    { email: 'service@epa002.cg', nom: 'Ondongo', prenom: 'David', role: 'SERVICE', epaCode: 'EPA002' },
    { email: 'tutelle@minfin.cg', nom: 'Tutelle', prenom: 'Admin', role: 'TUTELLE', epaCode: null },
    { email: 'ccdb@courcomptes.cg', nom: 'CCDB', prenom: 'Auditeur', role: 'CCDB', epaCode: null },
  ];

  const userIds = {};
  for (const user of users) {
    const epaId = user.epaCode ? epaIds[user.epaCode] : null;
    const result = await pool.query(
      `INSERT INTO utilisateurs (email, password_hash, nom, prenom, role_id, epa_id, actif)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             nom = EXCLUDED.nom,
             prenom = EXCLUDED.prenom,
             role_id = EXCLUDED.role_id,
             epa_id = EXCLUDED.epa_id,
             actif = true
       RETURNING id`,
      [user.email, passwordHash, user.nom, user.prenom, roleIds[user.role], epaId]
    );
    userIds[user.email] = result.rows[0].id;
  }

  console.log(`✅ ${users.length} utilisateurs créés/mis à jour`);
  return userIds;
}

async function createProgrammes(epaIds) {
  console.log('📋 Création des programmes budgétaires...');
  const programmeIds = {};

  let epaIndex = 0;
  for (const epaData of EPA_DATA) {
    epaIndex++;
    const epaId = epaIds[epaData.code];
    const programmes = PROGRAMMES_DATA[epaIndex] || [];

    for (const annee of ANNEES) {
      for (const prog of programmes) {
        const result = await pool.query(
          `INSERT INTO programmes (epa_id, code, libelle, annee, budget_initial)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (epa_id, code, annee) DO UPDATE SET budget_initial = EXCLUDED.budget_initial
           RETURNING id`,
          [epaId, prog.code, prog.libelle, annee, prog.budget]
        );
        programmeIds[`${epaId}-${prog.code}-${annee}`] = result.rows[0].id;
      }
    }
  }

  console.log('✅ Programmes budgétaires créés');
  return programmeIds;
}

async function createLignesBudgetaires(programmeIds) {
  console.log('💰 Création des lignes budgétaires...');
  const ligneIds = [];

  for (const [key, programmeId] of Object.entries(programmeIds)) {
    const [epaId, codeProg, annee] = key.split('-');
    
    // Sélectionner les lignes selon le secteur
    let lignes = [];
    if (epaId === '1' || epaId === '4') { // Santé
      lignes = LIGNES_BUDGETAIRES.filter(l => l.code.startsWith('70'));
    } else if (epaId === '2') { // Education
      lignes = LIGNES_BUDGETAIRES.filter(l => l.code.startsWith('60'));
    } else if (epaId === '3') { // Infrastructure
      lignes = LIGNES_BUDGETAIRES.filter(l => l.code.startsWith('61'));
    } else { // Culture
      lignes = LIGNES_BUDGETAIRES.filter(l => l.code.startsWith('62'));
    }

    // Récupérer le budget du programme
    const progResult = await pool.query('SELECT budget_initial FROM programmes WHERE id = $1', [programmeId]);
    const budgetInitial = parseFloat(progResult.rows[0].budget_initial);

    for (const ligne of lignes.slice(0, randomInt(2, 4))) {
      const montant = Math.round(budgetInitial * ligne.ratio);
      const aeInitial = montant;
      const cpInitial = montant * 0.9; // CP = 90% de l'AE

      const result = await pool.query(
        `INSERT INTO lignes_budgetaires 
         (programme_id, code_nature, libelle, ae_initial, cp_initial, ae_restant, cp_restant, annee)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [programmeId, ligne.code, ligne.libelle, aeInitial, cpInitial, aeInitial, cpInitial, parseInt(annee)]
      );

      ligneIds.push({
        id: result.rows[0].id,
        programmeId,
        aeRestant: aeInitial,
        cpRestant: cpInitial,
      });
    }
  }

  console.log(`✅ ${ligneIds.length} lignes budgétaires créées`);
  return ligneIds;
}

async function createEngagements(userIds, ligneIds) {
  console.log('📄 Création des engagements avec workflow complet...');
  
  const statuts = ['BROUILLON', 'SOUMISE_DAF', 'EN_VISA', 'VISA_OK', 'REGULARITE_OK', 'APPROUVE', 'PAYE'];
  const engagements = [];

  // Créer des engagements à différents stades
  for (let i = 0; i < 50; i++) {
    const ligne = randomItem(ligneIds);
    const programmeResult = await pool.query(
      'SELECT p.epa_id, p.id as programme_id FROM programmes p JOIN lignes_budgetaires lb ON p.id = lb.programme_id WHERE lb.id = $1',
      [ligne.id]
    );
    if (!programmeResult.rows[0]) continue;
    const { epa_id, programme_id } = programmeResult.rows[0];
    
    const statut = randomItem(statuts);
    const montant = randomInt(1000000, 50000000);
    const dateCreation = randomDate(new Date(2024, 0, 1), NOW);
    
    const numero = `ENG-${Date.now()}-${i}`;
    const objet = randomItem(OBJETS_ENGAGEMENTS[epa_id] || OBJETS_ENGAGEMENTS[1]);
    
    // Déterminer les IDs selon le statut et l'EPA
    // Utiliser les utilisateurs de EPA001 ou EPA002 selon disponibilité
    const epaPrefix = epa_id === 2 && userIds['service@epa002.cg'] ? 'epa002' : 'epa001';
    const serviceId = userIds[`service@${epaPrefix}.cg`] || userIds['service@epa001.cg'];
    let dafId = null, controleurId = null, comptableId = null, dgId = null;
    let visaDate = null, regulariteDate = null, approbationDate = null;

    if (['SOUMISE_DAF', 'EN_VISA', 'VISA_OK', 'REGULARITE_OK', 'APPROUVE', 'PAYE'].includes(statut)) {
      dafId = userIds[`daf@${epaPrefix}.cg`] || userIds['daf@epa001.cg'];
    }
    if (['VISA_OK', 'REGULARITE_OK', 'APPROUVE', 'PAYE'].includes(statut)) {
      controleurId = userIds[`controleur@${epaPrefix}.cg`] || userIds['controleur@epa001.cg'];
      visaDate = randomDate(dateCreation, NOW);
    }
    if (['REGULARITE_OK', 'APPROUVE', 'PAYE'].includes(statut)) {
      comptableId = userIds[`comptable@${epaPrefix}.cg`] || userIds['comptable@epa001.cg'];
      regulariteDate = randomDate(visaDate || dateCreation, NOW);
    }
    if (['APPROUVE', 'PAYE'].includes(statut)) {
      dgId = userIds[`dg@${epaPrefix}.cg`] || userIds['dg@epa001.cg'];
      approbationDate = randomDate(regulariteDate || dateCreation, NOW);
    }

    const result = await pool.query(
      `INSERT INTO engagements 
       (numero, epa_id, programme_id, ligne_budgetaire_id, service_id, daf_id,
        montant, objet, statut, visa_controleur, visa_controleur_id, visa_controleur_date,
        regularite_comptable, regularite_comptable_id, regularite_comptable_date,
        approbation_dg, approbation_dg_id, approbation_dg_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING id`,
      [
        numero, epa_id, programme_id, ligne.id, serviceId, dafId,
        montant, objet, statut,
        statut >= 'VISA_OK', controleurId, visaDate,
        statut >= 'REGULARITE_OK', comptableId, regulariteDate,
        statut >= 'APPROUVE', dgId, approbationDate,
        dateCreation, dateCreation
      ]
    );

    const engagementId = result.rows[0].id;
    engagements.push({ id: engagementId, statut, montant, epa_id, programme_id, ligne_id: ligne.id });

    // Créer l'historique workflow
    const workflowStates = [
      { statut: 'BROUILLON', acteurId: serviceId, date: dateCreation },
    ];

    if (statut !== 'BROUILLON') {
      workflowStates.push({ statut: 'SOUMISE_DAF', acteurId: serviceId, date: randomDate(dateCreation, NOW) });
    }
    if (['EN_VISA', 'VISA_OK', 'REGULARITE_OK', 'APPROUVE', 'PAYE'].includes(statut)) {
      workflowStates.push({ statut: 'EN_VISA', acteurId: dafId, date: randomDate(dateCreation, NOW) });
    }
    if (['VISA_OK', 'REGULARITE_OK', 'APPROUVE', 'PAYE'].includes(statut)) {
      workflowStates.push({ statut: 'VISA_OK', acteurId: controleurId, date: visaDate });
    }
    if (['REGULARITE_OK', 'APPROUVE', 'PAYE'].includes(statut)) {
      workflowStates.push({ statut: 'REGULARITE_OK', acteurId: comptableId, date: regulariteDate });
    }
    if (['APPROUVE', 'PAYE'].includes(statut)) {
      workflowStates.push({ statut: 'APPROUVE', acteurId: dgId, date: approbationDate });
    }

    for (let j = 0; j < workflowStates.length - 1; j++) {
      await pool.query(
        `INSERT INTO workflow_history (engagement_id, ancien_statut, nouveau_statut, acteur_id, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          engagementId,
          workflowStates[j].statut,
          workflowStates[j + 1].statut,
          workflowStates[j + 1].acteurId,
          workflowStates[j + 1].date
        ]
      );
    }

    // Créer des paiements pour les engagements PAYE
    if (statut === 'PAYE') {
      const datePaiement = randomDate(approbationDate, NOW);
      await pool.query(
        `INSERT INTO paiements (engagement_id, numero_ordre, montant, date_paiement, statut)
         VALUES ($1, $2, $3, $4, 'PAYE')`,
        [engagementId, `ORD-${Date.now()}-${i}`, montant, datePaiement]
      );
    }

    // Mettre à jour les lignes budgétaires pour les engagements approuvés
    if (statut >= 'APPROUVE') {
      await pool.query(
        `UPDATE lignes_budgetaires 
         SET ae_restant = ae_restant - $1, cp_restant = cp_restant - $1
         WHERE id = $2`,
        [montant, ligne.id]
      );
    }
  }

  console.log(`✅ ${engagements.length} engagements créés avec workflow complet`);
  return engagements;
}

async function createModificatifs() {
  console.log('🔄 Création des modificatifs...');
  
  const programmes = await pool.query('SELECT id, epa_id FROM programmes WHERE annee = 2025 LIMIT 10');
  const modificatifs = [];

  for (const prog of programmes.rows.slice(0, 5)) {
    const type = randomItem(['VIREMENT', 'ANNULATION', 'AUGMENTATION']);
    const montant = randomInt(5000000, 50000000);
    
    let programmeSourceId = null;
    let programmeDestId = null;

    if (type === 'VIREMENT') {
      programmeSourceId = prog.id;
      const autresProgs = await pool.query('SELECT id FROM programmes WHERE epa_id = $1 AND id != $2 LIMIT 1', [prog.epa_id, prog.id]);
      programmeDestId = autresProgs.rows[0]?.id || prog.id;
    }

    const result = await pool.query(
      `INSERT INTO modificatifs 
       (epa_id, numero, type_modificatif, programme_source_id, programme_dest_id, montant, motif, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        prog.epa_id,
        `MOD-${Date.now()}-${modificatifs.length}`,
        type,
        programmeSourceId,
        programmeDestId,
        montant,
        `Modificatif ${type.toLowerCase()} pour ajustement budgétaire`,
        randomItem(['BROUILLON', 'APPROUVE'])
      ]
    );

    modificatifs.push(result.rows[0].id);
  }

  console.log(`✅ ${modificatifs.length} modificatifs créés`);
}

async function createRecettes() {
  console.log('💵 Création des recettes...');
  
  const epas = await pool.query('SELECT id FROM epa');
  const recettes = [];

  for (const epa of epas.rows) {
    for (let i = 0; i < randomInt(5, 15); i++) {
      const montant = randomInt(10000000, 100000000);
      const dateRecette = randomDate(new Date(2024, 0, 1), NOW);

      const result = await pool.query(
        `INSERT INTO recettes (epa_id, numero, nature_recette, montant, date_recette, statut)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          epa.id,
          `REC-${Date.now()}-${i}`,
          randomItem(['Subvention État', 'Recettes propres', 'Dons', 'Partenariats']),
          montant,
          dateRecette,
          'ENREGISTRE'
        ]
      );

      recettes.push(result.rows[0].id);
    }
  }

  console.log(`✅ ${recettes.length} recettes créées`);
}

async function createAlertes(userIds) {
  console.log('⚠️  Création des alertes...');
  
  const engagements = await pool.query(`
    SELECT e.*, lb.ae_restant, lb.cp_restant 
    FROM engagements e
    JOIN lignes_budgetaires lb ON e.ligne_budgetaire_id = lb.id
    WHERE e.statut IN ('EN_VISA', 'VISA_OK')
    LIMIT 10
  `);

  for (const eng of engagements.rows) {
    if (eng.montant > eng.ae_restant || eng.montant > eng.cp_restant) {
      await pool.query(
        `INSERT INTO alertes (epa_id, type, titre, message, niveau, destine_a)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          eng.epa_id,
          'DERIVE_BUDGET',
          'Dépassement budgétaire',
          `Engagement ${eng.numero} dépasse les crédits disponibles`,
          'CRITICAL',
          'CONTROLEUR'
        ]
      );
    }
  }

  console.log('✅ Alertes créées');
}

async function createRapports() {
  console.log('📊 Création des rapports...');
  
  const epas = await pool.query('SELECT id FROM epa');
  
  for (const epa of epas.rows) {
    for (const annee of ANNEES) {
      await pool.query(
        `INSERT INTO rapports (epa_id, type_rapport, periode, annee, statut)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [
          epa.id,
          'RAP_TRIMESTRIEL',
          `T${randomInt(1, 4)}`,
          annee,
          randomItem(['BROUILLON', 'VALIDE'])
        ]
      );
    }
  }

  console.log('✅ Rapports créés');
}

async function seed() {
  try {
    console.log('🌱 Démarrage du seed complet...\n');

    const epaIds = await createEPA();
    const userIds = await createUsers(epaIds);
    const programmeIds = await createProgrammes(epaIds);
    const ligneIds = await createLignesBudgetaires(programmeIds);
    await createEngagements(userIds, ligneIds);
    await createModificatifs();
    await createRecettes();
    await createAlertes(userIds);
    await createRapports();

    console.log('\n✅ Seed complet terminé avec succès!');
    console.log('\n📝 Comptes de test disponibles:');
    console.log('  - dg@epa001.cg / password123');
    console.log('  - daf@epa001.cg / password123');
    console.log('  - controleur@epa001.cg / password123');
    console.log('  - comptable@epa001.cg / password123');
    console.log('  - service@epa001.cg / password123');
    console.log('  - tutelle@minfin.cg / password123');
    console.log('  - ccdb@courcomptes.cg / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

seed();

