const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');

const router = express.Router();

// Toutes les routes Admin nécessitent authentification + rôle ADMIN
router.use(authenticate);
router.use(authorize('ADMIN'));

// ============================================================
// DASHBOARD ADMIN — KPIs globaux
// ============================================================
router.get('/dashboard', async (req, res) => {
  try {
    // Nombre d'EPA
    const epaResult = await pool.query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE statut = 'actif') as actives FROM epa`
    );

    // Utilisateurs par rôle
    const usersResult = await pool.query(`
      SELECT r.code as role, r.nom as role_nom, COUNT(u.id) as total,
        COUNT(u.id) FILTER (WHERE u.statut = 'actif') as actifs
      FROM roles r
      LEFT JOIN utilisateurs u ON u.role_id = r.id
      GROUP BY r.id, r.code, r.nom
      ORDER BY r.code
    `);

    // Volume engagements global
    const engagementsResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE statut = 'en_attente_dg') as en_attente,
        COUNT(*) FILTER (WHERE statut = 'valide') as valides,
        COUNT(*) FILTER (WHERE statut = 'rejete') as rejetes,
        COALESCE(SUM(montant) FILTER (WHERE statut = 'valide'), 0) as montant_valide
      FROM engagements
    `);

    // Budget global par EPA
    const budgetsResult = await pool.query(`
      SELECT
        epa.id, epa.code, epa.nom, epa.secteur,
        COALESCE(epa.statut, 'actif') as statut,
        b.annee, b.statut as budget_statut,
        COALESCE(SUM(cb.ae_alloue), 0) as budget_total,
        COALESCE(SUM(cb.ae_engage), 0) as engage_total,
        COALESCE(SUM(cb.cp_paye), 0) as paye_total,
        COUNT(DISTINCT u.id) as nb_utilisateurs
      FROM epa
      LEFT JOIN budgets b ON b.epa_id = epa.id AND b.statut = 'actif'
      LEFT JOIN chapitres_budgetaires cb ON cb.id_budget = b.id
      LEFT JOIN utilisateurs u ON u.epa_id = epa.id AND u.statut = 'actif'
      GROUP BY epa.id, epa.code, epa.nom, epa.secteur, epa.statut, b.annee, b.statut
      ORDER BY epa.nom
    `);

    // Dernières connexions (journal_audit)
    const connexionsResult = await pool.query(`
      SELECT ja.*, u.nom || ' ' || u.prenom as utilisateur_nom, r.nom as role_nom
      FROM journal_audit ja
      JOIN utilisateurs u ON ja.id_utilisateur = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE ja.ressource = 'connexion'
      ORDER BY ja.date_heure DESC
      LIMIT 10
    `);

    // Alertes système
    const alertesResult = await pool.query(`
      SELECT * FROM alertes
      WHERE lue = false
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      epa: epaResult.rows[0],
      utilisateurs: usersResult.rows,
      engagements: engagementsResult.rows[0],
      budgetsParEpa: budgetsResult.rows,
      dernieresConnexions: connexionsResult.rows,
      alertes: alertesResult.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// GESTION EPA — CRUD complet
// ============================================================
router.get('/epa', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        epa.*,
        COALESCE(epa.statut, 'actif') as statut,
        COUNT(DISTINCT u.id) as nb_utilisateurs,
        COUNT(DISTINCT b.id) as nb_budgets,
        b_actif.annee as budget_annee_actif,
        b_actif.statut as budget_statut_actif,
        COALESCE(SUM(cb.ae_alloue), 0) as budget_total
      FROM epa
      LEFT JOIN utilisateurs u ON u.epa_id = epa.id AND u.statut = 'actif'
      LEFT JOIN budgets b ON b.epa_id = epa.id
      LEFT JOIN budgets b_actif ON b_actif.epa_id = epa.id AND b_actif.statut = 'actif'
      LEFT JOIN chapitres_budgetaires cb ON cb.id_budget = b_actif.id
      GROUP BY epa.id, epa.code, epa.nom, epa.secteur, epa.statut, epa.created_at, b_actif.annee, b_actif.statut
      ORDER BY epa.nom
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/epa/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const epaResult = await pool.query('SELECT * FROM epa WHERE id = $1', [id]);
    if (epaResult.rows.length === 0) {
      return res.status(404).json({ message: 'EPA non trouvée' });
    }

    const utilisateursResult = await pool.query(`
      SELECT u.id, u.nom, u.prenom, u.email, u.statut, r.nom as role_nom, r.code as role_code
      FROM utilisateurs u
      JOIN roles r ON u.role_id = r.id
      WHERE u.epa_id = $1
      ORDER BY r.code, u.nom
    `, [id]);

    const budgetsResult = await pool.query(
      'SELECT * FROM budgets WHERE epa_id = $1 ORDER BY annee DESC',
      [id]
    );

    const statsResult = await pool.query(`
      SELECT
        COUNT(DISTINCT e.id) as nb_engagements,
        COALESCE(SUM(e.montant) FILTER (WHERE e.statut = 'valide'), 0) as montant_valide,
        COUNT(*) FILTER (WHERE e.statut = 'valide') as nb_valides
      FROM engagements e
      WHERE e.epa_id = $1
    `, [id]);

    res.json({
      epa: epaResult.rows[0],
      utilisateurs: utilisateursResult.rows,
      budgets: budgetsResult.rows,
      statistiques: statsResult.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/epa', auditLogger('epa'), async (req, res) => {
  try {
    const { code, nom, secteur, description } = req.body;

    if (!code || !nom) {
      return res.status(400).json({ message: 'Le code et le nom sont obligatoires' });
    }

    const existing = await pool.query('SELECT id FROM epa WHERE code = $1', [code]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: `Le code EPA "${code}" existe déjà` });
    }

    const result = await pool.query(
      `INSERT INTO epa (code, nom, secteur, statut)
       VALUES ($1, $2, $3, 'actif')
       RETURNING *`,
      [code.toUpperCase(), nom, secteur || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.put('/epa/:id', auditLogger('epa'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, secteur, description } = req.body;

    const result = await pool.query(
      `UPDATE epa SET nom = $1, secteur = $2 WHERE id = $3 RETURNING *`,
      [nom, secteur || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'EPA non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.patch('/epa/:id/statut', auditLogger('epa'), async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['actif', 'inactif'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide. Valeurs : actif | inactif' });
    }

    const result = await pool.query(
      'UPDATE epa SET statut = $1 WHERE id = $2 RETURNING *',
      [statut, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'EPA non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// GESTION UTILISATEURS — CRUD complet
// ============================================================
router.get('/utilisateurs', async (req, res) => {
  try {
    const { role, epa_id, statut, search } = req.query;

    let query = `
      SELECT
        u.id, u.nom, u.prenom, u.email, u.statut,
        u.epa_id, u.direction_id, u.created_at, u.updated_at,
        r.id as role_id, r.code as role_code, r.nom as role_nom,
        epa.nom as epa_nom, epa.code as epa_code,
        (
          SELECT MAX(ja.date_heure)
          FROM journal_audit ja
          WHERE ja.id_utilisateur = u.id AND ja.ressource = 'connexion'
        ) as derniere_connexion
      FROM utilisateurs u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN epa ON u.epa_id = epa.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (role) {
      query += ` AND r.code = $${idx++}`;
      params.push(role);
    }
    if (epa_id) {
      query += ` AND u.epa_id = $${idx++}`;
      params.push(epa_id);
    }
    if (statut) {
      query += ` AND u.statut = $${idx++}`;
      params.push(statut);
    }
    if (search) {
      query += ` AND (u.nom ILIKE $${idx} OR u.prenom ILIKE $${idx} OR u.email ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    query += ' ORDER BY u.nom, u.prenom';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/utilisateurs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT u.*, r.id as role_id, r.code as role_code, r.nom as role_nom,
        epa.nom as epa_nom
      FROM utilisateurs u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN epa ON u.epa_id = epa.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Historique connexions
    const connexions = await pool.query(`
      SELECT date_heure, ip_adresse
      FROM journal_audit
      WHERE id_utilisateur = $1 AND ressource = 'connexion'
      ORDER BY date_heure DESC
      LIMIT 10
    `, [id]);

    res.json({ ...result.rows[0], connexions: connexions.rows });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/utilisateurs', auditLogger('utilisateurs'), async (req, res) => {
  try {
    const { nom, prenom, email, role_id, epa_id, direction_id, mot_de_passe } = req.body;

    if (!nom || !prenom || !email || !role_id || !mot_de_passe) {
      return res.status(400).json({
        message: 'Champs obligatoires : nom, prenom, email, role_id, mot_de_passe'
      });
    }

    // Vérifier unicité email
    const existing = await pool.query('SELECT id FROM utilisateurs WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: `L'email "${email}" est déjà utilisé` });
    }

    // Vérifier que le rôle existe
    const roleCheck = await pool.query('SELECT id FROM roles WHERE id = $1', [role_id]);
    if (roleCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const result = await pool.query(
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id, epa_id, direction_id, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'actif')
       RETURNING id, nom, prenom, email, statut, role_id, epa_id, direction_id, created_at`,
      [nom, prenom, email.toLowerCase(), hashedPassword, role_id, epa_id || null, direction_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.put('/utilisateurs/:id', auditLogger('utilisateurs'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, role_id, epa_id, direction_id } = req.body;

    // Vérifier unicité email (hors cet utilisateur)
    if (email) {
      const existing = await pool.query(
        'SELECT id FROM utilisateurs WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: `L'email "${email}" est déjà utilisé` });
      }
    }

    const result = await pool.query(
      `UPDATE utilisateurs
       SET nom = COALESCE($1, nom),
           prenom = COALESCE($2, prenom),
           email = COALESCE($3, email),
           role_id = COALESCE($4, role_id),
           epa_id = $5,
           direction_id = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, nom, prenom, email, statut, role_id, epa_id, direction_id`,
      [nom, prenom, email, role_id, epa_id || null, direction_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.patch('/utilisateurs/:id/statut', auditLogger('utilisateurs'), async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['actif', 'inactif'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide. Valeurs : actif | inactif' });
    }

    // Empêcher de désactiver son propre compte
    if (req.user.id === id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas désactiver votre propre compte' });
    }

    const result = await pool.query(
      `UPDATE utilisateurs SET statut = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING id, nom, prenom, email, statut`,
      [statut, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/utilisateurs/:id/reset-password', auditLogger('utilisateurs'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nouveau_mot_de_passe } = req.body;

    const mdp = nouveau_mot_de_passe || genererMotDePasse();
    const hashed = await bcrypt.hash(mdp, 10);

    const result = await pool.query(
      `UPDATE utilisateurs SET mot_de_passe = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING id, nom, prenom, email`,
      [hashed, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      ...result.rows[0],
      mot_de_passe_temporaire: mdp,
      message: 'Mot de passe réinitialisé. Communiquez-le à l\'utilisateur de façon sécurisée.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// GESTION RÔLES — Lecture seule + stats
// ============================================================
router.get('/roles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*,
        COUNT(u.id) as nb_utilisateurs,
        COUNT(u.id) FILTER (WHERE u.statut = 'actif') as nb_actifs
      FROM roles r
      LEFT JOIN utilisateurs u ON u.role_id = r.id
      GROUP BY r.id
      ORDER BY r.code
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// JOURNAL D'ACTIVITÉ — Audit global filtrable
// ============================================================
router.get('/journal', async (req, res) => {
  try {
    const { ressource, action, date_debut, date_fin, id_utilisateur, epa_id, search } = req.query;

    let query = `
      SELECT ja.*, u.nom || ' ' || u.prenom as utilisateur_nom,
        r.nom as role_nom, r.code as role_code,
        epa.nom as epa_nom
      FROM journal_audit ja
      JOIN utilisateurs u ON ja.id_utilisateur = u.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN epa ON u.epa_id = epa.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (ressource) {
      query += ` AND ja.ressource = $${idx++}`;
      params.push(ressource);
    }
    if (action) {
      query += ` AND ja.action = $${idx++}`;
      params.push(action);
    }
    if (date_debut) {
      query += ` AND ja.date_heure >= $${idx++}`;
      params.push(date_debut);
    }
    if (date_fin) {
      query += ` AND ja.date_heure <= $${idx++}`;
      params.push(date_fin + ' 23:59:59');
    }
    if (id_utilisateur) {
      query += ` AND ja.id_utilisateur = $${idx++}`;
      params.push(id_utilisateur);
    }
    if (epa_id) {
      query += ` AND u.epa_id = $${idx++}`;
      params.push(epa_id);
    }

    query += ' ORDER BY ja.date_heure DESC LIMIT 500';

    const result = await pool.query(query, params);

    // Stats
    const statsResult = await pool.query(`
      SELECT action, COUNT(*) as total
      FROM journal_audit
      WHERE date_heure >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY action
    `);

    res.json({ journal: result.rows, stats: statsResult.rows });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// CONFIGURATION SYSTÈME
// ============================================================
router.get('/configuration', async (req, res) => {
  try {
    // Années budgétaires par EPA
    const anneesResult = await pool.query(`
      SELECT b.*, epa.nom as epa_nom
      FROM budgets b
      JOIN epa ON b.epa_id = epa.id
      ORDER BY b.annee DESC, epa.nom
    `);

    // Secteurs disponibles
    const secteursResult = await pool.query(
      'SELECT DISTINCT secteur FROM epa WHERE secteur IS NOT NULL ORDER BY secteur'
    );

    // Stats globales
    const statsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM epa) as nb_epa,
        (SELECT COUNT(*) FROM utilisateurs WHERE statut = 'actif') as nb_utilisateurs_actifs,
        (SELECT COUNT(*) FROM engagements WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as nb_engagements_mois,
        (SELECT COUNT(*) FROM journal_audit WHERE date_heure >= CURRENT_DATE - INTERVAL '24 hours') as nb_actions_jour
    `);

    res.json({
      annees_budgetaires: anneesResult.rows,
      secteurs: secteursResult.rows.map(s => s.secteur),
      statistiques: statsResult.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Mettre à jour statut d'un budget
router.patch('/budgets/:id/statut', auditLogger('budgets'), async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const validStatuts = ['preparation', 'approuve', 'actif', 'cloture'];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({ message: `Statut invalide. Valeurs : ${validStatuts.join(', ')}` });
    }

    // Si activation, désactiver les autres budgets du même EPA pour la même année
    if (statut === 'actif') {
      const budget = await pool.query('SELECT * FROM budgets WHERE id = $1', [id]);
      if (budget.rows.length > 0) {
        await pool.query(
          `UPDATE budgets SET statut = 'cloture' WHERE epa_id = $1 AND annee = $2 AND id != $3 AND statut = 'actif'`,
          [budget.rows[0].epa_id, budget.rows[0].annee, id]
        );
      }
    }

    const result = await pool.query(
      `UPDATE budgets SET statut = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [statut, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Budget non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// STATISTIQUES GLOBALES
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM epa WHERE COALESCE(statut, 'actif') = 'actif') as epa_actives,
        (SELECT COUNT(*) FROM utilisateurs WHERE statut = 'actif') as utilisateurs_actifs,
        (SELECT COUNT(*) FROM engagements WHERE statut = 'en_attente_dg') as engagements_en_attente,
        (SELECT COUNT(*) FROM engagements WHERE statut = 'valide') as engagements_valides,
        (SELECT COALESCE(SUM(montant), 0) FROM engagements WHERE statut = 'valide') as montant_total_valide,
        (SELECT COUNT(*) FROM journal_audit WHERE date_heure >= CURRENT_DATE) as actions_aujourd_hui
    `);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ============================================================
// Helpers
// ============================================================
function genererMotDePasse() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  let mdp = '';
  for (let i = 0; i < 10; i++) {
    mdp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return mdp;
}

module.exports = router;
