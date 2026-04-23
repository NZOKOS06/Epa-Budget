const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');
const { changeStatutEngagement } = require('../services/workflow');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.use(authenticate);
router.use(authorize('SERVICE'));

// Configuration multer pour les pièces jointes
const uploadDir = path.join(__dirname, '../../uploads/engagements');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'piece-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ============================================================
// PROGRAMMES — Consultation avec montants agrégés
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

// ============================================================
// ARTICLES BUDGÉTAIRES — Pour le formulaire de demande
// ============================================================
router.get('/articles-budgetaires', async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT epa_id, direction_id FROM utilisateurs WHERE id = $1', [req.user.id]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    const { epa_id, direction_id } = userResult.rows[0];

    // RG-17: Restreindre aux articles de sa propre direction
    let query = `
      SELECT ab.*, cb.libelle as chapitre_libelle,
        ab.ae_disponible as solde_disponible
      FROM articles_budgetaires ab
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      JOIN budgets b ON cb.id_budget = b.id
      WHERE b.epa_id = $1 AND b.statut = 'actif'
    `;
    const params = [epa_id];

    if (direction_id) {
      query += ' AND (ab.direction_id = $2 OR ab.direction_id IS NULL)';
      params.push(direction_id);
    }

    query += ' ORDER BY ab.code';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// DEMANDES D'ENGAGEMENTS — Lister les demandes du service
// ============================================================
router.get('/demandes-engagements', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*,
        ab.code as article_code, ab.libelle as article_libelle,
        cb.id as programme_id,
        cb.code as chapitre_code,
        cb.libelle as chapitre_libelle,
        (
          SELECT COUNT(*)
          FROM pieces_jointes pj
          WHERE pj.engagement_id = e.id
        ) as pieces_count
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      WHERE e.id_demandeur = $1
      ORDER BY e.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// CRÉER UNE DEMANDE D'ENGAGEMENT — RG-01, RG-02, RG-17
// ============================================================
router.post('/demandes-engagements', auditLogger('engagements'), upload.array('pieces_jointes', 10), async (req, res) => {
  try {
    const { ligne_budgetaire_id, montant, objet } = req.body;
    const id_article_budgetaire = ligne_budgetaire_id;

    // Récupérer les infos utilisateur
    const userResult = await pool.query(
      'SELECT epa_id, direction_id FROM utilisateurs WHERE id = $1', [req.user.id]
    );
    const { epa_id, direction_id } = userResult.rows[0];

    // Vérifier l'article budgétaire
    const articleResult = await pool.query(`
      SELECT ab.*, b.statut as budget_statut, b.id as budget_id
      FROM articles_budgetaires ab
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      JOIN budgets b ON cb.id_budget = b.id
      WHERE ab.id = $1
    `, [id_article_budgetaire]);

    if (articleResult.rows.length === 0) {
      return res.status(400).json({ message: 'Article budgétaire non trouvé' });
    }

    const article = articleResult.rows[0];
    const statusBudget = article.budget_statut ? article.budget_statut.toLowerCase() : '';

    // RG-01: Vérifier que le budget est actif ou ouvert
    if (statusBudget !== 'actif' && statusBudget !== 'ouvert') {
      return res.status(400).json({
        message: `Le budget annuel doit être au statut "actif" ou "ouvert" pour initier un engagement. Statut actuel: ${article.budget_statut} (RG-01)`
      });
    }

    // RG-17: Vérifier que l'article appartient à la direction du CS
    if (direction_id && article.direction_id && article.direction_id !== direction_id) {
      return res.status(403).json({
        message: 'Vous ne pouvez initier des demandes que sur les articles budgétaires de votre propre direction (RG-17)'
      });
    }

    // RG-02: Vérifier le solde disponible
    const soldeDisponible = parseFloat(article.ae_disponible);
    if (parseFloat(montant) > soldeDisponible) {
      return res.status(400).json({
        message: `Solde insuffisant. Disponible: ${soldeDisponible} FCFA, Demandé: ${montant} FCFA (RG-02)`
      });
    }

    const numero = `ENG-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Créer l'engagement au statut brouillon
    const engagementResult = await pool.query(
      `INSERT INTO engagements 
       (numero, objet, montant, statut, id_article_budgetaire, id_demandeur, epa_id)
       VALUES ($1, $2, $3, 'brouillon', $4, $5, $6)
       RETURNING *`,
      [numero, objet, montant, id_article_budgetaire, req.user.id, epa_id]
    );

    const engagement = engagementResult.rows[0];

    // Upload des pièces jointes
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await pool.query(
          `INSERT INTO pieces_jointes 
           (engagement_id, nom_fichier, chemin_fichier, type_fichier, taille, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [engagement.id, file.originalname, file.path, (file.mimetype || '').slice(0, 50), file.size, req.user.id]
        );
      }
    }

    res.status(201).json(engagement);
  } catch (error) {
    console.error('ERREUR CREATION ENGAGEMENT:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la création de l\'engagement', 
      error: error.message,
      detail: error.detail // Souvent présent dans les erreurs PostgreSQL
    });
  }
});

