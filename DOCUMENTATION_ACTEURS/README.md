# 📚 Documentation des Acteurs - Application EPA Budget

Ce dossier contient la documentation complète pour chaque acteur de l'application de contrôle et suivi budgétaire des EPA.

## 📋 Documents Disponibles

### 1. [Directeur Général (DG)](01_DG_Directeur_General.md)
**Rôle** : Approbation stratégique et validation des engagements  
**Interfaces** : 4 écrans
- Dashboard Exécutif
- Sessions
- Rapports Tutelle
- Approbations Stratégiques

### 2. [Directeur Administratif et Financier (DAF)](02_DAF_Directeur_Administratif_Financier.md)
**Rôle** : Gestion budgétaire et administrative  
**Interfaces** : 5 écrans
- Budget-Programme
- Lignes Budgétaires
- Engagements (Kanban)
- Modificatifs
- Rapports Internes

### 3. [Contrôleur Financier](03_Controleur_Financier.md)
**Rôle** : Contrôle budgétaire et visa des engagements  
**Interfaces** : 4 écrans
- File Visas
- Checklist Visa
- Alertes Dérive
- Journal Contrôles

### 4. [Agent Comptable](04_Agent_Comptable.md)
**Rôle** : Régularité comptable et exécution financière  
**Interfaces** : 5 écrans
- Contrôle Régularité
- Recettes
- Clôture
- Trésorerie
- Comptes Annuels

### 5. [Services Métiers](05_Services_Metiers.md)
**Rôle** : Initiation des demandes d'engagement  
**Interfaces** : 4 écrans
- Actions Programme
- Demandes Engagements
- Réceptions
- Indicateurs

### 6. [Tutelle](06_Tutelle.md)
**Rôle** : Supervision et contrôle des EPA  
**Interfaces** : 4 écrans
- Consolidation Multi-EPA
- Workflow Approbation
- Performance Programmes
- Rapports Sectoriels

### 7. [CCDB (Cour des Comptes)](07_CCDB_Cour_Comptes.md)
**Rôle** : Audit et contrôle des comptes publics  
**Interfaces** : 2 écrans
- Piste Audit
- Comptes Annuels

---

## 🎯 Structure de Chaque Document

Chaque document suit la même structure :

1. **Rôle et Responsabilités** : Description du rôle de l'acteur
2. **Interfaces Disponibles** : Liste des écrans accessibles
3. **Détails de Chaque Interface** :
   - Description du contenu
   - Mode d'emploi détaillé
   - Exemples d'utilisation
4. **Connexion** : Identifiants de test
5. **Navigation** : Comment naviguer dans l'application
6. **Bonnes Pratiques** : Recommandations d'utilisation
7. **Cas Particuliers** : Gestion des situations spéciales

---

## 🔐 Identifiants de Test

Tous les acteurs utilisent le même mot de passe : `password123`

| Rôle | Email |
|------|-------|
| DG | dg@epa001.cg |
| DAF | daf@epa001.cg |
| Contrôleur | controleur@epa001.cg |
| Comptable | comptable@epa001.cg |
| Service | service@epa001.cg |
| Tutelle | tutelle@minfin.cg |
| CCDB | ccdb@courcomptes.cg |

---

## 📖 Documentation Complémentaire

Pour une vue d'ensemble :

- **`../CYCLE_COMPLET.md`** : Description complète du cycle budgétaire
- **`../SCENARIO_ACPCE.md`** : Scénario détaillé de gestion d'un engagement
- **`../DYNAMISATION_COMPLETE.md`** : Guide de dynamisation de l'application
- **`../GUIDE_SEED.md`** : Guide pour générer des données de test

---

## 🆘 Support

En cas de question ou problème :

1. Consulter la documentation de votre rôle
2. Vérifier la documentation complémentaire
3. Contacter l'administrateur système
4. Consulter les logs d'activité

---

## 📝 Notes

- Toutes les captures d'écran et exemples sont basés sur l'environnement de développement
- Les identifiants de test sont à usage exclusif de développement
- En production, chaque utilisateur doit avoir ses propres identifiants sécurisés
- La documentation est régulièrement mise à jour selon les évolutions de l'application

