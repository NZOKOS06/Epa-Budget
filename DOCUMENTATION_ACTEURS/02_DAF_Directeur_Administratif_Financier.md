# 📋 Documentation Utilisateur : Directeur Administratif et Financier (DAF)

## 🎯 Rôle et Responsabilités

Le **Directeur Administratif et Financier (DAF)** est responsable de la gestion budgétaire et administrative de l'EPA. Ses responsabilités incluent :

- ✅ **Validation budgétaire** des demandes d'engagement des services
- ✅ **Gestion des programmes budgétaires** et des lignes budgétaires (AE/CP)
- ✅ **Transmission au contrôleur** pour visa
- ✅ **Gestion des modificatifs** budgétaires (>10% des lignes)
- ✅ **Suivi de l'exécution** budgétaire et génération de rapports internes
- ✅ **Coordination** entre les services et les instances de contrôle

### Privilèges d'Accès

Le DAF a accès à toutes les données budgétaires de son EPA. Il peut consulter, valider, modifier les budgets et suivre l'exécution en temps réel.

---

## 🖥️ Interfaces Disponibles

Le DAF dispose de **5 interfaces principales** :

1. **Budget-Programme** (`/daf/programmes`)
2. **Lignes Budgétaires** (`/daf/lignes-budgetaires`)
3. **Engagements** (`/daf/engagements`)
4. **Modificatifs** (`/daf/modificatifs`)
5. **Rapports Internes** (`/daf/rapports-internes`)

---

## 📊 Interface 1 : Budget-Programme

**Route** : `/daf/programmes`  
**Objectif** : Gestion et suivi des programmes budgétaires de l'EPA

### Contenu de la Page

#### 1. Liste des Programmes

Tableau listant tous les programmes budgétaires de l'année en cours :

**Colonnes** :
- **Code** : Code du programme (ex: P001, P002)
- **Libellé** : Nom complet du programme
- **Budget Initial** : Budget alloué en FCFA
- **Montant Engagé** : Total des engagements validés
- **Montant Payé** : Total des paiements effectués
- **Taux d'Exécution** : Pourcentage d'exécution (barre de progression)
- **Actions** : Boutons de détails

#### 2. Filtres

- **Année** : Filtrer par année budgétaire
- **Recherche** : Rechercher par code ou libellé

#### 3. Vue Détails d'un Programme

En cliquant sur "Voir détails", un panneau s'ouvre avec :

- **Informations générales** : Code, libellé, budget
- **Statistiques d'exécution** :
  - Budget initial
  - Engagements totaux
  - Paiements totaux
  - Reste à engager
  - Reste à payer
- **Graphique d'évolution** : Courbe d'exécution mois par mois
- **Liste des engagements** : Engagements liés au programme

### Mode d'Emploi

#### Consultation des Programmes

1. Naviguer vers `/daf/programmes`
2. La liste des programmes s'affiche automatiquement
3. Utiliser les filtres pour affiner la recherche
4. Cliquer sur "Voir détails" pour plus d'informations

#### Analyse d'Exécution

1. Identifier les programmes avec un taux d'exécution faible (<50%)
2. Cliquer sur "Voir détails" pour analyser
3. Examiner la liste des engagements
4. Identifier les causes de la faible exécution
5. Prendre des mesures correctives si nécessaire

---

## 💰 Interface 2 : Lignes Budgétaires

**Route** : `/daf/lignes-budgetaires`  
**Objectif** : Gestion détaillée des lignes budgétaires avec crédits AE/CP

### Contenu de la Page

#### 1. Filtres Principaux

- **Programme** : Sélectionner un programme pour filtrer
- **Année** : Année budgétaire
- **Code Nature** : Recherche par code (ex: 70.01, 60.02)

#### 2. Tableau des Lignes Budgétaires

Tableau détaillé avec les colonnes suivantes :

