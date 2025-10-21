# 🛡️ Documentation Sécurité Complète

## 🎯 Philosophie de Sécurité

Cette API adopte une approche **"Security by Design"** avec une architecture de défense en profondeur. Chaque couche de l'application implémente des mécanismes de protection spécifiques, créant un écosystème sécurisé résilient aux attaques courantes.

**Principes fondamentaux :**
- **Principe du moindre privilège** : Accès minimal nécessaire
- **Défense en profondeur** : Multiples couches de protection
- **Sécurité par défaut** : Configuration sécurisée dès l'installation
- **Validation stricte** : Tous les inputs sont validés et sanitisés
- **Transparence contrôlée** : Logs détaillés sans exposition de données sensibles

## 📊 Matrice de Sécurité

| Couche | Protection | Implémentation | Tests | Status |
|--------|------------|----------------|-------|--------|
| **HTTP** | Headers sécurisés | Helmet.js | ✅ | Production |
| **CORS** | Origines restreintes | CORS middleware | ✅ | Production |
| **CSRF** | Token de session | csurf | ✅ | Production |
| **Auth** | Sessions sécurisées | express-session | ✅ | Production |
| **Input** | Validation/Sanitisation | Joi + middleware | ✅ | Production |
| **Rate** | Limitation requêtes | express-rate-limit | ✅ | Production |
| **DB** | Requêtes paramétrées | Prisma ORM | ✅ | Production |
| **Error** | Gestion centralisée | Middleware custom | ✅ | Production |

## 🔒 Protection CSRF - Cross-Site Request Forgery

### 🎯 Principe et Enjeux
La protection CSRF empêche les attaques où un site malveillant force un utilisateur authentifié à exécuter des actions non désirées sur notre application.

**Scénario d'attaque typique :**
1. Utilisateur connecté sur notre app (session active)
2. Visite d'un site malveillant dans un autre onglet
3. Le site malveillant tente une requête POST vers notre API
4. Sans CSRF : la requête réussit (session valide)
5. Avec CSRF : la requête échoue (token manquant)

### 🛠️ Implémentation Avancée
```javascript
import csrf from 'csurf';

// Configuration CSRF robuste
const csrfProtection = csrf({
  cookie: false,  // Stockage en session (plus sécurisé)
  sessionKey: 'session',
  value: (req) => {
    // Ordre de priorité pour récupérer le token
    return req.headers['x-csrf-token'] ||  // Header principal
           req.body._csrf ||               // Champ de formulaire
           req.query._csrf;                // Paramètre URL (déconseillé)
  },
  
  // Fonction de validation personnalisée
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], // Méthodes sûres
  
  // Messages d'erreur personnalisés
  onError: (err, req, res, next) => {
    console.warn(`🚨 Tentative CSRF détectée - IP: ${req.ip} - Path: ${req.path}`);
    res.status(403).json({
      error: 'Token CSRF invalide ou manquant',
      code: 'CSRF_INVALID',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Application sélective du CSRF
app.use('/api/auth', csrfProtection); // Routes sensibles seulement
app.use('/api/admin', csrfProtection); // Routes administratives
```

### 🔐 Utilisation Pratique Complète

#### 1. Récupération du Token
```bash
# Méthode recommandée avec gestion des cookies
curl -c cookies.txt -X GET http://localhost:3000/api/auth/csrf-token

# Réponse JSON
{
  "csrfToken": "abc123...",
  "expires": "2025-10-21T15:30:00.000Z"
}
```

#### 2. Utilisation dans les Requêtes
```bash
# Extraction automatique du token
CSRF_TOKEN=$(curl -s -c cookies.txt http://localhost:3000/api/auth/csrf-token | jq -r '.csrfToken')

# Requête sécurisée
curl -b cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123!"
  }'
```

#### 3. Client JavaScript Moderne
```javascript
class SecureAPIClient {
  constructor() {
    this.csrfToken = null;
  }

  async getCsrfToken() {
    const response = await fetch('/api/auth/csrf-token', {
      credentials: 'include'
    });
    const data = await response.json();
    this.csrfToken = data.csrfToken;
    return this.csrfToken;
  }

  async secureRequest(url, options = {}) {
    if (!this.csrfToken) {
      await this.getCsrfToken();
    }

    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken,
        ...options.headers
      }
    });
  }

  // Gestion automatique de l'expiration du token
  async handleResponse(response) {
    if (response.status === 403) {
      const error = await response.json();
      if (error.code === 'CSRF_INVALID') {
        // Token expiré, en récupérer un nouveau
        await this.getCsrfToken();
        throw new Error('CSRF_TOKEN_EXPIRED');
      }
    }
    return response;
  }
}

// Utilisation avec retry automatique
const api = new SecureAPIClient();

const registerUser = async (userData, retries = 1) => {
  try {
    const response = await api.secureRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    return await api.handleResponse(response);
  } catch (error) {
    if (error.message === 'CSRF_TOKEN_EXPIRED' && retries > 0) {
      return registerUser(userData, retries - 1);
    }
    throw error;
  }
};
```

