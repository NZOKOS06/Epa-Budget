# 📋 Documentation Utilisateur : Tutelle

## 🎯 Rôle et Responsabilités

La **Tutelle** est l'autorité de contrôle et de supervision des EPA. Ses responsabilités incluent :

- ✅ **Consolidation Multi-EPA** : Vue consolidée de tous les EPA
- ✅ **Approbation des Modificatifs** : Validation des modificatifs budgétaires (>10%)
- ✅ **Suivi de Performance** : Analyse de la performance des programmes
- ✅ **Rapports Sectoriels** : Génération de rapports par secteur d'activité
- ✅ **Supervision** : Contrôle de la conformité et de l'exécution budgétaire

### Privilèges d'Accès

La Tutelle a accès aux données consolidées de tous les EPA. Elle peut consulter, analyser et superviser l'exécution budgétaire au niveau national.

---

## 🖥️ Interfaces Disponibles

La Tutelle dispose de **4 interfaces principales** :

1. **Consolidation Multi-EPA** (`/tutelle/consolidation`)
2. **Workflow Approbation** (`/tutelle/workflow-approbation`)
3. **Performance Programmes** (`/tutelle/performance-programmes`)
4. **Rapports Sectoriels** (`/tutelle/rapports-sectoriels`)

---

## 📊 Interface 1 : Consolidation Multi-EPA

**Route** : `/tutelle/consolidation`  
**Objectif** : Vue consolidée de tous les EPA avec indicateurs clés

### Contenu de la Page

#### 1. KPI Consolidés

Cartes d'indicateurs au niveau global :
- **Total Engagements** : Nombre total d'engagements tous EPA confondus
- **Montant Total Engagé** : Montant total engagé
- **Montant Total Payé** : Montant total payé
- **Taux d'Exécution Global** : Pourcentage d'exécution

#### 2. Heatmap par EPA

Visualisation graphique montrant :
- Chaque EPA avec son secteur
- Indicateurs clés par EPA :
  - Nombre d'engagements
  - Montant total engagé
  - Montant total payé
  - Taux d'exécution
- Codes couleurs selon performance :
  - 🟢 Excellent (>80%)
  - 🟡 Bon (50-80%)
  - 🟠 Moyen (30-50%)
  - 🔴 Faible (<30%)

#### 3. Liste Détaillée des EPA

Tableau listant tous les EPA :

**Colonnes** :
- **EPA** : Nom de l'établissement
- **Secteur** : Secteur d'activité
- **Nombre Engagements** : Total d'engagements
- **Montant Engagé** : Total engagé
- **Nombre Payés** : Nombre d'engagements payés
- **Montant Payé** : Total payé
- **Taux d'Exécution** : Pourcentage
- **Actions** : Voir détails

#### 4. Filtres

- **Secteur** : Filtrer par secteur (Santé, Education, Infrastructure, Culture, etc.)
- **Recherche** : Rechercher par nom d'EPA

### Mode d'Emploi

#### Consultation de la Consolidation

1. Naviguer vers `/tutelle/consolidation`
2. La vue consolidée s'affiche automatiquement
3. Examiner les KPI globaux
4. Analyser la heatmap pour identifier les EPA en difficulté
5. Utiliser les filtres pour affiner l'analyse

#### Analyse par Secteur

1. Sélectionner un secteur dans le filtre
2. La liste se met à jour avec les EPA du secteur
3. Analyser la performance sectorielle
4. Comparer les EPA entre eux

#### Détails d'un EPA

1. Cliquer sur "Voir détails" d'un EPA
2. Une page détaillée s'ouvre avec :
   - Informations générales de l'EPA
   - Statistiques détaillées
   - Liste des programmes avec exécution
   - Graphiques d'évolution
   - Liste des engagements récents

---

## ✅ Interface 2 : Workflow Approbation

**Route** : `/tutelle/workflow-approbation`  
**Objectif** : Approbation des modificatifs budgétaires soumis par les EPA

### Contenu de la Page

#### 1. Liste des Modificatifs

Tableau listant les modificatifs en attente d'approbation :

