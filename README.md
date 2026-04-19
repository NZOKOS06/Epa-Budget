# Application de Contrôle et Suivi Budgétaire - EPA Congo-Brazzaville

Application complète de gestion budgétaire pour les Établissements Publics à caractère Administratif (EPA) du Congo-Brazzaville.

## Architecture

- **28 interfaces principales** réparties entre 7 acteurs
- **Base de données PostgreSQL** unique
- **Workflow engine centralisé** pour l'orchestration des transmissions
- **Notifications push** en temps réel (WebSocket)
- **Système RBAC** avec matrices de permissions granulaires

## Acteurs et Interfaces

### 1. DG (Directeur Général) - 4 écrans
- Dashboard Exécutif
- Sessions
- Rapports Tutelle
- Approbations Stratégiques

### 2. DAF (Directeur Administratif et Financier) - 5 écrans
- Budget-Programme
- Lignes Budgétaires
- Engagements
- Modificatifs
- Rapports Internes

### 3. Contrôleur Financier - 4 écrans
- File Visas
- Checklist Visa
- Alertes Dérive
- Journal Contrôles

### 4. Agent Comptable - 5 écrans
- Contrôle Régularité
- Recettes
- Clôture
- Trésorerie
- Comptes Annuels

### 5. Services Métiers - 4 écrans
- Actions Programme
- Demandes Engagements
- Réceptions
- Indicateurs

### 6. Tutelle - 4 écrans
- Consolidation Multi-EPA
- Workflow Approbation
- Performance Programmes
- Rapports Sectoriels

### 7. CCDB (Cour des Comptes et de Discipline Budgétaire) - 2 écrans
- Piste Audit
- Comptes Annuels

## Installation

```bash
npm run install-all
```

## Configuration

Créer un fichier `.env` à la racine :

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=epa_budget
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
NODE_ENV=development
CLIENT_URL=http://localhost:3001
```

## Génération des Données de Test

Pour créer un jeu de données complet et réaliste :

```bash
# 1. Créer la base de données
psql -U postgres -c "CREATE DATABASE epa_budget;"

# 2. Créer les tables
psql -U postgres -d epa_budget -f database/schema.sql

# 3. Générer les données
npm run seed
```

Voir `GUIDE_SEED.md` et `DYNAMISATION_COMPLETE.md` pour plus de détails.

## Démarrage

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5000` et le client sur `http://localhost:3000`.

## Structure du Projet

```
├── server/           # Backend API
│   ├── config/       # Configuration DB
│   ├── models/       # Modèles de données
│   ├── routes/       # Routes API par acteur
│   ├── middleware/   # Authentification, RBAC
│   ├── services/     # Services métiers (workflow, notifications)
│   └── index.js      # Point d'entrée serveur
├── client/           # Frontend React
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── pages/       # Pages par acteur
│   │   ├── services/    # Services API
│   │   └── App.js       # Router principal
└── database/         # Scripts SQL
    └── schema.sql    # Schéma de base de données
```

