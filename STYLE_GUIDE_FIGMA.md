# 🎨 GUIDE DE STYLE FIGMA - ACPCE BUDGET CONTROL

**Version**: 1.0  
**Date**: 2026  
**Format**: Material Design 3 + Tailwind CSS  
**Mobile-First**: 375x812px (iPhone)  
**Desktop**: 1440px

---

## 📐 STRUCTURE FRAME

### Dimensions Standard
- **Mobile**: 375px × 812px (iPhone 13)
- **Tablet**: 768px × 1024px (iPad)
- **Desktop**: 1440px × 900px

### Grid System
- **Columns Mobile**: 4 colonnes (16px gutter)
- **Columns Desktop**: 12 colonnes (24px gutter)
- **Marges**: 16px (mobile) / 24px (desktop)

---

## 🎨 PALETTE DE COULEURS

### Couleurs Principales (Primary)
```
Primary 50:  #EFF6FF  (Fond très clair)
Primary 100: #DBEAFE  (Fond clair)
Primary 200: #BFDBFE  (Bordure)
Primary 300: #93C5FD  (Hover léger)
Primary 400: #60A5FA  (Icônes)
Primary 500: #3B82F6  (Texte secondaire)
Primary 600: #2563EB  (Boutons, liens)
Primary 700: #1D4ED8  (Hover)
Primary 800: #1E40AF  (Sidebar, headers)
Primary 900: #1E3A8A  (ACPCE Bleu principal)
```

### Couleurs Secondaires (Success/Warning/Danger)
```
Success 500: #10B981  (Visa OK, validation)
Success 600: #059669  (Hover success)

Warning 500: #F59E0B  (Seuil 90%, attention)
Warning 600: #D97706  (Hover warning)

Danger 500: #EF4444  (Erreur, refus)
Danger 600: #DC2626  (Hover danger)

Info 500:   #3B82F6  (Information)
```

### Nuances de Gris (Slate)
```
Slate 50:   #F8FAFC  (Fond page)
Slate 100:  #F1F5F9  (Fond cards)
Slate 200:  #E2E8F0  (Bordures)
Slate 300:  #CBD5E1  (Diviseurs)
Slate 400:  #94A3B8  (Texte désactivé)
Slate 500:  #64748B  (Texte secondaire)
Slate 600:  #475569  (Texte)
Slate 700:  #334155  (Texte foncé)
Slate 800:  #1E293B  (Sidebar)
Slate 900:  #0F172A  (Texte principal)
```

---

## ✍️ TYPOGRAPHIE

### Police Principale
**Inter Variable** (Google Fonts)
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Hiérarchie Typographique

#### Headings
```
H1: 24px / 32px (Bold)      → Titres de page
H2: 20px / 28px (Semibold)  → Sections principales
H3: 18px / 24px (Semibold)  → Sous-sections
H4: 16px / 22px (Medium)    → Cards, tableaux
```

#### Body
```
Body Large:  16px / 24px (Regular)  → Texte principal
Body:        14px / 20px (Regular)  → Texte standard
Body Small:  12px / 16px (Regular)  → Métadonnées, labels
Caption:     11px / 14px (Regular)  → Légendes, hints
```

#### Spécifiques
```
KPI Value:    32px / 40px (Bold)     → Grands nombres
Stat Value:   20px / 28px (Semibold) → Statistiques
Button Text:  14px / 20px (Medium)   → Boutons
Label:        12px / 16px (Medium)   → Formulaires
```

---

## 📦 COMPOSANTS UI

### Buttons

#### Primary Button
```
Background: Gradient(#2563EB → #1D4ED8)
Text: #FFFFFF (14px, Medium)
Height: 40px
Padding: 12px 24px
Border Radius: 8px
Shadow: 0 4px 6px rgba(0,0,0,0.1)
Hover: Shadow 0 10px 15px rgba(0,0,0,0.15) + Translate Y -2px
```

#### Secondary Button
```
Background: Gradient(#7C3AED → #6D28D9)
Text: #FFFFFF (14px, Medium)
Height: 40px
Padding: 12px 24px
Border Radius: 8px
```

#### Outline Button
```
Background: Transparent
Border: 2px solid #2563EB
Text: #2563EB (14px, Medium)
Height: 40px
Padding: 10px 22px
Border Radius: 8px
Hover: Background #EFF6FF
```

#### Ghost Button
```
Background: Transparent
Text: #475569 (14px, Medium)
Height: 40px
Padding: 12px 24px
Hover: Background #F1F5F9
```

### Cards

