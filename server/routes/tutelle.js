const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');

const router = express.Router();

router.use(authenticate);
router.use(authorize('TUTELLE'));

// ============================================================
// CONSOLIDATION MULTI-EPA
// ============================================================
router.get('/consolidation', async (req, res) => {
  try {
    const { secteur } = req.query;
    let query = `
      SELECT 
        epa.id, epa.code, epa.nom, epa.secteur,
        COALESCE(SUM(cb.montant_alloue), 0) as budget_total,
        COALESCE(SUM(cb.montant_engage), 0) as engage_total,
        COALESCE(SUM(cb.montant_paye), 0) as paye_total,
        COUNT(DISTINCT e.id) FILTER (WHERE e.statut = 'valide') as nb_engagements_valides,
        COUNT(DISTINCT e.id) FILTER (WHERE e.statut = 'rejete') as nb_engagements_rejetes
      FROM epa
      LEFT JOIN budgets b ON b.epa_id = epa.id AND b.statut = 'actif'
      LEFT JOIN chapitres_budgetaires cb ON cb.id_budget = b.id
      LEFT JOIN articles_budgetaires ab ON ab.id_chapitre = cb.id
      LEFT JOIN engagements e ON e.id_article_budgetaire = ab.id
    `;
    const params = [];

    if (secteur) {
      query += ' WHERE epa.secteur = $1';
      params.push(secteur);
    }

    query += ' GROUP BY epa.id, epa.code, epa.nom, epa.secteur ORDER BY epa.nom';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// DÉTAIL D'UN EPA
// ============================================================
router.get('/epa/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const epaResult = await pool.query('SELECT * FROM epa WHERE id = $1', [id]);
    if (epaResult.rows.length === 0) {
      return res.status(404).json({ message: 'EPA non trouvé' });
    }

    // Statistiques
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as nb_engagements,
        SUM(montant) as total_engagements,
        COUNT(*) FILTER (WHERE statut = 'valide') as nb_valides,
        COUNT(*) FILTER (WHERE statut = 'liquide') as nb_liquides,
        SUM(montant) FILTER (WHERE statut IN ('valide', 'liquide')) as total_engage
      FROM engagements
      WHERE epa_id = $1
    `, [id]);

    // Chapitres budgétaires
    const chapitresResult = await pool.query(`
      SELECT cb.*
      FROM chapitres_budgetaires cb
      JOIN budgets b ON cb.id_budget = b.id
      WHERE b.epa_id = $1 AND b.statut = 'actif'
      ORDER BY cb.code
    `, [id]);

    res.json({
      epa: epaResult.rows[0],
      statistiques: statsResult.rows[0],
      chapitres: chapitresResult.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// WORKFLOW APPROBATION MODIFICATIFS
// ============================================================
router.get('/workflow-approbation', async (req, res) => {
  try {
    const { statut } = req.query;
    let query = `
      SELECT m.*, epa.nom as epa_nom
      FROM modificatifs m
      JOIN epa ON m.epa_id = epa.id
    `;
    const params = [];

    if (statut) {
      query += ' WHERE m.statut = $1';
      params.push(statut);
    }

    query += ' ORDER BY m.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// APPROUVER/REFUSER UN MODIFICATIF — RG-20: Tracé dans journal
// ============================================================
router.post('/modificatifs/:id/approbation', auditLogger('modificatifs'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, commentaire } = req.body;

    if (!['APPROUVER', 'REFUSER'].includes(action)) {
      return res.status(400).json({ message: 'Action invalide' });
    }

    const statut = action === 'APPROUVER' ? 'APPROUVE' : 'REFUSE';

    const result = await pool.query(
      `UPDATE modificatifs 
       SET statut = $1, approbation_tutelle = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [statut, action === 'APPROUVER', id]
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
// PERFORMANCE PROGRAMMES
// ============================================================
router.get('/performance-programmes', async (req, res) => {
  try {
    const { annee } = req.query;
    const anneeAnalyse = annee || new Date().getFullYear();

    const result = await pool.query(`
      SELECT 
        epa.nom as epa_nom,
        epa.secteur,
        cb.code as chapitre_code,
        cb.libelle as chapitre_libelle,
        cb.montant_alloue as budget_initial,
        cb.montant_engage,
        cb.montant_paye,
        ROUND(
          (cb.montant_paye / NULLIF(cb.montant_alloue, 0)) * 100, 2
        ) as taux_execution
      FROM chapitres_budgetaires cb
      JOIN budgets b ON cb.id_budget = b.id
      JOIN epa ON b.epa_id = epa.id
      WHERE b.annee = $1
      ORDER BY epa.nom, cb.code
    `, [anneeAnalyse]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// RAPPORTS SECTORIELS
// ============================================================
router.get('/rapports-sectoriels', async (req, res) => {
  try {
    const { secteur, annee } = req.query;
    let query = `
      SELECT 
        epa.secteur,
        COUNT(DISTINCT epa.id) as nb_epa,
        COALESCE(SUM(cb.montant_alloue), 0) as budget_total,
        COALESCE(SUM(cb.montant_engage), 0) as engage_total,
        COALESCE(SUM(cb.montant_paye), 0) as paye_total,
        COUNT(DISTINCT e.id) as nb_engagements,
        COALESCE(SUM(r.montant) FILTER (WHERE r.est_annulee = false), 0) as total_recettes
      FROM epa
      LEFT JOIN budgets b ON b.epa_id = epa.id
      LEFT JOIN chapitres_budgetaires cb ON cb.id_budget = b.id
      LEFT JOIN articles_budgetaires ab ON ab.id_chapitre = cb.id
      LEFT JOIN engagements e ON e.id_article_budgetaire = ab.id
      LEFT JOIN recettes r ON r.epa_id = epa.id
    `;
    const params = [];
    const conditions = [];

    if (secteur) {
      conditions.push(`epa.secteur = $${params.length + 1}`);
      params.push(secteur);
    }

    if (annee) {
      conditions.push(`b.annee = $${params.length + 1}`);
      params.push(annee);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY epa.secteur ORDER BY epa.secteur';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
