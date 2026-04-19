const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    // Récupérer l'utilisateur avec son rôle
    // Uniquement avec statut 'actif' (Conforme Schéma V2)
    const result = await pool.query(
      `SELECT u.*, r.code as role_code, r.nom as role_nom 
       FROM utilisateurs u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1 AND u.statut = 'actif'`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Utilisateur non trouvé ou inactif' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide ou expiré', error: error.message });
  }
};

// Middleware RBAC pour vérifier les permissions par rôle
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    if (!allowedRoles.includes(req.user.role_code)) {
      return res.status(403).json({ 
        message: `Accès refusé. Rôle requis: ${allowedRoles.join(' ou ')}` 
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