**Colonnes** :
- **Numéro** : Identifiant du modificatif
- **EPA** : Établissement
- **Type** : VIREMENT, ANNULATION, AUGMENTATION
- **Programme Source** : Programme d'origine (si virement)
- **Programme Destination** : Programme cible (si virement)
- **Montant** : Montant en FCFA
- **Motif** : Justification fournie
- **Statut** : 
  - 🟡 EN_ATTENTE : En attente d'approbation
  - 🟢 APPROUVE : Approuvé
  - 🔴 REFUSE : Refusé
- **Date Soumission** : Date de soumission
- **Actions** : Voir détails, Approuver, Refuser

#### 2. Filtres

- **Statut** : Filtrer par statut
- **Type** : Filtrer par type de modificatif
- **EPA** : Filtrer par établissement
- **Recherche** : Rechercher par numéro

### Mode d'Emploi

#### Consultation des Modificatifs

1. Naviguer vers `/tutelle/workflow-approbation`
2. La liste des modificatifs en attente s'affiche
3. Utiliser les filtres pour affiner
4. Cliquer sur "Voir détails" pour plus d'informations

#### Processus d'Approbation

**Étape 1 : Consultation**
1. Cliquer sur "Voir détails" d'un modificatif
2. Une modal s'ouvre avec :
   - Informations complètes du modificatif
   - Justification détaillée
   - Impact budgétaire :
     - Situation avant modificatif
     - Situation après modificatif
     - Variation
   - Historique du modificatif

**Étape 2 : Analyse**
Vérifier :
- ✅ La justification est claire et pertinente
- ✅ L'impact budgétaire est acceptable
- ✅ La réallocation est cohérente
- ✅ Les programmes concernés peuvent supporter la modification
- ✅ Conformité avec les règles budgétaires

**Étape 3 : Décision**

**Option A : Approuver**
1. Si tous les éléments sont conformes
2. Cliquer sur "Approuver"
3. Ajouter un commentaire optionnel
4. Confirmer
5. Le statut passe à `APPROUVE`
6. Les crédits sont automatiquement réalloués
7. Notification envoyée au DAF de l'EPA

**Option B : Refuser**
1. Si des éléments ne sont pas conformes
2. Cliquer sur "Refuser"
3. Indiquer le motif obligatoire :
   - Justification insuffisante
   - Impact budgétaire trop important
   - Non-conformité réglementaire
   - Autres motifs
4. Confirmer
5. Le statut passe à `REFUSE`
6. Notification envoyée au DAF avec le motif

#### Traitement en Lot

