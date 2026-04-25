-- ============================================================
-- MIGRATION ADMIN — Module Administrateur Système
-- À exécuter APRÈS le schema_v2.sql initial
-- ============================================================

-- 1. Ajouter colonne 'statut' à la table EPA (si absente)
ALTER TABLE epa ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'actif'
  CHECK (statut IN ('actif', 'inactif'));

-- 2. S'assurer que le rôle ADMIN existe
INSERT INTO roles (code, nom, description, permissions) VALUES
('ADMIN', 'Administrateur Système', 'Gestion complète de la plateforme : EPA, utilisateurs, configuration',
  '{
    "gerer_epa": true,
    "gerer_utilisateurs": true,
    "gerer_roles": true,
    "voir_journal_global": true,
    "configurer_systeme": true
  }'::jsonb)
ON CONFLICT (code) DO UPDATE
  SET permissions = EXCLUDED.permissions,
      description = EXCLUDED.description;

-- 3. Créer le compte Administrateur par défaut
-- Mot de passe par défaut : Admin2026! (à changer immédiatement après installation)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id, statut)
SELECT
  'Système',
  'Admin',
  'admin@epa-budget.cg',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHG', -- bcrypt de 'Admin2026!'
  r.id,
  'actif'
FROM roles r
WHERE r.code = 'ADMIN'
ON CONFLICT (email) DO NOTHING;

-- 4. Initialiser la colonne statut pour les EPA existantes
UPDATE epa SET statut = 'actif' WHERE statut IS NULL;

-- 5. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '=== Migration Admin terminée ===';
  RAISE NOTICE 'Email admin : admin@epa-budget.cg';
  RAISE NOTICE 'Mot de passe initial : Admin2026!';
  RAISE NOTICE 'CHANGEZ CE MOT DE PASSE IMMÉDIATEMENT !';
END $$;
