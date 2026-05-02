-- ============================================================
-- SCRIPT D'INITIALISATION COMPLET EPA-BUDGET
-- PostgreSQL - Exécuter ce fichier pour créer toute la base
-- ============================================================
-- Ordre d'exécution:
-- 1. Schéma principal V2
-- 2. Tables complémentaires
-- 3. Workflow de clôture
-- 4. Migration admin
-- 5. Données de test (optionnel)
-- ============================================================

\echo '========================================'
\echo 'DÉBUT INITIALISATION EPA-BUDGET'
\echo '========================================'

-- ============================================================
-- ÉTAPE 1: SCHÉMA PRINCIPAL V2
-- ============================================================
\echo '-> Exécution du schéma principal V2...'

-- Extension pour UUID (conservé pour compatibilité)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb
);

-- Insertion des rôles conformes au cahier des charges
INSERT INTO roles (code, nom, description, permissions) VALUES
('DG', 'Directeur Général', 'Ordonnateur — Valide les engagements, approuve le budget', 
  '{"valider_budget": true, "valider_engagement": true, "consulter_rapports": true, "compte_administratif": true, "compte_gestion": true}'::jsonb),
('DAF', 'Directeur Administratif et Financier', 'Gestion budgétaire — Crée/modifie le budget, liquide les dépenses', 
  '{"creer_budget": true, "modifier_budget": true, "liquider_depense": true, "consulter_rapports": true, "compte_administratif": true}'::jsonb),
('CONTROLEUR', 'Contrôleur Budgétaire', 'Émet des avis sur les engagements', 
  '{"emettre_avis": true}'::jsonb),
('COMPTABLE', 'Agent Comptable', 'Comptabilité — Enregistre recettes et paiements, valide liquidations', 
  '{"valider_liquidation": true, "enregistrer_recette": true, "enregistrer_paiement": true, "consulter_rapports": true, "compte_gestion": true}'::jsonb),
('SERVICE', 'Chef de Service', 'Initie les demandes d''engagement', 
  '{"initier_engagement": true, "consulter_budget": true}'::jsonb),
('ADMIN', 'Administrateur Système', 'Gestion des utilisateurs et configuration', 
  '{"gerer_utilisateurs": true, "gerer_roles": true}'::jsonb)
ON CONFLICT (code) DO UPDATE SET permissions = EXCLUDED.permissions, description = EXCLUDED.description;

-- ============================================================
-- TABLE: utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
    id_role INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    id_epa INTEGER,
    id_direction INTEGER,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(id_role);

