# 📋 Documentation Utilisateur : Agent Comptable

## 🎯 Rôle et Responsabilités

L'**Agent Comptable** est responsable de la régularité comptable et de l'exécution financière. Ses responsabilités incluent :

- ✅ **Contrôle de régularité** : Vérification de la régularité comptable des engagements visés
- ✅ **Gestion des recettes** : Enregistrement des recettes de l'EPA
- ✅ **Exécution des paiements** : Enregistrement des paiements des engagements approuvés
- ✅ **Gestion de la trésorerie** : Suivi des flux financiers
- ✅ **Clôture comptable** : Opérations de clôture mensuelle et annuelle
- ✅ **Comptes annuels** : Préparation et certification des états financiers

### Privilèges d'Accès

L'Agent Comptable a accès à toutes les données financières et comptables de son EPA. Il peut valider la régularité, enregistrer les recettes et les paiements, et gérer la trésorerie.

---

## 🖥️ Interfaces Disponibles

L'Agent Comptable dispose de **5 interfaces principales** :

1. **Contrôle Régularité** (`/comptable/controle-regularite`)
2. **Recettes** (`/comptable/recettes`)
3. **Clôture** (`/comptable/cloture`)
4. **Trésorerie** (`/comptable/tresorerie`)
5. **Comptes Annuels** (`/comptable/comptes-annuels`)

---

## ✅ Interface 1 : Contrôle Régularité

**Route** : `/comptable/controle-regularite`  
**Objectif** : Vérification de la régularité comptable des engagements visés

### Contenu de la Page

#### 1. Liste des Engagements

Tableau listant les engagements au statut `VISA_OK` :

**Colonnes** :
- **Numéro** : Identifiant unique
- **Montant** : Montant en FCFA
- **Objet** : Objet de l'engagement
- **EPA** : Établissement
- **Programme** : Programme budgétaire
- **Service** : Service demandeur
- **Contrôleur** : Nom du contrôleur ayant visé
- **Date Visa** : Date du visa
- **Date Soumission** : Date de soumission pour régularité
- **Actions** : Bouton "Voir détails"

### Mode d'Emploi

#### Processus de Contrôle de Régularité

**Étape 1 : Consultation**
1. Naviguer vers `/comptable/controle-regularite`
2. La liste des engagements visés s'affiche
3. Cliquer sur "Voir détails" d'un engagement

**Étape 2 : Vérifications Comptables**

**1. Régularité Budgétaire**
- ✅ Visa contrôleur présent et valide
- ✅ Crédits disponibles confirmés
- ✅ Imputation correcte (code nature, programme)

**2. Régularité Comptable**
- ✅ Imputation comptable correcte
- ✅ Classification conforme au plan comptable
- ✅ Pas de double engagement
- ✅ Vérification des engagements antérieurs

**3. Régularité Administrative**
- ✅ Pièces justificatives complètes
- ✅ Signatures présentes
- ✅ Autorisations en règle
- ✅ Procédures respectées

**4. Régularité Financière**
- ✅ Trésorerie suffisante
- ✅ Pas de dépassement de plafond
- ✅ Respect des ratios budgétaires

**Étape 3 : Décision**

**Option A : Régularité Validée**
1. Si tous les contrôles sont OK
2. Cliquer sur "Valider la régularité"
3. Ajouter un commentaire optionnel
4. Confirmer
5. Le statut passe à `REGULARITE_OK`
6. Notification envoyée au DG

**Option B : Régularité Refusée**
1. Identifier le problème
2. Cliquer sur "Refuser"
3. Indiquer le motif obligatoire
4. Confirmer
5. Le statut passe à `REFUSE`
6. Notification envoyée au service

---

## 💵 Interface 2 : Recettes

**Route** : `/comptable/recettes`  
**Objectif** : Enregistrement et gestion des recettes de l'EPA

### Contenu de la Page

#### 1. Liste des Recettes

Tableau listant toutes les recettes enregistrées :

**Colonnes** :
- **Numéro** : Numéro de la recette (ex: REC-20250115-001)
- **Nature** : Nature de la recette
  - Subvention État
  - Recettes propres
  - Dons
  - Partenariats
  - Autres
