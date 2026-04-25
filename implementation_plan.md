# 📊 Analyse Complète du Projet EPA-Budget & Plan d'Action Module Admin

---

## 1. État Actuel du Projet — Ce qui existe

### Architecture Générale
- **Stack** : React (client) + Express/Node.js (serveur) + PostgreSQL (base de données)
- **Auth** : JWT, 8h d'expiration, RBAC par rôle
- **Temps réel** : Socket.IO (WebSocket notifications)
- **Audit** : Middleware `auditLogger` + table `journal_audit`
- **Upload** : Multer (pièces jointes, factures, PV)

---

## 2. Modules Existants — Bilan par Acteur

### ✅ Module DG (Directeur Général)
| Fonctionnalité | Statut Backend | Statut Frontend |
|---|---|---|
| Dashboard exécutif (KPIs, évolution mensuelle, heatmap) | ✅ Opérationnel | ✅ Opérationnel |
| File d'approbations en attente | ✅ Opérationnel | ✅ Opérationnel |
| Approuver / Rejeter un engagement (+ motif) | ✅ Opérationnel | ✅ Opérationnel |
| Approbation en batch | ✅ Backend OK | ✅ UI OK |
| Sessions d'approbation | ✅ Opérationnel | ✅ Opérationnel |
| Rapports Tutelle (transmission) | ✅ Backend OK | ✅ UI OK |
| Indicateurs de performance | ✅ Opérationnel | ✅ Opérationnel |
| Export PDF rapports | ⚠️ 501 (stub) | ⚠️ Bouton présent |

---

### ✅ Module DAF (Directeur Administratif et Financier)
| Fonctionnalité | Statut Backend | Statut Frontend |
|---|---|---|
| Gestion Programmes (chapitres budgétaires) - CRUD | ✅ Opérationnel | ✅ Opérationnel |
| Gestion Lignes budgétaires (articles) - CRUD | ✅ Opérationnel | ✅ Opérationnel |
| Gestion Engagements (liste + détail) | ✅ Opérationnel | ✅ Opérationnel |
| Transmettre engagement au CB | ✅ Opérationnel | ✅ Opérationnel |
| Retourner engagement au Service | ✅ Opérationnel | ✅ Opérationnel |
| Créer liquidation (facture + PV) | ✅ Opérationnel | ✅ Opérationnel |
| Modificatifs budgétaires | ✅ Opérationnel | ✅ Opérationnel |
| Rapports internes | ✅ Opérationnel | ✅ Opérationnel |
| Créer budget annuel (RG-18) | ✅ Opérationnel | ✅ UI OK |
| Export PDF rapports | ⚠️ 501 (stub) | ⚠️ Bouton présent |

---

### ✅ Module Contrôleur Budgétaire
| Fonctionnalité | Statut Backend | Statut Frontend |
|---|---|---|
| File de visas (engagements en attente) | ✅ Opérationnel | ✅ Opérationnel |
| Détail d'un engagement | ✅ Opérationnel | ✅ Opérationnel |
| Émettre avis favorable / défavorable | ✅ Opérationnel | ✅ Opérationnel |
| Checklist de contrôle | ✅ Frontend | ✅ Opérationnel |
| Alertes de dérive budgétaire | ✅ Opérationnel | ✅ Opérationnel |
| Journal des contrôles effectués | ✅ Opérationnel | ✅ Opérationnel |
| Visualisation pièces jointes | ✅ Opérationnel | ✅ Opérationnel |

---

### ✅ Module Agent Comptable
| Fonctionnalité | Statut Backend | Statut Frontend |
|---|---|---|
| Contrôle de régularité (engagements validés) | ✅ Opérationnel | ✅ Opérationnel |
| Enregistrement recettes (RG-08/09/10) | ✅ Opérationnel | ✅ Opérationnel |
| Contre-passation recettes (RG-10) | ✅ Opérationnel | ✅ UI OK |
| Validation liquidations (RG-13) | ✅ Opérationnel | ✅ Opérationnel |
| Enregistrement paiements | ✅ Opérationnel | ✅ Opérationnel |
| Clôture budgétaire + étapes | ✅ Opérationnel | ✅ Opérationnel |
| Trésorerie (flux entrées/sorties) | ✅ Opérationnel | ✅ Opérationnel |
| Comptes annuels | ✅ Opérationnel | ✅ Opérationnel |
| Export comptes CCDB | ⚠️ JSON (pas Excel) | ⚠️ Bouton présent |
| Export PDF comptes | ⚠️ Stub | ⚠️ Bouton présent |

