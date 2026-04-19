# 📋 Documentation Utilisateur : Contrôleur Financier

## 🎯 Rôle et Responsabilités

Le **Contrôleur Financier** est responsable du contrôle budgétaire et du visa des engagements. Ses responsabilités incluent :

- ✅ **Visa des engagements** : Contrôle de régularité budgétaire avant visa
- ✅ **Vérification des crédits** : Contrôle de la disponibilité des crédits AE/CP
- ✅ **Validation des procédures** : Vérification de la conformité des procédures d'achat
- ✅ **Détection des dérives** : Identification des dépassements budgétaires
- ✅ **Journal des contrôles** : Traçabilité de tous les contrôles effectués

### Privilèges d'Accès

Le Contrôleur a accès aux engagements soumis par le DAF. Il peut consulter tous les détails, apposer le visa ou refuser avec justification.

---

## 🖥️ Interfaces Disponibles

Le Contrôleur dispose de **4 interfaces principales** :

1. **File Visas** (`/controleur/file-visas`)
2. **Checklist Visa** (`/controleur/checklist`)
3. **Alertes Dérive** (`/controleur/alertes-derive`)
4. **Journal Contrôles** (`/controleur/journal-controles`)

---

## 📋 Interface 1 : File Visas

**Route** : `/controleur/file-visas`  
**Objectif** : Vue d'ensemble des engagements en attente de visa

### Contenu de la Page

#### 1. Liste des Engagements

Tableau listant les engagements au statut `EN_VISA` :

**Colonnes** :
- **Numéro** : Identifiant unique de l'engagement
- **Montant** : Montant en FCFA (formaté)
- **Objet** : Objet de l'engagement
- **EPA** : Établissement concerné
- **Programme** : Programme budgétaire
- **Service** : Service demandeur
- **Date Soumission** : Date de soumission au contrôleur
- **Priorité** : Badge de priorité
  - 🔴 **URGENT** : Montant > 5 000 000 FCFA
  - 🟡 **MOYEN** : Montant entre 1M et 5M
  - 🟢 **NORMAL** : Montant < 1M
- **Actions** : Bouton "Voir détails"

#### 2. Filtres

- **Priorité** : Filtrer par niveau de priorité (URGENT, MOYEN, NORMAL)
- **Recherche** : Rechercher par numéro, objet, montant
- **Tri** : Par priorité, montant, date

#### 3. Compteurs

En-tête affichant :
- Total d'engagements en attente
- Nombre d'urgences
- Montant total en attente

### Mode d'Emploi

#### Consultation de la File

1. Naviguer vers `/controleur/file-visas`
2. La liste s'affiche automatiquement, triée par priorité
3. Les urgences apparaissent en haut de la liste
4. Utiliser les filtres pour affiner la recherche

#### Priorisation

- **Traitement recommandé** : Traiter d'abord les urgences (badge rouge)
- **Ordre suggéré** : URGENT → MOYEN → NORMAL
- **Délai** : Traiter les urgences dans les 24h, les autres dans les 48h

#### Accès aux Détails

1. Cliquer sur "Voir détails" d'un engagement
2. Redirection vers la page Checklist (voir interface 2)
3. Effectuer les contrôles nécessaires
4. Prendre une décision (Visa ou Refus)

---

## ✅ Interface 2 : Checklist Visa

**Route** : `/controleur/checklist`  
**Objectif** : Contrôle détaillé et visa d'un engagement spécifique

### Contenu de la Page

#### 1. Informations de l'Engagement

Section affichant :
- Numéro d'engagement
- Objet complet
- Montant demandé
- EPA, Programme, Ligne budgétaire
- Service demandeur
- Dates clés (création, soumission)

#### 2. Checklist de Contrôle

Liste de vérification structurée :