### 🧪 Tests de Sécurité Automatisés
```javascript
// Test de protection CSRF
describe('Protection CSRF', () => {
  it('devrait rejeter les requêtes POST sans token CSRF', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        password: 'Password123!'
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('CSRF');
  });

  it('devrait accepter les requêtes avec token CSRF valide', async () => {
    // Récupérer un token CSRF
    const csrfResponse = await request(app)
      .get('/api/auth/csrf-token');
    
    const csrfToken = csrfResponse.body.csrfToken;

    // Utiliser le token dans une requête
    const response = await request(app)
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({
        username: 'testuser',
        password: 'Password123!'
      });

    expect(response.status).toBe(201);
  });

  it('devrait gérer les tokens expirés', async () => {
    const expiredToken = 'expired-token';
    
    const response = await request(app)
      .post('/api/auth/login')
      .set('X-CSRF-Token', expiredToken)
      .send({
        username: 'test',
        password: 'test'
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('CSRF_INVALID');
  });
});
```

### 🔍 Monitoring et Alertes
```javascript
// Middleware de monitoring CSRF
const csrfMonitoring = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Détecter les échecs CSRF
    if (res.statusCode === 403 && data.includes('CSRF')) {
      console.warn(`🚨 Tentative CSRF bloquée:`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      // Alerter si tentatives répétées depuis la même IP
      incrementCsrfAttempts(req.ip);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Cache des tentatives par IP
const csrfAttempts = new Map();

const incrementCsrfAttempts = (ip) => {
  const current = csrfAttempts.get(ip) || 0;
  const newCount = current + 1;
  
  csrfAttempts.set(ip, newCount);
  
  // Alerte après 5 tentatives en 1 heure
  if (newCount >= 5) {
    console.error(`🚨 ALERTE SÉCURITÉ: ${newCount} tentatives CSRF depuis ${ip}`);
    // Ici : envoyer email, notification Slack, etc.
  }
  
  // Nettoyage automatique après 1 heure
  setTimeout(() => {
    csrfAttempts.delete(ip);
  }, 3600000);
};
```

## 🌐 Configuration CORS

### Configuration stricte
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,  // Important pour les cookies de session
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token']
};
```

### Environnements
- **Développement** : `http://localhost:5173`
- **Production** : Domaine spécifique uniquement
- **Test** : `http://localhost:3001`

## 🚦 Rate Limiting

### Configuration
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false
});
```

### Limites par endpoint
- **Général** : 100 req/15min par IP
- **Authentification** : Même limite (à affiner selon besoins)

## 🔐 Authentification et Sessions

### Sessions sécurisées
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET, // 32+ caractères
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS en prod
    httpOnly: true,    // Pas d'accès JavaScript
    maxAge: 24 * 60 * 60 * 1000, // 24h
    sameSite: 'strict' // Protection CSRF supplémentaire
  }
}));
```

### Hachage des mots de passe
```javascript
// Bcrypt avec salt de niveau 12
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### Règles de mot de passe
- **Minimum** : 8 caractères
- **Obligatoire** : 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
- **Validation** : Regex stricte avec Joi

## 🛡️ Headers de Sécurité (Helmet)

### Configuration
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Headers appliqués
- **CSP** : Content Security Policy
- **HSTS** : HTTP Strict Transport Security
- **X-Frame-Options** : Protection clickjacking
- **X-Content-Type-Options** : Protection MIME sniffing

## 🧹 Sanitisation des Données

### Protection XSS
```javascript
// Middleware de sanitisation automatique
const sanitizeInput = (req, res, next) => {
  // Nettoie req.body, req.query, req.params
  // Supprime scripts, balises HTML dangereuses
  // Encode caractères spéciaux
};
```

### Validation stricte (Joi)
```javascript
const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
});
```

## 🔄 Résilience et Timeout

### Timeout des requêtes
```javascript
// Middleware de timeout configurable
const requestTimeout = (timeout = 30000) => (req, res, next) => {
  res.setTimeout(timeout, () => {
    res.status(408).json({ error: 'Timeout de la requête' });
  });
  next();
};
```

### Gestion d'erreurs globale
```javascript
// Capture toutes les erreurs non gérées
app.use((err, req, res, next) => {
  // Log sécurisé (sans données sensibles)
  console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
  
  // Réponse différente selon l'environnement
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Erreur serveur' });
  } else {
    res.status(err.status || 500).json({ error: err.message, stack: err.stack });
  }
});
```

## 🚫 Protection contre les Attaques

### Injection SQL
- **Prisma** : Protection automatique avec requêtes préparées
- **Validation** : Tous les inputs validés avant base de données

### XSS (Cross-Site Scripting)
- **Sanitisation** : Nettoyage automatique des entrées
- **CSP** : Content Security Policy stricte
- **Encoding** : Échappement des caractères spéciaux

### CSRF (Cross-Site Request Forgery)
- **Tokens** : Token unique par session
- **SameSite** : Cookies avec restriction
- **Validation** : Vérification sur toutes les actions sensibles

### Brute Force
- **Rate Limiting** : Limitation par IP
- **Bcrypt** : Hachage lent (salt 12)
- **Sessions** : Expiration automatique

## 🔍 Audit et Monitoring

### Logs de sécurité
```javascript
// Logs des tentatives d'authentification
logger.info(`Tentative de connexion: ${username} - IP: ${req.ip}`);
logger.warn(`Échec authentification: ${username} - IP: ${req.ip}`);