Pour traiter plusieurs modificatifs similaires :
1. Sélectionner les modificatifs concernés
2. Utiliser les filtres pour regrouper
3. Traiter individuellement (pas de traitement en lot pour l'instant)

---

## 📈 Interface 3 : Performance Programmes

**Route** : `/tutelle/performance-programmes`  
**Objectif** : Analyse de la performance des programmes par EPA

### Contenu de la Page

#### 1. Tableau de Performance

Tableau détaillé par EPA et programme :

**Colonnes** :
- **EPA** : Nom de l'établissement
- **Secteur** : Secteur d'activité
- **Programme** : Code et libellé
- **Budget Initial** : Budget alloué
- **Nombre Engagements** : Nombre d'engagements
- **Montant Exécuté** : Montant payé
- **Taux d'Exécution** : Pourcentage (montant exécuté / budget initial)
- **Actions** : Voir détails

#### 2. Graphiques

- **Graphique en barres** : Taux d'exécution par programme
- **Graphique comparatif** : Comparaison entre EPA
- **Graphique sectoriel** : Performance par secteur

#### 3. Filtres

- **Année** : Sélectionner l'année d'analyse
- **Secteur** : Filtrer par secteur
- **EPA** : Filtrer par établissement
- **Taux min/max** : Filtrer par performance

### Mode d'Emploi

#### Consultation de la Performance

1. Naviguer vers `/tutelle/performance-programmes`
2. Sélectionner l'année d'analyse
3. Le tableau s'affiche avec tous les programmes
4. Analyser les taux d'exécution

#### Identification des Programmes à Problème

1. Filtrer par taux d'exécution faible (<50%)
2. Identifier les programmes en difficulté
3. Analyser les causes :
   - Budget surévalué
   - Engagements tardifs
   - Problèmes d'exécution
4. Prendre des mesures correctives

#### Analyse Sectorielle

1. Filtrer par secteur
2. Comparer les programmes du secteur
3. Identifier les bonnes pratiques
4. Partager les expériences entre EPA

#### Export pour Rapport

1. Appliquer les filtres souhaités
2. Cliquer sur "Exporter"
3. Le fichier Excel/PDF est généré
4. Utiliser pour rapports de performance

---

## 📄 Interface 4 : Rapports Sectoriels

**Route** : `/tutelle/rapports-sectoriels`  
**Objectif** : Génération de rapports consolidés par secteur

### Contenu de la Page

#### 1. Liste des Secteurs

Tableau listant les secteurs avec leurs statistiques :

**Colonnes** :
- **Secteur** : Nom du secteur
- **Nombre d'EPA** : Nombre d'établissements du secteur
- **Nombre Engagements** : Total d'engagements
- **Montant Engagé** : Total engagé
- **Montant Payé** : Total payé
- **Total Recettes** : Total des recettes
- **Taux d'Exécution** : Pourcentage
- **Actions** : Voir rapport, Exporter

#### 2. Graphiques Sectoriels

- **Graphique en secteurs** : Répartition par secteur
- **Graphique comparatif** : Comparaison entre secteurs
- **Évolution temporelle** : Tendance par secteur

#### 3. Filtres

- **Année** : Sélectionner l'année
- **Secteur** : Filtrer un secteur spécifique
- **Période** : Filtrer par période (trimestre, semestre)

### Mode d'Emploi

#### Consultation des Rapports

1. Naviguer vers `/tutelle/rapports-sectoriels`
2. Sélectionner l'année et la période
3. Le tableau s'affiche avec les statistiques par secteur
4. Analyser les performances sectorielles

#### Génération d'un Rapport Sectoriel

1. Cliquer sur "Voir rapport" d'un secteur
2. Une page détaillée s'ouvre avec :
   - Synthèse sectorielle
   - Liste des EPA du secteur
   - Statistiques détaillées
   - Graphiques et analyses
3. Utiliser pour analyse approfondie

#### Export PDF

1. Sélectionner le secteur
2. Cliquer sur "Exporter PDF"
3. Le rapport PDF est généré avec :
   - Couverture
   - Synthèse exécutive
   - Données détaillées
   - Graphiques
   - Analyses
4. Utiliser pour communication officielle

#### Utilisation des Rapports

- **Planification** : Utiliser pour planification budgétaire
- **Communication** : Partager avec les instances
- **Analyse** : Identifier les tendances sectorielles
- **Décision** : Informer les décisions stratégiques

---

## 🔐 Connexion et Authentification

### Identifiants de Test

- **Email** : `tutelle@minfin.cg`
- **Mot de passe** : `password123`

---

## 📱 Navigation

### Menu Latéral

- 📊 **Consolidation** : Vue consolidée multi-EPA
- ✅ **Workflow Approbation** : Approbation modificatifs
- 📈 **Performance Programmes** : Analyse de performance
- 📄 **Rapports Sectoriels** : Rapports par secteur

---

## 💡 Bonnes Pratiques

### 1. Analyse Régulière

- Consulter la consolidation régulièrement
- Surveiller les indicateurs globaux
- Identifier rapidement les problèmes

### 2. Décisions Éclairées

- Analyser tous les éléments avant d'approuver
- Vérifier la cohérence des modificatifs
- Documenter les décisions

### 3. Communication

- Communiquer clairement les refus
- Expliquer les décisions
- Fournir des orientations si nécessaire

### 4. Reporting

- Générer des rapports réguliers
- Analyser les tendances
- Partager les analyses

---

## ⚠️ Cas Particuliers

### Modificatif Complexe

Pour un modificatif complexe :
1. Analyser en détail l'impact
2. Vérifier la cohérence avec la stratégie
3. Consulter si nécessaire
4. Documenter la décision

### EPA en Difficulté

Si un EPA montre des difficultés :
1. Analyser en détail
2. Identifier les causes
3. Proposer des mesures correctives
4. Suivre l'amélioration

### Secteur Sous-Performant

Si un secteur sous-performe :
1. Analyser les causes sectorielles
2. Comparer avec d'autres secteurs
3. Proposer des actions sectorielles
4. Suivre les progrès

---

## 📚 Documentation Associée

- `CYCLE_COMPLET.md` : Cycle budgétaire complet
- Documentation technique pour les administrateurs