---

### ✅ Module Chef de Service
| Fonctionnalité | Statut Backend | Statut Frontend |
|---|---|---|
| Consultation programmes | ✅ Opérationnel | ✅ Opérationnel |
| Création demandes d'engagement | ✅ Opérationnel | ✅ Opérationnel |
| Suivi demandes (statuts workflow) | ✅ Opérationnel | ✅ Opérationnel |
| Upload pièces jointes | ✅ Opérationnel | ✅ Opérationnel |
| Soumettre demande au DAF | ✅ Opérationnel | ✅ Opérationnel |
| PV de Réception | ✅ Opérationnel | ✅ Opérationnel |
| Marquer service fait | ✅ Opérationnel | ✅ UI OK |
| Indicateurs de performance | ✅ Opérationnel | ✅ Opérationnel |

---

### ✅ Module Tutelle
| Fonctionnalité | Statut Backend | Statut Frontend |
|---|---|---|
| Consolidation multi-EPA | ✅ Opérationnel | ✅ Opérationnel |
| Détail EPA | ✅ Opérationnel | ✅ Opérationnel |
| Workflow approbation modificatifs | ✅ Opérationnel | ✅ Opérationnel |
| Performance programmes | ✅ Opérationnel | ✅ Opérationnel |
| Rapports sectoriels | ✅ Opérationnel | ✅ Opérationnel |

---

### ✅ Module CCDB (Chambre des Comptes)
| Fonctionnalité | Statut Backend | Statut Frontend |
|---|---|---|
| Piste d'audit avancée | ✅ Opérationnel | ✅ Opérationnel |
| Timeline complète d'un engagement | ✅ Opérationnel | ✅ Opérationnel |
| Journal d'audit global | ✅ Opérationnel | ✅ UI OK |
| Export audit externe | ✅ Opérationnel | ✅ UI OK |
| Comptes annuels (validation) | ✅ Opérationnel | ✅ Opérationnel |

---

## 3. Ce qui reste à implémenter (Gaps identifiés)

### 🔴 Critique — Manquant entièrement
| Gap | Impact |
|---|---|
| **Module ADMIN** — aucun interface n'existe | Aucune gestion des EPA, utilisateurs, rôles |
| **Rôle ADMIN** — défini en DB mais non géré en frontend | Compte admin ne peut pas se connecter utilement |
| **Gestion des EPA** — pas de CRUD EPA | L'admin doit faire ça manuellement en DB |
| **Gestion Utilisateurs** — pas de CRUD utilisateurs | Idem, pas d'interface pour inscrire ou modifier |
| **Route `/api/admin`** — n'existe pas | Backend à créer entièrement |
| **Page `/admin`** — n'existe pas dans `App.js` | Frontend à créer entièrement |

### 🟡 Incomplet — Partiellement implémenté
| Gap | Impact |
|---|---|
| Export PDF réel (tous modules) | Stub 501, boutons non fonctionnels |
| Export Excel comptes CCDB | JSON seulement |
| Notifications push (WebSocket) | Socket.IO installé mais front non branché |
| Gestion des directions (RG-17) | `direction_id` en DB mais pas d'UI pour gérer |
| Tableau de bord admin global | KPIs multi-EPA centralisés |
| Gestion du calendrier budgétaire | Pas d'interface pour gérer les années |

### 🟢 Fonctionnel mais améliorable
| Gap | Suggestion |
|---|---|
| Trésorerie — soldes fictifs hardcodés | Brancher sur des vraies données |
| Clôture — `workflow_cloture` table non créée | Migration SQL à ajouter |
| Contrôleur — Dashboard dédié | Page `Dashboard.js` existe mais données partielles |

---

## 4. Plan d'Action — Module Admin 🚀

### Vision globale
L'Admin est le **super-utilisateur** de la plateforme. Il gère :
- Les **EPA** (création, modification, activation/désactivation)
- Les **Utilisateurs** (inscription, rôles, EPA, statut)
- La **Configuration système** (années budgétaires, paramètres)
- La **Supervision globale** (tableau de bord consolidé)

---

### Interfaces à créer

#### Page 1 : Dashboard Admin (`/admin/dashboard`)
**Objectif** : Vue panoramique de toute la plateforme