// Logs des erreurs de sécurité
logger.error(`Erreur CSRF: ${req.path} - IP: ${req.ip}`);
```

### Health Check sécurisé
```javascript
// Endpoint /api/health expose uniquement des informations non sensibles
{
  "status": "healthy",
  "timestamp": "2025-10-21T...",
  "uptime": 3600,
  "memory": { "used": "50MB", "total": "100MB" },
  "database": "connected"
  // Pas de versions, pas de secrets, pas de détails internes
}
```

## ⚠️ Variables d'Environnement Sensibles

### Variables critiques
```env
# ❌ JAMAIS commiter ces valeurs réelles
SESSION_SECRET=change_this_to_a_very_strong_secret_32_chars_min
DATABASE_URL=mysql://user:password@localhost:3306/secure_api

# ✅ Utiliser des valeurs factices dans .env.example
SESSION_SECRET=your_session_secret_here_32_characters_minimum
DATABASE_URL=mysql://your_user:your_password@localhost:3306/secure_api
```

### Validation au démarrage
```javascript
// Vérification des variables critiques
const requiredEnvVars = ['SESSION_SECRET', 'DATABASE_URL'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Variable d'environnement manquante: ${varName}`);
    process.exit(1);
  }
});
```

## 🏗️ Déploiement Sécurisé

### Checklist Production
- [ ] **HTTPS** : Certificat SSL/TLS valide
- [ ] **Variables env** : Secrets sécurisés (pas dans le code)
- [ ] **Base de données** : Utilisateur avec droits minimaux
- [ ] **Firewall** : Ports nécessaires uniquement
- [ ] **Logs** : Monitoring des erreurs et tentatives
- [ ] **Backup** : Sauvegarde régulière chiffrée
- [ ] **Updates** : Dépendances maintenues à jour

### Configuration Production
```javascript
if (process.env.NODE_ENV === 'production') {
  // Sessions strictes
  app.use(session({
    cookie: {
      secure: true,      // HTTPS obligatoire
      sameSite: 'strict' // Protection CSRF renforcée
    }
  }));
  
  // CORS strict
  app.use(cors({
    origin: process.env.CORS_ORIGIN, // Domaine spécifique uniquement
    credentials: true
  }));
}
```

## 🧪 Tests de Sécurité

### Tests automatisés
```bash
# Tests de sécurité inclus dans la suite
npm run test:unit  # Inclut tests CSRF, validation, auth

# Script d'intégration sécurisé
./test-api.sh      # Teste protection CSRF, auth, validation
```

### Tests manuels
```bash
# Test protection CSRF
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test123!"}' \
  # → Doit retourner 403 Forbidden

# Test rate limiting
for i in {1..110}; do
  curl http://localhost:3000/api/health
done
# → Les dernières requêtes doivent être bloquées
```

## 🚨 Réponse aux Incidents

### En cas de faille détectée
1. **Isoler** : Couper l'accès si nécessaire
2. **Analyser** : Identifier l'étendue des dégâts
3. **Corriger** : Patcher la vulnérabilité
4. **Valider** : Tester la correction
5. **Communiquer** : Informer les utilisateurs si nécessaire

### Contacts sécurité
- **Rapporter une vulnérabilité** : Créer une issue GitHub privée
- **Urgence** : Email direct au mainteneur

## 📚 Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Prisma Security Guide](https://www.prisma.io/docs/guides/security)