- **Code Nature** : Code de la nomenclature (ex: 70.01)
- **Libellé** : Description de la ligne
- **Programme** : Programme parent
- **AE Initial** : Autorisation d'Engagement initiale
- **CP Initial** : Crédit de Paiement initial
- **AE Restant** : Crédit AE disponible
- **CP Restant** : Crédit CP disponible
- **% Engagé** : Pourcentage d'engagement
- **Statut** : Badge de statut (🟢 Disponible, 🟡 Attention, 🔴 Épuisé)

#### 3. Alertes

Section affichant les alertes automatiques :

- **⚠️ Masse Salariale** : Si la masse salariale dépasse 50% du budget total
- **🔴 Crédits Épuisés** : Lignes sans crédit disponible
- **🟡 Seuil Dépassé** : Lignes engagées à plus de 80%

### Mode d'Emploi

#### Consultation des Lignes

1. Naviguer vers `/daf/lignes-budgetaires`
2. Sélectionner un programme dans le filtre
3. La liste des lignes du programme s'affiche
4. Examiner les crédits disponibles (AE et CP)

#### Vérification des Crédits Avant Engagement

1. Avant de transmettre un engagement au contrôleur, vérifier :
   - Que l'AE restant est suffisant
   - Que le CP restant est suffisant
   - Qu'il n'y a pas d'alerte sur la ligne
2. Si crédits insuffisants : Créer un modificatif (voir interface Modificatifs)

#### Suivi des Seuils

1. Surveiller les lignes proches du seuil (80% engagé)
2. Prévoir des ajustements si nécessaire
3. Créer des modificatifs pour réallouer les crédits

---

## 📋 Interface 3 : Engagements

**Route** : `/daf/engagements`  
**Objectif** : Gestion des engagements via un tableau Kanban

### Contenu de la Page

#### 1. Vue Kanban

Tableau Kanban avec 4 colonnes représentant les statuts :

- **📝 BROUILLON** : Demandes créées par les services, non encore soumises
- **⏳ SOUMISE_DAF** : Demandes soumises, en attente de validation DAF
- **🔍 EN_VISA** : Engagements transmis au contrôleur pour visa
- **✅ VISA_OK** : Engagements visés, en cours de traitement comptable

#### 2. Cartes d'Engagement

Chaque carte affiche :
- **Numéro** : Identifiant unique
- **Montant** : Montant en FCFA
- **Programme** : Programme concerné
- **Service** : Service demandeur
- **Date** : Date de création ou dernière modification
- **Badge Priorité** : URGENT (rouge) si montant > 5M

#### 3. Actions sur les Cartes

- **Glisser-Déposer** : Déplacer une carte entre les colonnes (changement de statut)
- **Cliquer** : Ouvrir les détails de l'engagement
- **Menu contextuel** : Actions supplémentaires (voir détails, commenter, etc.)

#### 4. Modal de Détails

Lors du clic sur une carte, une modal s'ouvre avec :

**Informations Générales** :
- Numéro, objet, montant
- Programme et ligne budgétaire
- Service demandeur
- Dates clés

**Historique** :
- Timeline des actions
- Commentaires de chaque acteur

**Pièces Jointes** :
- Liste des documents
- Téléchargement possible

**Actions** :
- Envoyer pour visa
- Retourner au service (avec commentaire)
- Voir la ligne budgétaire

### Mode d'Emploi

#### Traitement d'une Demande (Workflow)

**Étape 1 : Réception**
1. Une nouvelle demande apparaît dans "SOUMISE_DAF"
2. Cliquer sur la carte pour voir les détails
3. Vérifier :
   - L'objet et la justification
   - Le montant
   - La ligne budgétaire choisie
   - Les pièces justificatives

**Étape 2 : Validation Budgétaire**
1. Vérifier que les crédits sont disponibles :
   - Aller dans l'onglet "Impact Budgétaire"
   - Vérifier AE restant ≥ montant
   - Vérifier CP restant ≥ montant
2. Si crédits insuffisants : Voir section "Modificatifs"

**Étape 3 : Décision**
- **Approuver et Transmettre** :
  1. Cliquer sur "Envoyer pour visa"
  2. Ajouter un commentaire optionnel (ex: "Crédits disponibles, conforme")
  3. Confirmer
  4. La carte passe dans la colonne "EN_VISA"
  5. Notification envoyée au contrôleur