#### Standard Card
```
Background: #FFFFFF
Border: 1px solid #E2E8F0
Border Radius: 12px
Padding: 24px
Shadow: 0 1px 3px rgba(0,0,0,0.1)
Hover: Shadow 0 10px 15px rgba(0,0,0,0.1)
```

#### Stat Card
```
Background: #FFFFFF
Border: 1px solid #E2E8F0
Border Radius: 16px
Padding: 24px
Shadow: 0 4px 6px rgba(0,0,0,0.07)
Hover: Border #BFDBFE + Shadow 0 10px 15px rgba(0,0,0,0.1)
```

### Input Fields

#### Text Input
```
Background: #FFFFFF
Border: 1px solid #CBD5E1
Border Radius: 8px
Height: 44px
Padding: 12px 16px
Font: 14px Regular
Focus: Border #2563EB + Ring 2px #DBEAFE
```

#### Textarea
```
Background: #FFFFFF
Border: 1px solid #CBD5E1
Border Radius: 8px
Padding: 12px 16px
Font: 14px Regular
Min Height: 100px
```

### Tables

#### Table Header
```
Background: Gradient(#F8FAFC → #F1F5F9)
Text: #475569 (12px, Semibold, Uppercase)
Height: 48px
Padding: 12px 24px
Border Bottom: 1px solid #E2E8F0
```

#### Table Row
```
Background: #FFFFFF
Text: #1E293B (14px, Regular)
Height: 56px
Padding: 16px 24px
Border Bottom: 1px solid #F1F5F9
Hover: Background #F8FAFC
```

### Badges

#### Status Badge
```
Success: Background #D1FAE5, Text #065F46, Border #A7F3D0
Warning: Background #FEF3C7, Text #92400E, Border #FDE68A
Danger:  Background #FEE2E2, Text #991B1B, Border #FECACA
Info:    Background #DBEAFE, Text #1E40AF, Border #BFDBFE

Padding: 6px 12px
Border Radius: 6px
Font: 12px Medium
```

### Sidebar Navigation

#### Sidebar Container
```
Width: 256px (Desktop)
Background: Gradient(#1E293B → #0F172A)
Height: 100vh
Border Right: 1px solid #334155
```

#### Menu Item (Inactive)
```
Background: Transparent
Text: #CBD5E1 (14px, Medium)
Height: 48px
Padding: 12px 16px
Border Radius: 8px
Hover: Background rgba(255,255,255,0.1)
```

#### Menu Item (Active)
```
Background: Gradient(#2563EB → #1D4ED8)
Text: #FFFFFF (14px, Medium)
Height: 48px
Padding: 12px 16px
Border Radius: 8px
Shadow: 0 4px 6px rgba(37,99,235,0.3)
```

### Topbar

#### Topbar Container
```
Height: 64px
Background: #FFFFFF
Border Bottom: 1px solid #E2E8F0
Padding: 16px 24px
Shadow: 0 1px 3px rgba(0,0,0,0.05)
```

### Modals

#### Modal Container
```
Background: rgba(0,0,0,0.5) backdrop-blur
Border Radius: 16px
Max Width: 512px (mobile: 100% - 32px)
Padding: 24px
Shadow: 0 20px 25px rgba(0,0,0,0.15)
```

---

## 🎯 COMPOSANTS SPÉCIFIQUES

### KPI Cards (Dashboard)
```
Layout: Grid 3 colonnes (Desktop) / 1 colonne (Mobile)
Card Size: Flexible
Icon: 64px × 64px (rounded 12px)
Value: 32px Bold
Label: 14px Medium, #64748B
Trend: 12px, Green/Red arrow
```

### Heatmap (Programmes)
```
Colors:
  - Rouge (#EF4444): 100% budget utilisé
  - Orange (#F59E0B): 75-99%
  - Jaune (#EAB308): 50-74%
  - Vert (#10B981): <50%
Cell Size: 32px × 32px
Border Radius: 4px
Hover: Scale 1.1 + Shadow
```

### Kanban Board (Engagements)
```
Columns: 4 (Brouillon | En visa | Validé | Payé)
Column Width: 280px
Card Height: Auto (min 120px)
Background Columns: #F8FAFC
Border: 1px solid #E2E8F0
Drag Shadow: 0 10px 25px rgba(0,0,0,0.2)
```

### Calendar (Sessions)
```
Day Cell: 40px × 40px
Today: Border 2px #2563EB
Selected: Background #DBEAFE
Event Dot: 8px × 8px (colors par type)
```

---

## 📐 ESPACEMENT (Spacing)

### Scale
```
0px    → Aucun espace
4px    → Très petit (icônes)
8px    → Petit (éléments proches)
12px   → Petit-Moyen
16px   → Moyen (standard)
24px   → Grand (sections)
32px   → Très grand (gros blocs)
48px   → Énorme (sections majeures)
64px   → Page sections
```

