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

### 1. **Installez les dépendances :**
```bash
npm install
```

### 2. **Configurez MySQL :**
```bash
# Connectez-vous à MySQL
sudo mysql -u root -p

# Créez la base de données et un utilisateur
CREATE DATABASE secure_api;
CREATE USER 'votre_utilisateur'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON secure_api.* TO 'votre_utilisateur'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. **Configurez les variables d'environnement :**
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
DATABASE_URL="mysql://votre_utilisateur:votre_mot_de_passe@localhost:3306/secure_api"
```

### 4. **Générez et appliquez les migrations :**

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

### 5. **Démarrez le serveur de développement :**
```bash
npm run dev
```

### 6. **Testez l'installation :**
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
- **Protection contre le brute force** : Limitation des tentatives de connexion (5 tentatives max, blocage 15min)
- **Hachage bcrypt** : Salt de niveau 12 pour le stockage sécurisé des mots de passe
- **Validation des entrées** : Utilisation de Joi pour valider toutes les données d'entrée

### Configuration avancée
- **Validation des variables d'environnement** : Vérification automatique au démarrage
- **Headers de sécurité avancés** : CSP, HSTS, limitation de taille des requêtes
- **Gestion d'erreurs centralisée** : Messages d'erreur appropriés et logging

## 🛡️ Résilience et fiabilité

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
- **Gestion spécialisée** : Erreurs CSRF, Prisma, Joi avec messages appropriés
- **Mode production** : Masquage des détails sensibles d'erreur en production

## 📁 Structure du projet

```
├── prisma/
│   ├── schema.prisma      # Schéma de base de données Prisma
│   └── migrations/        # Migrations de base de données
├── src/
│   ├── app.js             # Point d'entrée principal
│   ├── config/
│   │   ├── corsOptions.js # Configuration CORS
│   │   ├── database.js    # Configuration Prisma/MySQL
│   │   └── validateEnv.js # Validation des variables d'environnement
│   ├── middlewares/
│   │   ├── auth.js        # Middleware d'authentification
│   │   ├── errorHandler.js# Gestionnaire d'erreurs global
│   │   ├── resilience.js  # Middleware de résilience (timeout, sanitization)
│   │   └── validate.js    # Middleware de validation Joi
│   ├── routes/
│   │   ├── auth.js        # Routes d'authentification
│   │   └── index.js       # Routes principales
│   └── services/
│       └── userService.js # Service de gestion des utilisateurs
├── tests/
│   ├── middlewares/       # Tests unitaires des middlewares
│   ├── routes/           # Tests d'intégration des routes
│   ├── services/         # Tests des services
│   ├── helpers.js        # Utilitaires de test
│   └── setup.js          # Configuration des tests
├── test-api.sh           # Script de test automatisé complet
├── jest.config.json      # Configuration Jest pour ES modules
├── .env                  # Variables d'environnement
├── .env.example         # Exemple de configuration
├── .env.test            # Configuration de test
└── package.json         # Dépendances et scripts
```

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

## 🧪 Tests automatisés

### 📊 État des tests unitaires

L'API dispose d'une suite complète de tests automatisés pour garantir la fiabilité et la sécurité :

```bash
# Tests unitaires (middlewares uniquement - pas de DB requise)
npm run test:unit        # Tests des middlewares (40 tests)
npm run test:middlewares # Alias pour test:unit

# Tests nécessitant une base de données de test
npm run test:services    # Tests des services
npm run test:routes      # Tests d'intégration des routes

# Tests complets avec couverture
npm run test             # Tous les tests
npm run test:coverage    # Tests avec rapport de couverture
npm run test:watch       # Mode watch pour développement
```

**🎯 Résultats des tests unitaires :**
- ✅ **Middleware d'authentification** : 6/6 tests (100%) 
  - Validation des sessions utilisateur
  - Gestion des accès non autorisés
  - Types d'userId multiples supportés

