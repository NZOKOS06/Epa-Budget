# 📋 Documentation Utilisateur : Services Métiers

## 🎯 Rôle et Responsabilités

Les **Services Métiers** sont les utilisateurs opérationnels qui initient les demandes d'engagement. Leurs responsabilités incluent :

- ✅ **Identification des besoins** : Détection et justification des besoins d'achat
- ✅ **Création des demandes** : Saisie des demandes d'engagement
- ✅ **Suivi des demandes** : Suivi du statut de leurs demandes
- ✅ **Réception matérielle** : Enregistrement des PV de réception
- ✅ **Suivi des programmes** : Consultation de l'exécution des programmes

### Privilèges d'Accès

Les Services ont accès à leurs propres demandes et aux informations générales sur les programmes. Ils ne peuvent pas voir les demandes d'autres services.

---

## 🖥️ Interfaces Disponibles

Les Services Métiers disposent de **4 interfaces principales** :

1. **Actions Programme** (`/services/programmes`)
2. **Demandes Engagements** (`/services/demandes-engagements`)
3. **Réceptions** (`/services/receptions`)
4. **Indicateurs** (`/services/indicateurs`)

---

## 📊 Interface 1 : Actions Programme

**Route** : `/services/programmes`  
**Objectif** : Consultation des programmes et suivi de leur exécution

### Contenu de la Page

#### 1. Liste des Programmes

Tableau listant les programmes de l'EPA :

**Colonnes** :
- **Code** : Code du programme
- **Libellé** : Nom du programme
- **Budget Initial** : Budget alloué
- **Montant Engagé** : Total engagé
- **Montant Payé** : Total payé
- **Taux d'Exécution** : Pourcentage avec barre de progression
- **Actions** : Voir détails

#### 2. Calendrier des Sessions

Calendrier affichant :
- Les sessions d'approbation mensuelles
- Les dates importantes
- Navigation mois par mois

### Mode d'Emploi

#### Consultation des Programmes

1. Naviguer vers `/services/programmes`
2. La liste des programmes s'affiche
3. Cliquer sur "Voir détails" pour plus d'informations
4. Consulter le taux d'exécution pour identifier les programmes actifs

#### Suivi d'Exécution

1. Identifier les programmes pertinents pour votre service
2. Consulter le taux d'exécution
3. Vérifier les montants engagés et payés
4. Utiliser ces informations pour planifier vos demandes

---

## 📝 Interface 2 : Demandes Engagements

**Route** : `/services/demandes-engagements`  
**Objectif** : Création et suivi des demandes d'engagement

### Contenu de la Page

#### 1. Liste des Demandes

Tableau listant toutes vos demandes :

**Colonnes** :
- **Numéro** : Identifiant unique
- **Objet** : Objet de la demande
- **Montant** : Montant en FCFA
- **Programme** : Programme concerné
- **Statut** : Badge de statut
  - 🔵 BROUILLON : En préparation
  - 🟡 SOUMISE_DAF : Soumise au DAF
  - 🟠 EN_VISA : En cours de visa
  - 🟢 VISA_OK : Visé, en cours de traitement
  - ✅ APPROUVE : Approuvé par le DG
  - 💰 PAYE : Paiement effectué
  - 🔴 REFUSE : Refusé
- **Date** : Date de création ou dernière modification
- **Actions** : Voir détails, Modifier (si brouillon), Supprimer (si brouillon)

#### 2. Bouton "Nouvelle Demande"

Bouton permettant de créer une nouvelle demande.

#### 3. Filtres

- **Statut** : Filtrer par statut
- **Programme** : Filtrer par programme
- **Recherche** : Rechercher par numéro ou objet

### Mode d'Emploi

#### Création d'une Nouvelle Demande

**Étape 1 : Identification du Besoin**
1. Identifier précisément le besoin
2. Justifier la nécessité
3. Estimer le montant
4. Identifier le programme concerné

**Étape 2 : Saisie de la Demande**
1. Cliquer sur "Nouvelle Demande"
2. Un formulaire s'ouvre avec les champs suivants :

