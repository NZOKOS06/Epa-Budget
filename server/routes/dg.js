const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');
const { changeStatutEngagement } = require('../services/workflow');

const router = express.Router();

// Toutes les routes nécessitent authentification et rôle DG
router.use(authenticate);
router.use(authorize('DG'));

// ============================================================
// DASHBOARD EXÉCUTIF
// ============================================================
router.get('/dashboard', async (req, res) => {
  try {
    // Engagements en attente d'approbation DG (statut: en_attente_dg)
    const engagementsResult = await pool.query(`
      SELECT e.*, 
        ab.code as article_code, ab.libelle as article_libelle,
        u.nom || ' ' || u.prenom as demandeur_nom,
        ac.type_avis, ac.commentaire as avis_commentaire
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN utilisateurs u ON e.id_demandeur = u.id
      LEFT JOIN avis_controle ac ON ac.id_engagement = e.id AND ac.type_avis = 'favorable'
      WHERE e.statut = 'en_attente_dg'
      ORDER BY e.created_at ASC
      LIMIT 20
    `);

    // Statistiques globales
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE statut = 'en_attente_dg') as en_attente_approbation,
        COUNT(*) FILTER (WHERE statut = 'valide') as valides_total,
        SUM(montant) FILTER (WHERE statut = 'valide') as montant_valide_total,
        COUNT(*) FILTER (WHERE statut = 'rejete') as rejetes_total
      FROM engagements
      WHERE epa_id = (SELECT epa_id FROM utilisateurs WHERE id = $1)
    `, [req.user.id]);

    // Alertes
    const alertesResult = await pool.query(
      `SELECT * FROM alertes 
       WHERE destine_a = 'DG' AND lue = false 
       ORDER BY created_at DESC LIMIT 5`
    );

    res.json({
      engagements: engagementsResult.rows,
      statistiques: statsResult.rows[0],
      alertes: alertesResult.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// APPROUVER UN ENGAGEMENT (RG-03: dernière étape du circuit)
// RG-05: La déduction du solde s'effectue ici (dans workflow.js)
// ============================================================
router.post('/engagements/:id/approver', auditLogger('engagements'), async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;

    const result = await changeStatutEngagement(
      parseInt(id),
      'valide',
      req.user.id,
      commentaire || 'Approuvé par le Directeur Général'
    );

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================================
// REJETER UN ENGAGEMENT — RG-07: Motif obligatoire
// ============================================================
router.post('/engagements/:id/refuser', auditLogger('engagements'), async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;

    // RG-07: Le motif de rejet est obligatoire
    if (!commentaire || commentaire.trim() === '') {
      return res.status(400).json({
        message: 'Le motif de rejet est obligatoire (RG-07)'
      });
    }

    const result = await changeStatutEngagement(
      parseInt(id),
      'rejete',
      req.user.id,
      commentaire
    );

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================================
// APPROUVER EN BATCH
// ============================================================
router.post('/engagements/batch-approver', auditLogger('engagements'), async (req, res) => {
  try {
    const { engagementIds, commentaire } = req.body;
    const results = [];

    for (const id of engagementIds) {
      try {
        const result = await changeStatutEngagement(
          parseInt(id),
          'valide',
          req.user.id,
          commentaire || 'Approuvé en batch par le DG'
        );
        results.push({ id, success: true, ...result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// SESSIONS D'APPROBATION
// ============================================================
router.get('/sessions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', updated_at) as mois,
        COUNT(*) as nb_engagements,
        SUM(montant) as total_montant
      FROM engagements
      WHERE statut = 'valide' 
        AND id_validateur_dg IS NOT NULL
        AND epa_id = (SELECT epa_id FROM utilisateurs WHERE id = $1)
      GROUP BY DATE_TRUNC('month', updated_at)
      ORDER BY mois DESC
      LIMIT 12
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// RAPPORTS TUTELLE
// ============================================================
router.get('/rapports-tutelle', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, epa.nom as epa_nom
      FROM rapports r
      JOIN epa ON r.epa_id = epa.id
      WHERE r.type_rapport IN ('RAP_TRIMESTRIEL', 'COMPTES_ANNUELS')
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