// ============================================================
// DÉTAILS D'UN ENGAGEMENT
// ============================================================
router.get('/demandes-engagements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT e.*,
        ab.code as article_code, ab.libelle as article_libelle,
        cb.id as programme_id, cb.libelle as chapitre_libelle, cb.code as chapitre_code,
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
          SELECT wh.created_at
          FROM workflow_history wh
          WHERE wh.engagement_id = e.id AND wh.nouveau_statut = 'en_attente_dg'
          ORDER BY wh.created_at DESC
          LIMIT 1
        ) as transmission_dg_date,
        (
          SELECT wh.created_at
          FROM workflow_history wh
          WHERE wh.engagement_id = e.id AND wh.nouveau_statut = 'valide'
          ORDER BY wh.created_at DESC
          LIMIT 1
        ) as validation_dg_date
      FROM engagements e
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      WHERE e.id = $1 AND e.id_demandeur = $2
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    // Récupérer les pièces jointes
    const pieces = await pool.query(
      'SELECT * FROM pieces_jointes WHERE engagement_id = $1',
      [id]
    );

    res.json({ ...result.rows[0], pieces_jointes: pieces.rows });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// PIÈCES JOINTES — Visualisation/Téléchargement
// ============================================================
router.get('/demandes-engagements/:id/pieces/:pieceId/view', async (req, res) => {
  try {
    const { id, pieceId } = req.params;
    const pieceResult = await pool.query(
      `SELECT pj.*
       FROM pieces_jointes pj
       JOIN engagements e ON e.id = pj.engagement_id
       WHERE pj.id = $1 AND pj.engagement_id = $2 AND e.id_demandeur = $3`,
      [pieceId, id, req.user.id]
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

router.get('/demandes-engagements/:id/pieces/:pieceId/download', async (req, res) => {
  try {
    const { id, pieceId } = req.params;
    const pieceResult = await pool.query(
      `SELECT pj.*
       FROM pieces_jointes pj
       JOIN engagements e ON e.id = pj.engagement_id
       WHERE pj.id = $1 AND pj.engagement_id = $2 AND e.id_demandeur = $3`,
      [pieceId, id, req.user.id]
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
// SUPPRIMER UN ENGAGEMENT (Brouillon uniquement)
// ============================================================
router.delete('/demandes-engagements/:id', auditLogger('engagements'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier le statut avant suppression
    const check = await pool.query(
      'SELECT statut FROM engagements WHERE id = $1 AND id_demandeur = $2',
      [id, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    if (check.rows[0].statut.toLowerCase() !== 'brouillon') {
      return res.status(403).json({ message: 'Seules les demandes au statut brouillon peuvent être supprimées' });
    }

    // Supprimer les pièces jointes d'abord (contrainte FK)
    await pool.query('DELETE FROM pieces_jointes WHERE engagement_id = $1', [id]);
    await pool.query('DELETE FROM engagements WHERE id = $1', [id]);

    res.json({ message: 'Demande supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// SOUMETTRE UN ENGAGEMENT AU CONTRÔLEUR BUDGÉTAIRE (RG-03)
// ============================================================
router.post('/demandes-engagements/:id/soumettre', auditLogger('engagements'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await changeStatutEngagement(
      parseInt(id),
      'soumise_daf',
      req.user.id,
      'Soumis par le Chef de Service pour validation DAF'
    );

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================================
// RÉCEPTIONS — Lister les réceptions du service
// ============================================================
router.get('/receptions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, 
        e.id as engagement_id,
        e.numero as engagement_numero,
        e.objet as engagement_objet,
        e.montant as engagement_montant,
        cb.code as programme_code,
        cb.libelle as programme_libelle,
        COALESCE(l.created_at, l.updated_at) as date_reception
      FROM liquidations l
      JOIN engagements e ON l.id_engagement = e.id
      JOIN articles_budgetaires ab ON e.id_article_budgetaire = ab.id
      JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
      WHERE e.id_demandeur = $1
      ORDER BY l.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// INDICATEURS — Statistiques par article budgétaire
// ============================================================
router.get('/indicateurs', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT epa_id FROM utilisateurs WHERE id = $1', [req.user.id]);
    const epa_id = userResult.rows[0].epa_id;

    const result = await pool.query(`
      SELECT 
        cb.code as programme_code,
        cb.libelle as programme_libelle,
        COUNT(e.id) as nb_demandes,
        COUNT(e.id) FILTER (WHERE e.statut = 'valide') as nb_approuves,
        COUNT(e.id) FILTER (WHERE e.statut = 'liquide') as nb_payes,
        COALESCE(SUM(e.montant) FILTER (WHERE e.statut = 'valide'), 0) as montant_approuve,
        COALESCE(SUM(e.montant) FILTER (WHERE e.statut = 'liquide'), 0) as montant_paye
      FROM chapitres_budgetaires cb
      JOIN budgets b ON cb.id_budget = b.id
      LEFT JOIN articles_budgetaires ab ON ab.id_chapitre = cb.id
      LEFT JOIN engagements e ON e.id_article_budgetaire = ab.id
      WHERE b.epa_id = $1 AND b.annee = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY cb.id, cb.code, cb.libelle
      ORDER BY cb.code
    `, [epa_id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// ENGAGEMENTS RÉCEPTIONNABLES (pour le formulaire de réception)
// ============================================================
router.get('/engagements-receptionnables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.numero, e.objet, e.montant
      FROM engagements e
      LEFT JOIN liquidations l ON l.id_engagement = e.id
      WHERE e.id_demandeur = $1
        AND e.statut = 'valide'
        AND l.id IS NULL
      ORDER BY e.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// CRÉER UN PV DE RÉCEPTION (Créer une liquidation)
// ============================================================
router.post('/engagements/:id/reception', auditLogger('liquidations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { date_reception, observations } = req.body;

    // Vérifier que l'engagement existe et appartient à l'utilisateur
    const engagementResult = await pool.query(`
      SELECT e.id, e.montant, e.numero
      FROM engagements e
      WHERE e.id = $1 AND e.id_demandeur = $2 AND e.statut = 'valide'
    `, [id, req.user.id]);

    if (engagementResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Engagement non trouvé ou non valide' 
      });
    }

    const engagement = engagementResult.rows[0];

    // Vérifier qu'une liquidation n'existe pas déjà pour cet engagement
    const existingResult = await pool.query(
      'SELECT id FROM liquidations WHERE id_engagement = $1',
      [id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Une réception existe déjà pour cet engagement' 
      });
    }

    // Créer la liquidation (PV de réception)
    const insertResult = await pool.query(`
      INSERT INTO liquidations (
        montant_facture, 
        montant_liquide, 
        statut, 
        id_engagement,
        created_at
      ) VALUES ($1, $2, 'en_attente', $3, $4)
      RETURNING id, montant_facture, montant_liquide, statut, created_at
    `, [
      engagement.montant,
      engagement.montant,
      id,
      date_reception || new Date()
    ]);

    res.status(201).json({
      success: true,
      message: `PV de réception créé pour l'engagement ${engagement.numero}`,
      liquidation: insertResult.rows[0]
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création du PV de réception', 
      error: error.message 
    });
  }
});

// ============================================================
// MARQUER LE SERVICE FAIT (Passer la liquidation à validée)
// ============================================================
router.post('/receptions/:id/service-fait', auditLogger('liquidations'), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la liquidation existe et appartient à l'utilisateur
    const liquidationResult = await pool.query(`
      SELECT l.id, l.id_engagement
      FROM liquidations l
      JOIN engagements e ON l.id_engagement = e.id
      WHERE l.id = $1 AND e.id_demandeur = $2
    `, [id, req.user.id]);

    if (liquidationResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Liquidation non trouvée' 
      });
    }

    // Marquer le service fait en passant le statut à 'validee'
    // (en attente de validation comptable officielle)
    const updateResult = await pool.query(`
      UPDATE liquidations
      SET statut = 'validee', updated_at = NOW()
      WHERE id = $1
      RETURNING id, statut, montant_facture, montant_liquide, updated_at
    `, [id]);

    res.json({
      success: true,
      message: 'Service fait enregistré',
      liquidation: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'enregistrement du service fait', 
      error: error.message 
    });
  }
});

module.exports = router;
