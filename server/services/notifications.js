const pool = require('../config/database');

/**
 * Émet une notification pour un rôle spécifique ou un utilisateur
 */
async function emitNotification({ role, userId, engagementId, message, titre, lien, client = null }) {
  const dbClient = client || pool;
  
  try {
    let query, params;

    if (role) {
      // Notification pour tous les utilisateurs d'un rôle
      query = `
        INSERT INTO notifications (id_utilisateur, type, titre, message, lien)
        SELECT u.id, 'WORKFLOW', $1, $2, $3
        FROM utilisateurs u
        JOIN roles r ON u.id_role = r.id
        WHERE r.code = $4 AND u.statut = 'actif'
      `;
      params = [titre || 'Notification workflow', message, lien || null, role];
    } else if (userId) {
      // Notification pour un utilisateur spécifique
      query = `
        INSERT INTO notifications (id_utilisateur, type, titre, message, lien)
        VALUES ($1, 'WORKFLOW', $2, $3, $4)
      `;
      params = [userId, titre || 'Notification workflow', message, lien || null];
    } else {
      throw new Error('role ou userId requis');
    }

    await dbClient.query(query, params);

    // Si engagementId fourni, créer le lien automatiquement
    let notificationLien = lien;
    if (engagementId && !lien) {
      notificationLien = `/engagements/${engagementId}`;
      await dbClient.query(
        `UPDATE notifications SET lien = $1 
         WHERE id IN (
           SELECT id FROM notifications 
           WHERE message = $2 
           ORDER BY date_creation DESC LIMIT 1
         )`,
        [notificationLien, message]
      );
    }

    // Émission temps réel via Socket.IO
    if (global.emitNotificationSocket) {
      if (userId) {
        global.emitNotificationSocket(userId, { titre, message, lien: notificationLien });
      } else if (role) {
        // Récupérer les IDs des utilisateurs du rôle pour émettre
        const usersInRole = await pool.query(
          "SELECT u.id FROM utilisateurs u JOIN roles r ON u.id_role = r.id WHERE r.code = $1 AND u.statut = 'actif'",
          [role]
        );
        usersInRole.rows.forEach(u => {
          global.emitNotificationSocket(u.id, { titre, message, lien: notificationLien });
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur émission notification:', error);
    throw error;
  }
}

/**
 * Récupère les notifications d'un utilisateur
 */
async function getNotifications(userId, nonLuesSeulement = false) {
  let query = `
    SELECT * FROM notifications 
    WHERE id_utilisateur = $1
  `;
  const params = [userId];

  if (nonLuesSeulement) {
    query += ' AND lue = false';
  }

  query += ' ORDER BY date_creation DESC LIMIT 50';

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Marque une notification comme lue
 */
async function markAsRead(notificationId, userId) {
  const result = await pool.query(
    'UPDATE notifications SET lue = true WHERE id = $1 AND id_utilisateur = $2 RETURNING *',
    [notificationId, userId]
  );
  return result.rows[0];
}

/**
 * Marque toutes les notifications comme lues
 */
async function markAllAsRead(userId) {
  await pool.query(
    'UPDATE notifications SET lue = true WHERE id_utilisateur = $1 AND lue = false',
    [userId]
  );
}

module.exports = {
  emitNotification,
  getNotifications,
  markAsRead,
  markAllAsRead
};