**1. Disponibilité des Crédits**
- ✅ **AE Disponible** : Crédit AE restant de la ligne
- ✅ **CP Disponible** : Crédit CP restant de la ligne
- ✅ **Vérification** : Montant ≤ AE restant ET Montant ≤ CP restant
- ⚠️ **Alerte** : Si montant > crédits disponibles

**2. Respect de la Nomenclature Budgétaire**
- ✅ **Code Nature** : Vérifier que le code correspond à l'objet
- ✅ **Imputation** : Vérifier la cohérence programme/ligne
- ✅ **Classification** : Vérifier la classification comptable

**3. Pièces Justificatives**
- ✅ **Devis/Facture** : Présence du devis ou facture proforma
- ✅ **Documents Administratifs** : Notes de service, autorisations
- ✅ **Documents Techniques** : Rapports, spécifications si applicable
- ✅ **Complétude** : Tous les documents requis sont présents

**4. Procédure d'Achat**
- ✅ **Seuil d'Appel d'Offres** : 
  - Montant < 10M : Marché de gré à gré possible
  - Montant ≥ 10M : Appel d'offres obligatoire
- ✅ **Conformité** : Vérifier que la procédure respecte les seuils
- ⚠️ **Exception** : Justification si dérogation

**5. Vérification des Dérives**
- ✅ **Dépassement Ligne** : Vérifier que le montant ne dépasse pas la ligne
- ✅ **Dépassement Programme** : Vérifier les totaux du programme
- ✅ **Ratio d'Engagement** : Vérifier les seuils (masse salariale, etc.)

**6. Vérifications Complémentaires**
- ✅ **Cohérence** : L'objet correspond aux besoins
- ✅ **Opportunité** : L'achat est justifié
- ✅ **Conformité** : Respect des règles et procédures

#### 3. Affichage des Crédits

Section affichant :
- **Crédits Disponibles** :
  - AE Initial : X FCFA
  - CP Initial : X FCFA
  - AE Restant : X FCFA
  - CP Restant : X FCFA
- **Impact de l'Engagement** :
  - AE après engagement : X FCFA
  - CP après engagement : X FCFA
  - % d'engagement de la ligne

#### 4. Pièces Jointes

Liste des documents attachés :
- Nom du fichier
- Type
- Taille
- Date d'upload
- Bouton de téléchargement/prévisualisation

#### 5. Historique Workflow

Timeline affichant :
- Date de création (Service)
- Date de soumission (DAF)
- Commentaires à chaque étape
- Statut actuel

#### 6. Actions

Boutons d'action :
- **✅ Apposer le Visa** : Valider et apposer le visa
- **❌ Refuser le Visa** : Refuser avec motif
- **💬 Ajouter Commentaire** : Commenter sans décision

### Mode d'Emploi

#### Processus de Contrôle Complet

**Étape 1 : Consultation Initiale**
1. Depuis la File Visas, cliquer sur "Voir détails"
2. L'engagement s'ouvre dans la page Checklist
3. Consulter les informations générales
4. Examiner l'objet et le montant

**Étape 2 : Vérification des Crédits**
1. Aller dans la section "Crédits Disponibles"
2. Vérifier que :
   - AE Restant ≥ Montant demandé
   - CP Restant ≥ Montant demandé
3. Si crédits insuffisants :
   - ❌ **Refuser** avec motif : "Crédits insuffisants"
   - 📝 Commenter : Indiquer les crédits disponibles

**Étape 3 : Vérification des Pièces**
1. Examiner toutes les pièces jointes
2. Télécharger si nécessaire
3. Vérifier la complétude :
   - Devis présent
   - Documents administratifs présents
   - Conformité des documents

**Étape 4 : Vérification de la Procédure**
1. Vérifier le montant
2. Si montant ≥ 10M :
   - ✅ Vérifier qu'un appel d'offres a été réalisé
   - ⚠️ Si pas d'appel d'offres : Vérifier la justification
   - ❌ Si pas de justification : Refuser