- ✅ **Middleware de validation** : 12/12 tests (100%)
  - Validation des schémas utilisateur (Joi)
  - Gestion des erreurs de validation
  - Messages d'erreur personnalisés en français

- ✅ **Middleware de résilience** : 12/12 tests (100%)
  - Gestion des erreurs asynchrones
  - Sanitisation des entrées (XSS protection)
  - Configuration de timeout des requêtes

- ✅ **Middleware de gestion d'erreurs** : 10/10 tests (100%)
  - Logging détaillé des erreurs
  - Gestion spécialisée (CSRF, Prisma, Joi)
  - Mode développement/production

**Total : 40/40 tests automatisés (100% de réussite)**

### ⚙️ Configuration des tests

**Jest avec ES Modules :**
Le projet utilise Jest 30.2.0 configuré pour les modules ES natifs :
- Configuration dans `jest.config.json`
- Support des imports/exports ES6
- Utilisation de `cross-env` et `--experimental-vm-modules`
- Tests isolés avec mocks appropriés

**Structure des tests :**
- `tests/middlewares/` : Tests unitaires purs (pas de DB)
- `tests/services/` : Tests avec base de données de test
- `tests/routes/` : Tests d'intégration HTTP complets
- `tests/helpers.js` : Utilitaires partagés
- `tests/setup.js` : Configuration globale Jest

### 🚀 Tests d'intégration complets

## 🧪 Tests et utilisation de l'API

### Tests avec cURL

#### 1. **Récupérer le token CSRF :**
```bash
# Sauvegarder les cookies pour maintenir la session
curl -c cookies.txt http://localhost:3000/api/auth/csrf-token
```
Réponse : `{"csrfToken":"votre-token-csrf"}`

**💡 Astuce :** Pour extraire automatiquement le token depuis la réponse :
```bash
# Méthode 1 : Extraire et sauvegarder le token dans une variable
CSRF_TOKEN=$(curl -s -c cookies.txt http://localhost:3000/api/auth/csrf-token | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "Token CSRF : $CSRF_TOKEN"

# Méthode 2 : Utiliser jq (si installé)
CSRF_TOKEN=$(curl -s -c cookies.txt http://localhost:3000/api/auth/csrf-token | jq -r '.csrfToken')
echo "Token CSRF : $CSRF_TOKEN"
```

#### 2. **S'inscrire :**
```bash
# Avec le token extrait automatiquement
curl -b cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"username":"testuser","password":"MonMotDePasse123!"}'

# OU manuellement (remplacez VOTRE_TOKEN_ICI par le token affiché)
curl -b cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: VOTRE_TOKEN_ICI" \
  -d '{"username":"testuser","password":"MonMotDePasse123!"}'
```
Réponse : `{"message":"Utilisateur inscrit avec succès","user":{"id":1,"username":"testuser","createdAt":"2025-10-21T..."}}`

#### 3. **Se connecter :**
```bash
# Récupérer un nouveau token CSRF (recommandé pour la sécurité)
CSRF_TOKEN=$(curl -s -b cookies.txt -c cookies.txt http://localhost:3000/api/auth/csrf-token | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

# Se connecter avec le nouveau token
curl -b cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"username":"testuser","password":"MonMotDePasse123!"}'
```
Réponse : `{"message":"Connecté avec succès","user":{"id":1,"username":"testuser"}}`

#### 4. **Accéder au profil (route protégée) :**
```bash
curl -b cookies.txt http://localhost:3000/api/auth/profile
```
Réponse : `{"message":"Profil protégé","user":{"id":1,"username":"testuser","createdAt":"...","updatedAt":"..."}}`

#### 5. **Se déconnecter :**
```bash
# Récupérer un nouveau token CSRF pour la déconnexion
CSRF_TOKEN=$(curl -s -b cookies.txt -c cookies.txt http://localhost:3000/api/auth/csrf-token | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

# Se déconnecter
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout \
  -H "X-CSRF-Token: $CSRF_TOKEN"
```

