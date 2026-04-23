const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');

const router = express.Router();

router.use(authenticate);
router.use(authorize('COMPTABLE'));

// ============================================================
// RECETTES — Lister (RG-09: Seul l'Agent Comptable)
// ============================================================
router.get('/recettes', async (req, res) => {
  try {
    const { annee } = req.query;
    let query = `
      SELECT r.*, b.annee as budget_annee
      FROM recettes r
      JOIN budgets b ON r.id_budget = b.id
      WHERE r.epa_id = $1 AND r.est_annulee = false
    `;
    const params = [req.user.epa_id];

    if (annee) {
      query += ' AND EXTRACT(YEAR FROM r.date_encaissement) = $2';
      params.push(annee);
    }

    query += ' ORDER BY r.date_encaissement DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// ENREGISTRER UNE RECETTE — RG-08, RG-09, RG-10
// ============================================================
router.post('/recettes', auditLogger('recettes'), async (req, res) => {
  try {
    const { numero_quittance, montant, date_encaissement, source, reference_titre } = req.body;

    // Validation des champs obligatoires
    if (!numero_quittance || !montant || !date_encaissement || !source || !reference_titre) {
      return res.status(400).json({
        message: 'Tous les champs sont obligatoires: numero_quittance, montant, date_encaissement, source, reference_titre'
      });
    }

    // Vérifier le type de source
    const sourcesValides = ['permis_conduire', 'carte_grise', 'licence_transport', 'agrement_auto_ecole'];
    if (!sourcesValides.includes(source)) {
      return res.status(400).json({
        message: `Source invalide. Valeurs acceptées: ${sourcesValides.join(', ')}`
      });
    }

    // RG-08: Vérifier l'unicité du numéro de quittance
    const existingQuittance = await pool.query(
      'SELECT id FROM recettes WHERE numero_quittance = $1',
      [numero_quittance]
    );
    if (existingQuittance.rows.length > 0) {
      return res.status(409).json({
        message: `Le numéro de quittance "${numero_quittance}" existe déjà. Chaque quittance doit être unique (RG-08)`
      });
    }

    // Récupérer le budget actif pour cet EPA
    const budgetResult = await pool.query(
      `SELECT id FROM budgets WHERE epa_id = $1 AND statut = 'actif' LIMIT 1`,
      [req.user.epa_id]
    );
    if (budgetResult.rows.length === 0) {
      return res.status(400).json({
        message: 'Aucun budget actif trouvé pour cet EPA. La recette ne peut pas être enregistrée.'
      });
    }

    const result = await pool.query(
      `INSERT INTO recettes 
       (montant, date_encaissement, source, numero_quittance, reference_titre, id_budget, id_agent_comptable, epa_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [montant, date_encaissement, source, numero_quittance, reference_titre, 
       budgetResult.rows[0].id, req.user.id, req.user.epa_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    // RG-08: Attraper l'erreur UNIQUE VIOLATION au niveau PostgreSQL
    if (error.code === '23505' && error.constraint?.includes('quittance')) {
      return res.status(409).json({
        message: 'Ce numéro de quittance est déjà utilisé (RG-08)'
      });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// CONTRE-PASSATION D'UNE RECETTE — RG-10 (jamais modification directe)
// ============================================================
router.post('/recettes/:id/contre-passation', auditLogger('recettes'), async (req, res) => {
  try {
    const { id } = req.params;
    const { motif } = req.body;

    if (!motif || motif.trim() === '') {
      return res.status(400).json({ message: 'Le motif de la contre-passation est obligatoire' });
    }

    // Récupérer la recette originale
    const recetteResult = await pool.query('SELECT * FROM recettes WHERE id = $1', [id]);
    if (recetteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Recette non trouvée' });
    }

    const recette = recetteResult.rows[0];
    if (recette.est_annulee) {
      return res.status(400).json({ message: 'Cette recette est déjà annulée' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Marquer la recette originale comme annulée
      await client.query(
        'UPDATE recettes SET est_annulee = true WHERE id = $1',
        [id]
      );

      // Créer l'écriture de contre-passation (montant négatif logique)
      const nouveauNumero = `CP-${recette.numero_quittance}-${Date.now()}`;
      await client.query(
        `INSERT INTO recettes 
         (montant, date_encaissement, source, numero_quittance, reference_titre, 
          id_budget, id_agent_comptable, epa_id, est_annulee, id_contre_passation)
         VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, true, $8)`,
        [
          -recette.montant, // Montant négatif pour contre-passer
          recette.source,
          nouveauNumero,
          `Contre-passation: ${motif}`,
          recette.id_budget,
          req.user.id,
          req.user.epa_id,
          id
        ]
      );

      // Journal d'audit
      await client.query(
        `INSERT INTO journal_audit (action, ressource, ressource_id, ancienne_valeur, nouvelle_valeur, ip_adresse, id_utilisateur)
         VALUES ('update', 'recettes', $1, $2, $3, $4, $5)`,
        [
          id.toString(),
          JSON.stringify({ est_annulee: false }),
          JSON.stringify({ est_annulee: true, motif }),
          req.ip || '0.0.0.0',
          req.user.id
        ]
      );

      await client.query('COMMIT');

      res.json({ success: true, message: 'Contre-passation enregistrée' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// LIQUIDATIONS EN ATTENTE DE VALIDATION
// ============================================================
router.get('/liquidations-en-attente', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, 
        e.numero as engagement_numero,
        e.objet as engagement_objet,
        e.montant as engagement_montant,
        u.nom || ' ' || u.prenom as demandeur_nom
      FROM liquidations l
      JOIN engagements e ON l.id_engagement = e.id
      JOIN utilisateurs u ON e.id_demandeur = u.id
      WHERE l.statut = 'en_attente'
        AND e.epa_id = $1
      ORDER BY l.created_at ASC
    `, [req.user.epa_id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// CLÔTURE
// ============================================================
router.get('/cloture', async (req, res) => {
  try {
    const { annee } = req.query;
    const anneeCloture = annee || new Date().getFullYear();

    const result = await pool.query(`
      SELECT 
        cb.code as chapitre_code,
        cb.libelle as chapitre_libelle,
        cb.ae_alloue as montant_alloue,
        cb.cp_alloue,
        cb.ae_engage as montant_engage,
        cb.cp_paye as montant_paye,
        b.annee,
        b.statut as budget_statut
      FROM chapitres_budgetaires cb
      JOIN budgets b ON cb.id_budget = b.id
      WHERE b.epa_id = $1 AND b.annee = $2
      ORDER BY cb.code
    `, [req.user.epa_id, anneeCloture]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// ÉTAPES DE CLÔTURE
// ============================================================
router.get('/cloture/etapes', async (req, res) => {
  try {
    const { annee } = req.query;
    const anneeCloture = annee || new Date().getFullYear();

    // Vérifier s'il existe déjà des étapes pour cette année
    const existingEtapes = await pool.query(`
      SELECT * FROM workflow_cloture 
      WHERE epa_id = $1 AND annee = $2
      ORDER BY id
    `, [req.user.epa_id, anneeCloture]);

    if (existingEtapes.rows.length > 0) {
      res.json(existingEtapes.rows);
    } else {
      // Étapes par défaut
      const etapesDefaut = [
        { id: 1, nom: 'Génération Comptes Administratifs', statut: 'EN_ATTENTE', date: null },
        { id: 2, nom: 'Génération Comptes Financiers', statut: 'EN_ATTENTE', date: null },
        { id: 3, nom: 'Certification e-signature', statut: 'EN_ATTENTE', date: null },
        { id: 4, nom: 'Soumission CCDB', statut: 'EN_ATTENTE', date: null }
      ];
      res.json(etapesDefaut);
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// GÉNÉRER COMPTES DE CLÔTURE
// ============================================================
router.post('/cloture/generer', auditLogger('generation_comptes'), async (req, res) => {
  try {
    const { annee } = req.body;
    const anneeCloture = annee || new Date().getFullYear();

    // Mettre à jour les étapes
    await pool.query(`
      UPDATE workflow_cloture 
      SET statut = 'TERMINE', date = CURRENT_TIMESTAMP
      WHERE epa_id = $1 AND annee = $2 AND id IN (1, 2)
    `, [req.user.epa_id, anneeCloture]);

    // Marquer l'étape suivante en cours
    await pool.query(`
      UPDATE workflow_cloture 
      SET statut = 'EN_COURS'
      WHERE epa_id = $1 AND annee = $2 AND id = 3
    `, [req.user.epa_id, anneeCloture]);

    // Créer les rapports de comptes
    try {
      await pool.query(`
        INSERT INTO rapports (epa_id, type, type_rapport, annee, statut, created_at, updated_at)
        VALUES 
          ($1, 'COMPTES_ADMINISTRATIFS', 'COMPTES_ADMINISTRATIFS', $2, 'GENERE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ($1, 'COMPTES_FINANCIERS', 'COMPTES_FINANCIERS', $2, 'GENERE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [req.user.epa_id, anneeCloture]);
    } catch (error) {
      // Ignorer l'erreur si les rapports existent déjà
      if (!error.message.includes('duplicate key')) {
        throw error;
      }
    }

    res.json({ message: 'Comptes générés avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// CONTRÔLE DE RÉGULARITÉ
// ============================================================
router.get('/controle-regularite', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        ab.code as article_code,
        ab.libelle as article_libelle,
        cb.libelle as programme_libelle,
        u.nom || ' ' || u.prenom as demandeur_nom,
        ac.type_avis,
        ac.commentaire as avis_commentaire
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      JOIN utilisateurs u ON e.id_demandeur = u.id
      LEFT JOIN avis_controle ac ON ac.id_engagement = e.id AND ac.type_avis = 'favorable'
      WHERE e.statut = 'valide'
        AND e.epa_id = $1
        AND e.updated_at >= DATE_TRUNC('year', CURRENT_DATE)
      ORDER BY e.updated_at DESC
      LIMIT 100
    `, [req.user.epa_id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// CERTIFIER COMPTES
// ============================================================
router.post('/cloture/certifier', auditLogger('certification_comptes'), async (req, res) => {
  try {
    const { annee } = req.body;
    const anneeCloture = annee || new Date().getFullYear();

    // Mettre à jour l'étape de certification
    await pool.query(`
      UPDATE workflow_cloture 
      SET statut = 'TERMINE', date = CURRENT_TIMESTAMP
      WHERE epa_id = $1 AND annee = $2 AND id = 3
    `, [req.user.epa_id, anneeCloture]);

    // Marquer l'étape suivante en attente
    await pool.query(`
      UPDATE workflow_cloture 
      SET statut = 'EN_ATTENTE'
      WHERE epa_id = $1 AND annee = $2 AND id = 4
    `, [req.user.epa_id, anneeCloture]);

    // Mettre à jour les rapports comme certifiés
    await pool.query(`
      UPDATE rapports 
      SET statut = 'CERTIFIE', date_certification = CURRENT_TIMESTAMP
      WHERE epa_id = $1 AND annee = $2 
        AND type_rapport IN ('COMPTES_ADMINISTRATIFS', 'COMPTES_FINANCIERS')
    `, [req.user.epa_id, anneeCloture]);

    res.json({ message: 'Comptes certifiés avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// SOUMETTRE À LA CCDB
// ============================================================
router.post('/cloture/soumettre', auditLogger('soumission_ccdb'), async (req, res) => {
  try {
    const { annee } = req.body;
    const anneeCloture = annee || new Date().getFullYear();

    // Mettre à jour l'étape de soumission
    await pool.query(`
      UPDATE workflow_cloture 
      SET statut = 'TERMINE', date = CURRENT_TIMESTAMP
      WHERE epa_id = $1 AND annee = $2 AND id = 4
    `, [req.user.epa_id, anneeCloture]);

    // Mettre à jour les rapports comme soumis
    await pool.query(`
      UPDATE rapports 
      SET statut = 'SOUMIS_CCDB', date_soumission_ccdb = CURRENT_TIMESTAMP
      WHERE epa_id = $1 AND annee = $2 
        AND type_rapport IN ('COMPTES_ADMINISTRATIFS', 'COMPTES_FINANCIERS')
    `, [req.user.epa_id, anneeCloture]);

    res.json({ message: 'Comptes soumis à la CCDB avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// TRÉSORERIE
// ============================================================
router.get('/tresorerie', async (req, res) => {
  try {
    // 1. Recettes des 12 derniers mois
    const recettesResult = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', r.date_encaissement), 'Mon') as mois,
        SUM(r.montant) FILTER (WHERE r.est_annulee = false) as encaissements
      FROM recettes r
      WHERE r.epa_id = $1
      GROUP BY DATE_TRUNC('month', r.date_encaissement)
      ORDER BY DATE_TRUNC('month', r.date_encaissement) DESC
      LIMIT 12
    `, [req.user.epa_id]);

    // 2. Décaissements des 12 derniers mois (basé sur les paiements)
    const paiementsResult = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', p.date_paiement), 'Mon') as mois,
        SUM(p.montant) as decaissements
      FROM paiements p
      JOIN liquidations l ON p.id_liquidation = l.id
      JOIN engagements e ON l.id_engagement = e.id
      WHERE e.epa_id = $1
      GROUP BY DATE_TRUNC('month', p.date_paiement)
      ORDER BY DATE_TRUNC('month', p.date_paiement) DESC
      LIMIT 12
    `, [req.user.epa_id]);

    // Fusionner pour le plan de flux
    const planFluxMap = {};
    recettesResult.rows.forEach(r => {
      planFluxMap[r.mois] = { mois: r.mois, encaissements: parseFloat(r.encaissements || 0), decaissements: 0 };
    });
    paiementsResult.rows.forEach(p => {
      if (!planFluxMap[p.mois]) {
        planFluxMap[p.mois] = { mois: p.mois, encaissements: 0, decaissements: parseFloat(p.decaissements || 0) };
      } else {
        planFluxMap[p.mois].decaissements = parseFloat(p.decaissements || 0);
      }
    });
    const planFlux = Object.values(planFluxMap).reverse();

    // 3. Engagements en attente de paiement (Liquidations validées non payées)
    const engagementsResult = await pool.query(`
      SELECT SUM(l.montant_liquide) as total_engagements
      FROM liquidations l
      JOIN engagements e ON l.id_engagement = e.id
      WHERE l.statut = 'validee' AND e.epa_id = $1
    `, [req.user.epa_id]);
    
    // 4. Soldes fictifs pour la démo (le Trésor n'a pas de compte bancaire géré ici, mais on simule)
    const soldes = [
      { compte: 'Compte Trésor Principal', solde: 500000000 },
      { compte: 'Caisse Régie', solde: 15000000 }
    ];

    res.json({
      soldes,
      planFlux,
      engagements: parseFloat(engagementsResult.rows[0]?.total_engagements || 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// COMPTES ANNUELS
// ============================================================
router.get('/comptes-annuels', async (req, res) => {
  try {
    const { annee } = req.query;
    const anneeCompte = annee || new Date().getFullYear();

    const result = await pool.query(`
      SELECT r.*, epa.nom as epa_nom
      FROM rapports r
      JOIN epa ON r.epa_id = epa.id
      WHERE r.type_rapport = 'COMPTES_ANNUELS' 
        AND r.annee = $1
        AND r.epa_id = $2
      ORDER BY r.created_at DESC
    `, [anneeCompte, req.user.epa_id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// EXPORT COMPTES ANNUELS FORMAT CCDB
// ============================================================
router.get('/comptes-annuels/export-ccdb', async (req, res) => {
  try {
    const { annee } = req.query;
    const anneeCompte = annee || new Date().getFullYear();

    // Récupérer les données pour l'export
    const result = await pool.query(`
      SELECT 
        r.*,
        epa.nom as epa_nom,
        cb.ae_alloue,
        cb.cp_alloue,
        cb.cp_paye
      FROM rapports r
      JOIN epa ON r.epa_id = epa.id
      LEFT JOIN chapitres_budgetaires cb ON cb.id_budget = (
        SELECT id FROM budgets WHERE epa_id = r.epa_id AND annee = r.annee LIMIT 1
      )
      WHERE r.type_rapport IN ('COMPTES_ADMINISTRATIFS', 'COMPTES_FINANCIERS') 
        AND r.annee = $1
        AND r.epa_id = $2
      ORDER BY r.type_rapport
    `, [anneeCompte, req.user.epa_id]);

    // Pour l'instant, retourner un JSON simple
    // TODO: Implémenter la génération Excel avec une librairie comme xlsx
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="comptes_annuels_${anneeCompte}_ccdb.json"`);
    res.json({
      annee: anneeCompte,
      epa: result.rows[0]?.epa_nom || 'EPA',
      date_export: new Date().toISOString(),
      comptes: result.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// TÉLÉCHARGER UN COMPTE ANNUEL SPÉCIFIQUE
// ============================================================
router.get('/comptes-annuels/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer les informations du rapport
    const rapportResult = await pool.query(`
      SELECT r.*, epa.nom as epa_nom
      FROM rapports r
      JOIN epa ON r.epa_id = epa.id
      WHERE r.id = $1 AND r.epa_id = $2
    `, [id, req.user.epa_id]);

    if (rapportResult.rows.length === 0) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }

    const rapport = rapportResult.rows[0];

    // Pour l'instant, générer un PDF simple
    // TODO: Implémenter la génération PDF avec une librairie comme puppeteer
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${rapport.type_rapport}_${rapport.annee}.pdf"`);
    
    // Contenu PDF de base (placeholder)
    const pdfContent = `
      Rapport: ${rapport.type_rapport}
      EPA: ${rapport.epa_nom}
      Année: ${rapport.annee}
      Statut: ${rapport.statut}
      Date de création: ${rapport.created_at}
      ${rapport.date_certification ? `Date de certification: ${rapport.date_certification}` : ''}
    `;

    res.send(pdfContent);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
