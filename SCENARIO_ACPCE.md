# Scénario Complet : Cycle Budgétaire ACPCE

Ce document décrit un scénario réaliste reproduisant le cycle budgétaire de l'**Agence Centrale de Paiement et de Contrôle des Engagements (ACPCE)** du Congo-Brazzaville.

## 🏛️ Contexte : ACPCE

L'ACPCE est l'institution centrale qui contrôle et valide les engagements de dépenses des EPA (Établissements Publics Administratifs) avant leur paiement. Le cycle suit un processus rigoureux de contrôle à plusieurs niveaux.

## 📋 Scénario : Achat de Matériel Médical Urgent

### Contexte Initial
- **EPA** : Hôpital Central de Brazzaville (EPA001)
- **Besoin** : Acquisition urgente de matériel de radiologie numérique
- **Montant** : 45 000 000 FCFA
- **Ligne budgétaire** : 70.03 - Équipements médicaux
- **Programme** : P002 - Programme Équipements Médicaux

---

## 🔄 Phase 1 : Initiation (Service Métier)

### Étape 1.1 : Identification du Besoin
**Acteur** : Service Médical (service@epa001.cg)

**Actions** :
1. Connexion à l'application
2. Navigation : `/services/demandes-engagements`
3. Identification du besoin : Équipement de radiologie défaillant nécessitant remplacement urgent

**Données** :
- Programme : P002 - Équipements Médicaux
- Ligne budgétaire : 70.03 - Équipements médicaux
- Crédit disponible : 150 000 000 FCFA (AE et CP)

### Étape 1.2 : Création de la Demande
**Actions** :
1. Clic sur "Nouvelle demande d'engagement"
2. Saisie des informations :
   - **Objet** : "Acquisition d'un équipement de radiologie numérique pour le service d'imagerie médicale"
   - **Montant** : 45 000 000 FCFA
   - **Justification** : "Remplacement urgent de l'équipement défaillant. Impact sur la qualité des soins."
   - **Pièces jointes** : 
     - Devis du fournisseur
     - Rapport technique de l'équipement défaillant
     - Note de service du chef de service médical

3. Validation de la demande
4. **Statut** : `BROUILLON`

**Résultat** :
- Engagement créé : ENG-20250115-001
- Montant : 45 000 000 FCFA
- Statut : BROUILLON
- Notification envoyée au DAF (optionnel)

---

## 🔄 Phase 2 : Contrôle DAF (Directeur Administratif et Financier)

### Étape 2.1 : Réception et Vérification
**Acteur** : DAF (daf@epa001.cg)

**Actions** :
1. Connexion à l'application
2. Navigation : `/daf/engagements`
3. Visualisation dans le Kanban : colonne "BROUILLON"
4. Vérifications :
   - ✅ Montant cohérent avec le besoin
   - ✅ Ligne budgétaire correcte
   - ✅ Crédits disponibles suffisants (150M > 45M)
   - ✅ Pièces jointes présentes

