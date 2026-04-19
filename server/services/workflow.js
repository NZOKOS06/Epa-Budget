const pool = require('../config/database');
const { emitNotification } = require('./notifications');

// ============================================================
// WORKFLOW CONFORME AU CAHIER DES CHARGES DGTT
// Circuit: Chef de Service → Contrôleur Budgétaire → DG
// ============================================================

// Matrice de transitions conforme au cahier des charges et à la documentation DAF
const WORKFLOW_TRANSITIONS = {
  'brouillon': {
    allowedRoles: ['SERVICE'],
    nextStates: ['soumise_daf'],
    label: 'Soumettre au DAF',
    notifications: [
      { role: 'DAF', message: "Nouvelle demande d'engagement soumise par un service" }
    ]
  },
  'soumise_daf': {
    allowedRoles: ['DAF'],
    nextStates: ['en_attente_cb', 'brouillon'],
    label: 'Valider et transmettre au CB',
    notifications: [
      { role: 'CONTROLEUR', message: "Engagement transmis par le DAF pour visa" },
      { role: 'SERVICE', message: "Engagement retourné pour complément d'information", condition: 'brouillon' }
    ]
  },
  'en_attente_cb': {
    allowedRoles: ['CONTROLEUR'],
    nextStates: ['en_attente_dg', 'rejete'],
    label: 'Émettre un avis',
    notifications: [
      { role: 'DG', message: 'Engagement avec avis favorable — validation requise', condition: 'en_attente_dg' },
      { role: 'SERVICE', message: 'Demande rejetée par le Contrôleur Budgétaire', condition: 'rejete' }
    ]
  },
  'en_attente_dg': {
    allowedRoles: ['DG'],
    nextStates: ['valide', 'rejete'],
    label: 'Valider ou rejeter',
    notifications: [
      { role: 'SERVICE', message: 'Engagement validé par le Directeur Général', condition: 'valide' },
      { role: 'DAF', message: 'Engagement validé — liquidation possible', condition: 'valide' },
      { role: 'SERVICE', message: 'Demande rejetée par le Directeur Général', condition: 'rejete' }
    ]
  },
  'valide': {
    allowedRoles: ['DAF'],
    nextStates: ['liquide'],
    label: 'Liquider',
    notifications: [
      { role: 'COMPTABLE', message: 'Liquidation en attente de validation', condition: 'liquide' }
    ]
  },
  'liquide': {
    allowedRoles: [],
    nextStates: [],
    label: 'Terminal — en attente paiement via liquidation',
    notifications: []
  },
  'rejete': {
    allowedRoles: [],
    nextStates: [],
    label: 'Terminal — Définitivement rejeté',
    notifications: []
  }
};

/**
 * Change le statut d'un engagement selon les règles de workflow
 * RG-03: Circuit séquentiel CS → CB → DG
 * RG-04: Avis défavorable CB bloque définitivement
 * RG-05: Déduction atomique du solde après validation DG
 * RG-07: Motif obligatoire pour tout rejet
 */
