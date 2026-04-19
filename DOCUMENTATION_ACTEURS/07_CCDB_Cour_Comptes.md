# 📋 Documentation Utilisateur : CCDB (Cour des Comptes et de Discipline Budgétaire)

## 🎯 Rôle et Responsabilités

La **CCDB (Cour des Comptes et de Discipline Budgétaire)** est l'institution de contrôle et d'audit des comptes publics. Ses responsabilités incluent :

- ✅ **Audit complet** : Audit de tous les engagements et paiements
- ✅ **Piste d'audit** : Traçabilité complète de tous les processus
- ✅ **Contrôle de conformité** : Vérification de la conformité réglementaire
- ✅ **Analyse des comptes annuels** : Vérification des états financiers
- ✅ **Rapports d'audit** : Génération de rapports d'audit détaillés

### Privilèges d'Accès

La CCDB a accès à toutes les données de tous les EPA pour audit. Elle peut consulter l'historique complet, les workflows, et exporter les données pour analyse approfondie.

---

## 🖥️ Interfaces Disponibles

La CCDB dispose de **2 interfaces principales** :

1. **Piste Audit** (`/ccdb/piste-audit`)
2. **Comptes Annuels** (`/ccdb/comptes-annuels`)

---

## 🔍 Interface 1 : Piste Audit

**Route** : `/ccdb/piste-audit`  
**Objectif** : Recherche avancée et audit complet des engagements

### Contenu de la Page

#### 1. Formulaire de Recherche Avancée

Panneau de recherche avec plusieurs critères :

**Critères de Recherche** :
- **Numéro d'Engagement** : Recherche par numéro exact ou partiel
- **EPA** : Sélectionner un ou plusieurs EPA
- **Date Début** : Date de début de période
- **Date Fin** : Date de fin de période
- **Montant Minimum** : Filtrer par montant minimum
- **Montant Maximum** : Filtrer par montant maximum
- **Statut** : Filtrer par statut (tous, APPROUVE, PAYE, REFUSE, etc.)
- **Programme** : Filtrer par programme
- **Service** : Filtrer par service demandeur

#### 2. Résultats de Recherche

Tableau listant les engagements correspondant aux critères :

**Colonnes** :
- **Numéro** : Identifiant unique
- **Montant** : Montant en FCFA
- **Objet** : Objet de l'engagement
- **EPA** : Établissement
- **Programme** : Programme budgétaire
- **Statut** : Statut actuel
- **Date Création** : Date de création
- **Service** : Service demandeur
- **DAF** : DAF ayant traité
- **Contrôleur** : Contrôleur ayant visé
- **Comptable** : Comptable ayant validé
- **DG** : DG ayant approuvé
- **Actions** : Voir timeline complète

#### 3. Statistiques de Recherche

En-tête affichant :
- Nombre total de résultats
- Montant total des engagements trouvés
- Répartition par statut
- Répartition par EPA

#### 4. Export

Boutons d'export :
- **Export Excel** : Export des résultats en Excel
- **Export PDF** : Export en PDF pour rapport
- **Export Complet** : Export avec toutes les données détaillées

### Mode d'Emploi

#### Recherche Simple