- **Montant** : Montant en FCFA
- **Date** : Date de recette
- **Statut** : ENREGISTRE
- **Actions** : Modifier, Supprimer (si non comptabilisée)

#### 2. Formulaire de Saisie

Bouton "Nouvelle Recette" ouvrant un formulaire :

**Champs** :
- **Nature de recette** : Liste déroulante (obligatoire)
- **Montant** : Montant en FCFA (obligatoire)
- **Date de recette** : Date de réception (obligatoire)
- **Référence** : Numéro de référence (optionnel)
- **Commentaire** : Observations (optionnel)

### Mode d'Emploi

#### Enregistrement d'une Recette

1. Cliquer sur "Nouvelle Recette"
2. Remplir le formulaire :
   - Sélectionner la nature
   - Saisir le montant
   - Sélectionner la date
   - Ajouter référence et commentaire si nécessaire
3. Valider
4. La recette est enregistrée avec un numéro unique
5. Elle apparaît dans la liste

#### Consultation des Recettes

1. Naviguer vers `/comptable/recettes`
2. La liste des recettes s'affiche, triée par date (plus récentes d'abord)
3. Utiliser les filtres si disponibles :
   - Par année
   - Par nature
   - Par période

#### Modification/Suppression

- **Modification** : Possible si la recette n'est pas comptabilisée
- **Suppression** : Possible uniquement si non comptabilisée
- Après comptabilisation, aucune modification n'est possible

---

## 📊 Interface 3 : Clôture

**Route** : `/comptable/cloture`  
**Objectif** : Opérations de clôture comptable par programme

### Contenu de la Page

#### 1. Tableau de Clôture

Tableau listant les programmes avec leur situation de clôture :

**Colonnes** :
- **Programme** : Code et libellé
- **AE Initial** : Autorisation d'Engagement initiale
- **CP Initial** : Crédit de Paiement initial
- **AE Restant** : Crédit AE non engagé
- **CP Restant** : Crédit CP non payé
- **Engagements Payés** : Nombre d'engagements payés
- **Total Payé** : Montant total payé
- **Taux d'Exécution** : Pourcentage CP payé / CP initial

#### 2. Filtres

- **Année** : Sélectionner l'année de clôture
- **Programme** : Filtrer par programme

#### 3. Statistiques Globales

En-tête affichant :
- Total AE initial
- Total CP initial
- Total engagé
- Total payé
- Taux d'exécution global

### Mode d'Emploi

#### Consultation de la Clôture

1. Naviguer vers `/comptable/cloture`
2. Sélectionner l'année (par défaut : année en cours)
3. Le tableau s'affiche avec la situation de chaque programme
4. Analyser :
   - Les crédits restants
   - Le taux d'exécution
   - Les écarts éventuels

#### Analyse d'Exécution

1. Identifier les programmes avec faible taux d'exécution
2. Analyser les causes :
   - Engagements non payés
   - Engagements en cours
   - Retards de paiement
3. Préparer les ajustements si nécessaire

#### Préparation de la Clôture

1. Vérifier que tous les paiements sont enregistrés
2. Vérifier les crédits restants
3. Préparer les écritures de clôture
4. Générer les rapports de clôture

---

## 💰 Interface 4 : Trésorerie

**Route** : `/comptable/tresorerie`  
**Objectif** : Suivi de la trésorerie et des flux financiers

### Contenu de la Page

#### 1. Solde de Trésorerie

Section affichant :
- **Solde Actuel** : Solde disponible
- **Recettes du Mois** : Total des recettes du mois en cours
- **Dépenses du Mois** : Total des paiements du mois en cours
- **Solde Prévu (Fin de Mois)** : Solde prévisionnel

#### 2. Graphique des Flux

Graphique montrant :
- Recettes par mois (barres vertes)
- Dépenses par mois (barres rouges)
- Solde cumulé (ligne)
- Les 12 derniers mois

#### 3. Plan de Trésorerie

Tableau détaillé mois par mois :
- Mois
- Recettes prévues
- Dépenses prévues
- Solde prévu
- Solde réel (si disponible)

#### 4. Alertes Trésorerie

