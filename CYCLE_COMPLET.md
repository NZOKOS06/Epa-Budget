# Cycle Complet de Contrôle et Suivi Budgétaire

Ce document décrit le cycle complet de gestion budgétaire implémenté dans l'application.

## 🔄 Workflow des Engagements

### États Possibles

1. **BROUILLON** → Engagement créé par un Service
2. **SOUMISE_DAF** → Soumis au Directeur Administratif et Financier
3. **EN_VISA** → En attente de visa du Contrôleur Financier
4. **VISA_OK** → Visé par le Contrôleur
5. **REGULARITE_OK** → Contrôle régularité validé par le Comptable
6. **APPROUVE** → Approuvé par le Directeur Général
7. **PAYE** → Paiement effectué
8. **REFUSE** → Refusé à n'importe quel stade

### Transitions Autorisées

```
BROUILLON → SOUMISE_DAF (Service)
SOUMISE_DAF → EN_VISA (DAF)
SOUMISE_DAF → REFUSE (DAF)
EN_VISA → VISA_OK (Contrôleur)
EN_VISA → REFUSE (Contrôleur)
VISA_OK → REGULARITE_OK (Comptable)
VISA_OK → REFUSE (Comptable)
REGULARITE_OK → APPROUVE (DG)
REGULARITE_OK → REFUSE (DG)
APPROUVE → PAYE (Comptable)
```

## 👥 Acteurs et Responsabilités

### 1. Service Métier
**Rôles** :
- Créer des demandes d'engagement (statut BROUILLON)
- Soumettre les demandes au DAF
- Créer des PV de réception après livraison

**Écrans** :
- `/services/programmes` - Suivi des programmes
- `/services/demandes-engagements` - Création et suivi des demandes
- `/services/receptions` - Gestion des réceptions/liquidations
- `/services/indicateurs` - Indicateurs de performance

### 2. DAF (Directeur Administratif et Financier)
**Rôles** :
- Valider les demandes d'engagement
- Envoyer les demandes au Contrôleur pour visa
- Gérer les lignes budgétaires
- Créer des modificatifs budgétaires
- Générer des rapports internes

**Écrans** :
- `/daf/programmes` - Gestion des programmes budgétaires
- `/daf/lignes-budgetaires` - Gestion des lignes budgétaires (AE/CP)
- `/daf/engagements` - Gestion des engagements (Kanban)
- `/daf/modificatifs` - Modificatifs budgétaires (>10%)
- `/daf/rapports-internes` - Rapports internes mensuels

**Actions** :
- `POST /api/daf/engagements/:id/envoyer-visa` - Envoyer pour visa

### 3. Contrôleur Financier
**Rôles** :
- Contrôler et viser les engagements
- Vérifier la disponibilité des crédits (AE/CP)
- Identifier les dérives budgétaires
- Maintenir un journal des contrôles

**Écrans** :
- `/controleur/file-visas` - File d'attente des visas
- `/controleur/checklist` - Checklist de contrôle avant visa
- `/controleur/alertes-derive` - Alertes de dérive budgétaire
- `/controleur/journal-controles` - Journal des contrôles

**Actions** :
- `POST /api/controleur/engagements/:id/visa` - Apposer le visa
- `POST /api/controleur/engagements/:id/refuser-visa` - Refuser le visa

### 4. Agent Comptable
**Rôles** :
- Contrôler la régularité comptable
- Enregistrer les recettes
- Gérer la trésorerie
- Effectuer les paiements
- Préparer la clôture et les comptes annuels

**Écrans** :
- `/comptable/controle-regularite` - Contrôle de régularité
- `/comptable/recettes` - Gestion des recettes
- `/comptable/cloture` - Opérations de clôture
- `/comptable/tresorerie` - Gestion de la trésorerie
- `/comptable/comptes-annuels` - Comptes annuels certifiés

**Actions** :
- `POST /api/comptable/engagements/:id/regularite-ok` - Valider la régularité
- `POST /api/comptable/engagements/:id/paiement` - Enregistrer un paiement
- `POST /api/comptable/recettes` - Enregistrer une recette

### 5. Directeur Général (DG)
**Rôles** :
- Approbation stratégique des engagements validés
- Validation des sessions
- Suivi des rapports pour la Tutelle

**Écrans** :
- `/dg/dashboard` - Dashboard exécutif avec KPIs
- `/dg/sessions` - Sessions d'approbation
- `/dg/rapports-tutelle` - Rapports pour la Tutelle
- `/dg/approbations` - Approbations stratégiques