### Usage
- **Padding Cards**: 16px / 24px
- **Margin Sections**: 24px / 32px
- **Gap Grid**: 16px / 24px
- **Gap Flex**: 8px / 16px

---

## 🌈 ÉTATS ET INTERACTIONS

### Hover
```
Opacity: 0.9
Transform: TranslateY(-2px) pour boutons
Shadow: +25% elevation
Transition: 200ms ease-in-out
```

### Active/Pressed
```
Transform: Scale(0.98)
Opacity: 0.95
```

### Disabled
```
Opacity: 0.5
Cursor: not-allowed
No hover effects
```

### Loading
```
Spinner: 20px × 20px, #2563EB
Animation: Rotate 1s linear infinite
Background: Overlay rgba(255,255,255,0.8)
```

### Focus
```
Ring: 2px solid #DBEAFE
Outline: None
```

---

## 📱 RESPONSIVE BREAKPOINTS

```
Mobile:    < 640px   (1 colonne)
Tablet:    640-1024px (2-3 colonnes)
Desktop:   > 1024px   (3-4 colonnes)
Large:     > 1440px   (4+ colonnes)
```

### Mobile Adaptations
- Sidebar → Drawer (overlay)
- KPI Cards → Stack vertical
- Tables → Cards scrollables
- Modals → Full screen

---

## 🎭 ANIMATIONS

### Durées
```
Fast:    150ms  → Hover, clicks
Medium:  300ms  → Transitions standard
Slow:    500ms  → Page transitions
```

### Easing
```
Ease-in-out: Standard transitions
Ease-out:    Entrées (fade-in, slide-in)
Ease-in:     Sorties (fade-out)
```

### Types
```
Fade In:    Opacity 0 → 1
Slide In:   Transform translateX(-100%) → 0
Scale In:   Transform scale(0.9) → 1
Bounce:     Scale + translateY
```

---

## 🔍 ICÔNES

### Bibliothèque
**Heroicons** (Outline + Solid)
- Taille standard: 20px × 20px
- Taille grande: 24px × 24px
- Couleur: #64748B (standard) / #2563EB (active)

### Icônes Custom ACPCE
```
Visa:         ✅ Checkmark circle + stamp
Engagement:   📄 Document + money
PV Réception: 📋 Clipboard check
Programme:    📊 Chart + target
Session:      🗓️ Calendar + users
Audit:        🔍 Search + timeline
```

---

## 📊 GRAPHIQUES (Charts)

### Couleurs Série
```
Série 1: #2563EB (Primary)
Série 2: #10B981 (Success)
Série 3: #F59E0B (Warning)
Série 4: #EF4444 (Danger)
Série 5: #8B5CF6 (Secondary)
```

### Typographie
```
Axe Labels: 12px, #64748B
Légendes:   14px, #1E293B
Valeurs:    14px Bold, #1E293B
```

---

## ✅ CHECKLIST FIGMA

### Structure
- [ ] Frame principal 375×812px créé
- [ ] Auto-layout activé
- [ ] Composants réutilisables créés
- [ ] Variables de couleur définies
- [ ] Styles de texte configurés

### Composants
- [ ] Buttons (Primary, Secondary, Outline, Ghost)
- [ ] Cards (Standard, Stat)
- [ ] Inputs (Text, Textarea, Select)
- [ ] Tables (Header, Row, Cell)
- [ ] Badges (Status variants)
- [ ] Modals (Container, Header, Body, Footer)
- [ ] Sidebar (Container, Menu Item, Active State)
- [ ] Topbar (Search, Notifications, User Menu)

### Écrans (28 au total)
- [ ] Dashboard DG (4 écrans)
- [ ] Dashboard DAF (5 écrans)
- [ ] Dashboard Contrôleur (4 écrans)
- [ ] Dashboard Comptable (5 écrans)
- [ ] Dashboard Services (4 écrans)
- [ ] Dashboard Tutelle (4 écrans)
- [ ] Dashboard CCDB (2 écrans)

### Interactions
- [ ] Prototypes connectés (flows)
- [ ] États hover définis
- [ ] États active/pressed
- [ ] Animations configurées
- [ ] Transitions entre écrans

---

## 📦 EXPORT POUR DEV

### Assets à fournir
1. **Fichier .fig** complet
2. **Design Tokens** (JSON)
3. **Spécifications CSS** (ou Tailwind config)
4. **Icônes SVG** exportées
5. **Mockups responsives** (Mobile/Desktop)

---

**Créé pour**: ACPCE Budget Control  
**Designer**: [Votre nom]  
**Date**: 2026

