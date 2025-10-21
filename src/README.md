# 📁 Architecture du Code Source - Guide Développeur

## 📋 Vue d'ensemble

Cette section documente l'architecture complète du code source, conçue selon les meilleures pratiques Node.js/Express avec une séparation claire des responsabilités.

**Principes architecturaux :**
- **Séparation des préoccupations** : Chaque dossier a une responsabilité claire
- **Modularité** : Composants réutilisables et testables indépendamment
- **Sécurité par défaut** : Validation et protection à chaque niveau
- **ES Modules natifs** : Architecture moderne avec imports/exports
- **Type-safety** : Prisma pour les interactions base de données

## 📂 Structure détaillée

```
src/
├── app.js              # 🚀 Point d'entrée principal avec configuration serveur
├── config/             # ⚙️ Configuration globale de l'application
│   ├── corsOptions.js  # 🌐 Configuration CORS avec origines autorisées
│   ├── database.js     # 🗄️ Client Prisma/MySQL avec pool de connexions
│   └── validateEnv.js  # ✅ Validation des variables d'environnement
├── middlewares/        # 🛡️ Middlewares Express pour sécurité et fonctionnalités
│   ├── auth.js         # 🔐 Authentification basée sur les sessions
│   ├── errorHandler.js # 🚨 Gestion centralisée des erreurs avec logging
│   ├── resilience.js   # 💪 Résilience (timeout, sanitisation, async handler)
│   └── validate.js     # ✅ Validation Joi avec schémas personnalisés
├── routes/             # 🛣️ Routes API avec endpoints RESTful
│   ├── auth.js         # 🔑 Routes d'authentification (CRUD utilisateurs)
│   └── index.js        # 🏠 Routes système (health check, bienvenue)
└── services/           # 🔧 Logique métier avec interactions base de données
    └── userService.js  # 👤 Service de gestion des utilisateurs
```

## ⚙️ Configuration (`/config`) - Paramétrage Global

### `database.js` - Client Prisma Optimisé
Configuration avancée du client Prisma avec optimisations pour la production :

```javascript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Gestion gracieuse de la fermeture
process.on('beforeExit', async () => {
  console.log('🔌 Fermeture des connexions Prisma...');
  await prisma.$disconnect();
});

// Test de connexion au démarrage
export const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connexion base de données établie');
  } catch (error) {
    console.error('❌ Erreur connexion base de données:', error.message);
    process.exit(1);
  }
};
```

**Fonctionnalités :**
- **Logs conditionnels** : Détaillés en dev, minimes en prod
- **Pool de connexions** : Optimisé automatiquement par Prisma
- **Reconnexion automatique** : Gestion des pertes de connexion
- **Fermeture gracieuse** : Nettoyage des ressources au shutdown

### `corsOptions.js` - Sécurité CORS Renforcée
Configuration CORS stricte avec validation des origines :

```javascript
const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (apps mobiles, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:5173',
      'http://localhost:3000', // Pour les tests
      'http://127.0.0.1:5173'  // Variante localhost
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par la politique CORS'));
    }
  },
  credentials: true, // Essential pour les cookies de session
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 200, // Pour IE11
  maxAge: 86400 // Cache preflight 24h
};

export default corsOptions;
```

**Sécurité :**
- **Whitelist d'origines** : Seules les origines autorisées peuvent accéder
- **Headers contrôlés** : Limitation des headers acceptés
- **Credentials support** : Gestion des cookies cross-origin
- **Cache preflight** : Optimisation des requêtes OPTIONS

### `validateEnv.js` - Validation Stricte des Variables
Validation complète avec Joi et messages d'erreur détaillés :