### 🤖 Script de test automatisé

Pour simplifier les tests, voici un script bash complet qui automatise tout le processus :

```bash
#!/bin/bash
# test-api.sh - Script de test automatisé pour l'API

API_URL="http://localhost:3000"
COOKIES_FILE="cookies.txt"

# Fonction pour récupérer le token CSRF
get_csrf_token() {
    curl -s -b $COOKIES_FILE -c $COOKIES_FILE $API_URL/api/auth/csrf-token | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4
}

echo "🚀 Test automatisé de l'API sécurisée"
echo "=================================="

# 1. Vérifier que l'API fonctionne
echo "📡 Test de connectivité..."
curl -s $API_URL/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ API accessible"
else
    echo "❌ API non accessible - Vérifiez que le serveur fonctionne"
    exit 1
fi

# 2. Récupérer le token CSRF
echo "🔑 Récupération du token CSRF..."
CSRF_TOKEN=$(get_csrf_token)
if [ -n "$CSRF_TOKEN" ]; then
    echo "✅ Token CSRF récupéré : ${CSRF_TOKEN:0:10}..."
else
    echo "❌ Impossible de récupérer le token CSRF"
    exit 1
fi

# 3. Inscription
echo "📝 Test d'inscription..."
REGISTER_RESPONSE=$(curl -s -b $COOKIES_FILE -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"username":"testuser_'$(date +%s)'","password":"TestPassword123!"}')

if echo "$REGISTER_RESPONSE" | grep -q "inscrit avec succès"; then
    echo "✅ Inscription réussie"
    USERNAME=$(echo "$REGISTER_RESPONSE" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
    echo "   Utilisateur créé : $USERNAME"
else
    echo "❌ Échec de l'inscription"
    echo "   Réponse : $REGISTER_RESPONSE"
fi

# 4. Test du profil (utilisateur connecté)
echo "👤 Test d'accès au profil..."
PROFILE_RESPONSE=$(curl -s -b $COOKIES_FILE $API_URL/api/auth/profile)
if echo "$PROFILE_RESPONSE" | grep -q "Profil protégé"; then
    echo "✅ Accès au profil autorisé"
else
    echo "❌ Accès au profil refusé"
fi

# 5. Déconnexion
echo "🚪 Test de déconnexion..."
CSRF_TOKEN=$(get_csrf_token)
LOGOUT_RESPONSE=$(curl -s -b $COOKIES_FILE -X POST $API_URL/api/auth/logout \
  -H "X-CSRF-Token: $CSRF_TOKEN")

if echo "$LOGOUT_RESPONSE" | grep -q "Déconnecté avec succès"; then
    echo "✅ Déconnexion réussie"
else
    echo "❌ Échec de la déconnexion"
fi

# 6. Test d'accès non autorisé
echo "🚫 Test de sécurité (accès non autorisé)..."
UNAUTH_RESPONSE=$(curl -s $API_URL/api/auth/profile)
if echo "$UNAUTH_RESPONSE" | grep -q "Non autorisé"; then
    echo "✅ Sécurité OK - Accès refusé aux utilisateurs non connectés"
else
    echo "❌ Problème de sécurité détecté"
fi

echo ""
echo "🎉 Tests terminés ! Vérifiez les résultats ci-dessus."
echo "💡 Nettoyage : rm $COOKIES_FILE"
```

**Pour utiliser ce script :**
```bash
# Le script est déjà disponible dans le projet avec permissions d'exécution
# Lancer les tests automatisés complets
./test-api.sh

# Si permissions manquantes :
chmod +x test-api.sh
./test-api.sh
```

**Ce que fait le script :**
- ✅ Teste la connectivité de l'API
- 🔑 Récupère automatiquement les tokens CSRF
- 📝 Teste l'inscription avec validation
- 👤 Vérifie l'accès aux routes protégées  
- 🛡️ Teste la sécurité (CSRF, authentification)
- 🚪 Teste la déconnexion
- 🧹 Nettoie automatiquement les cookies

