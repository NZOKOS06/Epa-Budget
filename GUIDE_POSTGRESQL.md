# Guide PostgreSQL - Résolution des problèmes de connexion

## 🔍 Diagnostic du problème "Erreur serveur 500"

L'erreur 500 lors de la connexion peut avoir plusieurs causes :

### 1. Vérifier que PostgreSQL est démarré

**Option A : Via les Services Windows**
1. Appuyez sur `Windows + R`
2. Tapez `services.msc` et appuyez sur Entrée
3. Cherchez le service "postgresql-x64-18" (ou votre version)
4. Clic droit → Démarrer (si arrêté)

**Option B : Via PowerShell (en tant qu'administrateur)**
```powershell
Start-Service postgresql-x64-18
```

### 2. Vérifier que la base de données existe

Ouvrez un terminal et exécutez :
```bash
psql -U postgres -l
```

Vous devriez voir la liste des bases de données. Si `epa_budget` n'existe pas, créez-la :
```bash
psql -U postgres -c "CREATE DATABASE epa_budget;"
```

### 3. Créer les tables

Si les tables n'existent pas, exécutez le schéma SQL :
```bash
psql -U postgres -d epa_budget -f database/schema.sql
```

### 4. Charger les données de test (optionnel)

```bash
psql -U postgres -d epa_budget -f database/seed.sql
```

### 5. Initialiser les utilisateurs avec les bons mots de passe

```bash
npm run init-users
```

## 🖥️ Ouvrir pgAdmin (Interface Graphique PostgreSQL)

### Méthode 1 : Via le menu Démarrer
1. Cliquez sur le bouton **Démarrer** (Windows)
2. Tapez "pgAdmin"
3. Cliquez sur "pgAdmin 4"

### Méthode 2 : Via l'explorateur de fichiers
1. Ouvrez l'Explorateur de fichiers
2. Allez dans : `C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\`
3. Double-cliquez sur `pgAdmin4.exe`

### Méthode 3 : Via PowerShell
```powershell
Start-Process "C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\pgAdmin4.exe"
```

> **Note** : Le chemin peut varier selon votre version de PostgreSQL. Ajustez le numéro de version (18, 16, etc.)

## 🔐 Première connexion dans pgAdmin

1. **Mot de passe maître** : Lors de la première ouverture, pgAdmin vous demandera de définir un mot de passe maître. Choisissez-en un et notez-le.

2. **Se connecter au serveur PostgreSQL** :
   - Clic droit sur "Servers" → "Create" → "Server"
   - Onglet **General** :
     - Name : `EPA Budget Local` (ou un nom de votre choix)
   - Onglet **Connection** :
     - Host name/address : `localhost`
     - Port : `5432`
     - Maintenance database : `postgres`
     - Username : `postgres`
     - Password : Votre mot de passe PostgreSQL (par défaut : `Elnzokos@06` ou celui que vous avez configuré)
   - Cliquez sur **Save**

## ✅ Vérifier la configuration

### Vérifier le fichier `.env`

Le fichier `.env` à la racine du projet doit contenir :

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=epa_budget
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_postgresql
JWT_SECRET=votre_secret_jwt_aleatoire
NODE_ENV=development
CLIENT_URL=http://localhost:3001
```

### Vérifier les tables

Exécutez le script de vérification :
```bash
node check-database.js
```

Ce script va vérifier que toutes les tables et vues existent dans votre base de données.

## 🚨 Résolution des erreurs courantes

### Erreur : "relation does not exist"
**Solution** : Les tables n'ont pas été créées. Exécutez :
```bash
psql -U postgres -d epa_budget -f database/schema.sql
```

### Erreur : "password authentication failed"
**Solution** : Le mot de passe PostgreSQL dans `.env` est incorrect. Vérifiez-le dans pgAdmin ou changez-le.

### Erreur : "connection refused"
**Solution** : PostgreSQL n'est pas démarré. Démarrez le service (voir section 1).

### Erreur : "database does not exist"
**Solution** : Créez la base de données :
```bash
psql -U postgres -c "CREATE DATABASE epa_budget;"
```

## 📝 Comptes de test

Après avoir exécuté `npm run init-users`, vous pouvez vous connecter avec :

- **DG** : `dg@epa001.cg` / `password123`
- **DAF** : `daf@epa001.cg` / `password123`
- **Contrôleur** : `controleur@epa001.cg` / `password123`
- **Comptable** : `comptable@epa001.cg` / `password123`
- **Service** : `service@epa001.cg` / `password123`
- **Tutelle** : `tutelle@minfin.cg` / `password123`
- **CCDB** : `ccdb@courcomptes.cg` / `password123`

## 🔧 Commandes utiles PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Se connecter à une base de données spécifique
psql -U postgres -d epa_budget

# Lister toutes les bases de données
psql -U postgres -l

# Lister toutes les tables
psql -U postgres -d epa_budget -c "\dt"

# Exécuter un script SQL
psql -U postgres -d epa_budget -f chemin/vers/script.sql
```