Section affichant les alertes :
- 🔴 Solde insuffisant
- 🟡 Solde critique
- ⚠️ Dépenses supérieures aux recettes

### Mode d'Emploi

#### Consultation de la Trésorerie

1. Naviguer vers `/comptable/tresorerie`
2. Consulter le solde actuel
3. Examiner le graphique des flux
4. Analyser les tendances

#### Vérification Avant Paiement

Avant d'enregistrer un paiement :
1. Vérifier le solde disponible
2. Vérifier que le solde reste positif après paiement
3. Si solde insuffisant : Alerter la direction

#### Suivi des Flux

1. Surveiller les recettes et dépenses mensuelles
2. Identifier les périodes de tension
3. Anticiper les besoins de trésorerie
4. Préparer les prévisions

---

## 📋 Interface 5 : Comptes Annuels

**Route** : `/comptable/comptes-annuels`  
**Objectif** : Consultation et export des comptes annuels certifiés

### Contenu de la Page

#### 1. Liste des Comptes Annuels

Tableau listant les comptes annuels :

**Colonnes** :
- **Année** : Année comptable
- **Date de Certification** : Date de certification
- **Statut** : 
  - 🟡 EN_PRÉPARATION
  - 🟢 CERTIFIÉ
  - 🔵 TRANSMIS_CCDB
- **Fichier** : Lien vers le fichier PDF
- **Actions** : Télécharger, Prévisualiser

#### 2. Statistiques

Section affichant pour l'année sélectionnée :
- Total des recettes
- Total des dépenses
- Résultat (Recettes - Dépenses)
- Patrimoine net

### Mode d'Emploi

#### Consultation des Comptes Annuels

1. Naviguer vers `/comptable/comptes-annuels`
2. Sélectionner l'année si nécessaire
3. La liste des comptes annuels s'affiche
4. Cliquer sur "Prévisualiser" pour voir le contenu

#### Export PDF

1. Sélectionner le compte annuel souhaité
2. Cliquer sur "Télécharger PDF"
3. Le fichier PDF est généré avec :
   - Bilan
   - Compte de résultat
   - Annexes
   - Notes explicatives
4. Utiliser pour transmission à la tutelle ou à la CCDB

---

## 🔐 Connexion et Authentification

### Identifiants de Test

- **Email** : `comptable@epa001.cg`
- **Mot de passe** : `password123`

---

## 📱 Navigation

### Menu Latéral

- ✅ **Contrôle Régularité** : Vérification régularité
- 💵 **Recettes** : Gestion des recettes
- 📊 **Clôture** : Opérations de clôture
- 💰 **Trésorerie** : Suivi trésorerie
- 📋 **Comptes Annuels** : Comptes annuels

---

## 💡 Bonnes Pratiques

### 1. Rigoureux dans les Contrôles

- Vérifier systématiquement tous les éléments
- Ne pas valider sans avoir vérifié la trésorerie
- Documenter toutes les décisions

### 2. Enregistrement Immédiat

- Enregistrer les recettes dès réception
- Enregistrer les paiements après validation
- Maintenir la trésorerie à jour

### 3. Suivi Continu

- Consulter la trésorerie quotidiennement
- Surveiller les flux mensuels
- Anticiper les besoins

### 4. Traçabilité

- Tous les enregistrements sont tracés
- Conserver les justificatifs
- Préparer les rapports régulièrement

---

## ⚠️ Cas Particuliers

### Trésorerie Insuffisante

Si le solde est insuffisant pour un paiement :
1. Alerter la direction
2. Vérifier les recettes à venir
3. Reporter le paiement si possible
4. Chercher des solutions de trésorerie

### Régularité Douteuse

Si un doute subsiste sur la régularité :
1. Ne pas valider sans certitude
2. Demander des clarifications
3. Consulter si nécessaire
4. Documenter le doute

### Recette Exceptionnelle

Pour une recette importante ou exceptionnelle :
1. Vérifier la source
2. Documenter l'origine
3. Enregistrer avec commentaire détaillé
4. Informer la direction

---

## 📚 Documentation Associée

- `CYCLE_COMPLET.md` : Cycle budgétaire complet
- `SCENARIO_ACPCE.md` : Scénario détaillé
- Documentation technique pour les administrateurs

