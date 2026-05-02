const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');
const { changeStatutEngagement } = require('../services/workflow');
const path = require('path');
const fs = require('fs');
const { generatePDF } = require('../services/exportService');

const router = express.Router();

// Toutes les routes nécessitent authentification et rôle DG
router.use(authenticate);
router.use(authorize('DG'));

// ============================================================
// DÉTAIL D'UN ENGAGEMENT (Pour le DG)
// ============================================================
router.get('/engagements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const engagementResult = await pool.query(`
      SELECT e.*, 
        ab.code as article_code, ab.libelle as article_libelle,
        ab.ae_disponible, ab.cp_disponible,
        cb.id as programme_id, cb.code as programme_code, cb.libelle as programme_libelle,
        COALESCE(epa.nom, 'Service Général') as epa_nom,
        u.nom || ' ' || u.prenom as demandeur_nom,
        u.nom || ' ' || u.prenom as service_nom,
        ac.type_avis, ac.commentaire as avis_commentaire
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      LEFT JOIN epa ON e.id_epa = epa.id
      JOIN utilisateurs u ON e.id_demandeur = u.id
      LEFT JOIN avis_controle ac ON ac.id_engagement = e.id AND ac.type_avis = 'favorable'
      WHERE e.id = $1
    `, [id]);

    if (engagementResult.rows.length === 0) {
      return res.status(404).json({ message: 'Engagement non trouvé' });
    }

    const piecesResult = await pool.query(
      'SELECT id, nom_fichier, chemin_fichier, type_fichier, taille FROM pieces_jointes WHERE id_engagement = $1',
      [id]
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
// PIÈCES JOINTES — Visualisation/Téléchargement (Pour le DG)
// ============================================================
router.get('/engagements/:id/pieces/:pieceId/view', async (req, res) => {
  try {
    const { id, pieceId } = req.params;
    const pieceResult = await pool.query(
      `SELECT pj.*
       FROM pieces_jointes pj
       JOIN engagements e ON e.id = pj.id_engagement
       WHERE pj.id = $1 AND pj.id_engagement = $2`,
      [pieceId, id]
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
    const pieceResult = await pool.query(
      `SELECT pj.*
       FROM pieces_jointes pj
       JOIN engagements e ON e.id = pj.id_engagement
       WHERE pj.id = $1 AND pj.id_engagement = $2`,
      [pieceId, id]
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
// DASHBOARD EXÉCUTIF
// ============================================================
router.get('/dashboard', async (req, res) => {
  try {
    // 1. Engagements en attente d'approbation DG (statut: en_attente_dg)
    const engagementsResult = await pool.query(`
      SELECT e.*, 
        ab.code as article_code, ab.libelle as article_libelle,
        ab.ae_disponible, ab.cp_disponible,
        cb.id as programme_id, cb.code as programme_code, cb.libelle as programme_libelle,
        COALESCE(epa.nom, 'Service Général') as epa_nom,
        u.nom || ' ' || u.prenom as demandeur_nom,
        u.nom || ' ' || u.prenom as service_nom,
        ac.type_avis, ac.commentaire as avis_commentaire
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      LEFT JOIN epa ON e.id_epa = epa.id
      JOIN utilisateurs u ON e.id_demandeur = u.id
      LEFT JOIN avis_controle ac ON ac.id_engagement = e.id AND ac.type_avis = 'favorable'
      WHERE e.statut = 'en_attente_dg'
      ORDER BY e.date_creation ASC
      LIMIT 50
    `);

    // 2. Statistiques du mois en cours
    const currentMonthStats = await pool.query(`
      SELECT 
        COUNT(*) as approuves_mois,
        COALESCE(SUM(montant), 0) as montant_approuve_mois
      FROM engagements
      WHERE statut = 'valide'
        AND id_validateur_dg IS NOT NULL
        AND date_modification >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
        AND id_epa = (SELECT id_epa FROM utilisateurs WHERE id = $1)
    `, [req.user.id]);

    // 3. Évolution Mensuelle (12 derniers mois)
    const evolutionResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', date_modification) as mois,
        COALESCE(SUM(montant), 0) as total_montant,
        COUNT(*) as nb_engagements
      FROM engagements
      WHERE statut = 'valide'
        AND date_modification >= CURRENT_DATE - INTERVAL '12 months'
        AND id_epa = (SELECT id_epa FROM utilisateurs WHERE id = $1)
      GROUP BY DATE_TRUNC('month', date_modification)
      ORDER BY mois ASC
    `, [req.user.id]);

    // 4. Heatmap des Programmes (Taux d'exécution)
    const programmesResult = await pool.query(`
      SELECT 
        cb.id, cb.code, cb.libelle,
        COALESCE(cb.ae_alloue, 0) as budget_initial,
        COALESCE(SUM(e.montant) FILTER (WHERE e.statut = 'valide'), 0) as montant_engage,
        COALESCE(SUM(e.montant) FILTER (WHERE e.statut = 'liquide'), 0) as montant_paye
      FROM chapitres_budgetaires cb
      JOIN budgets b ON cb.id_budget = b.id
      LEFT JOIN articles_budgetaires ab ON ab.id_chapitre = cb.id
      LEFT JOIN engagements e ON e.id_article = ab.id
      WHERE b.id_epa = (SELECT id_epa FROM utilisateurs WHERE id = $1)
        AND b.statut = 'actif'
      GROUP BY cb.id, cb.code, cb.libelle, cb.ae_alloue
      ORDER BY cb.code
    `, [req.user.id]);

    // 5. Statistiques globales pour les compteurs
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE statut = 'en_attente_dg') as en_attente_approbation,
        COUNT(*) FILTER (WHERE statut = 'valide') as valides_total,
        SUM(montant) FILTER (WHERE statut = 'valide') as montant_valide_total,
        COUNT(*) FILTER (WHERE statut = 'rejete') as rejetes_total
      FROM engagements
      WHERE id_epa = (SELECT id_epa FROM utilisateurs WHERE id = $1)
    `, [req.user.id]);

    // 6. Alertes
    const alertesResult = await pool.query(
      `SELECT * FROM alertes 
       WHERE destine_a = 'DG' AND lue = false 
       ORDER BY date_creation DESC LIMIT 5`
    );

    // 7. Historique des approbations (dernières 10 approuvées)
    const historiqueResult = await pool.query(`
      SELECT 
        wh.id,
        wh.id_engagement as engagement_id,
        e.numero as engagement_numero,
        e.objet,
        e.montant,
        u.nom || ' ' || u.prenom as validateur_nom,
        wh.ancien_statut,
        wh.nouveau_statut,
        wh.commentaire,
        wh.date_creation as date_approbation
      FROM workflow_history wh
      JOIN engagements e ON wh.id_engagement = e.id
      JOIN utilisateurs u ON wh.id_acteur = u.id
      WHERE wh.nouveau_statut = 'valide'
        AND wh.id_acteur = $1
        AND e.id_epa = (SELECT id_epa FROM utilisateurs WHERE id = $1)
      ORDER BY wh.date_creation DESC
      LIMIT 10
    `, [req.user.id]);

    res.json({
      engagements: engagementsResult.rows,
      statistiques: {
        ...statsResult.rows[0],
        ...currentMonthStats.rows[0]
      },
      evolutionMensuelle: evolutionResult.rows,
      programmes: programmesResult.rows,
      alertes: alertesResult.rows,
      historique: historiqueResult.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// ENGAGEMENTS APPROUVÉS (Pour la liste des approbations approuvées)
// ============================================================
router.get('/engagements-approuves', async (req, res) => {
  try {
    const approuvesResult = await pool.query(`
      SELECT e.*, 
        ab.code as article_code, ab.libelle as article_libelle,
        ab.ae_disponible, ab.cp_disponible,
        cb.id as programme_id, cb.code as programme_code, cb.libelle as programme_libelle,
        COALESCE(epa.nom, 'Service Général') as epa_nom,
        u.nom || ' ' || u.prenom as demandeur_nom,
        u.nom || ' ' || u.prenom as service_nom,
        ac.type_avis, ac.commentaire as avis_commentaire
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      LEFT JOIN epa ON e.id_epa = epa.id
      JOIN utilisateurs u ON e.id_demandeur = u.id
      LEFT JOIN avis_controle ac ON ac.id_engagement = e.id AND ac.type_avis = 'favorable'
      WHERE e.statut = 'valide'
      ORDER BY e.date_modification DESC
      LIMIT 100
    `);

    res.json(approuvesResult.rows);
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
        DATE_TRUNC('month', date_modification) as mois,
        COUNT(*) as nb_engagements,
        SUM(montant) as total_montant
      FROM engagements
      WHERE statut = 'valide' 
        AND id_validateur_dg IS NOT NULL
        AND id_epa = (SELECT id_epa FROM utilisateurs WHERE id = $1)
      GROUP BY DATE_TRUNC('month', date_modification)
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
      JOIN epa ON r.id_epa = epa.id
      WHERE r.type_rapport IN ('RAP_TRIMESTRIEL', 'COMPTES_ANNUELS')
      ORDER BY r.date_creation DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Transmettre un rapport à la tutelle
router.post('/rapports/:id/transmettre', auditLogger('rapports'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE rapports SET statut = 'TRANSMIS', date_modification = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Rapport non trouvé' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Export PDF d'un rapport
router.get('/rapports/:id/export', async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer les infos du rapport
    const rapportResult = await pool.query(`
      SELECT r.*, epa.nom as epa_nom
      FROM rapports r
      JOIN epa ON r.id_epa = epa.id
      WHERE r.id = $1
    `, [id]);

    if (rapportResult.rows.length === 0) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }

    const rapport = rapportResult.rows[0];

    // Métadonnées du PDF
    const metadata = {
      'Rapport': rapport.type_rapport,
      'EPA': rapport.epa_nom,
      'Année': rapport.annee,
      'Statut': rapport.statut,
      'Généré le': new Date(rapport.date_creation).toLocaleString('fr-FR')
    };

    if (rapport.date_certification) metadata['Certifié le'] = new Date(rapport.date_certification).toLocaleString('fr-FR');
    if (rapport.date_soumission_ccdb) metadata['Soumis à la CCDB le'] = new Date(rapport.date_soumission_ccdb).toLocaleString('fr-FR');

    // Récupérer un résumé du budget pour l'année du rapport
    const resumeBudgetResult = await pool.query(`
      SELECT b.montant_previsionnel, b.statut,
             COALESCE(SUM(cb.ae_alloue), 0) as total_alloue,
             COALESCE(SUM(cb.ae_engage), 0) as total_engage,
             COALESCE(SUM(cb.cp_paye), 0) as total_paye
      FROM budgets b
      LEFT JOIN chapitres_budgetaires cb ON cb.id_budget = b.id
      WHERE b.id_epa = $1 AND b.annee = $2
      GROUP BY b.id
    `, [rapport.id_epa, rapport.annee]);

    const headers = ['Montant Prévisionnel', 'AE Alloués', 'AE Engagés', 'CP Payés'];
    let rows = [];
    
    if (resumeBudgetResult.rows.length > 0) {
      const b = resumeBudgetResult.rows[0];
      rows = [[
        parseFloat(b.montant_previsionnel || 0).toLocaleString('fr-FR') + ' FCFA',
        parseFloat(b.total_alloue || 0).toLocaleString('fr-FR') + ' FCFA',
        parseFloat(b.total_engage || 0).toLocaleString('fr-FR') + ' FCFA',
        parseFloat(b.total_paye || 0).toLocaleString('fr-FR') + ' FCFA'
      ]];
    }

    const pdfBuffer = await generatePDF({
      title: `Rapport ${rapport.type_rapport} - ${rapport.annee}`,
      metadata,
      headers,
      rows
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${rapport.type_rapport}_${rapport.annee}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
