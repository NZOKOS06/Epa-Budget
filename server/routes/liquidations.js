const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.use(authenticate);

// Configuration multer pour upload facture + PV
const uploadDir = path.join(__dirname, '../../uploads/liquidations');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF et images sont acceptés'));
    }
  }
});

// ============================================================
// CRÉER UNE LIQUIDATION (DAF uniquement) — RG-11, RG-12
// ============================================================
router.post(
  '/',
  authorize('DAF'),
  auditLogger('liquidations'),
  upload.fields([
    { name: 'facture', maxCount: 1 },
    { name: 'pv_service_fait', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { id_engagement, montant_facture, montant_liquide } = req.body;

      // RG-12: Vérifier la présence de la facture ET du PV de service fait
      if (!req.files || !req.files['facture'] || !req.files['pv_service_fait']) {
        return res.status(400).json({
          message: 'La facture numérisée ET le procès-verbal de service fait sont obligatoires (RG-12)'
        });
      }

      // Vérifier que l'engagement est au statut 'valide'
      const engagementResult = await pool.query(
        'SELECT * FROM engagements WHERE id = $1',
        [id_engagement]
      );

      if (engagementResult.rows.length === 0) {
        return res.status(404).json({ message: 'Engagement non trouvé' });
      }

      const engagement = engagementResult.rows[0];
      if (engagement.statut !== 'valide') {
        return res.status(400).json({
          message: 'L\'engagement doit être au statut "valide" pour être liquidé'
        });
      }

      // RG-11: Le montant liquidé ne peut pas dépasser le montant engagé
      if (parseFloat(montant_liquide) > parseFloat(engagement.montant)) {
        return res.status(400).json({
          message: `Le montant liquidé (${montant_liquide}) ne peut pas dépasser le montant engagé (${engagement.montant}) — RG-11`
        });
      }

      // Vérifier qu'il n'y a pas déjà une liquidation pour cet engagement
      const existingLiq = await pool.query(
        'SELECT id FROM liquidations WHERE id_engagement = $1',
        [id_engagement]
      );
      if (existingLiq.rows.length > 0) {
        return res.status(400).json({
          message: 'Une liquidation existe déjà pour cet engagement'
        });
      }

      // Créer la liquidation
      const result = await pool.query(
        `INSERT INTO liquidations 
         (montant_facture, montant_liquide, statut, facture_path, pv_service_fait_path, id_engagement)
         VALUES ($1, $2, 'en_attente', $3, $4, $5)
         RETURNING *`,
        [
          montant_facture,
          montant_liquide,
          req.files['facture'][0].path,
          req.files['pv_service_fait'][0].path,
          id_engagement
        ]
      );

      // Mettre à jour le statut de l'engagement
      await pool.query(
        `UPDATE engagements SET statut = 'liquide', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id_engagement]
      );

      // Mettre à jour les montants liquidés dans l'article budgétaire (CP)
      if (engagement.id_article_budgetaire) {
        await pool.query(
          `UPDATE articles_budgetaires 
           SET cp_liquide = cp_liquide + $1 
           WHERE id = $2`,
          [montant_liquide, engagement.id_article_budgetaire]
        );
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
);

// ============================================================
// LISTER LES LIQUIDATIONS EN ATTENTE (Agent Comptable)
// ============================================================
router.get('/en-attente', authorize('COMPTABLE'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, 
        e.numero as engagement_numero,
        e.objet as engagement_objet,
        e.montant as engagement_montant
      FROM liquidations l
      JOIN engagements e ON l.id_engagement = e.id
      WHERE l.statut IN ('en_attente', 'validee')
      ORDER BY l.created_at ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// VALIDER UNE LIQUIDATION (Agent Comptable uniquement) — RG-13
// ============================================================
router.post(
  '/:id/valider',
  authorize('COMPTABLE'),
  auditLogger('liquidations'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const liqResult = await pool.query(
        'SELECT * FROM liquidations WHERE id = $1',
        [id]
      );

      if (liqResult.rows.length === 0) {
        return res.status(404).json({ message: 'Liquidation non trouvée' });
      }

      if (liqResult.rows[0].statut !== 'en_attente') {
        return res.status(400).json({
          message: 'La liquidation doit être en attente pour être validée'
        });
      }

      const result = await pool.query(
        `UPDATE liquidations 
         SET statut = 'validee', id_validateur_ac = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 RETURNING *`,
        [req.user.id, id]
      );

      res.json({ success: true, liquidation: result.rows[0] });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
);

// ============================================================
// ENREGISTRER UN PAIEMENT (Agent Comptable uniquement) — RG-13
// Paiement ne peut intervenir qu'après validation de la liquidation
// ============================================================
router.post(
  '/:id/paiement',
  authorize('COMPTABLE'),
  auditLogger('paiements'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { montant, date_paiement, mode_paiement } = req.body;

      // Vérifier que la liquidation est validée (RG-13)
      const liqResult = await pool.query(
        'SELECT * FROM liquidations WHERE id = $1',
        [id]
      );

      if (liqResult.rows.length === 0) {
        return res.status(404).json({ message: 'Liquidation non trouvée' });
      }

      if (liqResult.rows[0].statut !== 'validee') {
        return res.status(400).json({
          message: 'Le paiement ne peut intervenir qu\'après validation de la liquidation par l\'Agent Comptable (RG-13)'
        });
      }

      const numero_ordre = `ORD-${Date.now()}`;

      // Créer le paiement
      const paiementResult = await pool.query(
        `INSERT INTO paiements 
         (montant, date_paiement, mode_paiement, numero_ordre, id_liquidation, id_agent_comptable)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [montant, date_paiement, mode_paiement || 'virement', numero_ordre, id, req.user.id]
      );

      // Mettre à jour la liquidation
      await pool.query(
        `UPDATE liquidations SET statut = 'payee', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );

      // Mettre à jour les montants payés dans l'article budgétaire
      const engagement = await pool.query(
        `SELECT e.id_article_budgetaire FROM engagements e 
         JOIN liquidations l ON l.id_engagement = e.id 
         WHERE l.id = $1`,
        [id]
      );

      if (engagement.rows.length > 0 && engagement.rows[0].id_article_budgetaire) {
        const id_article = engagement.rows[0].id_article_budgetaire;
        
        // Mettre à jour CP payé dans articles_budgetaires
        await pool.query(
          `UPDATE articles_budgetaires 
           SET cp_paye = cp_paye + $1 
           WHERE id = $2`,
          [montant, id_article]
        );

        // Mettre à jour CP payé dans chapitres_budgetaires
        await pool.query(
          `UPDATE chapitres_budgetaires 
           SET cp_paye = cp_paye + $1 
           WHERE id = (SELECT id_chapitre FROM articles_budgetaires WHERE id = $1)`,
          [id_article]
        );
      }

      res.status(201).json(paiementResult.rows[0]);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
);

module.exports = router;