**Actions** :
- `POST /api/dg/engagements/:id/approver` - Approuver un engagement
- `POST /api/dg/engagements/:id/refuser` - Refuser un engagement
- `POST /api/dg/engagements/batch-approver` - Approbation en lot

### 6. Tutelle
**Rôles** :
- Consolidation multi-EPA
- Approbation des modificatifs budgétaires
- Suivi de la performance des programmes
- Génération de rapports sectoriels

**Écrans** :
- `/tutelle/consolidation` - Consolidation multi-EPA
- `/tutelle/workflow-approbation` - Workflow d'approbation des modificatifs
- `/tutelle/performance-programmes` - Performance des programmes
- `/tutelle/rapports-sectoriels` - Rapports sectoriels

**Actions** :
- `POST /api/tutelle/modificatifs/:id/approbation` - Approuver/Refuser un modificatif

### 7. CCDB (Cour des Comptes)
**Rôles** :
- Audit complet des engagements
- Traçabilité complète (piste d'audit)
- Vérification des comptes annuels

**Écrans** :
- `/ccdb/piste-audit` - Piste d'audit avec recherche avancée
- `/ccdb/comptes-annuels` - Comptes annuels pour audit

**Actions** :
- `GET /api/ccdb/engagements/:id/timeline` - Timeline complète d'un engagement
- `GET /api/ccdb/export-audit` - Export complet pour audit

## 📊 Types de Données

### Engagements
- Numéro unique
- EPA, Programme, Ligne budgétaire
- Montant
- Objet/Description
- Statut workflow
- Dates de visa, régularité, approbation
- Historique complet

### Lignes Budgétaires
- Code nature (ex: 70.01, 60.02)
- Autorisation d'Engagement (AE) initiale et restante
- Crédit de Paiement (CP) initial et restant
- Mise à jour automatique lors des engagements

### Modificatifs
- Types : VIREMENT, ANNULATION, AUGMENTATION
- Nécessaire pour modifications >10% d'une ligne
- Approbation Tutelle requise

### Recettes
- Nature (Subvention État, Recettes propres, Dons, etc.)
- Montant
- Date d'enregistrement

### Paiements
- Numéro d'ordre de paiement
- Montant
- Date de paiement
- Lié à un engagement approuvé

## 🔔 Notifications

Les notifications sont générées automatiquement lors des transitions :

- Service → DAF : "Nouvelle demande d'engagement soumise"
- DAF → Contrôleur : "Demande envoyée pour visa"
- Contrôleur → Comptable : "Engagement visé - Contrôle régularité requis"
- Comptable → DG : "Engagement validé - Approbation requise"
- DG → Service : "Engagement approuvé - PV réception requis"
- DG → Tutelle : "Nouvel engagement approuvé"
- Refus : "Demande refusée"

## 🚨 Alertes Automatiques

- **Dérive budgétaire** : Lorsqu'un engagement dépasse les crédits disponibles (AE/CP)
- **Engagement urgent** : Montant > 5 000 000 FCFA
- **Dépassement seuil** : Masse salariale > 50% du budget

## 📈 Statistiques et Rapports

### Dashboard DG
- Engagements en attente d'approbation
- Montant approuvé dans le mois
- Alertes urgentes

### Rapports Internes DAF
- Nombre d'engagements par mois
- Total engagé vs payé
- Évolution mensuelle

### Consolidation Tutelle
- Vue multi-EPA
- Statistiques par secteur
- Performance globale

## 🔐 Sécurité et Traçabilité

- Toutes les actions sont authentifiées (JWT)
- Autorisation par rôle (RBAC)
- Historique complet dans `workflow_history`
- Traçabilité complète pour audit (CCDB)
- Timestamps sur tous les enregistrements

## 🎯 Cas d'Usage Typiques

### Cas 1 : Achat de matériel médical
1. Service crée la demande (BROUILLON)
2. Service soumet au DAF (SOUMISE_DAF)
3. DAF envoie au Contrôleur (EN_VISA)
4. Contrôleur vérifie les crédits et appose le visa (VISA_OK)
5. Comptable vérifie la régularité (REGULARITE_OK)
6. DG approuve (APPROUVE)
7. Comptable enregistre le paiement (PAYE)
8. Service crée le PV de réception

### Cas 2 : Dérive budgétaire détectée
1. Engagement créé dépasse les crédits disponibles
2. Alerte automatique générée pour le Contrôleur
3. Contrôleur peut refuser ou demander un modificatif
4. Si modificatif : approbation Tutelle requise

### Cas 3 : Audit CCDB
1. CCDB recherche les engagements par critères
2. Visualise la timeline complète de chaque engagement
3. Exporte les données pour audit externe
4. Vérifie les comptes annuels

