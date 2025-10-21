# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-21

### Ajouté
- 🗄️ Intégration complète MySQL avec Prisma ORM
- 🛡️ Sécurité renforcée avec CSRF, CORS, Rate Limiting, Helmet
- 🔐 Authentification robuste avec validation stricte des mots de passe
- 🔄 Système de résilience maximale (retry automatique, gestion d'erreurs)
- ⚡ Optimisations de performance (connection pooling, timeout intelligent)
- 🩺 Health checks complets (`/api/health`)
- 📚 Documentation exhaustive avec guides et troubleshooting
- 🧪 Exemples de tests avec cURL et JavaScript
- 🔧 Middlewares de sanitisation et timeout
- 📊 Validation automatique des variables d'environnement
- 🚪 Arrêt gracieux du serveur avec gestion des signaux
- 📝 Templates GitHub pour issues et contributions
- 🔄 Workflow CI/CD avec GitHub Actions

### Fonctionnalités de sécurité
- Protection contre les attaques par force brute (5 tentatives, blocage 15min)
- Validation des mots de passe (8+ caractères, complexité requise)
- Headers de sécurité avancés (CSP, HSTS, XSS Protection)
- Sessions sécurisées (httpOnly, secure, sameSite)
- Sanitisation automatique des entrées utilisateur

### Architecture
- Structure en couches : Routes → Services → Prisma → MySQL
- Gestion d'erreurs centralisée avec codes spécifiques
- Pool de connexions optimisé pour MySQL
- Retry automatique pour les opérations de base de données

### Endpoints API
- `GET /api/` - Message de bienvenue
- `GET /api/health` - Vérification de santé système
- `GET /api/auth/csrf-token` - Token CSRF
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/profile` - Profil utilisateur (protégé)
- `POST /api/auth/logout` - Déconnexion utilisateur

## [À venir]

### Prévu pour v1.1.0
- Tests unitaires et d'intégration
- Support Docker avec docker-compose
- Monitoring avec Prometheus/Grafana
- Rate limiting par utilisateur (pas seulement par IP)
- Support de Redis pour les sessions
- API de récupération de mot de passe
- Limitation des tentatives de connexion en base (pas en mémoire)

### Prévu pour v1.2.0
- Support de plusieurs bases de données
- API d'administration
- Système de logs centralisé
- Notifications par email
- Support WebSocket pour temps réel
- Documentation API avec Swagger/OpenAPI