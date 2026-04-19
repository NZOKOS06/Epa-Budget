# 📋 Documentation Utilisateur : Directeur Général (DG)

## 🎯 Rôle et Responsabilités

Le **Directeur Général (DG)** est le responsable exécutif de l'EPA. Il a la responsabilité de :

- ✅ **Approbation stratégique** des engagements validés par tous les niveaux de contrôle
- ✅ **Validation des sessions** d'approbation budgétaire
- ✅ **Suivi exécutif** de l'exécution budgétaire de l'EPA
- ✅ **Transmission des rapports** à l'autorité de tutelle
- ✅ **Décision finale** sur les engagements importants

### Privilèges d'Accès

Le DG a accès à toutes les données de son EPA pour une vision globale et stratégique. Il peut consulter l'historique complet des engagements et prendre des décisions d'approbation ou de refus.

---

## 🖥️ Interfaces Disponibles

Le DG dispose de **4 interfaces principales** :

1. **Dashboard Exécutif** (`/dg/dashboard`)
2. **Sessions** (`/dg/sessions`)
3. **Rapports Tutelle** (`/dg/rapports-tutelle`)
4. **Approbations Stratégiques** (`/dg/approbations`)

---

## 📊 Interface 1 : Dashboard Exécutif

**Route** : `/dg/dashboard`  
**Objectif** : Vue d'ensemble de l'exécution budgétaire avec indicateurs clés

### Contenu de la Page

#### 1. KPI Cards (Cartes d'Indicateurs)

Quatre cartes affichant les métriques principales :

- **📈 Engagements en Attente**
  - Nombre d'engagements validés par le comptable, en attente d'approbation DG
  - Statut : `REGULARITE_OK`
  
- **✅ Approbations du Mois**
  - Nombre d'engagements approuvés dans le mois en cours
  - Permet de suivre le rythme d'approbation

- **💰 Montant Approuvé (Mois)**
  - Montant total des engagements approuvés dans le mois
  - Affiché en FCFA avec formatage

- **⚠️ Alertes Urgentes**
  - Nombre d'alertes non lues destinées au DG
  - Indicateur visuel si > 0

#### 2. Heatmap d'Exécution des Programmes

Visualisation graphique montrant :
- Les différents programmes budgétaires
- Le taux d'exécution de chaque programme (par couleur)
- Codes couleurs :
  - 🟢 Vert : Exécution > 80% (excellent)
  - 🟡 Jaune : Exécution 50-80% (bon)
  - 🟠 Orange : Exécution 30-50% (moyen)
  - 🔴 Rouge : Exécution < 30% (faible)

**Utilisation** :
- Cliquer sur un programme pour voir les détails
- Identifier rapidement les programmes en retard

#### 3. Graphique d'Évolution Mensuelle

Graphique en ligne montrant :
- L'évolution des engagements approuvés mois par mois
- Les 12 derniers mois
- Permet de visualiser les tendances

#### 4. Liste des Engagements en Attente

Tableau listant les engagements validés, en attente d'approbation :

**Colonnes** :
- **Numéro** : Identifiant unique de l'engagement
- **Montant** : Montant en FCFA
- **Programme** : Programme budgétaire concerné
- **Service** : Service demandeur
- **Date** : Date de validation comptable
- **Actions** : Bouton "Voir détails"

**Fonctionnalités** :
- Tri par colonne
- Pagination si beaucoup d'éléments
- Filtres possibles (non visibles mais peuvent être ajoutés)

#### 5. Alertes Urgentes

Section affichant les 5 dernières alertes :
- Titre de l'alerte
- Message descriptif
- Date de création
- Badge de niveau (INFO, WARNING, CRITICAL)
- Bouton "Marquer comme lu"

### Mode d'Emploi

#### Consultation Quotidienne

1. **Connexion** : Se connecter avec vos identifiants DG
2. **Accès** : Le dashboard s'affiche automatiquement après connexion
3. **Analyse** :
   - Consulter les KPI cards pour un état rapide
   - Vérifier les alertes urgentes en priorité
   - Examiner la heatmap pour identifier les problèmes
4. **Action** : Cliquer sur "Voir détails" d'un engagement pour l'approuver

#### Approbation depuis le Dashboard

1. Dans la liste des engagements en attente, cliquer sur "Voir détails"
2. Une modal s'ouvre avec les informations complètes
3. Consulter :
   - L'objet de l'engagement
   - Le montant
   - L'historique des validations
   - Les pièces jointes
4. Prendre une décision :
   - **Approuver** : Cliquer sur "Approuver" et ajouter un commentaire optionnel
   - **Refuser** : Cliquer sur "Refuser" et indiquer le motif

---

## 📅 Interface 2 : Sessions

**Route** : `/dg/sessions`  
**Objectif** : Visualisation des sessions d'approbation mensuelles et e-voting

### Contenu de la Page

#### 1. Calendrier des Sessions

Calendrier interactif affichant :
- Les sessions d'approbation par mois
- Les mois avec des engagements approuvés sont mis en évidence
- Navigation mois par mois

