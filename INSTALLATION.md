# Guide d'Installation - Application de Contrôle et Suivi Budgétaire EPA

## Prérequis

- Node.js (v16 ou supérieur)
- PostgreSQL (v12 ou supérieur)
- npm ou yarn

## Installation

### 1. Installation des dépendances

```bash
# À la racine du projet
npm install

# Dans le dossier client
cd client
npm install
cd ..
```

### 2. Configuration de la base de données

1. Créer une base de données PostgreSQL :
```sql
CREATE DATABASE epa_budget;
```

2. Exécuter le schéma SQL :
```bash
psql -U postgres -d epa_budget -f database/schema.sql
```

3. (Optionnel) Charger les données de test :
```bash
psql -U postgres -d epa_budget -f database/seed.sql
```

### 3. Configuration de l'environnement

Créer un fichier `.env` à la racine du projet :

```env
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=epa_budget
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
JWT_SECRET=votre_secret_jwt_aleatoire
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 4. Génération des données de test (RECOMMANDÉ)

Pour créer un jeu de données complet avec un cycle réaliste, utilisez le script de seed :

```bash
npm run seed
```

Ce script va créer :
- Plusieurs EPA avec leurs utilisateurs
- Programmes et lignes budgétaires
- Engagements à tous les stades du workflow
- Modificatifs, recettes, paiements
- Alertes et rapports

Voir `GUIDE_SEED.md` pour plus de détails.

### 4b. Création simple des utilisateurs (Alternative)

Pour créer uniquement les utilisateurs avec des mots de passe hashés, utiliser ce script Node.js :

```javascript
const bcrypt = require('bcryptjs');
const pool = require('./server/config/database');

async function createUsers() {
  const password = await bcrypt.hash('password123', 10);
  
  // Mettre à jour les utilisateurs avec le hash correct
  await pool.query(
    `UPDATE utilisateurs SET password_hash = $1 WHERE email LIKE '%@epa001.cg'`,
    [password]
  );
  
  console.log('Utilisateurs créés avec succès');
  process.exit(0);
}

createUsers();
```

### 5. Démarrage de l'application

```bash
# Démarrer le serveur et le client en parallèle
npm run dev

# Ou séparément :
# Terminal 1 - Serveur
npm run server

# Terminal 2 - Client
npm run client
```

L'application sera accessible sur :
- Frontend : http://localhost:3001
- Backend API : http://localhost:5001

## Comptes de test

Après avoir exécuté le script de création d'utilisateurs, vous pouvez vous connecter avec :

- **DG** : dg@epa001.cg / password123
- **DAF** : daf@epa001.cg / password123
- **Contrôleur** : controleur@epa001.cg / password123
- **Comptable** : comptable@epa001.cg / password123
- **Service** : service@epa001.cg / password123
- **Tutelle** : tutelle@minfin.cg / password123
- **CCDB** : ccdb@courcomptes.cg / password123

## Structure des interfaces par acteur

### DG (Directeur Général)
- Dashboard Exécutif : `/dg/dashboard`
- Sessions : `/dg/sessions`
- Rapports Tutelle : `/dg/rapports-tutelle`
- Approbations Stratégiques : `/dg/approbations`

### DAF (Directeur Administratif et Financier)
- Budget-Programme : `/daf/programmes`
- Lignes Budgétaires : `/daf/lignes-budgetaires`
- Engagements : `/daf/engagements`
- Modificatifs : `/daf/modificatifs`
- Rapports Internes : `/daf/rapports-internes`

### Contrôleur Financier
- File Visas : `/controleur/file-visas`
- Checklist Visa : `/controleur/checklist`
- Alertes Dérive : `/controleur/alertes-derive`
- Journal Contrôles : `/controleur/journal-controles`

### Agent Comptable
- Contrôle Régularité : `/comptable/controle-regularite`
- Recettes : `/comptable/recettes`
- Clôture : `/comptable/cloture`
- Trésorerie : `/comptable/tresorerie`
- Comptes Annuels : `/comptable/comptes-annuels`

### Services Métiers
- Actions Programme : `/services/programmes`
- Demandes Engagements : `/services/demandes-engagements`
- Réceptions : `/services/receptions`
- Indicateurs : `/services/indicateurs`

### Tutelle
- Consolidation Multi-EPA : `/tutelle/consolidation`
- Workflow Approbation : `/tutelle/workflow-approbation`
- Performance Programmes : `/tutelle/performance-programmes`
- Rapports Sectoriels : `/tutelle/rapports-sectoriels`

### CCDB (Cour des Comptes)
- Piste Audit : `/ccdb/piste-audit`
- Comptes Annuels : `/ccdb/comptes-annuels`

## Architecture

- **Backend** : Node.js + Express + PostgreSQL
- **Frontend** : React + Material-UI
- **Workflow** : Système centralisé de gestion des statuts
- **Notifications** : WebSocket pour notifications push
- **RBAC** : Matrices de permissions par rôle

## Support

Pour toute question ou problème, consulter le README.md principal.

