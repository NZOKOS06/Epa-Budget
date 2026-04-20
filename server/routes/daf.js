const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');
const { changeStatutEngagement } = require('../services/workflow');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.use(authenticate);
router.use(authorize('DAF'));

// ============================================================
// BUDGET-PROGRAMME — Chapitres avec montants agrégés
// ============================================================
router.get('/programmes', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const epa_id = userResult.rows[0].epa_id;

    const result = await pool.query(`
      SELECT 
        cb.id, cb.code, cb.libelle,
        cb.ae_alloue as budget_initial, 
        cb.ae_engage as montant_engage, 
        cb.cp_paye as montant_paye,
        b.annee, b.statut as budget_statut
      FROM chapitres_budgetaires cb
      JOIN budgets b ON cb.id_budget = b.id
      WHERE b.epa_id = $1 AND b.annee = EXTRACT(YEAR FROM CURRENT_DATE)
      ORDER BY cb.code
    `, [epa_id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Récupérer le budget actif de l'année en cours
router.get('/active-budget', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const epa_id = userResult.rows[0].epa_id;

    const result = await pool.query(
      'SELECT * FROM budgets WHERE epa_id = $1 AND annee = EXTRACT(YEAR FROM CURRENT_DATE)',
      [epa_id]
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer un nouveau programme (chapitre budgétaire)
router.post('/programmes', auditLogger('programmes'), async (req, res) => {
  try {
    const { code, libelle, budget_initial } = req.body;
    
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    const epa_id = userResult.rows[0].epa_id;

    // 1. Récupérer ou créer le budget pour l'année en cours
    let budgetResult = await pool.query(
      'SELECT id FROM budgets WHERE epa_id = $1 AND annee = EXTRACT(YEAR FROM CURRENT_DATE)',
      [epa_id]
    );

    let budgetId;
    if (budgetResult.rows.length === 0) {
      // Créer un budget par défaut si absent
      const newBudget = await pool.query(
        `INSERT INTO budgets (annee, montant_previsionnel, statut, epa_id, created_by)
         VALUES (EXTRACT(YEAR FROM CURRENT_DATE), $1, 'actif', $2, $3)
         RETURNING id`,
        [1000000000, epa_id, req.user.id]
      );
      budgetId = newBudget.rows[0].id;
    } else {
      budgetId = budgetResult.rows[0].id;
    }

    // 2. Vérifier si le code existe déjà
    const existingCode = await pool.query(
      'SELECT id FROM chapitres_budgetaires WHERE code = $1',
      [code]
    );
    if (existingCode.rows.length > 0) {
      return res.status(409).json({ message: 'Ce code de programme existe déjà' });
    }

    // 3. Insérer le programme
    const result = await pool.query(
      `INSERT INTO chapitres_budgetaires (code, libelle, ae_alloue, cp_alloue, id_budget)
       VALUES ($1, $2, $3, $3, $4)
       RETURNING *`,
      [code, libelle, budget_initial, budgetId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// DÉTAIL D'UN CHAPITRE — Articles budgétaires
// ============================================================
router.get('/programmes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const chapitreResult = await pool.query(
      `SELECT *, ae_alloue as budget_initial, ae_engage as montant_engage, cp_paye as montant_paye 
       FROM chapitres_budgetaires 
       WHERE id = $1`, 
      [id]
    );
    if (chapitreResult.rows.length === 0) {
      return res.status(404).json({ message: 'Chapitre non trouvé' });
    }

    const articlesResult = await pool.query(`
      SELECT ab.*, ab.ae_disponible as solde_disponible
      FROM articles_budgetaires ab
      WHERE ab.id_chapitre = $1
      ORDER BY ab.code
    `, [id]);

    res.json({
      ...chapitreResult.rows[0],
      articles: articlesResult.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// ARTICLES BUDGÉTAIRES
// ============================================================
router.get('/lignes-budgetaires', async (req, res) => {
  try {
    const { programme_id, annee } = req.query;
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const epa_id = userResult.rows[0].epa_id;

    let query = `
      SELECT ab.*, cb.libelle as chapitre_libelle, cb.code as chapitre_code,
        ab.ae_disponible as ae_restant, ab.cp_disponible as cp_restant
      FROM articles_budgetaires ab
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      JOIN budgets b ON cb.id_budget = b.id
      WHERE b.epa_id = $1
    `;
    const params = [epa_id];

    if (programme_id) {
      params.push(programme_id);
      query += ` AND ab.id_chapitre = $${params.length}`;
    }

    if (annee) {
      params.push(annee);
      query += ` AND b.annee = $${params.length}`;
    } else {
      query += ` AND b.annee = EXTRACT(YEAR FROM CURRENT_DATE)`;
    }

    query += ' ORDER BY ab.code';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer une nouvelle ligne budgétaire (article)
router.post('/lignes-budgetaires', auditLogger('articles'), async (req, res) => {
  try {
    const { code, libelle, ae_initial, cp_initial, id_chapitre, direction_id } = req.body;

    // Vérifier si le code existe déjà
    const existingCode = await pool.query(
      'SELECT id FROM articles_budgetaires WHERE code = $1',
      [code]
    );
    if (existingCode.rows.length > 0) {
      return res.status(409).json({ message: 'Ce code de ligne existe déjà' });
    }

    const result = await pool.query(
      `INSERT INTO articles_budgetaires (code, libelle, ae_initial, cp_initial, id_chapitre, direction_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [code, libelle, ae_initial, cp_initial, id_chapitre, direction_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Modifier une ligne budgétaire (article)
router.put('/lignes-budgetaires/:id', auditLogger('articles'), async (req, res) => {
  try {
    const { id } = req.params;
    const { libelle, ae_initial, cp_initial, direction_id } = req.body;

    const result = await pool.query(
      `UPDATE articles_budgetaires 
       SET libelle = $1, ae_initial = $2, cp_initial = $3, direction_id = $4
       WHERE id = $5
       RETURNING *`,
      [libelle, ae_initial, cp_initial, direction_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ligne budgétaire non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// ENGAGEMENTS — Lister avec nouveaux statuts
// ============================================================
router.get('/engagements', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const epa_id = userResult.rows[0].epa_id;

    const { statut } = req.query;
    let query = `
      SELECT e.*,
        ab.code as article_code, ab.libelle as article_libelle,
        cb.libelle as chapitre_libelle,
        cb.libelle as programme_libelle,
        ab.libelle as ligne_budgetaire_libelle,
        u.nom || ' ' || u.prenom as demandeur_nom,
        u.nom || ' ' || u.prenom as service_nom,
        (
          SELECT wh.created_at
          FROM workflow_history wh
          WHERE wh.engagement_id = e.id AND wh.nouveau_statut = 'soumise_daf'
          ORDER BY wh.created_at DESC
          LIMIT 1
        ) as soumission_daf_date,
        (
          SELECT wh.created_at
          FROM workflow_history wh
          WHERE wh.engagement_id = e.id AND wh.nouveau_statut = 'en_attente_cb'
          ORDER BY wh.created_at DESC
          LIMIT 1
        ) as transmission_controleur_date,
        (
          SELECT COUNT(*)
          FROM pieces_jointes pj
          WHERE pj.engagement_id = e.id
        ) as pieces_count
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      JOIN utilisateurs u ON e.id_demandeur = u.id
      WHERE e.epa_id = $1
    `;
    const params = [epa_id];

    if (statut) {
      query += ' AND e.statut = $2';
      params.push(statut);
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// DÉTAIL D'UN ENGAGEMENT
// ============================================================
router.get('/engagements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const engagementResult = await pool.query(`
      SELECT e.*, 
        ab.code as article_code, ab.libelle as article_libelle,
        cb.libelle as chapitre_libelle,
        cb.libelle as programme_libelle,
        ab.libelle as ligne_budgetaire_libelle,
        u.nom || ' ' || u.prenom as demandeur_nom,
        u.nom || ' ' || u.prenom as service_nom,
        (
          SELECT wh.created_at
          FROM workflow_history wh
          WHERE wh.engagement_id = e.id AND wh.nouveau_statut = 'soumise_daf'
          ORDER BY wh.created_at DESC
          LIMIT 1
        ) as soumission_daf_date,
        (
          SELECT wh.created_at
          FROM workflow_history wh
          WHERE wh.engagement_id = e.id AND wh.nouveau_statut = 'en_attente_cb'
          ORDER BY wh.created_at DESC
          LIMIT 1
        ) as transmission_controleur_date
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      JOIN utilisateurs u ON e.id_demandeur = u.id
      WHERE e.id = $1
    `, [id]);

    if (engagementResult.rows.length === 0) {
      return res.status(404).json({ message: 'Engagement non trouvé' });
    }

    const piecesResult = await pool.query(
      'SELECT * FROM pieces_jointes WHERE engagement_id = $1', [id]
    );

    res.json({
      ...engagementResult.rows[0],
      pieces_jointes: piecesResult.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// PIÈCES JOINTES — Visualisation/Téléchargement
// ============================================================
router.get('/engagements/:id/pieces/:pieceId/view', async (req, res) => {
  try {
    const { id, pieceId } = req.params;
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const epa_id = userResult.rows[0].epa_id;

    const pieceResult = await pool.query(
      `SELECT pj.*
       FROM pieces_jointes pj
       JOIN engagements e ON e.id = pj.engagement_id
       WHERE pj.id = $1 AND pj.engagement_id = $2 AND e.epa_id = $3`,
      [pieceId, id, epa_id]
    );

    if (pieceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pièce jointe non trouvée' });
    }

    const piece = pieceResult.rows[0];
    const absolutePath = path.resolve(piece.chemin_fichier);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Fichier introuvable sur le serveur' });
    }

    const filename = (piece.nom_fichier || '').toLowerCase();
    const contentType = piece.type_fichier
      || (filename.endsWith('.pdf') ? 'application/pdf' : null)
      || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(piece.nom_fichier)}"`);
    return res.sendFile(absolutePath);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/engagements/:id/pieces/:pieceId/download', async (req, res) => {
  try {
    const { id, pieceId } = req.params;
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const epa_id = userResult.rows[0].epa_id;

    const pieceResult = await pool.query(
      `SELECT pj.*
       FROM pieces_jointes pj
       JOIN engagements e ON e.id = pj.engagement_id
       WHERE pj.id = $1 AND pj.engagement_id = $2 AND e.epa_id = $3`,
      [pieceId, id, epa_id]
    );

    if (pieceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pièce jointe non trouvée' });
    }

    const piece = pieceResult.rows[0];
    const absolutePath = path.resolve(piece.chemin_fichier);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Fichier introuvable sur le serveur' });
    }

    return res.download(absolutePath, piece.nom_fichier);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// CRÉER UN BUDGET — RG-18: un seul budget actif par année
// ============================================================
router.post('/budgets', auditLogger('budgets'), async (req, res) => {
  try {
    const { annee, montant_previsionnel } = req.body;
    
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    const epa_id = userResult.rows[0].epa_id;

    // RG-18: Vérifier qu'il n'existe pas déjà un budget pour cette année
    const existingBudget = await pool.query(
      'SELECT id FROM budgets WHERE annee = $1 AND epa_id = $2',
      [annee, epa_id]
    );
    if (existingBudget.rows.length > 0) {
      return res.status(409).json({
        message: `Un budget existe déjà pour l'année ${annee} (RG-18)`
      });
    }

    const result = await pool.query(
      `INSERT INTO budgets (annee, montant_previsionnel, statut, epa_id, created_by)
       VALUES ($1, $2, 'preparation', $3, $4)
       RETURNING *`,
      [annee, montant_previsionnel, epa_id, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// MODIFICATIFS — Virements de crédits (RG-20: tracé dans journal)
// ============================================================
router.get('/modificatifs', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    const epa_id = userResult.rows[0].epa_id;

    const result = await pool.query(`
      SELECT m.*, epa.nom as epa_nom
      FROM modificatifs m
      JOIN epa ON m.epa_id = epa.id
      WHERE m.epa_id = $1
      ORDER BY m.created_at DESC
    `, [epa_id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/modificatifs', auditLogger('modificatifs'), async (req, res) => {
  try {
    const { type, programme_source_id, programme_destination_id, montant, motif } = req.body;
    
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    const epa_id = userResult.rows[0].epa_id;

    const numero = `MOD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-3)}`;

    const result = await pool.query(
      `INSERT INTO modificatifs 
       (epa_id, numero, type_modificatif, programme_source_id, programme_dest_id, montant, motif, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'BROUILLON')
       RETURNING *`,
      [epa_id, numero, type || 'VIREMENT', programme_source_id, programme_destination_id, montant, motif]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// RAPPORTS INTERNES
// ============================================================
router.get('/rapports-internes', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    const epa_id = userResult.rows[0].epa_id;

    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', e.created_at) as mois,
        COUNT(*) as nb_engagements,
        SUM(e.montant) as total_engagements,
        COUNT(*) FILTER (WHERE e.statut = 'liquide') as nb_payes,
        SUM(e.montant) FILTER (WHERE e.statut = 'liquide') as total_payes,
        SUM(e.montant) FILTER (WHERE e.statut IN ('valide', 'liquide')) as total_engage
      FROM engagements e
      WHERE e.epa_id = $1
      GROUP BY DATE_TRUNC('month', e.created_at)
      ORDER BY mois DESC
      LIMIT 12
    `, [epa_id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// ACTIONS SUR LES ENGAGEMENTS — Intégration Workflow
// ============================================================

router.post('/engagements/:id/transmettre', auditLogger('engagements'), async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    
    const result = await changeStatutEngagement(
      parseInt(id),
      'en_attente_cb',
      req.user.id,
      commentaire || 'Transmis au Contrôleur Budgétaire par le DAF'
    );
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/engagements/:id/retourner', auditLogger('engagements'), async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    
    const result = await changeStatutEngagement(
      parseInt(id),
      'brouillon',
      req.user.id,
      commentaire || 'Retourné au service pour complément'
    );
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/engagements/:id/changer-statut', auditLogger('engagements'), async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, commentaire } = req.body;
    
    // Convertir les IDs de colonnes Kanban en statuts BDD
    const statutMap = {
      'brouillon': 'brouillon',
      'soumise-daf': 'soumise_daf',
      'en-visa': 'en_attente_cb',
      'visa-ok': 'en_attente_dg'
    };
    
    const targetStatut = statutMap[statut] || statut.toLowerCase();
    
    const result = await changeStatutEngagement(
      parseInt(id),
      targetStatut,
      req.user.id,
      commentaire
    );
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================================
// MODIFICATIFS — Soumission Tutelle
// ============================================================
router.post('/modificatifs/:id/soumettre', auditLogger('modificatifs'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE modificatifs 
       SET statut = 'EN_ATTENTE', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND epa_id = (SELECT epa_id FROM utilisateurs WHERE id = $2)
       RETURNING *`,
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Modificatif non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// RAPPORTS INTERNES — Génération
// ============================================================
router.post('/rapports-internes/generer', auditLogger('rapports'), async (req, res) => {
  try {
    const { mois, annee } = req.body;
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    const epa_id = userResult.rows[0].epa_id;

    // Simulation de génération (pourrait être une table 'rapports_generes')
    // Pour l'instant on renvoie juste un succès car les données sont dynamiques
    res.status(201).json({ 
      message: 'Rapport généré avec succès',
      periode: `${mois}/${annee}`,
      epa_id 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/rapports-internes/:id/export', async (req, res) => {
  // Dans une vraie implémentation, on générerait un PDF ici
  res.status(501).json({ message: 'Export PDF en cours de développement' });
});

module.exports = router;