#### 2. Détails de Session

Pour chaque mois, affichage de :
- **Période** : Mois et année
- **Nombre d'engagements** : Total d'engagements approuvés dans le mois
- **Montant total** : Somme des montants approuvés
- **Date de session** : Date de la session d'approbation

#### 3. Liste des Engagements de la Session

Tableau listant tous les engagements approuvés dans la session :

**Colonnes** :
- Numéro d'engagement
- Montant
- Programme
- Service demandeur
- Date d'approbation

#### 4. E-Voting (Si Applicable)

Fonctionnalité permettant :
- D'approuver plusieurs engagements en une seule session
- De voter électroniquement lors des sessions programmées
- D'enregistrer les décisions collectives

### Mode d'Emploi

#### Consultation d'une Session

1. Naviguer vers `/dg/sessions`
2. Cliquer sur un mois dans le calendrier
3. Les détails de la session s'affichent
4. Consulter la liste des engagements approuvés

#### Participation à une Session E-Voting

1. Si une session est programmée, elle apparaît dans le calendrier
2. Cliquer sur la session active
3. Une modal s'ouvre avec la liste des engagements à voter
4. Pour chaque engagement :
   - Consulter les détails
   - Voter "Pour" ou "Contre"
   - Ajouter un commentaire si nécessaire
5. Valider les votes
6. Les résultats sont enregistrés automatiquement

---

## 📄 Interface 3 : Rapports Tutelle

**Route** : `/dg/rapports-tutelle`  
**Objectif** : Gestion et transmission des rapports à l'autorité de tutelle

### Contenu de la Page

#### 1. Liste des Rapports

Tableau listant tous les rapports destinés à la tutelle :

**Colonnes** :
- **Type** : Type de rapport (Trimestriel, Comptes Annuels, etc.)
- **Période** : Période couverte (ex: T1 2025, Année 2024)
- **Statut** : Badge de statut
  - 🟡 BROUILLON : En cours de préparation
  - 🟢 VALIDE : Validé et prêt à transmettre
  - 🔵 TRANSMIS : Transmis à la tutelle
- **Date création** : Date de création
- **Actions** : Boutons d'action

#### 2. Types de Rapports

- **📊 Rapports Trimestriels** : Synthèse trimestrielle d'exécution budgétaire
- **📋 Comptes Annuels** : États financiers annuels certifiés
- **🔍 Rapports Spéciaux** : Rapports sur demande de la tutelle

#### 3. Actions Disponibles

- **📥 Télécharger PDF** : Exporter le rapport en PDF
- **📤 Transmettre à Tutelle** : Envoyer le rapport à la tutelle
- **✏️ Modifier** : Éditer un rapport en brouillon
- **👁️ Prévisualiser** : Voir le contenu avant transmission

### Mode d'Emploi

#### Consultation des Rapports

1. Naviguer vers `/dg/rapports-tutelle`
2. Visualiser la liste des rapports
3. Filtrer par type ou statut si nécessaire
4. Cliquer sur "Prévisualiser" pour voir le contenu

#### Transmission d'un Rapport

1. Sélectionner un rapport au statut "VALIDE"
2. Cliquer sur "Prévisualiser" pour vérifier le contenu
3. Si correct, cliquer sur "Transmettre à Tutelle"
4. Confirmer la transmission
5. Le statut passe à "TRANSMIS"
6. Un accusé de réception est généré

#### Export PDF

1. Sélectionner le rapport souhaité
2. Cliquer sur "Télécharger PDF"
3. Le fichier PDF est généré et téléchargé
4. Le fichier contient :
   - Couverture avec logo EPA
   - Synthèse exécutive
   - Données détaillées
   - Graphiques et tableaux
   - Signatures

---

## ✅ Interface 4 : Approbations Stratégiques

**Route** : `/dg/approbations`  
**Objectif** : Approbation ou refus des engagements validés par le comptable

### Contenu de la Page

#### 1. Liste des Engagements en Attente

Tableau principal listant les engagements au statut `REGULARITE_OK` :

**Colonnes** :
- **☑️ Sélection** : Case à cocher pour sélection multiple
- **Numéro** : Identifiant unique
- **Montant** : Montant en FCFA (formaté)
- **Programme** : Programme budgétaire
- **Service** : Service demandeur
- **Date validation** : Date de validation comptable
- **Actions** : Boutons d'action

#### 2. Filtres et Recherche

- **Recherche** : Par numéro, montant, programme
- **Tri** : Par montant, date, programme
- **Filtres** : Par programme, par montant (min/max)

#### 3. Actions en Lot

Bouton "Approuver la sélection" permettant :
- De sélectionner plusieurs engagements
- De les approuver en une seule action
- D'ajouter un commentaire global

#### 4. Modal de Détails

Lors du clic sur "Voir détails", une modal s'ouvre avec :

**Onglet 1 : Informations Générales**
- Numéro d'engagement
- Objet complet
- Montant détaillé
- Programme et ligne budgétaire
- Dates clés (création, visa, régularité)