**KPIs affichés** :
- Nombre total d'EPA actives
- Nombre d'utilisateurs actifs par rôle
- Volume global d'engagements en cours (toutes EPA)
- Alertes système (utilisateurs inactifs, EPA sans budget, etc.)

**Composants** :
- Carte par EPA avec statut (actif/inactif) + taux d'exécution budgétaire
- Graphique barres : engagements par EPA
- Tableau des dernières connexions (journal_audit)
- Liste des alertes système

---

#### Page 2 : Gestion des EPA (`/admin/epa`)
**Objectif** : CRUD complet des Établissements Publics et Administratifs

**Fonctionnalités** :
- **Liste des EPA** : tableau avec code, nom, secteur, statut, nombre d'utilisateurs, budget actif
- **Créer une EPA** : formulaire (code, nom, secteur, description)
- **Modifier une EPA** : édition inline ou modale
- **Activer / Désactiver une EPA** : toggle avec confirmation
- **Voir le détail** : utilisateurs rattachés, budgets, engagements en cours

**Formulaire EPA** :
```
Code EPA* : [TEXT]         Nom officiel* : [TEXT]
Secteur* : [SELECT]        Description : [TEXTAREA]
Statut : [TOGGLE actif/inactif]
```

---

#### Page 3 : Gestion des Utilisateurs (`/admin/utilisateurs`)
**Objectif** : Inscription et gestion des comptes utilisateurs

**Fonctionnalités** :
- **Liste des utilisateurs** : tableau paginé avec recherche
  - Colonnes : Nom, Prénom, Email, Rôle, EPA, Statut, Dernière connexion
  - Filtres : par rôle, par EPA, par statut
- **Créer un utilisateur** : formulaire complet
- **Modifier un utilisateur** : édition du rôle, EPA, direction, statut
- **Activer / Désactiver** : toggle sans suppression physique
- **Réinitialiser mot de passe** : génère un nouveau mot de passe temporaire
- **Historique connexions** : voir les connexions dans journal_audit

**Formulaire Utilisateur** :
```
Prénom* : [TEXT]           Nom* : [TEXT]
Email* : [EMAIL]           Rôle* : [SELECT → DG, DAF, CONTROLEUR, COMPTABLE, SERVICE, TUTELLE, CCDB, ADMIN]
EPA* : [SELECT → liste EPA] Direction : [TEXT / optionnel]
Mot de passe initial* : [PASSWORD auto-généré]
Statut : [TOGGLE actif/inactif]
```

---

#### Page 4 : Gestion des Rôles & Permissions (`/admin/roles`)
**Objectif** : Visualiser et potentiellement ajuster les permissions

**Fonctionnalités** :
- Liste des rôles avec leurs permissions (JSON viewer)
- Voir les utilisateurs par rôle
- (Optionnel) : modifier les permissions JSONB

---

#### Page 5 : Configuration Système (`/admin/configuration`)
**Objectif** : Paramètres globaux de l'application

**Sections** :
- **Années budgétaires** : créer / activer / clôturer une année
- **Paramètres généraux** : nom de l'institution, logo, timezone
- **Gestion des secteurs EPA** : liste des secteurs disponibles
- **Seuils d'alerte** : seuil de dérive budgétaire (défaut 10%)

---

#### Page 6 : Journal d'Activité Système (`/admin/journal`)
**Objectif** : Supervision totale de toutes les actions

**Fonctionnalités** :
- Table `journal_audit` avec filtres avancés
- Filtre par : utilisateur, action, ressource, date, EPA
- Export CSV du journal
- Statistiques : actions par jour/semaine/mois

---

## 5. Plan d'Implémentation Technique

### Étape 1 — Backend : Route `/api/admin` 
**Fichier** : `server/routes/admin.js` [NEW]

```
Routes à créer :
GET    /api/admin/dashboard          → KPIs globaux
GET    /api/admin/epa                → Liste toutes les EPA
POST   /api/admin/epa                → Créer une EPA
PUT    /api/admin/epa/:id            → Modifier une EPA
PATCH  /api/admin/epa/:id/statut     → Activer/désactiver
GET    /api/admin/utilisateurs       → Liste utilisateurs (avec filtres)
POST   /api/admin/utilisateurs       → Créer un utilisateur
PUT    /api/admin/utilisateurs/:id   → Modifier un utilisateur
PATCH  /api/admin/utilisateurs/:id/statut → Activer/désactiver
POST   /api/admin/utilisateurs/:id/reset-password → Reset MDP
GET    /api/admin/roles              → Liste des rôles
GET    /api/admin/journal            → Journal d'audit global filtrable
GET    /api/admin/stats              → Statistiques système
```