-- ============================================================
-- TABLE: epa
-- ============================================================
CREATE TABLE IF NOT EXISTS epa (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    secteur VARCHAR(100),
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: budgets
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    annee INTEGER NOT NULL,
    UNIQUE (annee, id_epa),
    montant_previsionnel DECIMAL(15,2) NOT NULL CHECK (montant_previsionnel > 0),
    statut VARCHAR(20) NOT NULL DEFAULT 'preparation' 
        CHECK (statut IN ('preparation', 'approuve', 'actif', 'cloture')),
    id_epa INTEGER NOT NULL REFERENCES epa(id) ON DELETE RESTRICT,
    cree_par UUID REFERENCES utilisateurs(id),
    approuve_par UUID REFERENCES utilisateurs(id),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: chapitres_budgetaires
-- ============================================================
CREATE TABLE IF NOT EXISTS chapitres_budgetaires (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    ae_alloue DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (ae_alloue >= 0),
    cp_alloue DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (cp_alloue >= 0),
    ae_engage DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (ae_engage >= 0),
    cp_paye DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (cp_paye >= 0),
    id_budget INTEGER NOT NULL REFERENCES budgets(id) ON DELETE RESTRICT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: articles_budgetaires
-- ============================================================
CREATE TABLE IF NOT EXISTS articles_budgetaires (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    ae_initial DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (ae_initial >= 0),
    cp_initial DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (cp_initial >= 0),
    ae_engage DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (ae_engage >= 0),
    cp_engage DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (cp_engage >= 0),
    ae_liquide DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (ae_liquide >= 0),
    cp_liquide DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (cp_liquide >= 0),
    ae_paye DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (ae_paye >= 0),
    cp_paye DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (cp_paye >= 0),
    ae_disponible DECIMAL(15,2) GENERATED ALWAYS AS (ae_initial - ae_engage) STORED,
    cp_disponible DECIMAL(15,2) GENERATED ALWAYS AS (cp_initial - cp_paye) STORED,
    id_chapitre INTEGER NOT NULL REFERENCES chapitres_budgetaires(id) ON DELETE RESTRICT,
    id_direction INTEGER,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_chapitre ON articles_budgetaires(id_chapitre);

-- ============================================================
-- TABLE: engagements
-- ============================================================
CREATE TABLE IF NOT EXISTS engagements (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    objet TEXT NOT NULL,
    montant DECIMAL(15,2) NOT NULL CHECK (montant > 0),
    statut VARCHAR(30) NOT NULL DEFAULT 'brouillon'
        CHECK (statut IN ('brouillon', 'soumise_daf', 'en_attente_cb', 'en_attente_dg', 'valide', 'rejete', 'liquide')),
    motif_rejet TEXT,
    id_article INTEGER NOT NULL REFERENCES articles_budgetaires(id) ON DELETE RESTRICT,
    id_demandeur UUID NOT NULL REFERENCES utilisateurs(id),
    id_validateur_dg UUID REFERENCES utilisateurs(id),
    id_epa INTEGER REFERENCES epa(id) ON DELETE RESTRICT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: motif_rejet obligatoire si statut = 'rejete'
CREATE OR REPLACE FUNCTION check_motif_rejet()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'rejete' AND (NEW.motif_rejet IS NULL OR TRIM(NEW.motif_rejet) = '') THEN
        RAISE EXCEPTION 'Le motif de rejet est obligatoire quand le statut est "rejete"';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_motif_rejet ON engagements;
CREATE TRIGGER trg_check_motif_rejet
    BEFORE INSERT OR UPDATE ON engagements
    FOR EACH ROW EXECUTE FUNCTION check_motif_rejet();

CREATE INDEX IF NOT EXISTS idx_engagements_statut ON engagements(statut);
CREATE INDEX IF NOT EXISTS idx_engagements_demandeur ON engagements(id_demandeur);
CREATE INDEX IF NOT EXISTS idx_engagements_article ON engagements(id_article);

-- ============================================================
-- TABLE: avis_controle
-- ============================================================
CREATE TABLE IF NOT EXISTS avis_controle (
    id SERIAL PRIMARY KEY,
    date_avis TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type_avis VARCHAR(20) NOT NULL CHECK (type_avis IN ('favorable', 'defavorable')),
    commentaire TEXT,
    id_engagement INTEGER NOT NULL REFERENCES engagements(id) ON DELETE RESTRICT,
    id_controleur UUID NOT NULL REFERENCES utilisateurs(id),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: commentaire obligatoire si avis défavorable
CREATE OR REPLACE FUNCTION check_commentaire_avis()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type_avis = 'defavorable' AND (NEW.commentaire IS NULL OR TRIM(NEW.commentaire) = '') THEN
        RAISE EXCEPTION 'Le commentaire est obligatoire pour un avis défavorable';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_commentaire_avis ON avis_controle;
CREATE TRIGGER trg_check_commentaire_avis
    BEFORE INSERT OR UPDATE ON avis_controle
    FOR EACH ROW EXECUTE FUNCTION check_commentaire_avis();

CREATE INDEX IF NOT EXISTS idx_avis_engagement ON avis_controle(id_engagement);

-- ============================================================
-- TABLE: liquidations
-- ============================================================
CREATE TABLE IF NOT EXISTS liquidations (
    id SERIAL PRIMARY KEY,
    montant_facture DECIMAL(15,2) NOT NULL CHECK (montant_facture > 0),
    montant_liquide DECIMAL(15,2) NOT NULL CHECK (montant_liquide > 0),
    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente'
        CHECK (statut IN ('en_attente', 'validee', 'payee')),
    chemin_facture VARCHAR(500),
    chemin_pv_service_fait VARCHAR(500),
    id_engagement INTEGER NOT NULL UNIQUE REFERENCES engagements(id) ON DELETE RESTRICT,
    id_validateur_ac UUID REFERENCES utilisateurs(id),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: montant_liquide <= montant engagé
CREATE OR REPLACE FUNCTION check_montant_liquidation()
RETURNS TRIGGER AS $$
DECLARE
    v_montant_engage DECIMAL(15,2);
BEGIN
    SELECT montant INTO v_montant_engage FROM engagements WHERE id = NEW.id_engagement;
    IF NEW.montant_liquide > v_montant_engage THEN
        RAISE EXCEPTION 'Le montant liquidé (%) ne peut pas dépasser le montant engagé (%)', 
            NEW.montant_liquide, v_montant_engage;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_montant_liquidation ON liquidations;
CREATE TRIGGER trg_check_montant_liquidation
    BEFORE INSERT OR UPDATE ON liquidations
    FOR EACH ROW EXECUTE FUNCTION check_montant_liquidation();

-- ============================================================
-- TABLE: paiements
-- ============================================================
CREATE TABLE IF NOT EXISTS paiements (
    id SERIAL PRIMARY KEY,
    montant DECIMAL(15,2) NOT NULL CHECK (montant > 0),
    date_paiement DATE NOT NULL,
    mode_paiement VARCHAR(20) NOT NULL DEFAULT 'virement'
        CHECK (mode_paiement IN ('virement', 'cheque', 'especes')),
    numero_ordre VARCHAR(50) UNIQUE NOT NULL,
    id_liquidation INTEGER NOT NULL UNIQUE REFERENCES liquidations(id) ON DELETE RESTRICT,
    id_agent_comptable UUID NOT NULL REFERENCES utilisateurs(id),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: recettes
-- ============================================================
CREATE TABLE IF NOT EXISTS recettes (
    id SERIAL PRIMARY KEY,
    montant DECIMAL(15,2) NOT NULL CHECK (montant > 0),
    date_encaissement DATE NOT NULL,
    source VARCHAR(50) NOT NULL
        CHECK (source IN ('permis_conduire', 'carte_grise', 'licence_transport', 'agrement_auto_ecole')),
    numero_quittance VARCHAR(100) UNIQUE NOT NULL,
    reference_titre VARCHAR(100) NOT NULL,
    est_annulee BOOLEAN NOT NULL DEFAULT false,
    id_contre_passation INTEGER REFERENCES recettes(id),
    id_budget INTEGER NOT NULL REFERENCES budgets(id) ON DELETE RESTRICT,
    id_agent_comptable UUID NOT NULL REFERENCES utilisateurs(id),
    id_epa INTEGER REFERENCES epa(id) ON DELETE RESTRICT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recettes_quittance ON recettes(numero_quittance);

-- ============================================================
-- TABLE: journal_audit
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_audit (
    id SERIAL PRIMARY KEY,
    date_heure TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view')),
    ressource VARCHAR(100) NOT NULL,
    id_ressource VARCHAR(100) NOT NULL,
    ancienne_valeur JSONB,
    nouvelle_valeur JSONB,
    adresse_ip VARCHAR(45) NOT NULL,
    id_utilisateur UUID NOT NULL REFERENCES utilisateurs(id),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_audit_utilisateur ON journal_audit(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_journal_audit_ressource ON journal_audit(ressource, id_ressource);
CREATE INDEX IF NOT EXISTS idx_journal_audit_date ON journal_audit(date_heure);

-- ============================================================
-- TABLE: workflow_history
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_history (
    id SERIAL PRIMARY KEY,
    id_engagement INTEGER REFERENCES engagements(id) ON DELETE RESTRICT,
    ancien_statut VARCHAR(50),
    nouveau_statut VARCHAR(50),
    id_acteur UUID REFERENCES utilisateurs(id),
    commentaire TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_engagement ON workflow_history(id_engagement);

-- ============================================================
-- TABLE: pieces_jointes
-- ============================================================
CREATE TABLE IF NOT EXISTS pieces_jointes (
    id SERIAL PRIMARY KEY,
    id_engagement INTEGER REFERENCES engagements(id) ON DELETE RESTRICT,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    type_fichier VARCHAR(50),
    taille INTEGER CHECK (taille >= 0),
    uploade_par UUID REFERENCES utilisateurs(id),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    id_utilisateur UUID REFERENCES utilisateurs(id) ON DELETE RESTRICT,
    type VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT,
    lien VARCHAR(500),
    lue BOOLEAN DEFAULT false,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur ON notifications(id_utilisateur, lue);

-- ============================================================
-- TABLE: alertes
-- ============================================================
CREATE TABLE IF NOT EXISTS alertes (
    id SERIAL PRIMARY KEY,
    id_epa INTEGER REFERENCES epa(id) ON DELETE RESTRICT,
    type VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT,
    niveau VARCHAR(20) DEFAULT 'INFO' CHECK (niveau IN ('INFO', 'WARNING', 'CRITICAL')),
    destine_a VARCHAR(50),
    lue BOOLEAN DEFAULT false,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: modificatifs
-- ============================================================
CREATE TABLE IF NOT EXISTS modificatifs (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    type_modificatif VARCHAR(20) NOT NULL CHECK (type_modificatif IN ('VIREMENT', 'ANNULATION', 'AUGMENTATION')),
    id_programme_source INTEGER REFERENCES chapitres_budgetaires(id),
    id_programme_destination INTEGER REFERENCES chapitres_budgetaires(id),
    id_ligne_budgetaire INTEGER REFERENCES articles_budgetaires(id),
    montant DECIMAL(15,2) NOT NULL CHECK (montant > 0),
    motif TEXT NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'BROUILLON'
        CHECK (statut IN ('BROUILLON', 'EN_ATTENTE', 'APPROUVE', 'REFUSE')),
    approbation_tutelle BOOLEAN DEFAULT false,
    id_epa INTEGER NOT NULL REFERENCES epa(id) ON DELETE RESTRICT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modificatifs_epa ON modificatifs(id_epa);
CREATE INDEX IF NOT EXISTS idx_modificatifs_statut ON modificatifs(statut);

-- ============================================================
-- TABLE: programmes (compatibilité legacy)
-- ============================================================
CREATE TABLE IF NOT EXISTS programmes (
    id SERIAL PRIMARY KEY,
    id_epa INTEGER REFERENCES epa(id),
    code VARCHAR(50) NOT NULL,
    libelle TEXT NOT NULL,
    annee INTEGER NOT NULL,
    budget_initial DECIMAL(15,2) DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_epa, code, annee)
);

-- ============================================================
-- TABLE: lignes_budgetaires (compatibilité legacy)
-- ============================================================
CREATE TABLE IF NOT EXISTS lignes_budgetaires (
    id SERIAL PRIMARY KEY,
    id_programme INTEGER REFERENCES programmes(id),
    code_nature VARCHAR(50) NOT NULL,
    libelle TEXT NOT NULL,
    ae_initial DECIMAL(15,2) DEFAULT 0,
    cp_initial DECIMAL(15,2) DEFAULT 0,
    ae_restant DECIMAL(15,2) DEFAULT 0,
    cp_restant DECIMAL(15,2) DEFAULT 0,
    annee INTEGER NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- VUES
-- ============================================================

-- Vue pour le solde disponible par article
CREATE OR REPLACE VIEW v_solde_articles AS
SELECT 
    ab.id,
    ab.code,
    ab.libelle,
    ab.ae_initial,
    ab.cp_initial,
    ab.ae_engage,
    ab.ae_disponible,
    ab.cp_paye,
    ab.cp_disponible,
    cb.code AS chapitre_code,
    cb.libelle AS chapitre_libelle,
    b.annee,
    b.statut AS budget_statut
FROM articles_budgetaires ab
JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
JOIN budgets b ON cb.id_budget = b.id;

-- Vue pour file visas contrôleur
CREATE OR REPLACE VIEW v_file_visas AS
SELECT 
    e.id,
    e.numero,
    e.montant,
    e.objet,
    e.statut,
    epa.nom as epa_nom,
    ab.libelle as article_libelle,
    u.nom || ' ' || u.prenom as demandeur_nom,
    e.date_creation,
    CASE 
        WHEN e.montant > 5000000 THEN 'URGENT'
        WHEN e.montant > 1000000 THEN 'MOYEN'
        ELSE 'NORMAL'
    END as priorite
FROM engagements e
JOIN epa ON e.id_epa = epa.id
JOIN articles_budgetaires ab ON e.id_article = ab.id
JOIN utilisateurs u ON e.id_demandeur = u.id
WHERE e.statut = 'en_attente_cb';

-- Vue pour consolidation
CREATE OR REPLACE VIEW v_consolidation AS
SELECT 
    epa.id as id_epa,
    epa.nom as epa_nom,
    epa.secteur,
    COUNT(e.id) as nb_engagements,
    SUM(e.montant) as total_engagements,
    COUNT(CASE WHEN e.statut = 'valide' THEN 1 END) as nb_valides,
    SUM(CASE WHEN e.statut = 'valide' THEN e.montant ELSE 0 END) as total_valides
FROM epa
LEFT JOIN engagements e ON epa.id = e.id_epa
GROUP BY epa.id, epa.nom, epa.secteur;

\echo '-> Schéma principal V2 créé avec succès'

-- ============================================================
-- ÉTAPE 2: WORKFLOW DE CLÔTURE
-- ============================================================
\echo '-> Création du workflow de clôture...'

CREATE TABLE IF NOT EXISTS workflow_cloture (
    id SERIAL PRIMARY KEY,
    id_epa INTEGER REFERENCES epa(id),
    annee INTEGER NOT NULL,
    nom VARCHAR(255) NOT NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'EN_ATTENTE',
    date TIMESTAMP,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_epa, annee, id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_cloture_epa_annee ON workflow_cloture(id_epa, annee);

-- Vue pour les états de clôture
CREATE OR REPLACE VIEW v_etat_cloture AS
SELECT 
    epa.nom as epa_nom,
    wc.annee,
    COUNT(CASE WHEN wc.statut = 'TERMINE' THEN 1 END) as etapes_terminees,
    COUNT(*) as total_etapes,
    CASE 
        WHEN COUNT(CASE WHEN wc.statut = 'TERMINE' THEN 1 END) = COUNT(*) THEN 'COMPLETE'
        WHEN COUNT(CASE WHEN wc.statut = 'EN_COURS' THEN 1 END) > 0 THEN 'EN_COURS'
        ELSE 'EN_ATTENTE'
    END as statut_global
FROM workflow_cloture wc
JOIN epa ON epa.id = wc.id_epa
GROUP BY epa.id, epa.nom, wc.annee
ORDER BY wc.annee DESC, epa.nom;

\echo '-> Workflow de clôture créé'

-- ============================================================
-- ÉTAPE 3: MIGRATION ADMIN
-- ============================================================
\echo '-> Application de la migration admin...'

-- S'assurer que le rôle ADMIN existe avec les bonnes permissions
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

-- Créer le compte Administrateur par défaut
-- Mot de passe par défaut : Admin2026! (à changer immédiatement)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, id_role, statut)
SELECT
  'Système',
  'Admin',
  'admin@epa-budget.cg',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHG',
  r.id,
  'actif'
FROM roles r
WHERE r.code = 'ADMIN'
ON CONFLICT (email) DO NOTHING;

-- Initialiser la colonne statut pour les EPA existantes
UPDATE epa SET statut = 'actif' WHERE statut IS NULL;

\echo '-> Migration admin appliquée'

-- ============================================================
-- ÉTAPE 4: DONNÉES DE TEST (OPTIONNEL)
-- ============================================================
\echo '-> Insertion des données de test...'

-- Insertion d'EPA de test
INSERT INTO epa (code, nom, secteur) VALUES
('EPA001', 'Hôpital Central de Brazzaville', 'Santé'),
('EPA002', 'Université Marien Ngouabi', 'Education'),
('EPA003', 'Office National des Routes', 'Infrastructure')
ON CONFLICT (code) DO NOTHING;

-- Créer un budget pour l'année en cours
INSERT INTO budgets (annee, montant_previsionnel, statut, id_epa)
SELECT 
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    1000000000,
    'actif',
    id
FROM epa
ON CONFLICT (annee, id_epa) DO NOTHING;

-- Créer des chapitres budgétaires
INSERT INTO chapitres_budgetaires (code, libelle, ae_alloue, cp_alloue, id_budget)
SELECT 
    'CH' || LPAD(ROW_NUMBER() OVER (PARTITION BY b.id ORDER BY b.id)::TEXT, 3, '0'),
    'Chapitre ' || ROW_NUMBER() OVER (PARTITION BY b.id ORDER BY b.id),
    100000000,
    100000000,
    b.id
FROM budgets b
WHERE NOT EXISTS (
    SELECT 1 FROM chapitres_budgetaires cb WHERE cb.id_budget = b.id
)
LIMIT 3;

-- Créer des articles budgétaires
INSERT INTO articles_budgetaires (code, libelle, ae_initial, cp_initial, id_chapitre)
SELECT 
    cb.code || '-ART' || LPAD(ROW_NUMBER() OVER (PARTITION BY cb.id ORDER BY cb.id)::TEXT, 3, '0'),
    'Article pour ' || cb.libelle,
    cb.ae_alloue / 3,
    cb.cp_alloue / 3,
    cb.id
FROM chapitres_budgetaires cb
WHERE NOT EXISTS (
    SELECT 1 FROM articles_budgetaires ab WHERE ab.id_chapitre = cb.id
);

-- Créer des étapes de clôture par défaut
INSERT INTO workflow_cloture (id_epa, annee, nom, statut) 
SELECT 
    epa.id,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    unnest(ARRAY[
        'Génération Comptes Administratifs',
        'Génération Comptes Financiers', 
        'Certification e-signature',
        'Soumission CCDB'
    ]),
    'EN_ATTENTE'
FROM epa
WHERE NOT EXISTS (
    SELECT 1 FROM workflow_cloture wc 
    WHERE wc.id_epa = epa.id 
    AND wc.annee = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
);

\echo '--> Données de test insérées'

-- ============================================================
-- ÉTAPE 5: TABLE RAPPORTS (utilisée par Comptable et DG)
-- ============================================================
\echo '--> Création de la table rapports...'

CREATE TABLE IF NOT EXISTS rapports (
    id SERIAL PRIMARY KEY,
    id_epa INTEGER NOT NULL REFERENCES epa(id) ON DELETE RESTRICT,
    type_rapport VARCHAR(50) NOT NULL
        CHECK (type_rapport IN (
            'COMPTES_ADMINISTRATIFS',
            'COMPTES_FINANCIERS',
            'COMPTES_ANNUELS',
            'RAP_TRIMESTRIEL'
        )),
    annee INTEGER NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'GENERE'
        CHECK (statut IN ('GENERE', 'CERTIFIE', 'SOUMIS_CCDB', 'TRANSMIS')),
    date_certification TIMESTAMP,
    date_soumission_ccdb TIMESTAMP,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_epa, type_rapport, annee)
);

CREATE INDEX IF NOT EXISTS idx_rapports_epa_annee ON rapports(id_epa, annee);

\echo '--> Table rapports créée'

-- ============================================================
-- FIN
-- ============================================================
\echo '========================================'
\echo 'INITIALISATION TERMINÉE AVEC SUCCÈS'
\echo '========================================'
\echo 'Compte admin : admin@epa-budget.cg'
\echo 'Mot de passe : Admin2026!'
\echo 'IMPORTANT : Changez ce mot de passe immédiatement !'
\echo '========================================'
