-- Application de Contrôle et Suivi Budgétaire EPA Congo-Brazzaville
-- Base de données PostgreSQL

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs et rôles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT
);

INSERT INTO roles (code, nom, description) VALUES
('DG', 'Directeur Général', 'Direction générale de l''EPA'),
('DAF', 'Directeur Administratif et Financier', 'Gestion budgétaire et administrative'),
('CONTROLEUR', 'Contrôleur Financier', 'Contrôle et visa des engagements'),
('COMPTABLE', 'Agent Comptable', 'Comptabilité et régularité'),
('SERVICE', 'Service Métier', 'Services opérationnels'),
('TUTELLE', 'Tutelle', 'Autorité de tutelle'),
('CCDB', 'Cour des Comptes', 'Contrôle et audit');

CREATE TABLE utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    epa_id INTEGER,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des EPA
CREATE TABLE epa (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    secteur VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des programmes budgétaires
CREATE TABLE programmes (
    id SERIAL PRIMARY KEY,
    epa_id INTEGER REFERENCES epa(id),
    code VARCHAR(50) NOT NULL,
    libelle TEXT NOT NULL,
    annee INTEGER NOT NULL,
    budget_initial DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(epa_id, code, annee)
);

-- Table des lignes budgétaires (AE/CP)
CREATE TABLE lignes_budgetaires (
    id SERIAL PRIMARY KEY,
    programme_id INTEGER REFERENCES programmes(id),
    code_nature VARCHAR(50) NOT NULL,
    libelle TEXT NOT NULL,
    ae_initial DECIMAL(15,2) DEFAULT 0, -- Autorisation d'Engagement
    cp_initial DECIMAL(15,2) DEFAULT 0, -- Crédit de Paiement
    ae_restant DECIMAL(15,2) DEFAULT 0,
    cp_restant DECIMAL(15,2) DEFAULT 0,
    annee INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des engagements
CREATE TABLE engagements (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    epa_id INTEGER REFERENCES epa(id),
    programme_id INTEGER REFERENCES programmes(id),
    ligne_budgetaire_id INTEGER REFERENCES lignes_budgetaires(id),
    service_id UUID REFERENCES utilisateurs(id),
    daf_id UUID REFERENCES utilisateurs(id),
    montant DECIMAL(15,2) NOT NULL,
    objet TEXT NOT NULL,
    statut VARCHAR(50) DEFAULT 'BROUILLON',
    -- Statuts possibles: BROUILLON, SOUMISE_DAF, EN_VISA, VISA_OK, REGULARITE_OK, APPROUVE, PAYE, REFUSE
    visa_controleur BOOLEAN DEFAULT false,
    visa_controleur_id UUID REFERENCES utilisateurs(id),
    visa_controleur_date TIMESTAMP,
    regularite_comptable BOOLEAN DEFAULT false,
    regularite_comptable_id UUID REFERENCES utilisateurs(id),
    regularite_comptable_date TIMESTAMP,
    approbation_dg BOOLEAN DEFAULT false,
    approbation_dg_id UUID REFERENCES utilisateurs(id),
    approbation_dg_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des pièces jointes
CREATE TABLE pieces_jointes (
    id SERIAL PRIMARY KEY,
    engagement_id INTEGER REFERENCES engagements(id),
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    type_fichier VARCHAR(50),
    taille INTEGER,
    uploaded_by UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des modificatifs budgétaires
CREATE TABLE modificatifs (
    id SERIAL PRIMARY KEY,
    epa_id INTEGER REFERENCES epa(id),
    numero VARCHAR(50) UNIQUE NOT NULL,
    type_modificatif VARCHAR(50) NOT NULL, -- VIREMENT, ANNULATION, AUGMENTATION
    programme_source_id INTEGER REFERENCES programmes(id),
    programme_dest_id INTEGER REFERENCES programmes(id),
    montant DECIMAL(15,2) NOT NULL,
    motif TEXT,
    statut VARCHAR(50) DEFAULT 'BROUILLON',
    approbation_tutelle BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des recettes
CREATE TABLE recettes (
    id SERIAL PRIMARY KEY,
    epa_id INTEGER REFERENCES epa(id),
    numero VARCHAR(50) UNIQUE NOT NULL,
    nature_recette VARCHAR(100) NOT NULL,
    montant DECIMAL(15,2) NOT NULL,
    date_recette DATE NOT NULL,
    statut VARCHAR(50) DEFAULT 'ENREGISTRE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des paiements
CREATE TABLE paiements (
    id SERIAL PRIMARY KEY,
    engagement_id INTEGER REFERENCES engagements(id),
    numero_ordre VARCHAR(50) UNIQUE NOT NULL,
    montant DECIMAL(15,2) NOT NULL,
    date_paiement DATE,
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    utilisateur_id UUID REFERENCES utilisateurs(id),
    type VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT,
    lien VARCHAR(500),
    lue BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des workflows (historique des changements de statut)
CREATE TABLE workflow_history (
    id SERIAL PRIMARY KEY,
    engagement_id INTEGER REFERENCES engagements(id),
    ancien_statut VARCHAR(50),
    nouveau_statut VARCHAR(50),
    acteur_id UUID REFERENCES utilisateurs(id),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des alertes
CREATE TABLE alertes (
    id SERIAL PRIMARY KEY,
    epa_id INTEGER REFERENCES epa(id),
    type VARCHAR(50) NOT NULL, -- DERIVE_BUDGET, ENGAGEMENT_URGENT, ECART
    titre VARCHAR(255) NOT NULL,
    message TEXT,
    niveau VARCHAR(20) DEFAULT 'INFO', -- INFO, WARNING, CRITICAL
    destine_a VARCHAR(50), -- Role destinataire
    lue BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des réceptions (PV de réception)
CREATE TABLE receptions (
    id SERIAL PRIMARY KEY,
    engagement_id INTEGER REFERENCES engagements(id),
    numero VARCHAR(50) UNIQUE NOT NULL,
    date_reception DATE NOT NULL,
    observations TEXT,
    service_id UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des rapports (pour Tutelle et CCDB)
CREATE TABLE rapports (
    id SERIAL PRIMARY KEY,
    epa_id INTEGER REFERENCES epa(id),
    type_rapport VARCHAR(50) NOT NULL, -- RAP_TRIMESTRIEL, COMPTES_ANNUELS, AUDIT
    periode VARCHAR(50),
    annee INTEGER,
    fichier_path VARCHAR(500),
    statut VARCHAR(50) DEFAULT 'BROUILLON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX idx_engagements_statut ON engagements(statut);
CREATE INDEX idx_engagements_epa ON engagements(epa_id);
CREATE INDEX idx_engagements_service ON engagements(service_id);
CREATE INDEX idx_notifications_utilisateur ON notifications(utilisateur_id, lue);
CREATE INDEX idx_workflow_engagement ON workflow_history(engagement_id);
CREATE INDEX idx_lignes_budgetaires_programme ON lignes_budgetaires(programme_id);

-- Vue pour dashboard DG
CREATE OR REPLACE VIEW v_dashboard_dg AS
SELECT 
    e.id,
    e.numero,
    e.montant,
    e.statut,
    epa.nom as epa_nom,
    p.libelle as programme_libelle,
    u.nom || ' ' || u.prenom as service_nom,
    e.created_at
FROM engagements e
JOIN epa ON e.epa_id = epa.id
JOIN programmes p ON e.programme_id = p.id
JOIN utilisateurs u ON e.service_id = u.id
WHERE e.statut IN ('REGULARITE_OK', 'APPROUVE');

-- Vue pour dashboard DAF
CREATE OR REPLACE VIEW v_dashboard_daf AS
SELECT 
    e.id,
    e.numero,
    e.montant,
    e.statut,
    p.libelle as programme_libelle,
    lb.code_nature,
    u.nom || ' ' || u.prenom as demandeur_nom,
    e.created_at
FROM engagements e
JOIN programmes p ON e.programme_id = p.id
JOIN lignes_budgetaires lb ON e.ligne_budgetaire_id = lb.id
JOIN utilisateurs u ON e.service_id = u.id
WHERE e.statut IN ('SOUMISE_DAF', 'EN_VISA');

-- Vue pour file visas contrôleur
CREATE OR REPLACE VIEW v_file_visas AS
SELECT 
    e.id,
    e.numero,
    e.montant,
    e.objet,
    e.statut,
    epa.nom as epa_nom,
    p.libelle as programme_libelle,
    u.nom || ' ' || u.prenom as demandeur_nom,
    e.created_at,
    CASE 
        WHEN e.montant > 5000000 THEN 'URGENT'
        WHEN e.montant > 1000000 THEN 'MOYEN'
        ELSE 'NORMAL'
    END as priorite
FROM engagements e
JOIN epa ON e.epa_id = epa.id
JOIN programmes p ON e.programme_id = p.id
JOIN utilisateurs u ON e.service_id = u.id
WHERE e.statut = 'EN_VISA';

-- Vue pour consolidation Tutelle
CREATE OR REPLACE VIEW v_consolidation_tutelle AS
SELECT 
    epa.id as epa_id,
    epa.nom as epa_nom,
    epa.secteur,
    COUNT(e.id) as nb_engagements,
    SUM(e.montant) as total_engagements,
    COUNT(CASE WHEN e.statut = 'PAYE' THEN 1 END) as nb_payes,
    SUM(CASE WHEN e.statut = 'PAYE' THEN e.montant ELSE 0 END) as total_payes
FROM epa
LEFT JOIN engagements e ON epa.id = e.epa_id
GROUP BY epa.id, epa.nom, epa.secteur;

