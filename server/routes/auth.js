const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Connexion
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password;
    console.log(`[AUTH] Tentative: ${email} | PWD_LEN: ${password?.length}`);
    if (password && password.length > 0) {
      console.log(`[AUTH] PWD_CHARS: ${password.charCodeAt(0)} ... ${password.charCodeAt(password.length - 1)}`);
    }

    const result = await pool.query(
      `SELECT u.*, r.code as role_code, r.nom as role_nom 
       FROM utilisateurs u 
       JOIN roles r ON u.role_id = r.id 
       WHERE LOWER(u.email) = LOWER($1) AND u.statut = 'actif'`,
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`[AUTH] Échec: Utilisateur non trouvé ou inactif (${email})`);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];
    console.log(`[AUTH] Utilisateur trouvé: ${user.email} (Rôle: ${user.role_code})`);
    
    // Compatible avec les deux noms de colonnes (ancien: password_hash, nouveau: mot_de_passe)
    const hashedPassword = user.mot_de_passe || user.password_hash;
    const isValid = await bcrypt.compare(password, hashedPassword);

    if (!isValid) {
      console.log(`[AUTH] Échec: Mot de passe incorrect pour ${email}`);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    console.log(`[AUTH] Connexion réussie pour ${email}`);

    // JWT avec durée limitée à 8h (exigence cahier des charges)
    const token = jwt.sign(
      { userId: user.id, role: user.role_code },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '8h' }
    );

    // Journal d'audit — tracer la connexion
    try {
      await pool.query(
        `INSERT INTO journal_audit (action, ressource, ressource_id, nouvelle_valeur, ip_adresse, id_utilisateur)
         VALUES ('view', 'connexion', $1, $2, $3, $4)`,
        [
          user.id.toString(),
          JSON.stringify({ email: user.email, role: user.role_code }),
          req.ip || req.headers['x-forwarded-for'] || '0.0.0.0',
          user.id
        ]
      );
    } catch (auditError) {
      // Ne pas bloquer la connexion si le journal d'audit échoue
      console.error('Erreur journal audit login:', auditError.message);
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role_code,
        role_nom: user.role_nom
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Récupérer l'utilisateur connecté
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      nom: req.user.nom,
      prenom: req.user.prenom,
      role: req.user.role_code,
      role_nom: req.user.role_nom
    }
  });
});

module.exports = router;