1. Naviguer vers `/ccdb/piste-audit`
2. Saisir un critère simple (ex: numéro d'engagement)
3. Cliquer sur "Rechercher"
4. Les résultats s'affichent

#### Recherche Avancée

1. Remplir plusieurs critères :
   - Sélectionner un EPA
   - Définir une période (ex: année 2024)
   - Définir un montant minimum (ex: > 10M)
   - Sélectionner un statut (ex: PAYE)
2. Cliquer sur "Rechercher"
3. Les résultats correspondant à tous les critères s'affichent
4. Utiliser les filtres supplémentaires si nécessaire

#### Analyse des Résultats

1. Examiner la liste des résultats
2. Analyser les statistiques affichées
3. Identifier les patterns ou anomalies
4. Sélectionner les engagements à auditer en détail

#### Consultation de la Timeline Complète

1. Cliquer sur "Voir timeline" d'un engagement
2. Une page détaillée s'ouvre avec :

**Onglet 1 : Informations Générales**
- Toutes les informations de l'engagement
- Montant, objet, programme, ligne
- Dates clés
- Acteurs impliqués

**Onglet 2 : Timeline Complète**
- Chronologie détaillée de toutes les étapes :
  - Date de création (Service)
  - Date de soumission (DAF)
  - Date de visa (Contrôleur)
  - Date de validation comptable (Comptable)
  - Date d'approbation (DG)
  - Date de paiement (Comptable)
- Acteur de chaque étape
- Commentaires à chaque étape
- Durée entre chaque étape

**Onglet 3 : Pièces Jointes**
- Liste complète des documents
- Téléchargement possible
- Vérification de la présence et conformité

**Onglet 4 : Paiements**
- Liste des paiements associés
- Numéros d'ordre de paiement
- Dates de paiement
- Montants payés
- Bénéficiaires

**Onglet 5 : Analyse Audit**
- Vérifications de conformité
- Points de contrôle
- Anomalies détectées
- Recommandations

#### Export pour Audit

**Export Excel** :
1. Appliquer les filtres souhaités
2. Cliquer sur "Export Excel"
3. Le fichier contient :
   - Liste complète des engagements
   - Toutes les colonnes visibles
   - Données détaillées
4. Utiliser pour analyse approfondie dans Excel

**Export PDF** :
1. Cliquer sur "Export PDF"
2. Le rapport PDF est généré avec :
   - Résumé exécutif
   - Liste des engagements
   - Tableaux et graphiques
   - Analyses
3. Utiliser pour rapport d'audit officiel

**Export Complet** :
1. Cliquer sur "Export Complet"
2. Toutes les données détaillées sont exportées :
   - Informations complètes
   - Timeline détaillée
   - Pièces jointes (références)
   - Historique complet
3. Format structuré pour analyse approfondie

---

## 📄 Interface 2 : Comptes Annuels

**Route** : `/ccdb/comptes-annuels`  
**Objectif** : Consultation et audit des comptes annuels des EPA

### Contenu de la Page

#### 1. Liste des Comptes Annuels

Tableau listant les comptes annuels de tous les EPA :

**Colonnes** :
- **Année** : Année comptable
- **EPA** : Établissement
- **Secteur** : Secteur d'activité
- **Date Certification** : Date de certification
- **Statut** : 
  - 🟢 CERTIFIÉ : Certifié par l'EPA
  - 🔵 TRANSMIS_CCDB : Transmis à la CCDB
  - 🟡 EN_AUDIT : En cours d'audit CCDB
  - ✅ VALIDE : Validé par la CCDB
- **Fichier** : Lien vers le fichier PDF
- **Actions** : Voir détails, Télécharger, Auditer

#### 2. Filtres

- **Année** : Sélectionner l'année
- **EPA** : Filtrer par établissement
- **Secteur** : Filtrer par secteur
- **Statut** : Filtrer par statut d'audit

#### 3. Statistiques

Section affichant :
- Nombre total de comptes annuels
- Nombre certifiés
- Nombre en audit
- Nombre validés

### Mode d'Emploi

#### Consultation des Comptes Annuels

1. Naviguer vers `/ccdb/comptes-annuels`
2. Sélectionner l'année d'audit
3. La liste des comptes annuels s'affiche
4. Utiliser les filtres pour affiner

#### Consultation d'un Compte Annuel

1. Cliquer sur "Voir détails" d'un compte annuel
2. Une page détaillée s'ouvre avec :

**Informations Générales** :
- EPA concerné
- Année comptable
- Date de certification
- Statut

**États Financiers** :
- Bilan
- Compte de résultat
- Tableau des flux de trésorerie
- Annexes

**Analyses** :
- Ratios financiers
- Évolution par rapport à l'année précédente
- Comparaison sectorielle
- Points d'attention

#### Téléchargement

1. Cliquer sur "Télécharger" d'un compte annuel
2. Le fichier PDF est téléchargé
3. Utiliser pour analyse approfondie hors ligne

#### Processus d'Audit

1. Sélectionner un compte annuel à auditer
2. Cliquer sur "Auditer"
3. Une interface d'audit s'ouvre avec :
   - Checklist d'audit
   - Points de contrôle
   - Vérifications à effectuer
   - Espace pour observations
4. Remplir la checklist
5. Enregistrer les observations
6. Marquer comme "En audit" puis "Validé" ou "À corriger"

---

## 🔐 Connexion et Authentification

### Identifiants de Test

- **Email** : `ccdb@courcomptes.cg`
- **Mot de passe** : `password123`

---

## 📱 Navigation

### Menu Latéral

- 🔍 **Piste Audit** : Recherche et audit des engagements
- 📄 **Comptes Annuels** : Audit des comptes annuels

---

## 💡 Bonnes Pratiques

### 1. Recherche Systématique

- Utiliser plusieurs critères pour affiner la recherche
- Vérifier la cohérence des résultats
- Analyser les patterns

### 2. Audit Approfondi

- Consulter toujours la timeline complète
- Vérifier toutes les pièces jointes
- Analyser les délais entre les étapes
- Détecter les anomalies

### 3. Documentation

- Documenter toutes les observations
- Enregistrer les anomalies détectées
- Préparer les recommandations
- Générer les rapports d'audit

### 4. Export et Analyse

- Exporter les données pour analyse approfondie
- Utiliser des outils d'analyse si nécessaire
- Croiser les données entre EPA
- Identifier les tendances

---

## ⚠️ Cas Particuliers

### Engagements Suspects

Si des engagements suspects sont détectés :
1. Analyser en détail la timeline
2. Vérifier toutes les pièces jointes
3. Examiner les délais anormaux
4. Documenter les anomalies
5. Générer un rapport d'audit spécifique

### Anomalies Détectées

Si des anomalies sont détectées :
1. Documenter précisément
2. Identifier les causes
3. Recommander des correctifs
4. Suivre la mise en œuvre

### Audit Urgent

Pour un audit urgent :
1. Utiliser des critères de recherche ciblés
2. Prioriser les engagements à haut risque
3. Analyser rapidement les éléments critiques
4. Générer un rapport préliminaire si nécessaire

---

## 📚 Documentation Associée

- `CYCLE_COMPLET.md` : Cycle budgétaire complet
- Documentation technique pour les administrateurs

---

## 🆘 Support

En cas de problème :

1. Consulter cette documentation
2. Vérifier les critères de recherche
3. Contacter l'administrateur pour problèmes techniques
4. Utiliser les exports pour analyse hors ligne si nécessaire

