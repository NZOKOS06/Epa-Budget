const pool = require('../config/database');

/**
 * Middleware de journalisation d'audit (RG-20)
 * Trace automatiquement toutes les opérations financières (POST, PUT, DELETE)
 * dans la table journal_audit.
 */
const auditLogger = (ressource) => {
  return async (req, res, next) => {
    // Ne tracer que les opérations d'écriture
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Sauvegarder la méthode send originale pour intercepter la réponse
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function(body) {
      res._auditBody = body;
      return originalSend.call(this, body);
    };

    res.json = function(body) {
      res._auditBody = body;
      return originalJson.call(this, body);
    };

    // Intercepter la fin de la réponse
    res.on('finish', async () => {
      try {
        // Ne loguer que les réponses réussies (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
          const action = req.method === 'POST' ? 'create' 
                       : req.method === 'DELETE' ? 'delete' 
                       : 'update';

          const ressourceId = req.params.id || 'new';
          const ipAdresse = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '0.0.0.0';

          await pool.query(
            `INSERT INTO journal_audit 
             (action, ressource, ressource_id, ancienne_valeur, nouvelle_valeur, ip_adresse, id_utilisateur)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              action,
              ressource,
              ressourceId.toString(),
              null, // ancienne_valeur — à enrichir si nécessaire
              JSON.stringify(req.body || {}),
              ipAdresse,
              req.user.id
            ]
          );
        }
      } catch (error) {
        // Ne pas bloquer la réponse en cas d'erreur d'audit
        console.error('Erreur journalisation audit:', error.message);
      }
    });

    next();
  };
};

module.exports = { auditLogger };