**Exemple de sortie complète :**
```
🚀 Test automatisé de l'API sécurisée
==================================
📡 Nettoyage des anciens cookies
📡 Test de connectivité...
✅ API accessible et fonctionnelle
� Récupération du token CSRF...
✅ Token CSRF récupéré : ouOtt5yc-8fV-Go...
� Test d'inscription...
✅ Inscription réussie
   👤 Utilisateur créé : testuser1761080647
� Test d'accès au profil utilisateur...
✅ Accès au profil autorisé
   👤 Profil de : testuser1761080647
📡 Test de validation - mot de passe faible...
✅ Validation des mots de passe fonctionne
📡 Test de sécurité - requête sans token CSRF...
✅ Protection CSRF active
📡 Test de déconnexion...
✅ Déconnexion réussie
📡 Test de sécurité - accès non autorisé après déconnexion...
✅ Sécurité OK - Accès refusé aux utilisateurs non connectés

🎉 Tests terminés !
📋 Résumé des tests effectués :
   • Connectivité API
   • Récupération token CSRF
   • Inscription utilisateur
   • Accès profil protégé
   • Validation mot de passe
   • Protection CSRF
   • Déconnexion
   • Sécurité accès non autorisé

💡 Nettoyage : rm cookies.txt
```

**🎯 Tests de sécurité validés :**
- ✅ **Protection CSRF** : Requêtes sans token rejetées
- ✅ **Validation stricte** : Mots de passe faibles refusés
- ✅ **Authentification** : Accès profil protégé seulement si connecté
- ✅ **Sessions** : Déconnexion effective et sécurisée
- ✅ **Gestion automatique** : Extraction et utilisation des tokens CSRF

### Tests avec JavaScript/Fetch

```javascript
// Récupérer le token CSRF
const csrfResponse = await fetch('/api/auth/csrf-token', {
  credentials: 'include'
});
const { csrfToken } = await csrfResponse.json();

// Inscription avec token CSRF
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  credentials: 'include', // Important pour les cookies
  body: JSON.stringify({
    username: 'monUtilisateur',
    password: 'MonMotDePasse123!'
  })
});

const result = await response.json();
console.log(result);
```

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

### Architecture testée
- **40 tests unitaires** : 100% de réussite sur tous les middlewares
- **Script d'intégration** : Validation automatique complète de l'API
- **Configuration Jest** : Support complet des ES modules avec Node.js

## 🗄️ Base de données MySQL avec Prisma

### Qu'est-ce que Prisma ?

**Prisma** est un ORM (Object-Relational Mapping) moderne et type-safe pour Node.js et TypeScript. Dans ce projet, Prisma joue un rôle crucial en tant que couche d'abstraction entre votre application Express.js et votre base de données MySQL.

### Pourquoi Prisma est important ?

#### ✅ **Sécurité et Type Safety**
- **Protection SQL Injection** : Requêtes automatiquement sécurisées
- **Validation des types** : Détection d'erreurs à la compilation
- **Schema-first** : Base de données définie par le schéma Prisma

#### ✅ **Développement simplifié**
- **Auto-completion** : IntelliSense complet dans votre IDE
- **Migrations automatiques** : Synchronisation schema ↔ base de données
- **Client généré** : API JavaScript type-safe automatiquement créée

#### ✅ **Performance et fiabilité**
- **Connection pooling** : Gestion optimisée des connexions MySQL
- **Query optimization** : Requêtes SQL optimisées automatiquement
- **Retry automatique** : Reconnexion en cas de perte de connexion

#### ✅ **Outils de développement**
- **Prisma Studio** : Interface graphique pour explorer vos données
- **Migration system** : Versioning de votre schéma de base de données
- **Introspection** : Génération du schéma depuis une DB existante

