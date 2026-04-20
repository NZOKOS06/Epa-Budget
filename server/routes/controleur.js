const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');
const { changeStatutEngagement, getWorkflowHistory } = require('../services/workflow');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.use(authenticate);
router.use(authorize('CONTROLEUR'));

// ============================================================
// FILE VISAS — Engagements en attente d'avis du Contrôleur (RG-03)
// ============================================================
router.get('/file-visas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, 
        ab.code as article_code, ab.libelle as article_libelle,
        ab.ae_initial, ab.ae_engage, ab.ae_disponible,
        u.nom || ' ' || u.prenom as demandeur_nom,
        cb.libelle as programme_libelle
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      JOIN utilisateurs u ON e.id_demandeur = u.id
      WHERE e.statut = 'en_attente_cb'
      ORDER BY e.created_at ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// DÉTAIL D'UN ENGAGEMENT POUR VISA
// ============================================================
router.get('/engagements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const engagementResult = await pool.query(`
      SELECT e.*, 
        ab.code as article_code, ab.libelle as article_libelle,
        ab.ae_initial, ab.ae_engage, ab.ae_disponible,
        ab.cp_initial, ab.cp_paye, ab.cp_disponible,
        u.nom || ' ' || u.prenom as demandeur_nom,
        cb.libelle as programme_libelle
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      JOIN utilisateurs u ON e.id_demandeur = u.id
      WHERE e.id = $1
    `, [id]);

    if (engagementResult.rows.length === 0) {
      return res.status(404).json({ message: 'Engagement non trouvé' });
    }

    // Pièces jointes
    const piecesResult = await pool.query(
      'SELECT * FROM pieces_jointes WHERE engagement_id = $1',
      [id]
    );

    // Historique workflow
    const history = await getWorkflowHistory(id);

    // Avis précédents sur cet engagement
    const avisResult = await pool.query(
      `SELECT ac.*, u.nom || ' ' || u.prenom as controleur_nom
       FROM avis_controle ac
       JOIN utilisateurs u ON ac.id_controleur = u.id
       WHERE ac.id_engagement = $1
       ORDER BY ac.date_avis DESC`,
      [id]
    );

    res.json({
      ...engagementResult.rows[0],
      pieces_jointes: piecesResult.rows,
      historique: history,
      avis: avisResult.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// PIÈCES JOINTES — Visualisation/Téléchargement (Contrôleur)
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
// DÉCISION DU CONTRÔLEUR (VISA ou REFUS)
// ============================================================
router.post('/engagements/:id/visa', auditLogger('avis_controle'), async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, commentaire, checklist } = req.body; // decision: 'favorable' | 'defavorable'

    // Vérifier que l'engagement est en attente du CB
    const engCheck = await pool.query('SELECT statut FROM engagements WHERE id = $1', [id]);
    if (engCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Engagement non trouvé' });
    }
    if (engCheck.rows[0].statut !== 'en_attente_cb') {
      return res.status(400).json({ message: 'L\'engagement n\'est pas en attente du Contrôleur Budgétaire' });
    }

    if (decision === 'favorable') {
      // Enregistrer l'avis dans la table avis_controle
      await pool.query(
        `INSERT INTO avis_controle (type_avis, commentaire, id_engagement, id_controleur)
         VALUES ('favorable', $1, $2, $3)`,
        [commentaire || 'Avis favorable', id, req.user.id]
      );

      // Faire avancer le workflow vers le DG
      const result = await changeStatutEngagement(
        parseInt(id),
        'en_attente_dg',
        req.user.id,
        commentaire || 'Avis favorable du Contrôleur Budgétaire'
      );
      res.json({ success: true, ...result });

    } else if (decision === 'defavorable') {
      // RG-07: Le commentaire est obligatoire pour un avis défavorable
      if (!commentaire || commentaire.trim() === '') {
        return res.status(400).json({
          message: 'Le commentaire est obligatoire pour un avis défavorable (RG-07)'
        });
      }

      // Enregistrer l'avis
      await pool.query(
        `INSERT INTO avis_controle (type_avis, commentaire, id_engagement, id_controleur)
         VALUES ('defavorable', $1, $2, $3)`,
        [commentaire, id, req.user.id]
      );

      // RG-04: Avis défavorable = blocage définitif (statut rejete)
      const result = await changeStatutEngagement(
        parseInt(id),
        'rejete',
        req.user.id,
        commentaire
      );
      res.json({ success: true, ...result });
    } else {
      res.status(400).json({ message: 'Décision non valide' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================================
// ALERTES DÉRIVE BUDGÉTAIRE — Basées sur AE_disponible
// ============================================================
router.get('/alertes-derive', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        ab.code as article_code,
        ab.ae_initial,
        ab.ae_engage,
        ab.ae_disponible,
        CASE 
          WHEN e.montant > ab.ae_disponible THEN 'Dépassement AE'
          WHEN ab.ae_disponible < (ab.ae_initial * 0.1) THEN 'Seuil Critique'
          ELSE 'Alerte'
        END as type_alerte
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      WHERE e.statut = 'en_attente_cb'
        AND (e.montant > ab.ae_disponible OR ab.ae_disponible < (ab.ae_initial * 0.1))
      ORDER BY e.montant DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// JOURNAL DES CONTRÔLES EFFECTUÉS PAR CE CONTRÔLEUR
// ============================================================
router.get('/journal-controles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ac.id,
        ac.date_avis,
        ac.type_avis,
        ac.commentaire,
        e.numero as engagement_numero,
        e.montant,
        e.objet,
        u.nom || ' ' || u.prenom as demandeur_nom
      FROM avis_controle ac
      JOIN engagements e ON ac.id_engagement = e.id
      JOIN utilisateurs u ON e.id_demandeur = u.id
      WHERE ac.id_controleur = $1
      ORDER BY ac.date_avis DESC
      LIMIT 100
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