**Middleware** : `authorize('ADMIN')` sur toutes les routes

---

### Étape 2 — Migration DB
**Fichier** : `database/admin_migration.sql` [NEW]

```sql
-- Ajouter colonne 'statut' à la table EPA si absente
ALTER TABLE epa ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'actif';

-- S'assurer que le rôle ADMIN existe (déjà dans schema_v2.sql)
-- Créer un utilisateur ADMIN par défaut
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id, statut)
SELECT 'Admin', 'Système', 'admin@dgtt.cg', 
  '$2a$10$...', -- bcrypt hash de 'Admin2026!'
  r.id, 'actif'
FROM roles r WHERE r.code = 'ADMIN'
ON CONFLICT (email) DO NOTHING;
```

---

### Étape 3 — Frontend : Pages Admin

**Fichiers à créer** :
```
client/src/pages/admin/
  ├── Dashboard.js         [NEW] — KPIs globaux
  ├── GestionEPA.js        [NEW] — CRUD EPA
  ├── GestionUtilisateurs.js [NEW] — CRUD utilisateurs
  ├── GestionRoles.js      [NEW] — Visualisation rôles
  ├── Configuration.js     [NEW] — Paramètres système
  └── JournalActivite.js   [NEW] — Audit global
```

**Mise à jour** :
- `client/src/App.js` — ajouter les 6 routes `/admin/*`
- `client/src/components/Layout.js` — ajouter le menu Admin

---

### Étape 4 — Connexion `server/index.js`
```js
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
```

---

## 6. Priorité d'Exécution

| Priorité | Tâche | Complexité | Valeur |
|---|---|---|---|
| 🔴 P1 | Backend `admin.js` (EPA + Users) | Haute | Critique |
| 🔴 P1 | Frontend `GestionUtilisateurs.js` | Haute | Critique |
| 🔴 P1 | Frontend `GestionEPA.js` | Moyenne | Critique |
| 🟡 P2 | Frontend `Dashboard.js` Admin | Moyenne | Haute |
| 🟡 P2 | Mise à jour `App.js` + `Layout.js` | Faible | Haute |
| 🟡 P2 | Migration DB (admin user + EPA statut) | Faible | Haute |
| 🟢 P3 | `GestionRoles.js` | Faible | Moyenne |
| 🟢 P3 | `Configuration.js` | Moyenne | Moyenne |
| 🟢 P3 | `JournalActivite.js` | Faible | Moyenne |

---

## 7. Questions Ouvertes

> [!IMPORTANT]
> **Q1 — Portée des EPA** : L'Admin peut-il gérer *toutes* les EPA depuis un seul compte (vue centralisée), ou chaque EPA a-t-elle son propre Admin local ?

> [!IMPORTANT]
> **Q2 — Reset mot de passe** : L'admin doit-il recevoir le nouveau mot de passe par email, ou afficher un mot de passe temporaire à l'écran ?

> [!NOTE]
> **Q3 — Notifications** : Souhaitez-vous activer les notifications WebSocket (Socket.IO est déjà installé) dans le cadre de cette livraison ?

> [!NOTE]
> **Q4 — Export PDF** : Faut-il implémenter les exports PDF (puppeteer/pdfkit) dans ce plan ou c'est une phase ultérieure ?

---

## 8. Résumé — Ce que l'Admin va apporter

Une fois implémenté, l'Admin pourra :

1. **Créer une nouvelle EPA** (ex: DGTT, ORSEC, ANGT...) et lui attribuer un secteur
2. **Inscrire les utilisateurs** de chaque EPA : un DG, un DAF, un Contrôleur, un Comptable, des Chefs de Service
3. **Attribuer les rôles** et lier chaque utilisateur à son EPA
4. **Activer/désactiver** des comptes sans les supprimer
5. **Surveiller l'activité** de toute la plateforme depuis un tableau de bord centralisé
6. **Configurer les paramètres** système (années, seuils, etc.)

L'application sera alors **autonome** : l'Admin devient le seul point d'entrée pour l'onboarding de nouvelles EPA et de nouveaux acteurs, sans intervention directe en base de données.