**Calculs effectués** :
- Crédit restant après engagement : 150M - 45M = 105M FCFA
- Ratio engagement/budget : 45M / 150M = 30% (< 50%, pas d'alerte)

### Étape 2.2 : Soumission au Contrôleur
**Actions** :
1. Clic sur l'engagement ENG-20250115-001
2. Vérification des détails
3. Clic sur "Envoyer pour visa"
4. Ajout d'un commentaire : "Demande justifiée, crédits disponibles. Envoi pour visa contrôleur."
5. Validation
6. **Statut** : `SOUMISE_DAF` → `EN_VISA`

**Résultat** :
- Statut : EN_VISA
- Notification envoyée au Contrôleur
- Date de soumission : 2025-01-15 14:30
- DAF assigné : Marie Kouba

---

## 🔄 Phase 3 : Contrôle Financier (Contrôleur ACPCE)

### Étape 3.1 : Réception dans la File des Visas
**Acteur** : Contrôleur Financier (controleur@epa001.cg)

**Actions** :
1. Connexion à l'application
2. Navigation : `/controleur/file-visas`
3. Visualisation de l'engagement avec **priorité URGENTE** (montant > 5M)
4. Affichage des informations :
   - Numéro : ENG-20250115-001
   - Montant : 45 000 000 FCFA (PRIORITÉ URGENTE)
   - EPA : Hôpital Central de Brazzaville
   - Programme : P002 - Équipements Médicaux
   - Crédit AE restant : 105 000 000 FCFA
   - Crédit CP restant : 105 000 000 FCFA

### Étape 3.2 : Contrôle de Régularité Budgétaire
**Actions** :
1. Navigation : `/controleur/checklist`
2. Ouverture de l'engagement ENG-20250115-001
3. Vérification de la **Checklist de Contrôle** :

   ✅ **1. Disponibilité des crédits**
   - AE disponible : 105M FCFA ✓
   - CP disponible : 105M FCFA ✓
   - Montant demandé : 45M FCFA
   - **Conclusion** : Crédits suffisants

   ✅ **2. Respect de la nomenclature budgétaire**
   - Code nature : 70.03 (Équipements médicaux) ✓
   - Correspondance avec l'objet ✓

   ✅ **3. Pièces justificatives**
   - Devis fournisseur présent ✓
   - Rapport technique présent ✓
   - Note de service présente ✓

   ✅ **4. Procédure d'achat**
   - Montant > 10M : appel d'offres requis
   - **Vérification** : Devis unique fourni
   - **Action** : Demander justification ou appel d'offres

   ⚠️ **5. Vérification des dépassements**
   - Dépassement de ligne budgétaire : NON
   - Dépassement de programme : NON
   - **Alerte générée** : Procédure d'achat à vérifier

### Étape 3.3 : Décision de Visa
**Situation A : Visa Accordé (si procédure justifiée)**

**Actions** :
1. Validation de tous les éléments de la checklist
2. Ajout d'un commentaire : "Visa accordé sous réserve de respect de la procédure d'achat. L'appel d'offres est recommandé pour ce montant."
3. Clic sur "Apposer le visa"
4. **Statut** : `EN_VISA` → `VISA_OK`

**Résultat** :
- Statut : VISA_OK
- Date de visa : 2025-01-15 16:45
- Contrôleur : Pierre Mboumba
- Notification envoyée au Comptable
- Enregistrement dans le journal de contrôles

**Situation B : Visa Refusé (si procédure non conforme)**

**Actions** :
1. Découverte d'une non-conformité
2. Commentaire : "Visa refusé : Procédure d'achat non conforme. Appel d'offres obligatoire pour montant > 10M."
3. Clic sur "Refuser le visa"
4. **Statut** : `EN_VISA` → `REFUSE`

**Résultat** :
- Statut : REFUSE
- Notification envoyée au Service
- Demande de correction nécessaire

---

## 🔄 Phase 4 : Contrôle de Régularité Comptable

### Étape 4.1 : Réception pour Contrôle Comptable
**Acteur** : Agent Comptable (comptable@epa001.cg)

**Actions** :
1. Connexion à l'application
2. Navigation : `/comptable/controle-regularite`
3. Visualisation de l'engagement ENG-20250115-001
4. Statut : VISA_OK (venant du contrôleur)

### Étape 4.2 : Vérifications Comptables
**Contrôles effectués** :

   ✅ **1. Régularité budgétaire**
   - Visa contrôleur présent ✓
   - Crédits disponibles ✓

   ✅ **2. Régularité comptable**
   - Imputation correcte (70.03) ✓
   - Engagements antérieurs vérifiés ✓
   - Pas de double engagement ✓

   ✅ **3. Régularité administrative**
   - Pièces justificatives complètes ✓
   - Signatures présentes ✓

   ✅ **4. Régularité financière**
   - Trésorerie suffisante ✓
   - Pas de dépassement de plafond ✓

### Étape 4.3 : Validation de la Régularité
**Actions** :
1. Validation de tous les contrôles
2. Commentaire : "Régularité comptable validée. Engagement conforme aux règles."
3. Clic sur "Valider la régularité"
4. **Statut** : `VISA_OK` → `REGULARITE_OK`

**Résultat** :
- Statut : REGULARITE_OK
- Date de validation : 2025-01-16 09:15
- Comptable : Sophie Nkouka
- Notification envoyée au DG
- Prêt pour approbation DG

---

## 🔄 Phase 5 : Approbation DG (Directeur Général)

### Étape 5.1 : Réception pour Approbation
**Acteur** : Directeur Général (dg@epa001.cg)

**Actions** :
1. Connexion à l'application
2. Navigation : `/dg/approbations`
3. Visualisation de l'engagement ENG-20250115-001
4. Informations affichées :
   - Montant : 45 000 000 FCFA
   - Objet : Acquisition équipement radiologie
   - Visa contrôleur : ✓ (2025-01-15)
   - Régularité comptable : ✓ (2025-01-16)
   - Historique complet visible

### Étape 5.2 : Décision Stratégique
**Analyse** :
- Besoin médical urgent justifié ✓
- Contrôles de régularité validés ✓
- Impact budgétaire maîtrisé (30% de la ligne) ✓
- Conformité aux objectifs stratégiques ✓

**Actions** :
1. Consultation de l'historique workflow
2. Vérification des pièces jointes
3. Décision : Approbation
4. Commentaire : "Approuvé. Acquisition conforme aux besoins et aux contrôles. Priorité médicale justifiée."
5. Clic sur "Approuver"
6. **Statut** : `REGULARITE_OK` → `APPROUVE`

**Résultat** :
- Statut : APPROUVE
- Date d'approbation : 2025-01-16 11:30
- DG : Jean Moukoko
- Notification envoyée au Service et à la Tutelle
- Engagement prêt pour paiement

**Session d'approbation** :
- L'engagement est inclus dans la session mensuelle
- Visible dans `/dg/sessions` pour le mois de janvier 2025

---

## 🔄 Phase 6 : Paiement (Agent Comptable)

### Étape 6.1 : Préparation du Paiement
**Acteur** : Agent Comptable (comptable@epa001.cg)

**Actions** :
1. Navigation : `/comptable/controle-regularite`
2. Filtrage : Statut = APPROUVE
3. Visualisation de ENG-20250115-001
4. Vérifications avant paiement :
   - Engagement approuvé ✓
   - PV de réception (si applicable) ✓
   - Trésorerie disponible ✓

### Étape 6.2 : Enregistrement du Paiement
**Actions** :
1. Clic sur "Enregistrer le paiement"
2. Saisie des informations :
   - Montant : 45 000 000 FCFA
   - Date de paiement : 2025-01-20
   - Numéro d'ordre de paiement : ORD-20250120-045
   - Bénéficiaire : [Fournisseur]
3. Validation
4. **Statut** : `APPROUVE` → `PAYE`

**Résultat** :
- Statut : PAYE
- Date de paiement : 2025-01-20
- Ordre de paiement : ORD-20250120-045
- Montant : 45 000 000 FCFA
- Mise à jour automatique :
  - Crédit AE restant : 105M - 45M = 60M FCFA
  - Crédit CP restant : 105M - 45M = 60M FCFA
  - Ligne budgétaire mise à jour

### Étape 6.3 : Enregistrement Trésorerie
**Actions** :
1. Navigation : `/comptable/tresorerie`
2. Visualisation de l'impact :
   - Sortie de trésorerie : 45 000 000 FCFA
   - Solde mis à jour automatiquement
   - Flux enregistré dans le plan de trésorerie

---

## 🔄 Phase 7 : Réception (Service Métier)

### Étape 7.1 : Réception Matérielle
**Acteur** : Service Métier (service@epa001.cg)

**Actions** :
1. Réception physique de l'équipement
2. Vérification conformité avec la commande
3. Navigation : `/services/receptions`
4. Clic sur "Nouvelle réception"
5. Sélection de l'engagement ENG-20250115-001
6. Saisie du PV de réception :
   - Date de réception : 2025-02-10
   - Observations : "Équipement reçu conforme. Installation en cours."
   - Numéro PV : PV-REC-20250210-001
7. Enregistrement

**Résultat** :
- PV de réception créé
- Lien avec l'engagement établi
- Cycle complet terminé

---

## 🔄 Phase 8 : Clôture et Reporting

### Étape 8.1 : Clôture Mensuelle (Comptable)
**Acteur** : Agent Comptable

**Actions** :
1. Navigation : `/comptable/cloture`
2. Sélection du mois : Janvier 2025
3. Visualisation des données :
   - Engagements payés : X
   - Montant total payé : XXX FCFA
   - Écarts budgétaires : Analyse
   - Ratios d'exécution : Calculs automatiques

### Étape 8.2 : Rapport DAF
**Acteur** : DAF

**Actions** :
1. Navigation : `/daf/rapports-internes`
2. Génération du rapport mensuel janvier 2025
3. Export PDF
4. Contenu :
   - Engagements par programme
   - Évolution des dépenses
   - Taux d'exécution budgétaire

### Étape 8.3 : Rapport Tutelle
**Acteur** : DG

**Actions** :
1. Navigation : `/dg/rapports-tutelle`
2. Préparation du rapport trimestriel
3. Envoi à la Tutelle
4. Contenu :
   - Synthèse des engagements
   - État d'exécution des programmes
   - Indicateurs de performance

---

## 📊 Résumé du Cycle ACPCE

### Timeline Complète

| Date | Heure | Phase | Acteur | Action | Statut |
|------|-------|-------|--------|--------|--------|
| 2025-01-15 | 10:00 | Initiation | Service | Création demande | BROUILLON |
| 2025-01-15 | 14:30 | Contrôle DAF | DAF | Soumission contrôleur | EN_VISA |
| 2025-01-15 | 16:45 | Visa | Contrôleur | Visa accordé | VISA_OK |
| 2025-01-16 | 09:15 | Régularité | Comptable | Régularité validée | REGULARITE_OK |
| 2025-01-16 | 11:30 | Approbation | DG | Approbation | APPROUVE |
| 2025-01-20 | 14:00 | Paiement | Comptable | Paiement effectué | PAYE |
| 2025-02-10 | 10:00 | Réception | Service | PV réception | - |

**Durée totale** : 26 jours (de la demande au paiement)

### Points de Contrôle ACPCE

1. ✅ **Contrôle DAF** : Vérification budgetaire et administratif
2. ✅ **Visa Contrôleur** : Contrôle régularité budgétaire et procédures
3. ✅ **Régularité Comptable** : Contrôle comptable et financier
4. ✅ **Approbation DG** : Décision stratégique
5. ✅ **Paiement** : Exécution financière
6. ✅ **Réception** : Validation matérielle

### Documents Générés

- ✅ Demande d'engagement
- ✅ Checklist de contrôle
- ✅ Visa contrôleur
- ✅ Validation régularité comptable
- ✅ Décision d'approbation DG
- ✅ Ordre de paiement
- ✅ PV de réception
- ✅ Rapports de clôture

---

## 🎯 Points Clés du Cycle ACPCE

### Principes
1. **Séparation des fonctions** : Chaque acteur a un rôle distinct
2. **Contrôle à plusieurs niveaux** : Double contrôle (DAF + Contrôleur)
3. **Traçabilité complète** : Historique de toutes les actions
4. **Validation hiérarchique** : Approbation DG obligatoire
5. **Conformité réglementaire** : Respect des procédures

### Contrôles Spécifiques
- **Disponibilité des crédits** : Vérification AE et CP
- **Procédures d'achat** : Appel d'offres selon montant
- **Pièces justificatives** : Dossier complet requis
- **Régularité comptable** : Imputation correcte
- **Impact budgétaire** : Analyse des ratios

### Alertes Automatiques
- Dépassement de crédits → Alerte contrôleur
- Montant > 5M → Priorité urgente
- Masse salariale > 50% → Alerte DG
- Dépassement ligne > 10% → Modificatif requis

---

## 🔍 Scénarios Alternatifs

### Scénario A : Refus Contrôleur
Si le contrôleur refuse :
- Statut : REFUSE
- Notification au Service
- Demande de correction
- Nouvelle soumission possible après correction

### Scénario B : Modificatif Requis
Si modification > 10% de la ligne :
- DAF crée un modificatif
- Approbation Tutelle requise
- Modification des crédits
- Puis poursuite du cycle normal

### Scénario C : Audit CCDB
À tout moment, la CCDB peut :
- Consulter la piste d'audit
- Voir la timeline complète
- Exporter les données
- Vérifier la conformité

---

Ce scénario reproduit fidèlement le cycle budgétaire ACPCE avec tous les contrôles et validations nécessaires.

