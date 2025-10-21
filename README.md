# 🔒 Squelette Express.js Sécurisé - API REST avec CSRF

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express](https://img.shields.io/badge/Express-4.19+-blue.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)
![Prisma](https://img.shields.io/badge/Prisma-6.17+-blueviolet.svg)
![Jest](https://img.shields.io/badge/Jest-30.2+-red.svg)
![Tests](https://img.shields.io/badge/Tests-40%2F40%20✅-success.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Security](https://img.shields.io/badge/Security-Production%20Ready-brightgreen.svg)

**Un squelette Express.js sécurisé et robuste avec MySQL/Prisma, conçu pour être incassable et prêt pour la production.**

✨ **Fonctionnalités principales :**
- 🛡️ **Sécurité renforcée** : CSRF, CORS, Rate Limiting, Helmet, validation stricte, sanitisation XSS
- 🗄️ **Base MySQL/Prisma 6.17** : ORM type-safe avec migrations automatiques et client généré
- 🔄 **Résilience maximale** : Middleware de résilience, gestion d'erreurs centralisée, timeout configurables
- ⚡ **Performance optimisée** : Connection pooling, timeout intelligent, health checks complets
- 🧪 **Tests complets** : 40 tests unitaires (100% ✅) + script d'intégration automatisé
- 🚀 **ES Modules natifs** : Architecture moderne avec support Jest et Node.js 18+
- 📋 **Prêt production** : Documentation exhaustive, scripts automatisés, monitoring intégré

## 🚀 Démarrage rapide

### 1. Installation
```bash
git clone https://github.com/Mohammed-el-Amine/secure-api.git
cd secure-api
npm install
```

### 2. Configuration MySQL
```bash
# Connectez-vous à MySQL
sudo mysql -u root -p

# Créez la base de données et un utilisateur
CREATE DATABASE secure_api;
CREATE USER 'your_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON secure_api.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Variables d'environnement
```bash
cp .env.example .env
# Modifiez .env avec vos informations MySQL
```

### 4. Configurez les variables d'environnement

Copiez `.env.example` vers `.env` et modifiez les valeurs :
```bash
cp .env.example .env
```

Modifiez votre `.env` avec vos informations MySQL :
```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=votre_secret_tres_securise_avec_plus_de_32_caracteres
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="mysql://your_user:your_password@localhost:3306/secure_api"
```

### 5. Générez et appliquez les migrations

**⚠️ Important :** Assurez-vous que votre utilisateur MySQL a les droits nécessaires avant de continuer.

**Option A - Si la base `secure_api` existe déjà :**
```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations sur la base existante
npx prisma migrate dev --name init
```

**Option B - Si la base `secure_api` n'existe pas encore :**
```bash
# 1. Créer manuellement la base (en tant que root ou utilisateur avec privilèges)
mysql -u root -p -e "CREATE DATABASE secure_api;"

# 2. Générer le client Prisma
npx prisma generate

# 3. Appliquer les migrations
npx prisma migrate dev --name init
```

**Option C - Vérification et diagnostic :**
```bash
# Vérifier les droits de votre utilisateur
mysql -u votre_utilisateur -p -e "SHOW GRANTS;"

# Tester la connexion Prisma
npx prisma db pull
```

### 6. Démarrez le serveur de développement
```bash
npm run dev
```

### 7. Testez l'installation
```bash
# Test de base - Le serveur fonctionne sur http://localhost:3000
curl http://localhost:3000/api/health

# Test complet automatisé (recommandé)
./test-api.sh
```

**✅ Si le test automatisé affiche tous les ✅ verts, votre API est parfaitement configurée !**

## 🔒 Fonctionnalités de sécurité

### Sécurité renforcée
- **Helmet** : Protection contre les vulnérabilités web communes (XSS, clickjacking, etc.)
- **CORS** : Configuration stricte des origines autorisées
- **Rate Limiting** : Protection contre le spam et les attaques par déni de service (100 req/15min)
- **CSRF** : Protection contre les attaques cross-site request forgery
- **Sessions sécurisées** : Cookies httpOnly, secure en production, sameSite

### Authentification robuste
- **Validation de mots de passe renforcée** : 8 caractères minimum avec majuscules, minuscules, chiffres et caractères spéciaux
- **Protection contre le brute force** : Limitation des tentatives de connexion
- **Hachage bcrypt** : Salt de niveau 12 pour le stockage sécurisé des mots de passe
- **Validation des entrées** : Utilisation de Joi pour valider toutes les données d'entrée

## �️ Résilience et fiabilité

### Protection contre les crashes
- **Gestion globale des erreurs** : Capture de toutes les erreurs non gérées avec middleware centralisé
- **Wrapper async** : Protection automatique des routes asynchrones (`asyncHandler`)
- **Retry automatique** : Nouvelles tentatives pour les erreurs de base de données
- **Timeout des requêtes** : Protection contre les requêtes qui traînent (30s par défaut)
- **Arrêt propre** : Fermeture gracieuse des connexions lors de l'arrêt
- **Sanitisation XSS** : Nettoyage automatique contre les injections de scripts

### Surveillance et monitoring
- **Health Check** : Route `/api/health` pour vérifier l'état du système et de la DB
- **Logs détaillés** : Journalisation complète des erreurs avec contexte et stack traces
- **Métriques système** : Utilisation mémoire, uptime, état de la base de données

## 🔗 Endpoints API

### Authentification
- `GET /api/auth/csrf-token` - Récupérer le token CSRF
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/profile` - Profil utilisateur (protégé)
- `POST /api/auth/logout` - Déconnexion utilisateur

### Système
- `GET /api/` - Message de bienvenue et statut
- `GET /api/health` - Vérification de santé (base de données, mémoire, uptime)

## 🧪 Tests automatisés - 40/40 ✅ (100%)

### Tests unitaires des middlewares
```bash
npm run test:unit        # Tests des middlewares (40 tests)
npm run test:coverage    # Tests avec rapport de couverture
npm run test:watch       # Mode watch pour développement
```

**Résultats détaillés :**
- ✅ **Middleware d'authentification** : 6/6 tests (100%)
- ✅ **Middleware de validation** : 12/12 tests (100%)
- ✅ **Middleware de résilience** : 12/12 tests (100%)
- ✅ **Middleware de gestion d'erreurs** : 10/10 tests (100%)

### Tests d'intégration automatisés
```bash
# Script de test complet avec 8 scénarios
./test-api.sh
```

**Tests effectués :**
1. ✅ Connectivité API
2. ✅ Récupération token CSRF
3. ✅ Inscription utilisateur
4. ✅ Accès routes protégées
5. ✅ Validation des données
6. ✅ Protection CSRF
7. ✅ Déconnexion
8. ✅ Sécurité (accès non autorisé)

## 📚 Documentation détaillée

| Section | Documentation | Description |
|---------|---------------|-------------|
| **Architecture** | [→ src/README.md](src/README.md) | Code source, middlewares, routes, services |
| **Tests** | [→ tests/README.md](tests/README.md) | Suite de tests, Jest, configuration |
| **Base de données** | [→ prisma/README.md](prisma/README.md) | Prisma, migrations, schémas MySQL |
| **Sécurité** | [→ SECURITY.md](SECURITY.md) | CSRF, CORS, validation, résilience |
| **API** | [→ API.md](API.md) | Endpoints, exemples cURL/JavaScript |

## ⚠️ Notes importantes

### CSRF Protection
L'API utilise une protection CSRF basée sur les sessions. Récupérez le token via `GET /api/auth/csrf-token` et incluez-le dans l'header `X-CSRF-Token` pour toutes les requêtes sensibles.

### ES Modules
Ce projet utilise les **modules ES natifs** (ESM) :
- `"type": "module"` dans package.json
- Utilisation de `import/export` au lieu de `require()`
- Jest configuré avec `--experimental-vm-modules`
- Compatibilité Node.js 18+

### Sessions
- **Développement** : Sessions stockées en mémoire (perdues au redémarrage)
- **Production** : Configurez Redis ou un store persistant pour les sessions

## 🛠️ Scripts de développement

```bash
# Développement
npm run dev              # Serveur avec rechargement automatique
npm run start            # Serveur production

# Tests
npm run test:unit        # Tests unitaires (40 tests)
npm run test:coverage    # Tests avec couverture
npm run test:watch       # Mode watch
./test-api.sh           # Tests d'intégration complets

# Base de données
npm run db:studio        # Interface graphique Prisma
npm run db:reset         # Réinitialiser la base (⚠️ supprime données)
npm run db:generate      # Générer le client Prisma

# Santé de l'API
npm run test:health      # Test rapide de l'API
```

## � Problèmes courants

**Erreur "Access denied" lors des migrations Prisma :**
```bash
# Solution : Donner les droits nécessaires
mysql -u root -p -e "GRANT ALL PRIVILEGES ON secure_api.* TO 'votre_utilisateur'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

**Token CSRF invalide :**
```bash
# Récupérer un nouveau token avant chaque requête sensible
CSRF_TOKEN=$(curl -s -c cookies.txt http://localhost:3000/api/auth/csrf-token | jq -r '.csrfToken')
```

**Port déjà utilisé :**
```bash
# Libérer le port 3000
kill -9 $(lsof -ti:3000)
```

## 🎯 Prêt pour la production

- ✅ **Variables d'environnement** : Configuration sécurisée avec validation
- ✅ **Tests complets** : 40 tests unitaires + intégration
- ✅ **Sécurité renforcée** : CSRF, CORS, Rate Limiting, Helmet
- ✅ **Gestion d'erreurs** : Middleware centralisé avec logs
- ✅ **Health checks** : Monitoring de l'état système et DB
- ✅ **ES Modules** : Architecture moderne et maintenable

## 📄 Licence

MIT - Utilisez ce squelette librement pour vos projets !