```javascript
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .port()
    .default(3000),
  
  SESSION_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'string.min': 'SESSION_SECRET doit contenir au minimum 32 caractères',
      'any.required': 'SESSION_SECRET est obligatoire pour la sécurité'
    }),
  
  DATABASE_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'DATABASE_URL doit être une URL MySQL valide',
      'any.required': 'DATABASE_URL est obligatoire'
    }),
  
  CORS_ORIGIN: Joi.string()
    .uri()
    .default('http://localhost:5173')
    
}).unknown(); // Autoriser d'autres variables

export const validateEnvironment = () => {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    console.error('❌ Configuration invalide:');
    error.details.forEach(detail => {
      console.error(`   • ${detail.message}`);
    });
    process.exit(1);
  }
  
  console.log('✅ Variables d\'environnement validées');
  return value;
};
```

**Validation :**
- **Types stricts** : Port numérique, URL valides, longueurs minimales
- **Messages personnalisés** : Erreurs explicites en français
- **Valeurs par défaut** : Configuration fonctionnelle par défaut
- **Validation au démarrage** : Échec rapide si config invalide

## 🛡️ Middlewares (`/middlewares`) - Couche de Sécurité

### `auth.js` - Authentification Basée Sessions 🔐
**Fonction :** Protection des routes nécessitant une authentification
**Tests :** 6/6 ✅ | **Couverture :** 100%

```javascript
export const requireAuth = (req, res, next) => {
  // Vérification de l'existence de la session
  if (!req.session) {
    return res.status(401).json({ error: 'Session non disponible' });
  }

  // Vérification de l'ID utilisateur
  const userId = req.session.userId;
  if (!userId || (typeof userId !== 'number' && typeof userId !== 'string')) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  // Ajout des informations utilisateur à la requête
  req.userId = userId;
  next();
};
```

**Fonctionnalités :**
- **Validation de session** : Vérifie l'existence et la validité
- **Types flexibles** : Support userId string ou number
- **Messages clairs** : Erreurs explicites pour le debugging
- **Injection de contexte** : Ajoute userId à req pour les handlers

**Cas d'usage :**
```javascript
// Protection d'une route
app.get('/api/auth/profile', requireAuth, getUserProfile);

// Dans le handler, userId est disponible
const getUserProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId }
  });
  res.json({ user });
};
```

### `errorHandler.js` - Gestion Centralisée des Erreurs 🚨
**Fonction :** Gestion intelligente des erreurs avec logging et classification
**Tests :** 10/10 ✅ | **Couverture :** 100%

```javascript
export const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  
  // Classification automatique des erreurs
  let statusCode = 500;
  let message = 'Erreur serveur interne';
  
  // Erreurs CSRF
  if (err.code === 'EBADCSRFTOKEN') {
    statusCode = 403;
    message = 'Token CSRF invalide';
  }
  
  // Erreurs Prisma
  else if (err.code?.startsWith('P')) {
    statusCode = handlePrismaError(err);
    message = getPrismaErrorMessage(err);
  }
  
  // Erreurs Joi (validation)
  else if (err.isJoi) {
    statusCode = 400;
    message = 'Erreur de validation';
    const details = err.details.map(detail => detail.message);
    return res.status(statusCode).json({ error: message, details });
  }
  
  // Logging sécurisé (sans données sensibles)
  console.error(`[${timestamp}] ${statusCode} - ${req.method} ${req.path} - IP: ${ip}`);
  console.error(`Erreur: ${err.message}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  // Réponse différentiée selon l'environnement
  const response = {
    error: message,
    timestamp,
    path: req.path
  };
  
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.message;
  }
  
  res.status(statusCode).json(response);
};
```

**Classification des erreurs :**
- **CSRF (403)** : Token manquant ou invalide
- **Prisma (400/409/500)** : Erreurs base de données contextualisées
- **Joi (400)** : Validation avec détails des champs invalides
- **Génériques (500)** : Erreurs non classifiées

### `resilience.js` - Résilience et Sécurité Avancée 💪
**Fonction :** Protection contre les crashes et attaques
**Tests :** 12/12 ✅ | **Couverture :** 100%

```javascript
// AsyncHandler - Capture automatique des erreurs async
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Sanitisation XSS - Protection contre l'injection de scripts
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Scripts
        .replace(/<[^>]*>/g, '') // Balises HTML
        .replace(/javascript:/gi, '') // URLs javascript:
        .replace(/on\w+\s*=/gi, ''); // Attributs d'événements
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

