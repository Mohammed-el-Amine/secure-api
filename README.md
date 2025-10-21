# 🔒 Squelette Express.js Sécurisé - API REST avec CSRF

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express](https://img.shields.io/badge/Express-4.19+-blue.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)
![Prisma](https://img.shields.io/badge/Prisma-5.0+-blueviolet.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Security](https://img.shields.io/badge/Security-Production%20Ready-brightgreen.svg)

**Un squelette Express.js sécurisé et robuste avec MySQL/Prisma, conçu pour être incassable et prêt pour la production.**

✨ **Fonctionnalités principales :**
- 🛡️ **Sécurité renforcée** : CSRF, CORS, Rate Limiting, Helmet, validation stricte
- 🗄️ **Base MySQL/Prisma** : ORM type-safe avec migrations automatiques
- 🔄 **Résilience maximale** : Gestion d'erreurs avancée, retry automatique, arrêt gracieux
- ⚡ **Performance optimisée** : Connection pooling, timeout intelligent, health checks
- 🧪 **Facilement testable** : Exemples cURL/JavaScript, monitoring complet

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
```bash
# Créer et appliquer la migration initiale
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate
```

### 5. **Démarrez le serveur de développement :**
```bash
npm run dev
```

### 6. **Testez l'installation :**
```bash
# Le serveur fonctionne sur http://localhost:3000
curl http://localhost:3000/api/health
```

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
- **Gestion globale des erreurs** : Capture de toutes les erreurs non gérées
- **Wrapper async** : Protection automatique des routes asynchrones
- **Retry automatique** : Nouvelles tentatives pour les erreurs de base de données
- **Timeout des requêtes** : Protection contre les requêtes qui traînent (30s)
- **Arrêt propre** : Fermeture gracieuse des connexions lors de l'arrêt

### Surveillance et monitoring
- **Health Check** : Route `/api/health` pour vérifier l'état du système
- **Logs détaillés** : Journalisation complète des erreurs avec contexte
- **Métriques système** : Utilisation mémoire, uptime, état de la base
- **Sanitisation** : Nettoyage automatique des entrées utilisateur

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
│   │   └── validate.js    # Middleware de validation Joi
│   ├── routes/
│   │   ├── auth.js        # Routes d'authentification
│   │   └── index.js       # Routes principales
│   └── services/
│       └── userService.js # Service de gestion des utilisateurs
├── .env                   # Variables d'environnement
├── .env.example          # Exemple de configuration
└── package.json          # Dépendances et scripts
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

## 🧪 Tests et utilisation de l'API

### Tests avec cURL

#### 1. **Récupérer le token CSRF :**
```bash
# Sauvegarder les cookies pour maintenir la session
curl -c cookies.txt http://localhost:3000/api/auth/csrf-token
```
Réponse : `{"csrfToken":"votre-token-csrf"}`

#### 2. **S'inscrire :**
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: VOTRE_TOKEN_ICI" \
  -d '{"username":"testuser","password":"MonMotDePasse123!"}'
```
Réponse : `{"message":"Utilisateur inscrit avec succès","user":{"id":1,"username":"testuser","createdAt":"2025-10-21T..."}}`

#### 3. **Se connecter :**
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: VOTRE_TOKEN_ICI" \
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
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout \
  -H "X-CSRF-Token: VOTRE_TOKEN_ICI"
```

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

### Sessions
- **Développement** : Sessions stockées en mémoire (perdues au redémarrage)
- **Production** : Configurez Redis ou un store persistant pour les sessions

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

### Vérification de l'état
```bash
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
- Morgan affiche les requêtes HTTP
- Les erreurs sont centralisées via le middleware `errorHandler`

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

**Erreurs Prisma courantes** :
- `P2002` : Contrainte unique violée (utilisateur déjà existant)
- `P2025` : Record non trouvé 
- `P1001` : Base de données inaccessible
- Solution : Vérifiez les logs détaillés avec `npx prisma studio`

**Token CSRF invalide** :
- Utilisez `-c cookies.txt` pour sauvegarder les cookies
- Utilisez `-b cookies.txt` pour les envoyer
- Récupérez un nouveau token après chaque redémarrage

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