**Étape 5 : Vérifications Complémentaires**
1. Vérifier la cohérence objet/classification
2. Vérifier l'opportunité de l'achat
3. Vérifier la conformité réglementaire
4. Examiner l'historique pour détecter des anomalies

**Étape 6 : Décision**

**Option A : Visa Accordé**
1. Vérifier que tous les éléments de la checklist sont validés
2. Cliquer sur "Apposer le Visa"
3. Une modal s'ouvre :
   - Commentaire optionnel (ex: "Visa accordé, crédits disponibles, procédure conforme")
   - Confirmation requise
4. Confirmer
5. Le statut passe à `VISA_OK`
6. Notification envoyée au Comptable
7. Enregistrement dans le Journal des Contrôles

**Option B : Visa Refusé**
1. Identifier l'élément problématique
2. Cliquer sur "Refuser le Visa"
3. Une modal s'ouvre :
   - **Motif obligatoire** : Explication détaillée du refus
   - Exemples :
     - "Crédits insuffisants : AE restant = 2M, montant demandé = 5M"
     - "Appel d'offres non réalisé pour montant > 10M"
     - "Pièces justificatives incomplètes"
4. Confirmer le refus
5. Le statut passe à `REFUSE`
6. Notification envoyée au Service avec le motif
7. Enregistrement dans le Journal des Contrôles

#### Cas Particuliers

**Crédits Limites**
- Si crédits juste suffisants (ex: montant = crédit restant)
- Ajouter un commentaire : "Visa accordé, crédits au maximum"
- Alerter le DAF de la situation

**Procédure Exceptionnelle**
- Si appel d'offres non réalisé mais justifié
- Documenter la justification
- Visa possible avec commentaire explicatif

**Doute sur la Conformité**
- Ne pas hésiter à refuser si doute
- Demander des clarifications
- Mieux vaut refuser que valider un engagement non conforme

---

## ⚠️ Interface 3 : Alertes Dérive

**Route** : `/controleur/alertes-derive`  
**Objectif** : Détection et suivi des dérives budgétaires

### Contenu de la Page

#### 1. Cartes d'Alertes

Cartes affichant les alertes de dérive :

**Types d'Alertes** :
- **🔴 Dépassement AE** : Montant engagement > AE restant
- **🔴 Dépassement CP** : Montant engagement > CP restant
- **🟡 Seuil Critique** : Engagement proche de la limite

**Informations sur chaque Carte** :
- Numéro d'engagement
- Montant
- Type de dérive
- Crédit disponible
- Écart (montant - crédit)
- Programme et ligne
- Actions : Voir détails, Traiter

#### 2. Liste Détaillée

Tableau avec colonnes :
- Engagement
- Type d'Alerte
- Montant Demandé
- Crédit Disponible
- Écart
- Statut
- Actions

### Mode d'Emploi

#### Consultation des Alertes