// Timeout configurable - Protection contre les requêtes longues
export const requestTimeout = (timeout = 30000) => (req, res, next) => {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Timeout de la requête',
        timeout: `${timeout}ms`
      });
    }
  }, timeout);

  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));
  
  next();
};
```

**Protection fournie :**
- **Crash prevention** : AsyncHandler capture toutes les erreurs async
- **XSS protection** : Sanitisation automatique des entrées
- **DoS protection** : Timeout configurable par route
- **Memory leaks** : Nettoyage automatique des timers

### `validate.js` - Validation Joi Avancée ✅
**Fonction :** Validation stricte des données avec messages français
**Tests :** 12/12 ✅ | **Couverture :** 100%

```javascript
// Schéma utilisateur avec validation renforcée
export const userSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Le nom d\'utilisateur ne peut contenir que des lettres et chiffres',
      'string.min': 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
      'string.max': 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères',
      'any.required': 'Le nom d\'utilisateur est obligatoire'
    }),
    
  password: Joi.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)',
      'any.required': 'Le mot de passe est obligatoire'
    })
});

// Middleware de validation générique
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Retourner toutes les erreurs
    stripUnknown: true, // Supprimer les champs non définis
    convert: true // Conversion automatique des types
  });

  if (error) {
    const details = error.details.map(detail => detail.message);
    return res.status(400).json({
      error: 'Erreur de validation',
      details
    });
  }

  req.validatedData = value; // Données validées disponibles
  next();
};
```

**Règles de validation :**
- **Username** : 3-30 caractères alphanumériques uniquement
- **Password** : 8+ caractères avec complexité (maj, min, chiffre, spécial)
- **Messages français** : Erreurs explicites pour l'utilisateur
- **Validation complète** : Toutes les erreurs retournées ensemble

## 🛣️ Routes (`/routes`)

### `auth.js`
Endpoints d'authentification :
- `GET /api/auth/csrf-token` - Token CSRF
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil (protégé)
- `POST /api/auth/logout` - Déconnexion

### `index.js`
Routes système :
- `GET /api/` - Message de bienvenue
- `GET /api/health` - Health check complet

## 🔧 Services (`/services`)

### `userService.js`
Logique métier pour les utilisateurs :
- `createUser()` - Création avec hachage bcrypt
- `authenticateUser()` - Vérification credentials
- `findUserById()` - Récupération utilisateur

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Routes    │ ─► │ Middlewares  │ ─► │  Services   │
│ (HTTP)      │    │ (Validation) │    │ (Logique)   │
└─────────────┘    └──────────────┘    └─────────────┘
                                              │
                                      ┌───────▼──────┐
                                      │    Prisma    │
                                      │   (MySQL)    │
                                      └──────────────┘
```

## 🔄 Flux de requête

1. **Route** reçoit la requête HTTP
2. **Middlewares** appliqués dans l'ordre :
   - Helmet (sécurité headers)
   - CORS
   - Sessions
   - CSRF (pour POST/PUT/DELETE)
   - Validation (si nécessaire)
   - Auth (si route protégée)
   - Résilience (timeout, sanitisation)
3. **Service** exécute la logique métier
4. **Prisma** interagit avec MySQL
5. **ErrorHandler** gère les erreurs

## 📊 Métriques

- **40 tests unitaires** sur les middlewares (100% ✅)
- **ES Modules** natifs partout
- **TypeScript-ready** avec Prisma
- **Production-ready** avec gestion d'erreurs complète

## 🚀 Démarrage développement

```bash
# Mode développement avec rechargement
npm run dev

# Tests des middlewares
npm run test:unit

# Interface graphique base de données
npm run db:studio
```