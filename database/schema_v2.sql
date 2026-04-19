-- ============================================================
-- APPLICATION DE CONTRÔLE ET SUIVI BUDGÉTAIRE — DGTT CONGO
-- SCHÉMA V2 — Conforme au cahier des charges et diagramme UML
-- Date: 18 avril 2026
-- ============================================================

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
    mot_de_passe VARCHAR(255) NOT NULL, -- Hashé avec bcrypt, jamais en clair
    statut VARCHAR(20) NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    epa_id INTEGER,
    direction_id INTEGER, -- Pour restreindre CS à sa direction (RG-17)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role_id);

-- ============================================================
-- TABLE: epa (conservée pour compatibilité multi-EPA)
-- ============================================================
CREATE TABLE IF NOT EXISTS epa (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    secteur VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: budgets (NOUVELLE — RG-01, RG-18, RG-19)
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    annee INTEGER UNIQUE NOT NULL, -- RG-18: un seul budget actif par année
    montant_previsionnel DECIMAL(15,2) NOT NULL CHECK (montant_previsionnel > 0),
    statut VARCHAR(20) NOT NULL DEFAULT 'preparation' 
        CHECK (statut IN ('preparation', 'approuve', 'actif', 'cloture')),
    epa_id INTEGER NOT NULL REFERENCES epa(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES utilisateurs(id),
    approved_by UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: chapitres_budgetaires (NOUVELLE — conforme UML)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: articles_budgetaires (NOUVELLE — conforme UML)
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
    direction_id INTEGER, -- Pour associer un article à une direction (RG-17)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_chapitre ON articles_budgetaires(id_chapitre);

-- ============================================================
-- TABLE: engagements (CORRIGÉE — statuts conformes au cahier)
-- ============================================================
CREATE TABLE IF NOT EXISTS engagements (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    objet TEXT NOT NULL,
    montant DECIMAL(15,2) NOT NULL CHECK (montant > 0),
    statut VARCHAR(30) NOT NULL DEFAULT 'brouillon'
        CHECK (statut IN ('brouillon', 'soumise_daf', 'en_attente_cb', 'en_attente_dg', 'valide', 'rejete', 'liquide')),
    motif_rejet TEXT, -- Obligatoire si statut = rejete (vérifié au niveau applicatif + trigger)
    id_article_budgetaire INTEGER NOT NULL REFERENCES articles_budgetaires(id) ON DELETE RESTRICT,
    id_demandeur UUID NOT NULL REFERENCES utilisateurs(id),
    id_validateur_dg UUID REFERENCES utilisateurs(id), -- Nullable tant que non validé
    epa_id INTEGER REFERENCES epa(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: motif_rejet obligatoire si statut = 'rejete' (RG-07)
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
CREATE INDEX IF NOT EXISTS idx_engagements_article ON engagements(id_article_budgetaire);

-- ============================================================
-- TABLE: avis_controle (NOUVELLE — conforme UML)
-- ============================================================
CREATE TABLE IF NOT EXISTS avis_controle (
    id SERIAL PRIMARY KEY,
    date_avis TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type_avis VARCHAR(20) NOT NULL CHECK (type_avis IN ('favorable', 'defavorable')),
    commentaire TEXT, -- NOT NULL vérifié par trigger si défavorable
    id_engagement INTEGER NOT NULL REFERENCES engagements(id) ON DELETE RESTRICT,
    id_controleur UUID NOT NULL REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: commentaire obligatoire si avis défavorable (RG-07)
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
-- TABLE: liquidations (NOUVELLE — conforme UML, RG-11/12/13)
-- ============================================================
CREATE TABLE IF NOT EXISTS liquidations (
    id SERIAL PRIMARY KEY,
    montant_facture DECIMAL(15,2) NOT NULL CHECK (montant_facture > 0),
    montant_liquide DECIMAL(15,2) NOT NULL CHECK (montant_liquide > 0),
    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente'
        CHECK (statut IN ('en_attente', 'validee', 'payee')),
    facture_path VARCHAR(500), -- Chemin vers la facture numérisée (RG-12)
    pv_service_fait_path VARCHAR(500), -- Chemin vers le PV de service fait (RG-12)
    id_engagement INTEGER NOT NULL UNIQUE REFERENCES engagements(id) ON DELETE RESTRICT,
    id_validateur_ac UUID REFERENCES utilisateurs(id), -- Agent Comptable validateur
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: montant_liquide <= montant engagé (RG-11)
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
-- TABLE: paiements (CORRIGÉE — conforme UML)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: recettes (CORRIGÉE — conforme UML, RG-08/09/10)
-- ============================================================
CREATE TABLE IF NOT EXISTS recettes (
    id SERIAL PRIMARY KEY,
    montant DECIMAL(15,2) NOT NULL CHECK (montant > 0),
    date_encaissement DATE NOT NULL,
    source VARCHAR(50) NOT NULL
        CHECK (source IN ('permis_conduire', 'carte_grise', 'licence_transport', 'agrement_auto_ecole')),
    numero_quittance VARCHAR(100) UNIQUE NOT NULL, -- RG-08: unicité absolue
    reference_titre VARCHAR(100) NOT NULL,
    est_annulee BOOLEAN NOT NULL DEFAULT false, -- Pour contre-passation (RG-10)
    id_contre_passation INTEGER REFERENCES recettes(id), -- Référence à la recette annulée
    id_budget INTEGER NOT NULL REFERENCES budgets(id) ON DELETE RESTRICT,
    id_agent_comptable UUID NOT NULL REFERENCES utilisateurs(id),
    epa_id INTEGER REFERENCES epa(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recettes_quittance ON recettes(numero_quittance);

-- ============================================================
-- TABLE: journal_audit (NOUVELLE — traçabilité complète)
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_audit (
    id SERIAL PRIMARY KEY,
    date_heure TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view')),
    ressource VARCHAR(100) NOT NULL, -- Nom de la table/entité
    ressource_id VARCHAR(100) NOT NULL, -- ID de l'entité
    ancienne_valeur JSONB, -- Nullable (pour les créations)
    nouvelle_valeur JSONB, -- Nullable (pour les suppressions)
    ip_adresse VARCHAR(45) NOT NULL,
    id_utilisateur UUID NOT NULL REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_audit_utilisateur ON journal_audit(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_journal_audit_ressource ON journal_audit(ressource, ressource_id);
CREATE INDEX IF NOT EXISTS idx_journal_audit_date ON journal_audit(date_heure);

-- ============================================================
-- TABLE: workflow_history (conservée pour compatibilité)
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_history (
    id SERIAL PRIMARY KEY,
    engagement_id INTEGER REFERENCES engagements(id) ON DELETE RESTRICT,
    ancien_statut VARCHAR(50),
    nouveau_statut VARCHAR(50),
    acteur_id UUID REFERENCES utilisateurs(id),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_engagement ON workflow_history(engagement_id);

-- ============================================================
-- TABLE: pieces_jointes (conservée)
-- ============================================================
CREATE TABLE IF NOT EXISTS pieces_jointes (
    id SERIAL PRIMARY KEY,
    engagement_id INTEGER REFERENCES engagements(id) ON DELETE RESTRICT,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    type_fichier VARCHAR(50),
    taille INTEGER CHECK (taille >= 0),
    uploaded_by UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: notifications (conservée)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE RESTRICT,
    type VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT,
    lien VARCHAR(500),
    lue BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur ON notifications(utilisateur_id, lue);

-- ============================================================
-- TABLE: alertes (conservée)
-- ============================================================
CREATE TABLE IF NOT EXISTS alertes (
    id SERIAL PRIMARY KEY,
    epa_id INTEGER REFERENCES epa(id) ON DELETE RESTRICT,
    type VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT,
    niveau VARCHAR(20) DEFAULT 'INFO' CHECK (niveau IN ('INFO', 'WARNING', 'CRITICAL')),
    destine_a VARCHAR(50),
    lue BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: modificatifs (NOUVELLE — RG-20)
-- ============================================================
CREATE TABLE IF NOT EXISTS modificatifs (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    type_modificatif VARCHAR(20) NOT NULL CHECK (type_modificatif IN ('VIREMENT', 'ANNULATION', 'AUGMENTATION')),
    programme_source_id INTEGER REFERENCES chapitres_budgetaires(id),
    programme_dest_id INTEGER REFERENCES chapitres_budgetaires(id),
    ligne_budgetaire_id INTEGER REFERENCES articles_budgetaires(id),
    montant DECIMAL(15,2) NOT NULL CHECK (montant > 0),
    motif TEXT NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'BROUILLON'
        CHECK (statut IN ('BROUILLON', 'EN_ATTENTE', 'APPROUVE', 'REFUSE')),
    approbation_tutelle BOOLEAN DEFAULT false,
    epa_id INTEGER NOT NULL REFERENCES epa(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modificatifs_epa ON modificatifs(epa_id);
CREATE INDEX IF NOT EXISTS idx_modificatifs_statut ON modificatifs(statut);

-- ============================================================
-- VUES UTILITAIRES
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

-- ============================================================
-- FIN DU SCHÉMA V2
-- ============================================================
