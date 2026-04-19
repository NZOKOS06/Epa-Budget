# Guide de Seed - Données Réalistes pour le Cycle Complet

Ce guide explique comment générer des données réalistes pour tester toute l'application avec un cycle complet de gestion budgétaire.

## 🎯 Objectif

Le script `seed-complete.js` crée un jeu de données complet qui simule un cycle réel de contrôle et suivi budgétaire avec :

- ✅ **5 EPA** différents (Santé, Education, Infrastructure, Culture)
- ✅ **Utilisateurs** pour chaque rôle (DG, DAF, Contrôleur, Comptable, Service)
- ✅ **Programmes budgétaires** pour chaque EPA sur 2 années (2024-2025)
- ✅ **Lignes budgétaires** avec crédits AE/CP réalistes
- ✅ **50+ engagements** à tous les stades du workflow
- ✅ **Workflow complet** avec historique des transitions
- ✅ **Modificatifs** budgétaires
- ✅ **Recettes** enregistrées
- ✅ **Paiements** pour les engagements approuvés
- ✅ **Alertes** de dérive budgétaire
- ✅ **Rapports** trimestriels et annuels

## 🚀 Utilisation

### Prérequis

1. **Base de données créée** :
   ```bash
   psql -U postgres -c "CREATE DATABASE epa_budget;"
   ```

2. **Schéma SQL exécuté** :
   ```bash
   psql -U postgres -d epa_budget -f database/schema.sql
   ```

### Exécution du seed

```bash
npm run seed
```

Le script va :
1. Créer les EPA
2. Créer les utilisateurs avec mots de passe hashés
3. Créer les programmes budgétaires
4. Créer les lignes budgétaires
5. Créer 50 engagements à différents stades
6. Créer l'historique workflow complet
7. Créer des modificatifs, recettes, paiements, alertes et rapports

### Réinitialisation complète

Si vous voulez repartir de zéro :

```bash
# Supprimer toutes les données (ATTENTION!)
psql -U postgres -d epa_budget -c "TRUNCATE TABLE workflow_history, paiements, pieces_jointes, engagements, receptions, recettes, modificatifs, lignes_budgetaires, programmes, alertes, notifications, rapports, utilisateurs, epa RESTART IDENTITY CASCADE;"

# Réexécuter le schéma
psql -U postgres -d epa_budget -f database/schema.sql

# Relancer le seed
npm run seed
```

## 📊 Données Générées

### EPA et Utilisateurs

- **EPA001** : Hôpital Central de Brazzaville (Santé)
  - dg@epa001.cg / password123
  - daf@epa001.cg / password123
  - controleur@epa001.cg / password123
  - comptable@epa001.cg / password123
  - service@epa001.cg / password123

- **EPA002** : Université Marien Ngouabi (Education)
  - dg@epa002.cg / password123
  - daf@epa002.cg / password123
  - controleur@epa002.cg / password123
  - comptable@epa002.cg / password123
  - service@epa002.cg / password123

- **EPA003** : Office National des Routes (Infrastructure)
- **EPA004** : Centre Hospitalier de Pointe-Noire (Santé)
- **EPA005** : Conservatoire National de Musique (Culture)

### Engagements - Cycle Complet

Les engagements sont créés à différents stades pour simuler le workflow réel :

1. **BROUILLON** → Créé par un Service
2. **SOUMISE_DAF** → Soumis au DAF
3. **EN_VISA** → En attente de visa contrôleur
4. **VISA_OK** → Visé par le contrôleur
5. **REGULARITE_OK** → Contrôle régularité OK par le comptable
6. **APPROUVE** → Approuvé par le DG
7. **PAYE** → Paiement effectué

Chaque transition est enregistrée dans `workflow_history` avec l'acteur et la date.

### Exemples de Scénarios

#### Scénario 1 : Engagement Complet
- Service crée une demande
- DAF la soumet au contrôleur
- Contrôleur appose le visa
- Comptable valide la régularité
- DG approuve
- Comptable enregistre le paiement

#### Scénario 2 : Engagement Bloqué
- Engagement en VISA avec dépassement budgétaire
- Alerte automatique générée pour le contrôleur

#### Scénario 3 : Modificatif
- DAF crée un modificatif pour ajuster un budget
- En attente d'approbation Tutelle

## 🔍 Vérification

Après le seed, vous pouvez vérifier les données :

```sql
-- Nombre d'engagements par statut
SELECT statut, COUNT(*) FROM engagements GROUP BY statut;

-- Workflow history
SELECT * FROM workflow_history ORDER BY created_at DESC LIMIT 10;

-- Engagements avec workflow complet
SELECT e.numero, e.statut, COUNT(wh.id) as nb_transitions
FROM engagements e
LEFT JOIN workflow_history wh ON e.id = wh.engagement_id
GROUP BY e.id, e.numero, e.statut
ORDER BY nb_transitions DESC;

-- Paiements effectués
SELECT COUNT(*) as nb_paiements, SUM(montant) as total_paye
FROM paiements WHERE statut = 'PAYE';
```

## 🎨 Tester le Workflow

### 1. Se connecter comme Service
- Email : `service@epa001.cg`
- Mot de passe : `password123`
- Créer une nouvelle demande d'engagement

### 2. Se connecter comme DAF
- Email : `daf@epa001.cg`
- Mot de passe : `password123`
- Voir les demandes en attente
- Les soumettre au contrôleur

### 3. Se connecter comme Contrôleur
- Email : `controleur@epa001.cg`
- Mot de passe : `password123`
- Voir la file des visas
- Apposer le visa après vérification

### 4. Se connecter comme Comptable
- Email : `comptable@epa001.cg`
- Mot de passe : `password123`
- Valider la régularité
- Enregistrer les paiements

### 5. Se connecter comme DG
- Email : `dg@epa001.cg`
- Mot de passe : `password123`
- Approuver les engagements validés

## 📈 Statistiques Générées

Le seed génère environ :
- 5 EPA
- 12 utilisateurs
- 30+ programmes budgétaires
- 100+ lignes budgétaires
- 50 engagements (répartis sur tous les statuts)
- 5 modificatifs
- 30+ recettes
- 10+ paiements
- Alertes automatiques
- Rapports trimestriels

Ces données permettent de tester toutes les fonctionnalités de l'application avec des scénarios réalistes.