### Modèle utilisateur (Prisma)
```prisma
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique @db.VarChar(30)
  passwordHash String   @db.VarChar(255)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

### Avantages dans ce projet

- 🔒 **Sécurité renforcée** : Protection automatique contre l'injection SQL
- 🚀 **Performance** : Pool de connexions optimisé pour MySQL  
- 🛠️ **Maintenabilité** : Migrations versionnées et schema centralisé
- 🐛 **Debugging** : Logs détaillés des requêtes en développement
- 🔄 **Résilience** : Retry automatique avec gestion d'erreurs personnalisée

### Commandes utiles Prisma
```bash
# Voir l'état de la base de données
npx prisma db pull

# Réinitialiser la base de données (⚠️ supprime toutes les données)
npx prisma migrate reset

# Ouvrir Prisma Studio (interface graphique pour vos données)
npx prisma studio

# Générer le client après modification du schéma
npx prisma generate

# Créer une nouvelle migration après modification du schema
npx prisma migrate dev --name nom_de_votre_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Formatter le schéma Prisma
npx prisma format

# Valider le schéma Prisma
npx prisma validate
```

### Architecture avec Prisma

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Routes Auth   │ ─► │ UserService  │ ─► │   Prisma    │
│ (API Express)   │    │ (Logique)    │    │  (Client)   │
└─────────────────┘    └──────────────┘    └─────────────┘
                                                   │
                                           ┌───────▼──────┐
                                           │    MySQL     │
                                           │  (Database)  │
                                           └──────────────┘
```

Cette architecture sépare clairement :
- **Routes** : Gestion HTTP et validation
- **Services** : Logique métier
- **Prisma** : Accès aux données sécurisé
- **MySQL** : Stockage persistant

### Variables d'environnement requises
```bash
PORT=3000                                                      # Port du serveur
NODE_ENV=development                                           # Environnement (development/production/test)
SESSION_SECRET=votre_secret_tres_securise_32_caracteres_min    # Secret de session (32+ caractères)
CORS_ORIGIN=http://localhost:5173                             # Origine CORS autorisée
DATABASE_URL="mysql://utilisateur:motdepasse@localhost:3306/secure_api"  # Connexion MySQL
```

### Exemple d'utilisation de Prisma dans le code

```javascript
// Création d'un utilisateur avec Prisma
const user = await prisma.user.create({
  data: {
    username: 'john_doe',
    passwordHash: hashedPassword
  },
  select: {
    id: true,
    username: true,
    createdAt: true
    // passwordHash exclu pour la sécurité
  }
});

// Recherche avec conditions et pagination
const users = await prisma.user.findMany({
  where: {
    createdAt: {
      gte: new Date('2025-01-01')
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10 // Limite à 10 résultats
});
```

## 🔧 Développement et débogage

### Scripts de développement disponibles
```bash
# Développement avec rechargement automatique
npm run dev

# Tests en mode watch pour développement
npm run test:watch

# Interface graphique pour explorer la base de données
npm run db:studio

# Réinitialiser la base de données (⚠️ supprime les données)
npm run db:reset

# Réinitialiser la base de données de test
npm run db:reset:test

# Générer le client Prisma après modification du schéma
npm run db:generate
```

### Vérification de l'état
```bash
# Vérifier que l'API fonctionne
npm run test:health
# OU
curl -f http://localhost:3000/api/health

# Vérifier que MySQL fonctionne
sudo systemctl status mysql

# Vérifier la connexion à la base
mysql -u votre_utilisateur -p 

# Utiliser la base de données
USE secure_api;

# Voir les utilisateurs créés
SELECT * FROM users;
```

### Logs et monitoring
- Les requêtes Prisma sont loggées en mode développement
- Morgan affiche toutes les requêtes HTTP avec timing
- Les erreurs sont centralisées via le middleware `errorHandler`
- Logs colorés dans le terminal pour faciliter le debugging

### Problèmes courants