- **Retourner au Service** :
  1. Cliquer sur "Retourner au service"
  2. Indiquer le motif (ex: "Pièces justificatives incomplètes")
  3. Confirmer
  4. La carte retourne à "BROUILLON"
  5. Notification envoyée au service

#### Utilisation du Kanban (Glisser-Déposer)

1. **Transmission au Contrôleur** :
   - Glisser une carte de "SOUMISE_DAF" vers "EN_VISA"
   - Une confirmation s'affiche
   - Valider le changement de statut
   - Le système enregistre l'action

2. **Visualisation** :
   - Le Kanban permet une vue d'ensemble
   - Identifier rapidement les urgences (badges rouges)
   - Voir la charge de travail par statut

#### Gestion des Urgences

Pour les engagements prioritaires (montant > 5M) :
- Badge "URGENT" visible
- Traiter en priorité
- Vérifier rapidement les crédits
- Transmettre rapidement si conforme

---

## 🔄 Interface 4 : Modificatifs

**Route** : `/daf/modificatifs`  
**Objectif** : Gestion des modificatifs budgétaires (>10% d'une ligne)

### Contenu de la Page

#### 1. Liste des Modificatifs

Tableau listant tous les modificatifs :

**Colonnes** :
- **Numéro** : Identifiant unique (ex: MOD-20250115-001)
- **Type** : Type de modificatif
  - 🔵 VIREMENT : Transfert entre programmes
  - 🔴 ANNULATION : Annulation de crédits
  - 🟢 AUGMENTATION : Ajout de crédits
- **Programme Source** : Programme d'origine (si virement)
- **Programme Destination** : Programme cible (si virement)
- **Montant** : Montant en FCFA
- **Statut** : 
  - 🟡 BROUILLON : En préparation
  - 🔵 EN_ATTENTE : En attente approbation tutelle
  - 🟢 APPROUVE : Approuvé par la tutelle
  - 🔴 REFUSE : Refusé
- **Date** : Date de création
- **Actions** : Voir détails, modifier, supprimer (si brouillon)

#### 2. Bouton "Nouveau Modificatif"

Bouton permettant de créer un nouveau modificatif.

### Mode d'Emploi

#### Création d'un Modificatif

**Cas d'Usage** : Réallocation de crédits entre programmes

1. Cliquer sur "Nouveau modificatif"
2. Une modal s'ouvre avec le formulaire

**Renseignements** :
- **Type** : Sélectionner (VIREMENT, ANNULATION, AUGMENTATION)
- **Programme Source** : Programme d'origine (pour virement)
- **Programme Destination** : Programme cible (pour virement)
- **Ligne Budgétaire** : Ligne concernée
- **Montant** : Montant du modificatif
- **Motif** : Justification obligatoire

3. Cliquer sur "Prévisualiser" pour voir l'impact :
   - Ancien équilibre
   - Variation
   - Nouvel équilibre

4. Si correct, cliquer sur "Créer"
5. Le modificatif est créé au statut "BROUILLON"

#### Soumission à la Tutelle

1. Pour un modificatif au statut "BROUILLON", cliquer sur "Soumettre"
2. Confirmer la soumission
3. Le statut passe à "EN_ATTENTE"
4. Notification envoyée à la tutelle
5. Attendre l'approbation

#### Consultation des Modificatifs Approuvés

1. Filtrer par statut "APPROUVE"
2. Voir les modificatifs validés
3. Les crédits sont automatiquement réalloués après approbation

### Règles Métier

- **Seuil de 10%** : Un modificatif est nécessaire si la modification dépasse 10% d'une ligne
- **Approbation Tutelle** : Tous les modificatifs nécessitent l'approbation de la tutelle
- **Impact automatique** : Après approbation, les crédits sont automatiquement ajustés

---

## 📊 Interface 5 : Rapports Internes

**Route** : `/daf/rapports-internes`  
**Objectif** : Génération de rapports mensuels d'exécution budgétaire

### Contenu de la Page

#### 1. Liste des Rapports

Tableau listant les rapports mensuels :

**Colonnes** :
- **Période** : Mois et année (ex: Janvier 2025)
- **Nombre d'Engagements** : Total d'engagements dans le mois
- **Total Engagé** : Montant total engagé
- **Nombre Payé** : Nombre d'engagements payés
- **Total Payé** : Montant total payé
- **Taux d'Exécution** : Pourcentage payé/engagé
- **Actions** : Télécharger PDF, Prévisualiser

#### 2. Graphique d'Évolution

Graphique en barres montrant :
- Évolution mensuelle des engagements
- Comparaison engagé vs payé
- Les 12 derniers mois

#### 3. Bouton "Générer Rapport"

Bouton pour générer un nouveau rapport pour un mois donné.

### Mode d'Emploi

#### Consultation d'un Rapport

1. Naviguer vers `/daf/rapports-internes`
2. La liste des rapports des 12 derniers mois s'affiche
3. Cliquer sur "Prévisualiser" pour voir le contenu

#### Génération d'un Rapport

1. Cliquer sur "Générer Rapport"
2. Sélectionner le mois et l'année
3. Le système génère automatiquement :
   - Nombre d'engagements
   - Montants totaux
   - Statistiques par programme
   - Graphiques d'évolution
4. Le rapport est sauvegardé et disponible pour export

#### Export PDF

1. Sélectionner le rapport souhaité
2. Cliquer sur "Télécharger PDF"
3. Le fichier PDF est généré avec :
   - En-tête avec logo EPA
   - Synthèse exécutive
   - Tableaux détaillés
   - Graphiques
   - Pied de page avec date de génération

#### Utilisation des Rapports

- **Suivi mensuel** : Comparer l'exécution mois par mois
- **Analyse de tendances** : Identifier les évolutions
- **Communication interne** : Partager avec la direction
- **Préparation tutelle** : Base pour les rapports trimestriels

---

## 🔐 Connexion et Authentification

### Identifiants de Test

- **Email** : `daf@epa001.cg`
- **Mot de passe** : `password123`

---

## 📱 Navigation

### Menu Latéral

- 💼 **Budget-Programme** : Programmes budgétaires
- 💰 **Lignes Budgétaires** : Lignes AE/CP
- 📋 **Engagements** : Gestion Kanban
- 🔄 **Modificatifs** : Modifications budgétaires
- 📊 **Rapports Internes** : Rapports mensuels

---

## 💡 Bonnes Pratiques

### 1. Vérification Systématique

- Toujours vérifier les crédits avant transmission
- Consulter les alertes sur les lignes budgétaires
- Vérifier la cohérence des montants

### 2. Traitement Rapide

- Traiter les demandes dans les 48h
- Prioriser les urgences
- Communiquer rapidement avec les services

### 3. Documentation

- Ajouter des commentaires lors des transmissions
- Documenter les décisions de retour
- Conserver une trace des échanges

### 4. Suivi Continu

- Consulter régulièrement les lignes budgétaires
- Surveiller les seuils d'engagement
- Anticiper les besoins de modificatifs

---

## ⚠️ Cas Particuliers

### Crédits Insuffisants

Si un engagement dépasse les crédits disponibles :
1. Ne pas transmettre au contrôleur
2. Créer un modificatif si nécessaire
3. Retourner au service avec explication
4. Proposer des alternatives si possible

### Modificatif Urgent

Pour un modificatif urgent :
1. Créer le modificatif avec motif détaillé
2. Soumettre immédiatement à la tutelle
3. Informer la direction de l'urgence
4. Suivre l'approbation régulièrement

### Engagement Contesté

Si un engagement semble problématique :
1. Consulter tous les détails
2. Vérifier l'historique
3. Retourner au service avec commentaire précis
4. Demander des clarifications si nécessaire

---

## 📚 Documentation Associée

- `CYCLE_COMPLET.md` : Cycle budgétaire complet
- `SCENARIO_ACPCE.md` : Scénario détaillé
- Documentation technique pour les administrateurs

