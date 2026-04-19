const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getNotifications, markAsRead, markAllAsRead } = require('../services/notifications');

const router = express.Router();

router.use(authenticate);

// Récupérer les notifications
router.get('/', async (req, res) => {
  try {
    const { non_lues_seulement } = req.query;
    const notifications = await getNotifications(
      req.user.id,
      non_lues_seulement === 'true'
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Marquer une notification comme lue
router.put('/:id/lire', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await markAsRead(id, req.user.id);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Marquer toutes les notifications comme lues
router.put('/tout-lire', async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;

