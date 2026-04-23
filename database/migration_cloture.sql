-- Migration pour les fonctionnalités de clôture comptable
-- À exécuter après le schéma principal

-- Table pour suivre les étapes de clôture par EPA et par année
CREATE TABLE IF NOT EXISTS workflow_cloture (
    id SERIAL PRIMARY KEY,
    epa_id INTEGER REFERENCES epa(id),
    annee INTEGER NOT NULL,
    nom VARCHAR(255) NOT NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'EN_ATTENTE', -- EN_ATTENTE, EN_COURS, TERMINE
    date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(epa_id, annee, id)
);

-- Mise à jour de la table rapports pour ajouter les champs manquants
ALTER TABLE rapports 
ADD COLUMN IF NOT EXISTS date_certification TIMESTAMP,
ADD COLUMN IF NOT EXISTS date_soumission_ccdb TIMESTAMP;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_workflow_cloture_epa_annee ON workflow_cloture(epa_id, annee);

-- Insertion des étapes de clôture par défaut pour les EPA existants
INSERT INTO workflow_cloture (epa_id, annee, nom, statut) 
SELECT 
    epa.id,
    EXTRACT(YEAR FROM CURRENT_DATE) as annee,
    unnest(ARRAY[
        'Génération Comptes Administratifs',
        'Génération Comptes Financiers', 
        'Certification e-signature',
        'Soumission CCDB'
    ]) as nom,
    'EN_ATTENTE' as statut
FROM epa
WHERE NOT EXISTS (
    SELECT 1 FROM workflow_cloture wc 
    WHERE wc.epa_id = epa.id 
    AND wc.annee = EXTRACT(YEAR FROM CURRENT_DATE)
)
ORDER BY epa.id, unnest(ARRAY[1,2,3,4]);

-- Création d'une vue pour les états de clôture
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
JOIN epa ON epa.id = wc.epa_id
GROUP BY epa.id, epa.nom, wc.annee
ORDER BY wc.annee DESC, epa.nom;
