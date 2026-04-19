const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('CCDB'));

// ============================================================
// PISTE D'AUDIT — Recherche avancée avec journal_audit
// ============================================================
router.get('/piste-audit', async (req, res) => {
  try {
    const { 
      numero_engagement, 
      epa_id, 
      date_debut, 
      date_fin,
      montant_min 
    } = req.query;

    let query = `
      SELECT 
        e.*,
        ab.code as article_code, ab.libelle as article_libelle,
        u1.nom || ' ' || u1.prenom as demandeur_nom,
        u2.nom || ' ' || u2.prenom as validateur_dg_nom,
        ac.type_avis, ac.commentaire as avis_commentaire,
        uc.nom || ' ' || uc.prenom as controleur_nom
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN utilisateurs u1 ON e.id_demandeur = u1.id
      LEFT JOIN utilisateurs u2 ON e.id_validateur_dg = u2.id
      LEFT JOIN avis_controle ac ON ac.id_engagement = e.id
      LEFT JOIN utilisateurs uc ON ac.id_controleur = uc.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (numero_engagement) {
      query += ` AND e.numero ILIKE $${paramIndex}`;
      params.push(`%${numero_engagement}%`);
      paramIndex++;
    }

    if (epa_id) {
      query += ` AND e.epa_id = $${paramIndex}`;
      params.push(epa_id);
      paramIndex++;
    }

    if (date_debut) {
      query += ` AND e.created_at >= $${paramIndex}`;
      params.push(date_debut);
      paramIndex++;
    }

    if (date_fin) {
      query += ` AND e.created_at <= $${paramIndex}`;
      params.push(date_fin);
      paramIndex++;
    }

    if (montant_min) {
      query += ` AND e.montant >= $${paramIndex}`;
      params.push(montant_min);
      paramIndex++;
    }

    query += ' ORDER BY e.created_at DESC LIMIT 500';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// TIMELINE COMPLÈTE D'UN ENGAGEMENT
// ============================================================
router.get('/engagements/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;

    // Engagement avec détails
    const engagementResult = await pool.query(`
      SELECT 
        e.*,
        ab.code as article_code, ab.libelle as article_libelle,
        cb.code as chapitre_code, cb.libelle as chapitre_libelle,
        u1.nom || ' ' || u1.prenom as demandeur_nom,
        u2.nom || ' ' || u2.prenom as validateur_dg_nom
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      JOIN utilisateurs u1 ON e.id_demandeur = u1.id
      LEFT JOIN utilisateurs u2 ON e.id_validateur_dg = u2.id
      WHERE e.id = $1
    `, [id]);

    if (engagementResult.rows.length === 0) {
      return res.status(404).json({ message: 'Engagement non trouvé' });
    }

    // Historique workflow complet
    const historyResult = await pool.query(`
      SELECT wh.*, u.nom || ' ' || u.prenom as acteur_nom, r.nom as acteur_role
      FROM workflow_history wh
      JOIN utilisateurs u ON wh.acteur_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE wh.engagement_id = $1
      ORDER BY wh.created_at ASC
    `, [id]);

    // Avis du contrôleur
    const avisResult = await pool.query(`
      SELECT ac.*, u.nom || ' ' || u.prenom as controleur_nom
      FROM avis_controle ac
      JOIN utilisateurs u ON ac.id_controleur = u.id
      WHERE ac.id_engagement = $1
      ORDER BY ac.date_avis ASC
    `, [id]);

    // Pièces jointes
    const piecesResult = await pool.query(
      'SELECT * FROM pieces_jointes WHERE engagement_id = $1 ORDER BY created_at', [id]
    );

    // Liquidation
    const liquidationResult = await pool.query(
      'SELECT * FROM liquidations WHERE id_engagement = $1', [id]
    );

    // Paiement via liquidation
    let paiement = null;
    if (liquidationResult.rows.length > 0) {
      const paiementResult = await pool.query(
        'SELECT * FROM paiements WHERE id_liquidation = $1', [liquidationResult.rows[0].id]
      );
      paiement = paiementResult.rows[0] || null;
    }

    // Journal d'audit pour cet engagement
    const auditResult = await pool.query(`
      SELECT ja.*, u.nom || ' ' || u.prenom as utilisateur_nom
      FROM journal_audit ja
      JOIN utilisateurs u ON ja.id_utilisateur = u.id
      WHERE ja.ressource = 'engagements' AND ja.ressource_id = $1
      ORDER BY ja.date_heure ASC
    `, [id.toString()]);

    res.json({
      engagement: engagementResult.rows[0],
      historique_workflow: historyResult.rows,
      avis_controle: avisResult.rows,
      pieces_jointes: piecesResult.rows,
      liquidation: liquidationResult.rows[0] || null,
      paiement,
      journal_audit: auditResult.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// JOURNAL D'AUDIT GLOBAL — Toutes les opérations tracées
// ============================================================
router.get('/journal-audit', async (req, res) => {
  try {
    const { ressource, date_debut, date_fin, id_utilisateur } = req.query;

    let query = `
      SELECT ja.*, u.nom || ' ' || u.prenom as utilisateur_nom, r.nom as role_nom
      FROM journal_audit ja
      JOIN utilisateurs u ON ja.id_utilisateur = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (ressource) {
      query += ` AND ja.ressource = $${paramIndex}`;
      params.push(ressource);
      paramIndex++;
    }

    if (date_debut) {
      query += ` AND ja.date_heure >= $${paramIndex}`;
      params.push(date_debut);
      paramIndex++;
    }

    if (date_fin) {
      query += ` AND ja.date_heure <= $${paramIndex}`;
      params.push(date_fin);
      paramIndex++;
    }

    if (id_utilisateur) {
      query += ` AND ja.id_utilisateur = $${paramIndex}`;
      params.push(id_utilisateur);
      paramIndex++;
    }

    query += ' ORDER BY ja.date_heure DESC LIMIT 500';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// COMPTES ANNUELS — Validation
// ============================================================
router.get('/comptes-annuels', async (req, res) => {
  try {
    const { annee, epa_id } = req.query;
    let query = `
      SELECT r.*, epa.nom as epa_nom, epa.secteur
      FROM rapports r
      JOIN epa ON r.epa_id = epa.id
      WHERE r.type_rapport = 'COMPTES_ANNUELS'
    `;
    const params = [];
    let paramIndex = 1;

    if (annee) {
      query += ` AND r.annee = $${paramIndex}`;
      params.push(annee);
      paramIndex++;
    }

    if (epa_id) {
      query += ` AND r.epa_id = $${paramIndex}`;
      params.push(epa_id);
      paramIndex++;
    }

    query += ' ORDER BY r.annee DESC, epa.nom';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// EXPORT COMPLET POUR AUDIT EXTERNE
// ============================================================
router.get('/export-audit', async (req, res) => {
  try {
    const { epa_id, date_debut, date_fin } = req.query;

    let query = `
      SELECT 
        e.numero, e.montant, e.objet, e.statut, e.motif_rejet,
        e.created_at, e.updated_at,
        ab.code as article_code,
        cb.code as chapitre_code,
        u1.nom || ' ' || u1.prenom as demandeur_nom,
        u2.nom || ' ' || u2.prenom as validateur_dg_nom,
        ac.type_avis, ac.date_avis,
        uc.nom || ' ' || uc.prenom as controleur_nom
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      JOIN utilisateurs u1 ON e.id_demandeur = u1.id
      LEFT JOIN utilisateurs u2 ON e.id_validateur_dg = u2.id
      LEFT JOIN avis_controle ac ON ac.id_engagement = e.id
      LEFT JOIN utilisateurs uc ON ac.id_controleur = uc.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (epa_id) {
      query += ` AND e.epa_id = $${paramIndex}`;
      params.push(epa_id);
      paramIndex++;
    }

    if (date_debut) {
      query += ` AND e.created_at >= $${paramIndex}`;
      params.push(date_debut);
      paramIndex++;
    }

    if (date_fin) {
      query += ` AND e.created_at <= $${paramIndex}`;
      params.push(date_fin);
      paramIndex++;
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