1. Naviguer vers `/controleur/alertes-derive`
2. Les alertes actives s'affichent automatiquement
3. Trier par type ou par écart (plus grave d'abord)

#### Traitement d'une Alerte

1. Cliquer sur "Voir détails"
2. Examiner la situation :
   - Montant demandé
   - Crédits disponibles
   - Écart exact
3. Décision :
   - **Refuser** : Si dépassement non justifiable
   - **Demander Modificatif** : Si justifié, demander un modificatif au DAF
   - **Visa Conditionnel** : Si crédits suffisants après modificatif en cours

#### Actions Correctives

- **Refus** : Refuser avec motif "Dépassement des crédits disponibles"
- **Demande de Modificatif** : Informer le DAF de la nécessité d'un modificatif
- **Suivi** : Suivre le traitement de l'alerte jusqu'à résolution

---

## 📝 Interface 4 : Journal Contrôles

**Route** : `/controleur/journal-controles`  
**Objectif** : Historique de tous les contrôles effectués

### Contenu de la Page

#### 1. Liste des Contrôles

Tableau listant l'historique des contrôles :

**Colonnes** :
- **Date/Heure** : Date et heure du contrôle
- **Engagement** : Numéro de l'engagement
- **Montant** : Montant contrôlé
- **EPA** : Établissement
- **Action** : Visa accordé / Refusé
- **Commentaire** : Commentaire ajouté
- **Détails** : Lien vers l'engagement

#### 2. Filtres

- **Période** : Filtrer par date (jour, semaine, mois)
- **Action** : Filtrer par type (Visa, Refus)
- **Recherche** : Par numéro d'engagement

#### 3. Statistiques

En-tête affichant :
- Total de contrôles effectués
- Nombre de visas accordés
- Nombre de refus
- Taux d'acceptation

#### 4. Export

Bouton "Exporter" permettant :
- Export Excel des contrôles
- Export PDF pour rapport
- Filtrage avant export

### Mode d'Emploi

#### Consultation du Journal

1. Naviguer vers `/controleur/journal-controles`
2. La liste des 100 derniers contrôles s'affiche
3. Utiliser les filtres pour rechercher un contrôle spécifique
4. Cliquer sur "Détails" pour voir l'engagement complet

#### Utilisation du Journal

- **Traçabilité** : Consulter l'historique de vos décisions
- **Analyse** : Identifier les motifs de refus récurrents
- **Reporting** : Exporter pour rapports mensuels
- **Formation** : Analyser les cas pour amélioration

#### Export pour Rapport

1. Appliquer les filtres souhaités (ex: mois de janvier)
2. Cliquer sur "Exporter Excel"
3. Le fichier contient :
   - Liste des contrôles
   - Détails de chaque contrôle
   - Statistiques synthétiques
4. Utiliser pour rapports de contrôle mensuels

---

## 🔐 Connexion et Authentification

### Identifiants de Test

- **Email** : `controleur@epa001.cg`
- **Mot de passe** : `password123`

---

## 📱 Navigation

### Menu Latéral

- 📋 **File Visas** : Engagements en attente
- ✅ **Checklist Visa** : Contrôle détaillé
- ⚠️ **Alertes Dérive** : Dérives budgétaires
- 📝 **Journal Contrôles** : Historique

---

## 💡 Bonnes Pratiques

### 1. Rigueur du Contrôle

- Vérifier systématiquement tous les éléments
- Ne pas valider sans avoir examiné les pièces
- En cas de doute, demander des clarifications

### 2. Délais Respectés

- Traiter les urgences dans les 24h
- Traiter les autres dans les 48h
- Ne pas laisser les dossiers s'accumuler

### 3. Documentation

- Toujours ajouter un commentaire lors du visa
- Expliquer clairement les refus
- Documenter les exceptions

### 4. Communication

- Communiquer rapidement avec le DAF en cas de problème
- Expliquer les motifs de refus clairement
- Proposer des solutions quand possible

---

## ⚠️ Cas Particuliers

### Engagement Complexe

Pour un engagement complexe :
1. Examiner toutes les pièces en détail
2. Vérifier la cohérence de tous les éléments
3. Consulter l'historique de l'EPA si nécessaire
4. Ne pas hésiter à demander des clarifications

### Urgence Justifiée

Pour une urgence justifiée :
1. Accélérer le traitement
2. Vérifier quand même tous les éléments critiques
3. Documenter l'urgence dans le commentaire
4. Visa possible avec mention de l'urgence

### Doute Persistant

Si un doute persiste après vérification :
1. Refuser avec demande de clarification
2. Indiquer précisément ce qui manque
3. Le service peut resoumettre après correction

---

## 📚 Documentation Associée

- `CYCLE_COMPLET.md` : Cycle budgétaire complet
- `SCENARIO_ACPCE.md` : Scénario détaillé avec phase contrôleur
- Documentation technique pour les administrateurs