async function changeStatutEngagement(engagementId, nouveauStatut, acteurId, commentaire = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Récupérer l'engagement actuel avec verrou (RG-05: atomicité)
    const engagementResult = await client.query(
      'SELECT * FROM engagements WHERE id = $1 FOR UPDATE',
      [engagementId]
    );

    if (engagementResult.rows.length === 0) {
      throw new Error('Engagement non trouvé');
    }

    const engagement = engagementResult.rows[0];
    const ancienStatut = engagement.statut;

    // Vérifier que la transition est autorisée
    const transition = WORKFLOW_TRANSITIONS[ancienStatut];
    if (!transition || !transition.nextStates.includes(nouveauStatut)) {
      throw new Error(`Transition non autorisée de "${ancienStatut}" vers "${nouveauStatut}"`);
    }

    // Vérifier le rôle de l'acteur
    const acteurResult = await client.query(
      `SELECT u.*, r.code as role_code FROM utilisateurs u 
       JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
      [acteurId]
    );
    
    if (acteurResult.rows.length === 0) {
      throw new Error('Acteur non trouvé');
    }

    const acteurRole = acteurResult.rows[0].role_code;
    if (!transition.allowedRoles.includes(acteurRole)) {
      throw new Error(`Rôle "${acteurRole}" non autorisé pour cette transition. Rôles autorisés: ${transition.allowedRoles.join(', ')}`);
    }

    // RG-07: Motif obligatoire pour tout rejet
    if (nouveauStatut === 'rejete') {
      if (!commentaire || commentaire.trim() === '') {
        throw new Error('Le motif de rejet est obligatoire (RG-07)');
      }
    }

    // ============================================================
    // RG-01: Vérifier que le budget est actif avant soumission
    // ============================================================
    if (ancienStatut === 'brouillon' && nouveauStatut === 'en_attente_cb') {
      const budgetCheck = await client.query(`
        SELECT b.statut FROM budgets b
        JOIN chapitres_budgetaires cb ON cb.id_budget = b.id
        JOIN articles_budgetaires ab ON ab.id_chapitre = cb.id
        WHERE ab.id = $1
      `, [engagement.id_article_budgetaire]);

      if (budgetCheck.rows.length === 0 || budgetCheck.rows[0].statut !== 'actif') {
        throw new Error('Le budget annuel doit être au statut "actif" pour soumettre un engagement (RG-01)');
      }
    }

    // ============================================================
    // RG-05: Déduction atomique du solde après validation DG
    // ============================================================
    if (nouveauStatut === 'valide') {
      // Verrouiller l'article budgétaire
      const articleResult = await client.query(
        'SELECT * FROM articles_budgetaires WHERE id = $1 FOR UPDATE',
        [engagement.id_article_budgetaire]
      );

      if (articleResult.rows.length === 0) {
        throw new Error('Article budgétaire non trouvé');
      }

      const article = articleResult.rows[0];
      const soldeDisponible = parseFloat(article.ae_initial) - parseFloat(article.ae_engage);

      // RG-02: Vérifier le solde disponible
      if (parseFloat(engagement.montant) > soldeDisponible) {
        throw new Error(
          `Solde insuffisant sur l'article ${article.code}. ` +
          `Solde disponible: ${soldeDisponible} FCFA, Montant demandé: ${engagement.montant} FCFA (RG-02)`
        );
      }

      // Déduire le montant engagé (opération atomique)
      await client.query(
        `UPDATE articles_budgetaires 
         SET ae_engage = ae_engage + $1, cp_engage = cp_engage + $1 
         WHERE id = $2`,
        [engagement.montant, engagement.id_article_budgetaire]
      );

      // Mettre à jour le chapitre budgétaire
      await client.query(
        `UPDATE chapitres_budgetaires 
         SET ae_engage = ae_engage + $1 
         WHERE id = (SELECT id_chapitre FROM articles_budgetaires WHERE id = $2)`,
        [engagement.montant, engagement.id_article_budgetaire]
      );
    }

    // ============================================================
    // Mise à jour du statut de l'engagement
    // ============================================================
    let updateQuery = 'UPDATE engagements SET statut = $1';
    let updateParams = [nouveauStatut];

    if (nouveauStatut === 'valide') {
      updateQuery += ', id_validateur_dg = $3';
      updateParams.push(engagementId, acteurId);
    } else if (nouveauStatut === 'rejete') {
      updateQuery += ', motif_rejet = $3';
      updateParams.push(engagementId, commentaire);
    } else {
      updateParams.push(engagementId);
    }

    updateQuery += ` WHERE id = $2`;
    await client.query(updateQuery, updateParams);

    // Enregistrer dans l'historique workflow
    await client.query(
      `INSERT INTO workflow_history (engagement_id, ancien_statut, nouveau_statut, acteur_id, commentaire)
       VALUES ($1, $2, $3, $4, $5)`,
      [engagementId, ancienStatut, nouveauStatut, acteurId, commentaire]
    );

    // ============================================================
    // Journal d'audit (RG-20)
    // ============================================================
    await client.query(
      `INSERT INTO journal_audit (action, ressource, ressource_id, ancienne_valeur, nouvelle_valeur, ip_adresse, id_utilisateur)
       VALUES ('update', 'engagements', $1, $2, $3, $4, $5)`,
      [
        engagementId.toString(),
        JSON.stringify({ statut: ancienStatut }),
        JSON.stringify({ statut: nouveauStatut, commentaire }),
        '0.0.0.0', // IP sera passée par le middleware
        acteurId
      ]
    );

    // Envoyer les notifications
    const notifications = transition.notifications || [];
    for (const notif of notifications) {
      if (!notif.condition || notif.condition === nouveauStatut) {
        await emitNotification({
          role: notif.role,
          engagementId,
          message: notif.message,
          client
        });
      }
    }

    await client.query('COMMIT');

    return {
      success: true,
      ancienStatut,
      nouveauStatut,
      engagementId
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Récupère l'historique workflow d'un engagement
 */
async function getWorkflowHistory(engagementId) {
  const result = await pool.query(
    `SELECT wh.*, u.nom || ' ' || u.prenom as acteur_nom, r.nom as acteur_role
     FROM workflow_history wh
     JOIN utilisateurs u ON wh.acteur_id = u.id
     JOIN roles r ON u.role_id = r.id
     WHERE wh.engagement_id = $1
     ORDER BY wh.created_at ASC`,
    [engagementId]
  );

  return result.rows;
}

module.exports = {
  changeStatutEngagement,
  getWorkflowHistory,
  WORKFLOW_TRANSITIONS
};
