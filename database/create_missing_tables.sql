-- Création des tables manquantes pour les liquidations et articles budgétaires

-- Table des articles budgétaires
CREATE TABLE IF NOT EXISTS articles_budgetaires (
    id SERIAL PRIMARY KEY,
    id_chapitre INTEGER REFERENCES chapitres_budgetaires(id),
    code VARCHAR(50) NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    ae_alloue DECIMAL(15,2) DEFAULT 0,
    cp_alloue DECIMAL(15,2) DEFAULT 0,
    ae_engage DECIMAL(15,2) DEFAULT 0,
    cp_liquide DECIMAL(15,2) DEFAULT 0,
    cp_paye DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des liquidations
CREATE TABLE IF NOT EXISTS liquidations (
    id SERIAL PRIMARY KEY,
    id_engagement INTEGER REFERENCES engagements(id),
    montant_facture DECIMAL(15,2) NOT NULL,
    montant_liquide DECIMAL(15,2) NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_attente', -- en_attente, validee, payee
    facture_path VARCHAR(500),
    pv_service_fait_path VARCHAR(500),
    id_validateur_ac UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mise à jour de la table engagements pour ajouter id_article_budgetaire
ALTER TABLE engagements 
ADD COLUMN IF NOT EXISTS id_article_budgetaire INTEGER REFERENCES articles_budgetaires(id);

-- Mise à jour de la table paiements pour correspondre au code
ALTER TABLE paiements 
ADD COLUMN IF NOT EXISTS id_liquidation INTEGER REFERENCES liquidations(id),
ADD COLUMN IF NOT EXISTS id_agent_comptable UUID REFERENCES utilisateurs(id),
ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(50) DEFAULT 'virement';

-- Création de quelques articles budgétaires par défaut
INSERT INTO articles_budgetaires (id_chapitre, code, libelle, ae_alloue, cp_alloue)
SELECT 
    cb.id,
    'ART-' || cb.code || '-001',
    'Article par défaut pour ' || cb.libelle,
    cb.ae_alloue,
    cb.cp_alloue
FROM chapitres_budgetaires cb
WHERE NOT EXISTS (
    SELECT 1 FROM articles_budgetaires ab 
    WHERE ab.id_chapitre = cb.id
)
LIMIT 10;

-- Mise à jour des engagements pour leur assigner un article budgétaire
UPDATE engagements 
SET id_article_budgetaire = (
    SELECT ab.id 
    FROM articles_budgetaires ab 
    JOIN chapitres_budgetaires cb ON ab.id_chapitre = cb.id
    JOIN programmes p ON cb.id_programme = p.id
    WHERE p.id = engagements.programme_id
    LIMIT 1
)
WHERE id_article_budgetaire IS NULL;
