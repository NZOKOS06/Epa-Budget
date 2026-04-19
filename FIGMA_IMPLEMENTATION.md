# 📐 GUIDE D'IMPLÉMENTATION FIGMA - ACPCE BUDGET CONTROL

Ce document explique comment utiliser le **Guide de Style** et les **composants React** créés pour implémenter les maquettes Figma.

---

## 📦 FICHIERS FOURNIS

### 1. **STYLE_GUIDE_FIGMA.md**
Guide de style complet avec :
- ✅ Palette de couleurs (Primary, Success, Warning, Danger, Slate)
- ✅ Typographie (Inter Variable, hiérarchie H1-H4)
- ✅ Composants UI (Buttons, Cards, Tables, Modals, Sidebar)
- ✅ Spacing & Layout (Grid system, breakpoints)
- ✅ États & Interactions (Hover, Active, Disabled, Loading)
- ✅ Animations & Transitions
- ✅ Checklist pour création Figma

### 2. **Composants React créés** (`client/src/components/ui/`)
- ✅ `KPICard.js` - Cartes de statistiques avec icônes et trends
- ✅ `Heatmap.js` - Visualisation heatmap des programmes
- ✅ `KanbanBoard.js` - Tableau Kanban pour engagements
- ✅ `Card.js` - Cartes standard et statistiques
- ✅ `Table.js` - Tableaux professionnels
- ✅ `Button.js` - Boutons avec variantes
- ✅ `Badge.js` - Badges de statut
- ✅ `LoadingSpinner.js` - Spinners et états vides

### 3. **Dashboard amélioré** (`client/src/pages/dg/Dashboard.js`)
- ✅ Utilise les nouveaux composants KPICard, Heatmap
- ✅ Design cohérent avec le guide de style
- ✅ Responsive et accessible

---

## 🎨 COMMENT CRÉER LES MAQUETTES FIGMA

### Étape 1 : Configuration Figma

1. **Créer un nouveau fichier Figma**
   - Nom : "ACPCE Budget Control - Prototype"
   - Frame : 375×812px (Mobile) + 1440×900px (Desktop)

2. **Configurer les Variables de Couleur**
   - Allez dans **Design → Variables**
   - Importez les couleurs depuis `STYLE_GUIDE_FIGMA.md`
   - Créez des modes : Light (par défaut)

3. **Créer les Styles de Texte**
   - Inter Variable (Google Fonts)
   - Créez les styles : H1, H2, H3, H4, Body, Body Small, Caption

### Étape 2 : Créer les Composants de Base

Créez d'abord les composants réutilisables :

#### Button Component
```
Frame: Auto-layout (Horizontal, 12px padding)
- Primary variant: Gradient(#2563EB → #1D4ED8)
- Secondary variant: Gradient(#7C3AED → #6D28D9)
- Outline variant: Border 2px #2563EB
- Ghost variant: Transparent
Properties: Variant (Primary/Secondary/Outline/Ghost), State (Default/Hover/Active/Disabled)
```

#### Card Component
```
Frame: 12px border-radius, Shadow 0 1px 3px
- Standard: Padding 24px, Border 1px #E2E8F0
- Stat: Padding 24px, Border 1px #E2E8F0, 16px radius
Properties: Variant (Standard/Stat)
```

#### KPI Card Component
```
Frame: Auto-layout (Vertical, 24px padding)
- Icon container: 64×64px, rounded 12px
- Value: 32px Bold
- Label: 14px Medium, #64748B
- Trend indicator (optional)
Properties: Color (Primary/Success/Warning/Danger)
```

### Étape 3 : Créer les Écrans (28 au total)

Pour chaque écran, suivez cette structure :

```
Frame 375×812px (Mobile) / 1440×900px (Desktop)
├── Sidebar (256px width, Desktop only)
├── Topbar (64px height)
├── Main Content (Auto-layout)
│   ├── Header (Titre + Actions)
│   ├── KPI Cards (Grid 3 colonnes)
│   ├── Content Area
│   └── Footer (si nécessaire)
└── Modals (overlay, si nécessaire)
```

#### Exemple : Dashboard DG (Écran 1)

1. **Sidebar** (Desktop)
   - Logo ACPCE + "EPA Budget"
   - Menu items avec icônes
   - User footer

2. **Topbar**
   - Titre "Dashboard Exécutif"
   - Bouton "Exporter"
   - Notifications + User menu

3. **KPI Cards** (Grid 3 colonnes)
   - Card 1: Exécution 78% (Primary color)
   - Card 2: 3 programmes retard (Warning)
   - Card 3: Trésorerie 450M (Success)

4. **Heatmap**
   - Grid 5×1 ou 10×1 de carrés colorés
   - Légende en dessous

5. **Tableau Engagements**
   - Table avec colonnes: Numéro, EPA, Programme, Montant, Date, Actions
   - Bouton "Approuver" par ligne

6. **Alertes Section**
   - Cards avec badges (Danger/Warning)
   - Message d'alerte

