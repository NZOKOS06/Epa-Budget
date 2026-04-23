-- Création de la table workflow_cloture si elle n'existe pas
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