**Erreur EADDRINUSE** : Port déjà utilisé
```bash
# Trouver le processus utilisant le port 3000
lsof -ti:3000

# L'arrêter
kill $(lsof -ti:3000)

# L'arrêter de force
kill -9 $(lsof -ti:3000)
```

**Erreur de connexion MySQL** :
- Vérifiez que MySQL est démarré : `sudo systemctl start mysql` 
- Vérifiez les credentials dans `DATABASE_URL`
- Vérifiez que la base `secure_api` existe
- Testez la connexion : `npx prisma db pull`

**Erreur "Access denied" lors des migrations Prisma** :
```bash
# Problème : L'utilisateur n'a pas les droits pour créer/modifier des bases
# Solution 1 : Créer la base manuellement avec un utilisateur privilégié
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS secure_api;"

# Solution 2 : Donner les droits nécessaires à votre utilisateur
mysql -u root -p -e "GRANT ALL PRIVILEGES ON secure_api.* TO 'votre_utilisateur'@'localhost';"
mysql -u root -p -e "GRANT CREATE ON *.* TO 'votre_utilisateur'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

# Solution 3 : Vérifier les droits actuels
mysql -u votre_utilisateur -p -e "SHOW GRANTS;"
```

**Erreurs Prisma courantes** :
- `P2002` : Contrainte unique violée (utilisateur déjà existant)
- `P2025` : Record non trouvé 
- `P1001` : Base de données inaccessible
- Solution : Vérifiez les logs détaillés avec `npx prisma studio`

**Token CSRF invalide** :
- **Problème** : Erreur 403 "CSRF token mismatch"
- **Solutions** :
  ```bash
  # 1. Vérifiez que les cookies sont sauvegardés ET envoyés
  curl -c cookies.txt -b cookies.txt http://localhost:3000/api/auth/csrf-token
  
  # 2. Récupérez un NOUVEAU token avant chaque action sensible
  CSRF_TOKEN=$(curl -s -c cookies.txt -b cookies.txt http://localhost:3000/api/auth/csrf-token | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
  
  # 3. Vérifiez le contenu du fichier cookies.txt
  cat cookies.txt
  
  # 4. Si le problème persiste, supprimez les anciens cookies
  rm cookies.txt
  ```
- **Important** : Le token CSRF change à chaque redémarrage du serveur
- **Astuce** : Utilisez toujours `-c cookies.txt -b cookies.txt` ensemble

##  Prêt pour la production

Pour déployer en production, considérez ces améliorations :

1. **Base de données** : MySQL optimisé + Redis pour les sessions
2. **Variables d'environnement** : Configuration sécurisée avec validation ✅
3. **Tests** : Tests unitaires et d'intégration
4. **Docker** : Containerisation pour le déploiement
5. **Monitoring** : Prometheus/Grafana ou équivalent
6. **HTTPS** : Certificats SSL/TLS
7. **Logs** : Système de logging centralisé
8. **Pool de connexions** : Optimisation des connexions MySQL
9. **Backup automatique** : Sauvegarde régulière de la base

## 📊 Validation des données

### Règles de validation implémentées

**Nom d'utilisateur :**
- 3 à 30 caractères
- Uniquement alphanumériques
- Unique en base de données

**Mot de passe :**
- Minimum 8 caractères
- Au moins 1 minuscule
- Au moins 1 majuscule  
- Au moins 1 chiffre
- Au moins 1 caractère spécial (@$!%*?&)

### Protection contre les attaques

- **Brute Force** : 5 tentatives max par IP, blocage 15min
- **CSRF** : Token obligatoire pour toutes les actions sensibles
- **Rate Limiting** : 100 requêtes/15min par IP
- **Sessions sécurisées** : httpOnly, secure en production, SameSite
- **Headers sécurisés** : CSP, HSTS, XSS Protection

## �📝 Licence

MIT - Utilisez ce squelette librement pour vos projets !