### Étape 4 : Prototypage & Interactions

Pour chaque écran, configurez les interactions :

1. **Navigation Sidebar**
   - Clic sur menu item → Navigate to → Écran cible
   - Highlight item actif

2. **Boutons**
   - Hover: Shadow + TranslateY(-2px)
   - Click: Scale(0.98)
   - Disabled: Opacity 0.5

3. **Modals**
   - Open: Fade in + Scale
   - Close: Fade out
   - Backdrop click → Close

4. **Kanban** (Écran 7 - DAF Engagements)
   - Drag & drop entre colonnes
   - Visual feedback pendant drag

---

## 🚀 UTILISATION DES COMPOSANTS REACT

### KPICard

```jsx
import { KPICard } from '../components/ui';

<KPICard
  title="Exécution Budget"
  value="78%"
  subtitle="1,95 Md / 2,5 Md FCFA"
  icon={<YourIcon />}
  trend="up"
  trendValue="+5% vs mois dernier"
  color="primary"
/>
```

### Heatmap

```jsx
import { Heatmap } from '../components/ui';

const data = [
  { label: 'Prog 01', percentage: 100, used: 50000000, total: 50000000 },
  { label: 'Prog 02', percentage: 85, used: 42500000, total: 50000000 },
  // ...
];

<Heatmap data={data} />
```

### KanbanBoard

```jsx
import { KanbanBoard } from '../components/ui';

const columns = [
  {
    id: 'brouillon',
    title: 'Brouillon',
    items: [/* engagements */]
  },
  {
    id: 'en-visa',
    title: 'En visa',
    items: [/* engagements */]
  },
  // ...
];

<KanbanBoard 
  columns={columns} 
  onMove={(itemId, fromColumn, toColumn) => {
    // Gérer le déplacement
  }}
/>
```

---

## 📋 CHECKLIST PAR ÉCRAN

Pour chaque écran, vérifiez :

### Structure
- [ ] Frame correcte (375×812px mobile / 1440×900px desktop)
- [ ] Auto-layout activé
- [ ] Grid system respecté

### Design
- [ ] Couleurs conformes au guide (#1E3A8A primary, #10B981 success)
- [ ] Typographie Inter Variable
- [ ] Spacing cohérent (8px, 16px, 24px)
- [ ] Border radius (8px buttons, 12px cards)

### Composants
- [ ] Composants réutilisables utilisés
- [ ] Variantes correctes (Primary/Secondary, etc.)
- [ ] États définis (Hover, Active, Disabled)

### Interactions
- [ ] Prototypes connectés
- [ ] Transitions fluides (200-300ms)
- [ ] Feedback visuel (hover, click)

---

## 🎯 ÉCRANS PRIORITAIRES À CRÉER

### Phase 1 : Dashboards Principaux
1. ✅ **Dashboard DG** (Écran 1) - Déjà implémenté en React
2. **Sessions DG** (Écran 2) - Calendrier + e-vote
3. **Approbations DG** (Écran 4) - File approbations + batch

### Phase 2 : DAF
4. **Fiches Programmes** (Écran 5) - Wizard 10 sections
5. **Lignes Budgétaires** (Écran 6) - Tableau AE/CP
6. **Engagements** (Écran 7) - **Kanban Board** (composant créé)

### Phase 3 : Contrôleur & Comptable
7. **File Visas** (Écran 10) - Tableau urgent
8. **Checklist Visa** (Écran 11) - Modal avec cases
9. **Contrôle Régularité** (Écran 14) - Dossier validation

---

## 📊 STRUCTURE DES DONNÉES

### Format JSON pour Mockups

```json
{
  "dashboard": {
    "kpis": [
      {
        "title": "Exécution Budget",
        "value": "78%",
        "subtitle": "1,95 Md / 2,5 Md FCFA",
        "trend": "up",
        "trendValue": "+5%"
      }
    ],
    "programmes": [
      {
        "id": 1,
        "label": "Prog 01",
        "percentage": 100,
        "used": 50000000,
        "total": 50000000
      }
    ],
    "engagements": [
      {
        "id": 1,
        "numero": "ACPCE-2026-001",
        "montant": 200000000,
        "programme": "Un Jeune, Une Entreprise",
        "statut": "EN_ATTENTE"
      }
    ]
  }
}
```

---

## 🔗 RESSOURCES

- **Guide de Style**: `STYLE_GUIDE_FIGMA.md`
- **Composants React**: `client/src/components/ui/`
- **Exemple Dashboard**: `client/src/pages/dg/Dashboard.js`
- **Couleurs Tailwind**: `client/tailwind.config.js`

---

## ✅ NEXT STEPS

1. **Créer les maquettes Figma** en suivant le guide de style
2. **Tester les prototypes** avec les user flows définis
3. **Exporter les assets** (SVG icons, images)
4. **Handoff dev** : Utiliser les composants React existants comme référence

---

**Créé pour**: ACPCE Budget Control  
**Date**: 2026