**Onglet 2 : Historique Workflow**
- Timeline complète des validations
- Acteurs ayant validé à chaque étape
- Dates et commentaires
- Statut actuel

**Onglet 3 : Pièces Jointes**
- Liste des documents
- Téléchargement possible
- Prévisualisation si supporté

**Onglet 4 : Impact Budgétaire**
- Crédits disponibles avant engagement
- Crédits restants après engagement
- Taux d'engagement de la ligne
- Graphique d'évolution

### Mode d'Emploi

#### Approbation Individuelle

1. Naviguer vers `/dg/approbations`
2. Identifier l'engagement à approuver dans la liste
3. Cliquer sur "Voir détails"
4. Consulter toutes les informations dans les onglets
5. Vérifier :
   - L'objet et la justification
   - Le montant et l'impact budgétaire
   - L'historique des validations
   - Les pièces justificatives
6. Prendre une décision :
   - **Approuver** :
     - Cliquer sur "Approuver"
     - Ajouter un commentaire optionnel (ex: "Conforme aux objectifs stratégiques")
     - Confirmer
     - Le statut passe à `APPROUVE`
     - Notification envoyée au service et à la tutelle
   
   - **Refuser** :
     - Cliquer sur "Refuser"
     - Indiquer le motif obligatoire (ex: "Non conforme aux priorités")
     - Confirmer
     - Le statut passe à `REFUSE`
     - Notification envoyée au service avec le motif

#### Approbation en Lot

1. Dans la liste des engagements, cocher les cases des engagements à approuver
2. Vérifier que tous sont conformes
3. Cliquer sur "Approuver la sélection"
4. Une modal de confirmation s'ouvre
5. Ajouter un commentaire global si nécessaire
6. Confirmer l'approbation en lot
7. Tous les engagements sélectionnés passent au statut `APPROUVE`

#### Consultation de l'Historique

1. Pour chaque engagement, cliquer sur "Voir détails"
2. Aller dans l'onglet "Historique Workflow"
3. Visualiser la timeline complète :
   - Date de création par le service
   - Date de soumission au DAF
   - Date de visa par le contrôleur
   - Date de validation comptable
   - Décisions prises à chaque étape
4. Voir les commentaires de chaque acteur

---

## 🔐 Connexion et Authentification

### Identifiants de Test

- **Email** : `dg@epa001.cg`
- **Mot de passe** : `password123`

### Processus de Connexion

1. Accéder à la page de connexion
2. Saisir l'email et le mot de passe
3. Cliquer sur "Se connecter"
4. Après authentification, redirection vers le dashboard DG
5. La session reste active pendant 24h

---

## 📱 Navigation dans l'Application

### Menu Latéral

Le menu latéral affiche les 4 interfaces du DG :

- 🏠 **Dashboard** : Vue d'ensemble
- 📅 **Sessions** : Sessions d'approbation
- 📄 **Rapports Tutelle** : Rapports à transmettre
- ✅ **Approbations** : Approbation des engagements

### En-tête

- **Profil utilisateur** : Nom et prénom du DG
- **Notification** : Icône avec badge si alertes non lues
- **Déconnexion** : Bouton de déconnexion

---

## 💡 Bonnes Pratiques

### 1. Consultation Régulière

- Consulter le dashboard quotidiennement
- Vérifier les alertes en priorité
- Traiter les approbations dans les 48h

### 2. Décisions Éclairées

- Toujours consulter les détails complets avant d'approuver
- Vérifier l'impact budgétaire
- Examiner l'historique des validations

### 3. Commentaires Utiles

- Ajouter des commentaires lors de l'approbation
- Expliquer les refus avec précision
- Documenter les décisions stratégiques

### 4. Suivi des Sessions

- Consulter régulièrement les sessions mensuelles
- Vérifier la cohérence des approbations
- Préparer les rapports tutelle à temps

---

## ⚠️ Cas Particuliers

### Engagement avec Dérive Budgétaire

Si un engagement dépasse les crédits disponibles :
- Une alerte est générée automatiquement
- L'engagement apparaît dans les alertes urgentes
- Consultation des détails obligatoire
- Décision : Approuver (si justifié) ou Refuser avec demande de modificatif

### Engagement Urgent

Pour les engagements prioritaires (montant > 5M) :
- Badge "URGENT" visible
- Traitement en priorité recommandé
- Notification renforcée

### Refus d'un Engagement

En cas de refus :
- Motif obligatoire à renseigner
- Notification envoyée au service
- L'engagement peut être corrigé et resoumis
- Historique conservé pour traçabilité

---

## 📞 Support

En cas de problème ou question :

1. Consulter cette documentation
2. Contacter l'administrateur système
3. Vérifier les logs d'activité dans votre profil

---

## 📚 Documentation Associée

- `CYCLE_COMPLET.md` : Description du cycle budgétaire complet
- `SCENARIO_ACPCE.md` : Scénario détaillé de gestion d'un engagement
- Documentation technique disponible pour les administrateurs