**Champs Obligatoires** :
- **Programme** : Sélectionner dans la liste
- **Ligne Budgétaire** : Sélectionner (s'affiche selon le programme)
- **Objet** : Description complète et précise de l'engagement
- **Montant** : Montant en FCFA
- **Justification** : Justification détaillée du besoin

**Champs Optionnels** :
- **Commentaire** : Informations complémentaires
- **Référence** : Numéro de référence interne

**Étape 3 : Pièces Jointes**
1. Cliquer sur "Ajouter des pièces"
2. Glisser-déposer les fichiers ou cliquer pour sélectionner
3. Types de fichiers acceptés : PDF, Word, Excel, Images
4. Pièces recommandées :
   - Devis ou facture proforma
   - Rapport technique si équipement
   - Note de service justifiant le besoin
   - Autres documents pertinents

**Étape 4 : Validation**
1. Vérifier toutes les informations
2. Vérifier que les pièces jointes sont présentes
3. Cliquer sur "Enregistrer en brouillon" ou "Soumettre"
4. Si brouillon : La demande est sauvegardée, vous pouvez la modifier
5. Si soumise : La demande est envoyée au DAF, statut = `SOUMISE_DAF`

#### Modification d'une Demande (Brouillon)

1. Dans la liste, repérer une demande au statut BROUILLON
2. Cliquer sur "Modifier"
3. Modifier les champs souhaités
4. Ajouter ou supprimer des pièces jointes
5. Sauvegarder ou soumettre

#### Suivi d'une Demande

1. Dans la liste, cliquer sur "Voir détails" d'une demande
2. Une modal s'ouvre avec :

**Informations Générales** :
- Numéro, objet, montant
- Programme et ligne budgétaire
- Statut actuel
- Dates clés

**Historique** :
- Timeline complète des actions
- Date de soumission au DAF
- Date de visa (si visé)
- Date d'approbation (si approuvé)
- Commentaires de chaque acteur

**Pièces Jointes** :
- Liste des documents
- Téléchargement possible

**Actions selon le Statut** :
- **BROUILLON** : Modifier, Supprimer, Soumettre
- **SOUMISE_DAF** : Voir détails uniquement (en attente)
- **REFUSE** : Voir le motif, Modifier et resoumettre
- **APPROUVE** : Voir détails, Préparer la réception
- **PAYE** : Voir détails, Enregistrer la réception

#### Traitement d'un Refus

Si votre demande est refusée :
1. Consulter le motif du refus dans les détails
2. Corriger les éléments problématiques
3. Modifier la demande si nécessaire
4. Resoumettre après correction
5. La nouvelle version repart en validation

---

## 📦 Interface 3 : Réceptions

**Route** : `/services/receptions`  
**Objectif** : Enregistrement des PV de réception après livraison

### Contenu de la Page

#### 1. Liste des Réceptions

Tableau listant les réceptions enregistrées :

**Colonnes** :
- **Numéro PV** : Numéro du PV de réception
- **Engagement** : Numéro de l'engagement lié
- **Objet** : Objet de l'engagement
- **Date Réception** : Date de réception matérielle
- **Statut** : ENREGISTRE, VALIDE
- **Actions** : Voir détails, Modifier

#### 2. Bouton "Nouvelle Réception"

Bouton permettant d'enregistrer une nouvelle réception.

### Mode d'Emploi

#### Enregistrement d'une Réception

**Prérequis** : L'engagement doit être au statut `APPROUVE` ou `PAYE`

1. Cliquer sur "Nouvelle Réception"
2. Une modal s'ouvre avec :
   - Liste des engagements approuvés disponibles
3. Sélectionner l'engagement concerné
4. Renseigner :
   - **Date de réception** : Date de réception matérielle
   - **Observations** : État de la livraison, conformité, remarques
5. Valider
6. Le PV de réception est créé avec un numéro unique
7. Il apparaît dans la liste

#### Consultation des Réceptions

1. Naviguer vers `/services/receptions`
2. La liste des réceptions s'affiche
3. Cliquer sur "Voir détails" pour voir le PV complet
4. Le PV contient :
   - Informations de l'engagement
   - Date de réception
   - Observations
   - Statut de conformité

#### Modification d'une Réception

- Possible uniquement si la réception n'est pas validée
- Modifier les observations si nécessaire
- Sauvegarder les modifications

---

## 📈 Interface 4 : Indicateurs

**Route** : `/services/indicateurs`  
**Objectif** : Consultation des indicateurs de performance par programme

### Contenu de la Page

#### 1. Tableau des Indicateurs

Tableau listant les programmes avec leurs indicateurs :

**Colonnes** :
- **Programme** : Code et libellé
- **Nombre de Demandes** : Nombre de demandes créées
- **Nombre Approuvées** : Nombre de demandes approuvées
- **Nombre Payées** : Nombre de demandes payées
- **Montant Approuvé** : Total des montants approuvés
- **Montant Payé** : Total des montants payés
- **Taux de Réussite** : Pourcentage approuvé/demandé

#### 2. Graphiques

- **Graphique en barres** : Comparaison demandes/approuvées/payées
- **Graphique circulaire** : Répartition par programme
- **Graphique d'évolution** : Tendance mensuelle

### Mode d'Emploi

#### Consultation des Indicateurs

1. Naviguer vers `/services/indicateurs`
2. Le tableau s'affiche avec les indicateurs
3. Analyser :
   - Le taux de réussite des demandes
   - Les montants engagés et payés
   - L'évolution dans le temps

#### Utilisation pour Planification

1. Identifier les programmes les plus actifs
2. Analyser les tendances
3. Utiliser pour planifier les futures demandes
4. Optimiser le taux de réussite

---

## 🔐 Connexion et Authentification

### Identifiants de Test

- **Email** : `service@epa001.cg`
- **Mot de passe** : `password123`

---

## 📱 Navigation

### Menu Latéral

- 📊 **Actions Programme** : Programmes et exécution
- 📝 **Demandes Engagements** : Création et suivi
- 📦 **Réceptions** : PV de réception
- 📈 **Indicateurs** : Performance

---

## 💡 Bonnes Pratiques

### 1. Préparation de la Demande

- **Identifier précisément le besoin** : Être clair sur ce qui est demandé
- **Justifier** : Expliquer pourquoi c'est nécessaire
- **Estimer correctement** : Fournir un montant réaliste
- **Préparer les pièces** : Rassembler tous les documents nécessaires

### 2. Qualité des Documents

- **Devis à jour** : Fournir des devis récents et détaillés
- **Documents complets** : S'assurer que tous les éléments sont présents
- **Clarté** : Documents lisibles et compréhensibles
- **Conformité** : Respecter les formats demandés

### 3. Suivi Régulier

- **Consulter régulièrement** : Vérifier l'avancement de vos demandes
- **Réagir rapidement** : Traiter les refus rapidement
- **Communiquer** : Demander des clarifications si nécessaire

### 4. Réception

- **Enregistrer rapidement** : Enregistrer les réceptions dès livraison
- **Documenter** : Noter toutes les observations importantes
- **Vérifier la conformité** : Signaler tout problème

---

## ⚠️ Cas Particuliers

### Demande Urgente

Pour une demande urgente :
1. Indiquer clairement l'urgence dans la justification
2. Joindre une note de service justifiant l'urgence
3. Contacter le DAF si nécessaire
4. Suivre régulièrement l'avancement

### Montant Important (> 10M)

Pour un montant important :
1. S'assurer qu'un appel d'offres a été réalisé
2. Joindre les résultats de l'appel d'offres
3. Justifier le choix du fournisseur
4. Documenter la procédure

### Demande Refusée

Si votre demande est refusée :
1. Lire attentivement le motif
2. Comprendre les raisons
3. Corriger les éléments problématiques
4. Resoumettre avec les corrections
5. Si besoin, contacter le DAF pour clarifications

### Réception Non Conforme

Si la livraison n'est pas conforme :
1. Noter précisément dans les observations
2. Signaler tous les problèmes
3. Prendre des photos si nécessaire
4. Contacter le fournisseur
5. Informer le DAF si problème majeur

---

## 📚 Documentation Associée

- `CYCLE_COMPLET.md` : Cycle budgétaire complet
- `SCENARIO_ACPCE.md` : Scénario détaillé de création d'engagement
- Documentation technique pour les administrateurs

---

## 🆘 Support

En cas de problème :

1. Consulter cette documentation
2. Vérifier les messages d'erreur
3. Contacter le DAF pour questions sur les demandes
4. Contacter l'administrateur pour problèmes techniques

