const pool = require('./config/database');

async function checkDashboardQueries() {
  const userId = '36557cea-2823-4b2e-afba-ebb8b03345b0';
  try {
    const currentMonthStats = await pool.query(`
      SELECT 
        COUNT(*) as approuves_mois,
        COALESCE(SUM(montant), 0) as montant_approuve_mois
      FROM engagements
      WHERE statut = 'valide'
        AND id_validateur_dg IS NOT NULL
        AND date_modification >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
        AND id_epa = (SELECT id_epa FROM utilisateurs WHERE id = $1)
    `, [userId]);
    console.log('Current Month Stats:', currentMonthStats.rows[0]);

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
    `, [userId]);
    console.log('Evolution:', evolutionResult.rows);

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
    `, [userId]);
    console.log('Programmes:', programmesResult.rows);

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
    `, [userId]);
    console.log('Historique approbations:', historiqueResult.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkDashboardQueries();
