# Squelette Express.js Sécurisé - API REST avec CSRF

**Ce que vous obtenez**
- API Express.js avec Helmet, CORS, limitation de débit, protection CSRF, validation d'entrée (Joi), logging, et routes d'authentification complètes (inscription/connexion/déconnexion).
- Stockage utilisateur simple en mémoire (pour demo). Remplacez par une vraie base de données en production.
- Authentification basée sur les sessions avec express-session (stockage mémoire pour le développement uniquement).

## 🚀 Démarrage rapide

1. **Installez les dépendances :**
   ```bash
   npm install
   ```

2. **Configurez les variables d'environnement :**
   Copiez `.env.example` vers `.env` et modifiez les valeurs :
   ```bash
   cp .env.example .env
   ```

3. **Démarrez le serveur de développement :**
   ```bash
   npm run dev
   ```

4. **Le serveur fonctionne sur http://localhost:3000 par défaut.**

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

## 📁 Structure du projet

```
src/
├── app.js                 # Point d'entrée principal
├── config/
│   ├── corsOptions.js     # Configuration CORS
│   └── validateEnv.js     # Validation des variables d'environnement
├── middlewares/
│   ├── auth.js           # Middleware d'authentification
│   ├── errorHandler.js   # Gestionnaire d'erreurs global
│   └── validate.js       # Middleware de validation Joi
└── routes/
    ├── auth.js           # Routes d'authentification
    └── index.js          # Routes principales
```

## 🔗 Endpoints API

### Authentification
- `GET /api/auth/csrf-token` - Récupérer le token CSRF
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/profile` - Profil utilisateur (protégé)
- `POST /api/auth/logout` - Déconnexion utilisateur

### Exemple d'utilisation

```javascript
// Récupérer le token CSRF
const csrfResponse = await fetch('/api/auth/csrf-token');
const { csrfToken } = await csrfResponse.json();

// Inscription avec token CSRF
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  credentials: 'include',
  body: JSON.stringify({
    username: 'monUtilisateur',
    password: 'MonMotDePasse123!'
  })
});
```

## ⚠️ Notes importantes

### Développement vs Production
- **CSRF** : L'API expose `GET /api/auth/csrf-token` qui retourne un token CSRF à inclure dans les requêtes (header `X-CSRF-Token`) lors de l'utilisation de cookies/sessions.
- **Stockage** : Ce squelette utilise des stockages en mémoire (sessions, utilisateurs) — **PAS pour la production**. Utilisez des stockages persistants (Redis, DB) et une configuration sécurisée pour la production.

### Variables d'environnement requises
```bash
PORT=3000                                    # Port du serveur
NODE_ENV=development                         # Environnement (development/production/test)
SESSION_SECRET=votre_secret_tres_securise    # Secret de session (32+ caractères)
CORS_ORIGIN=http://localhost:5173           # Origine CORS autorisée
```

## 🚀 Prêt pour la production

Pour déployer en production, considérez ces améliorations :

1. **Base de données** : PostgreSQL/MongoDB + Redis pour les sessions
2. **Variables d'environnement** : Configuration sécurisée avec validation
3. **Tests** : Tests unitaires et d'intégration
4. **Docker** : Containerisation pour le déploiement
5. **Monitoring** : Prometheus/Grafana ou équivalent
6. **HTTPS** : Certificats SSL/TLS
7. **Logs** : Système de logging centralisé

## 📝 Licence

MIT - Utilisez ce squelette librement pour vos projets !
