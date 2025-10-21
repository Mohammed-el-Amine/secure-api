# 🌐 Documentation API

## 🎯 Base URL
- **Développement** : `http://localhost:3000`
- **Production** : `https://your-domain.com`

## 🔐 Authentification

L'API utilise des **sessions avec protection CSRF** basées sur Express Session et csurf. Cette approche garantit une sécurité maximale contre les attaques CSRF tout en maintenant une expérience utilisateur fluide.

### Architecture de sécurité
- **Sessions HTTP-Only** : Cookies sécurisés non accessibles via JavaScript
- **Protection CSRF** : Tokens uniques pour chaque session
- **Rate Limiting** : Protection contre les attaques par force brute
- **Validation stricte** : Sanitisation et validation de toutes les entrées
- **Headers sécurisés** : CORS configuré, CSP, et autres headers de sécurité

### Workflow d'authentification complet
1. **Initialisation** : Récupérer un token CSRF depuis `/api/auth/csrf-token`
2. **Inscription/Connexion** : Utiliser le token pour s'authentifier
3. **Session active** : Accéder aux routes protégées avec les cookies de session
4. **Renouvellement** : Récupérer un nouveau token CSRF si nécessaire
5. **Déconnexion** : Terminer proprement la session

### Bonnes pratiques d'intégration
- Toujours inclure `credentials: 'include'` dans les requêtes fetch
- Gérer les erreurs 403 (CSRF) en récupérant un nouveau token
- Implémenter un système de retry automatique pour les tokens expirés
- Utiliser HTTPS en production pour protéger les cookies de session

---

## 📋 Endpoints

### 🔑 Authentification

#### `GET /api/auth/csrf-token`
Récupère un token CSRF pour les requêtes sécurisées.

**Réponse :**
```json
{
  "csrfToken": "ouOtt5yc-8fV-Go3F8Nb8EInJxm_Xqxc"
}
```

**Exemple cURL :**
```bash
curl -c cookies.txt http://localhost:3000/api/auth/csrf-token
```

**Exemple JavaScript avec gestion d'erreurs :**
```javascript
async function getCsrfToken() {
  try {
    const response = await fetch('/api/auth/csrf-token', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const { csrfToken } = await response.json();
    
    // Stocker le token pour les requêtes suivantes
    sessionStorage.setItem('csrfToken', csrfToken);
    
    return csrfToken;
  } catch (error) {
    console.error('Erreur lors de la récupération du token CSRF:', error);
    throw error;
  }
}

// Utilisation avec retry automatique
async function getCsrfTokenWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await getCsrfToken();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.warn(`Tentative ${attempt} échouée, retry dans 1s...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

**Exemple avec Axios :**
```javascript
import axios from 'axios';

// Configuration globale d'Axios
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:3000';

// Intercepteur pour ajouter automatiquement le token CSRF
axios.interceptors.request.use(async (config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
    let csrfToken = sessionStorage.getItem('csrfToken');
    
    if (!csrfToken) {
      const response = await axios.get('/api/auth/csrf-token');
      csrfToken = response.data.csrfToken;
      sessionStorage.setItem('csrfToken', csrfToken);
    }
    
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  
  return config;
});

// Intercepteur pour gérer les erreurs CSRF
axios.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
      // Token CSRF invalide, récupérer un nouveau token et retry
      sessionStorage.removeItem('csrfToken');
      const response = await axios.get('/api/auth/csrf-token');
      const newToken = response.data.csrfToken;
      sessionStorage.setItem('csrfToken', newToken);
      
      // Retry la requête originale avec le nouveau token
      error.config.headers['X-CSRF-Token'] = newToken;
      return axios.request(error.config);
    }
    
    return Promise.reject(error);
  }
);
```

---

#### `POST /api/auth/register`
Inscription d'un nouvel utilisateur.

**Headers requis :**
- `Content-Type: application/json`
- `X-CSRF-Token: {token}`

**Body :**
```json
{
  "username": "string (3-30 caractères alphanumériques)",
  "password": "string (8+ caractères, 1 maj, 1 min, 1 chiffre, 1 spécial)"
}
```

**Réponse succès (201) :**
```json
{
  "message": "Utilisateur inscrit avec succès",
  "user": {
    "id": 1,
    "username": "testuser",
    "createdAt": "2025-10-21T14:30:00.000Z"
  }
}
```

**Réponse erreur (400) :**
```json
{
  "error": "Erreur de validation",
  "details": [
    "Le mot de passe doit contenir au moins 8 caractères"
  ]
}
```

**Exemple cURL :**
```bash
# Récupérer d'abord le token CSRF
CSRF_TOKEN=$(curl -s -c cookies.txt http://localhost:3000/api/auth/csrf-token | jq -r '.csrfToken')

# S'inscrire
curl -b cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"username":"testuser","password":"Password123!"}'
```

**Exemple JavaScript avec validation côté client :**
```javascript
async function registerUser(username, password) {
  // Validation côté client (optionnelle mais recommandée)
  const usernameRegex = /^[a-zA-Z0-9]{3,30}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  if (!usernameRegex.test(username)) {
    throw new Error('Le nom d\'utilisateur doit contenir 3-30 caractères alphanumériques');
  }
  
  if (!passwordRegex.test(password)) {
    throw new Error('Le mot de passe ne respecte pas les critères de sécurité');
  }
  
  try {
    const csrfToken = await getCsrfToken();
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    
    console.log('Inscription réussie:', result.user);
    return result;
    
  } catch (error) {
    console.error('Erreur d\'inscription:', error.message);
    throw error;
  }
}

// Utilisation avec gestion des erreurs spécifiques
try {
  await registerUser('testuser', 'Password123!');
} catch (error) {
  if (error.message.includes('déjà')) {
    console.log('Cet utilisateur existe déjà');
  } else if (error.message.includes('validation')) {
    console.log('Données invalides:', error.message);
  } else {
    console.log('Erreur système:', error.message);
  }
}
```

**Exemple avec React Hook personnalisé :**
```javascript
import { useState, useCallback } from 'react';

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const register = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await registerUser(username, password);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { user, loading, error, register };
}

// Utilisation dans un composant React
function RegisterForm() {
  const { user, loading, error, register } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData.username, formData.password);
      // Redirection ou message de succès
    } catch (err) {
      // Erreur déjà gérée dans le hook
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
        disabled={loading}
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Inscription...' : 'S\'inscrire'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

---

#### `POST /api/auth/login`
Connexion d'un utilisateur existant.

**Headers requis :**
- `Content-Type: application/json`
- `X-CSRF-Token: {token}`

**Body :**
```json
{
  "username": "string",
  "password": "string"
}
```

**Réponse succès (200) :**
```json
{
  "message": "Connecté avec succès",
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

**Réponse erreur (401) :**
```json
{
  "error": "Nom d'utilisateur ou mot de passe incorrect"
}
```

**Exemple cURL :**
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"username":"testuser","password":"Password123!"}'
```

---

#### `GET /api/auth/profile`
Récupère le profil de l'utilisateur connecté. **Route protégée**.

**Headers requis :**
- Cookies de session valides

**Réponse succès (200) :**
```json
{
  "message": "Profil protégé",
  "user": {
    "id": 1,
    "username": "testuser",
    "createdAt": "2025-10-21T14:30:00.000Z",
    "updatedAt": "2025-10-21T14:30:00.000Z"
  }
}
```

**Réponse erreur (401) :**
```json
{
  "error": "Non autorisé"
}
```

**Exemple cURL :**
```bash
curl -b cookies.txt http://localhost:3000/api/auth/profile
```

---

#### `POST /api/auth/logout`
Déconnexion de l'utilisateur.

**Headers requis :**
- `X-CSRF-Token: {token}`

**Réponse succès (200) :**
```json
{
  "message": "Déconnecté avec succès"
}
```

**Exemple cURL :**
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout \
  -H "X-CSRF-Token: $CSRF_TOKEN"
```

---

### 🏥 Système

#### `GET /api/`
Message de bienvenue et informations générales.

**Réponse (200) :**
```json
{
  "message": "API Express.js sécurisée",
  "version": "1.0.0",
  "docs": "Consultez README.md pour la documentation complète",
  "endpoints": {
    "health": "/api/health",
    "auth": "/api/auth/*"
  }
}
```

---

#### `GET /api/health`
Vérification de l'état de santé de l'API et de la base de données.

**Réponse succès (200) :**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T14:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": "52.3 MB",
    "total": "1.0 GB"
  },
  "database": "connected"
}
```

**Réponse erreur (503) :**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-21T14:30:00.000Z",
  "error": "Database connection failed"
}
```

---

## 🔧 Codes de Statut HTTP

### Codes de succès
| Code | Signification | Utilisation | Exemple de réponse |
|------|---------------|-------------|-------------------|
| 200 | OK | Requête réussie | Login, profil, logout |
| 201 | Created | Ressource créée | Inscription réussie |

### Codes d'erreur client
| Code | Signification | Utilisation | Action recommandée |
|------|---------------|-------------|-------------------|
| 400 | Bad Request | Données invalides | Vérifier le format des données |
| 401 | Unauthorized | Non authentifié | Se connecter d'abord |
| 403 | Forbidden | Token CSRF manquant/invalide | Récupérer un nouveau token CSRF |
| 404 | Not Found | Endpoint inexistant | Vérifier l'URL |
| 409 | Conflict | Ressource déjà existante | Choisir un autre nom d'utilisateur |
| 429 | Too Many Requests | Rate limit atteint | Attendre avant de retenter |

### Codes d'erreur serveur
| Code | Signification | Utilisation | Action recommandée |
|------|---------------|-------------|-------------------|
| 500 | Internal Server Error | Erreur serveur | Contacter l'administrateur |
| 503 | Service Unavailable | Base de données indisponible | Retenter plus tard |

### Gestion des codes d'erreur en JavaScript
```javascript
async function handleApiResponse(response) {
  const data = await response.json();
  
  switch (response.status) {
    case 200:
    case 201:
      return data;
      
    case 400:
      throw new Error(`Données invalides: ${data.error}`);
      
    case 401:
      // Rediriger vers la page de connexion
      window.location.href = '/login';
      throw new Error('Vous devez vous connecter');
      
    case 403:
      // Récupérer un nouveau token CSRF et retry
      if (data.error?.includes('CSRF')) {
        const newToken = await getCsrfToken();
        throw new Error('CSRF_RETRY_NEEDED');
      }
      throw new Error('Accès interdit');
      
    case 404:
      throw new Error('Endpoint non trouvé');
      
    case 409:
      throw new Error(`Conflit: ${data.error}`);
      
    case 429:
      const retryAfter = response.headers.get('Retry-After') || 60;
      throw new Error(`Trop de requêtes. Retry dans ${retryAfter}s`);
      
    case 500:
      throw new Error('Erreur serveur interne');
      
    case 503:
      throw new Error('Service temporairement indisponible');
      
    default:
      throw new Error(`Erreur HTTP ${response.status}: ${data.error || response.statusText}`);
  }
}

// Wrapper pour les requêtes avec retry automatique
async function apiRequestWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...options
      });
      
      return await handleApiResponse(response);
      
    } catch (error) {
      if (error.message === 'CSRF_RETRY_NEEDED' && attempt < maxRetries) {
        // Récupérer un nouveau token et retry
        const newToken = await getCsrfToken();
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': newToken
        };
        continue;
      }
      
      if (attempt === maxRetries) throw error;
      
      // Backoff exponentiel pour les erreurs serveur
      if (error.message.includes('500') || error.message.includes('503')) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
}
```

---

## 🛡️ Sécurité

### Headers requis pour les requêtes sensibles
```
Content-Type: application/json
X-CSRF-Token: {token_from_csrf_endpoint}
Cookie: {session_cookies}
```

### Rate Limiting
- **Limite** : 100 requêtes par IP toutes les 15 minutes
- **Header de réponse** : `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### CORS
- **Origine autorisée** : Configurée via `CORS_ORIGIN`
- **Credentials** : `true` (cookies inclus)

---

## 🧪 Tests d'Intégration

### Suite de tests automatisée complète

**Script principal (`test-api-complete.sh`) :**
```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
COOKIES_FILE="cookies_$(date +%s).txt"
TEST_USER="testuser_$(date +%s)"
TEST_PASSWORD="TestPassword123!"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
  echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1"
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Fonction de nettoyage
cleanup() {
  log "Nettoyage des cookies..."
  rm -f "$COOKIES_FILE"
}

# Trap pour nettoyage automatique
trap cleanup EXIT

# Variables de suivi des tests
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction de test avec validation
run_test() {
  local test_name="$1"
  local expected_status="$2"
  shift 2
  local curl_cmd="$@"
  
  log "Test: $test_name"
  
  local response=$(eval "$curl_cmd" 2>/dev/null)
  local status_code=$(curl -s -o /dev/null -w "%{http_code}" $curl_cmd 2>/dev/null)
  
  if [[ "$status_code" == "$expected_status" ]]; then
    success "$test_name - Status: $status_code"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "Response: $response" | jq . 2>/dev/null || echo "Response: $response"
  else
    error "$test_name - Expected: $expected_status, Got: $status_code"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "Response: $response"
  fi
  
  echo "----------------------------------------"
}

# 1. Test de connectivité générale
log "=== PHASE 1: Tests de connectivité ==="

run_test "API Root" "200" \
  "curl -s '$API_URL/api/'"

run_test "Health Check" "200" \
  "curl -s '$API_URL/api/health'"

# 2. Tests d'authentification
log "=== PHASE 2: Tests d'authentification ==="

# Récupération du token CSRF
log "Récupération du token CSRF..."
CSRF_TOKEN=$(curl -s -c "$COOKIES_FILE" "$API_URL/api/auth/csrf-token" | jq -r '.csrfToken')

if [[ "$CSRF_TOKEN" && "$CSRF_TOKEN" != "null" ]]; then
  success "Token CSRF récupéré: ${CSRF_TOKEN:0:8}..."
else
  error "Impossible de récupérer le token CSRF"
  exit 1
fi

# Test d'inscription
run_test "Inscription utilisateur" "201" \
  "curl -s -b '$COOKIES_FILE' -X POST '$API_URL/api/auth/register' \
   -H 'Content-Type: application/json' \
   -H 'X-CSRF-Token: $CSRF_TOKEN' \
   -d '{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASSWORD\"}'"

# Test d'accès au profil (après inscription)
run_test "Accès profil (après inscription)" "200" \
  "curl -s -b '$COOKIES_FILE' '$API_URL/api/auth/profile'"

# Test de déconnexion
log "Récupération nouveau token CSRF pour déconnexion..."
CSRF_TOKEN=$(curl -s -b "$COOKIES_FILE" -c "$COOKIES_FILE" "$API_URL/api/auth/csrf-token" | jq -r '.csrfToken')

run_test "Déconnexion" "200" \
  "curl -s -b '$COOKIES_FILE' -X POST '$API_URL/api/auth/logout' \
   -H 'X-CSRF-Token: $CSRF_TOKEN'"

# 3. Tests de sécurité
log "=== PHASE 3: Tests de sécurité ==="

# Test d'accès protégé après déconnexion (doit échouer)
run_test "Accès profil après déconnexion (doit échouer)" "401" \
  "curl -s -b '$COOKIES_FILE' '$API_URL/api/auth/profile'"

# Test sans token CSRF (doit échouer)
run_test "Inscription sans token CSRF (doit échouer)" "403" \
  "curl -s -X POST '$API_URL/api/auth/register' \
   -H 'Content-Type: application/json' \
   -d '{\"username\":\"testfail\",\"password\":\"TestPassword123!\"}'"

# Test avec données invalides
run_test "Inscription mot de passe faible (doit échouer)" "400" \
  "curl -s -c '$COOKIES_FILE' -X POST '$API_URL/api/auth/register' \
   -H 'Content-Type: application/json' \
   -H 'X-CSRF-Token: $(curl -s '$API_URL/api/auth/csrf-token' | jq -r '.csrfToken')' \
   -d '{\"username\":\"testuser2\",\"password\":\"weak\"}'"

# 4. Tests de performance et limits
log "=== PHASE 4: Tests de performance ==="

# Test de multiples requêtes simultanées
log "Test de charge (10 requêtes simultanées)..."
for i in {1..10}; do
  curl -s "$API_URL/api/health" > /dev/null &
done
wait

success "Test de charge terminé"

# 5. Résumé des résultats
log "=== RÉSUMÉ DES TESTS ==="
echo "Tests réussis: $TESTS_PASSED"
echo "Tests échoués: $TESTS_FAILED"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"

if [[ $TESTS_FAILED -eq 0 ]]; then
  success "Tous les tests sont passés avec succès!"
  exit 0
else
  error "$TESTS_FAILED test(s) ont échoué"
  exit 1
fi
```

### Tests de charge et performance
```bash
#!/bin/bash
# test-load.sh - Tests de charge avancés

API_URL="http://localhost:3000"
CONCURRENT_USERS=50
REQUESTS_PER_USER=20

log() {
  echo "[$(date +'%H:%M:%S')] $1"
}

# Test de charge sur /api/health
log "Test de charge: $CONCURRENT_USERS utilisateurs, $REQUESTS_PER_USER requêtes chacun"

# Mesure du temps total
start_time=$(date +%s)

for ((i=1; i<=CONCURRENT_USERS; i++)); do
  (
    for ((j=1; j<=REQUESTS_PER_USER; j++)); do
      curl -s "$API_URL/api/health" > /dev/null
    done
  ) &
done

# Attendre que tous les processus se terminent
wait

end_time=$(date +%s)
total_time=$((end_time - start_time))
total_requests=$((CONCURRENT_USERS * REQUESTS_PER_USER))

log "Résultats:"
log "- Total requêtes: $total_requests"
log "- Temps total: ${total_time}s"
log "- Requêtes/seconde: $((total_requests / total_time))"

# Test de stress sur l'authentification
log "Test de stress - authentification simultanée"

for ((i=1; i<=10; i++)); do
  (
    COOKIES_FILE="stress_cookies_$i.txt"
    CSRF_TOKEN=$(curl -s -c "$COOKIES_FILE" "$API_URL/api/auth/csrf-token" | jq -r '.csrfToken')
    
    curl -s -b "$COOKIES_FILE" -X POST "$API_URL/api/auth/register" \
      -H "Content-Type: application/json" \
      -H "X-CSRF-Token: $CSRF_TOKEN" \
      -d "{\"username\":\"stressuser$i\",\"password\":\"StressTest123!\"}" > /dev/null
    
    rm -f "$COOKIES_FILE"
  ) &
done

wait
log "Test de stress terminé"
```

### Monitoring en temps réel
```bash
#!/bin/bash
# monitor-api.sh - Surveillance continue de l'API

API_URL="http://localhost:3000"
INTERVAL=5 # secondes

monitor_health() {
  while true; do
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    response=$(curl -s -w "%{time_total},%{http_code}" "$API_URL/api/health")
    
    if [[ $? -eq 0 ]]; then
      time_total=$(echo "$response" | tail -c 10 | cut -d',' -f1)
      status_code=$(echo "$response" | tail -c 4)
      
      if [[ "$status_code" == "200" ]]; then
        echo "[$timestamp] ✓ API OK - Temps: ${time_total}s"
      else
        echo "[$timestamp] ⚠ API Status: $status_code - Temps: ${time_total}s"
      fi
    else
      echo "[$timestamp] ✗ API inaccessible"
    fi
    
    sleep $INTERVAL
  done
}

log "Démarrage du monitoring de l'API..."
log "URL: $API_URL"
log "Intervalle: ${INTERVAL}s"
log "Ctrl+C pour arrêter"

monitor_health
```

---

## 📱 Client JavaScript Complet

### Classe API Helper avancée avec gestion d'erreurs robuste
```javascript
class SecureAPIClient {
  constructor(baseURL = 'http://localhost:3000', options = {}) {
    this.baseURL = baseURL;
    this.csrfToken = null;
    this.options = {
      timeout: 10000,
      maxRetries: 3,
      retryDelay: 1000,
      debug: false,
      ...options
    };
    
    // Cache pour éviter les requêtes répétées
    this.tokenCache = new Map();
    this.lastTokenFetch = 0;
    this.tokenCacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  // Logging conditionnel
  log(message, level = 'info') {
    if (this.options.debug) {
      console[level](`[SecureAPIClient] ${message}`);
    }
  }

  // Gestion du timeout pour les requêtes
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout après ${this.options.timeout}ms`);
      }
      throw error;
    }
  }

  // Récupération du token CSRF avec cache intelligent
  async getCsrfToken(forceRefresh = false) {
    const now = Date.now();
    
    // Utiliser le cache si disponible et pas expiré
    if (!forceRefresh && this.csrfToken && (now - this.lastTokenFetch) < this.tokenCacheDuration) {
      this.log('Utilisation du token CSRF en cache');
      return this.csrfToken;
    }
    
    this.log('Récupération d\'un nouveau token CSRF');
    
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/api/auth/csrf-token`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.csrfToken = data.csrfToken;
      this.lastTokenFetch = now;
      
      this.log(`Token CSRF récupéré: ${this.csrfToken.substring(0, 8)}...`);
      return this.csrfToken;
      
    } catch (error) {
      this.log(`Erreur lors de la récupération du token CSRF: ${error.message}`, 'error');
      throw error;
    }
  }

  // Méthode générique pour les requêtes avec retry automatique
  async makeRequest(endpoint, options = {}, requiresCsrf = false) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        this.log(`Tentative ${attempt}/${this.options.maxRetries} pour ${endpoint}`);
        
        const requestOptions = {
          credentials: 'include',
          ...options
        };
        
        // Ajouter le token CSRF si nécessaire
        if (requiresCsrf) {
          const token = await this.getCsrfToken();
          requestOptions.headers = {
            ...requestOptions.headers,
            'X-CSRF-Token': token
          };
        }
        
        const response = await this.fetchWithTimeout(`${this.baseURL}${endpoint}`, requestOptions);
        const data = await response.json();
        
        if (!response.ok) {
          // Gestion spéciale des erreurs CSRF
          if (response.status === 403 && data.error?.includes('CSRF')) {
            this.log('Token CSRF invalide, récupération d\'un nouveau token');
            await this.getCsrfToken(true); // Force refresh
            
            if (attempt < this.options.maxRetries) {
              continue; // Retry avec le nouveau token
            }
          }
          
          throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        this.log(`Requête réussie pour ${endpoint}`, 'success');
        return { data, response };
        
      } catch (error) {
        lastError = error;
        this.log(`Tentative ${attempt} échouée: ${error.message}`, 'warn');
        
        // Ne pas retenter pour certaines erreurs
        if (error.message.includes('400') || error.message.includes('401') || error.message.includes('404')) {
          break;
        }
        
        // Attendre avant de retenter (sauf pour la dernière tentative)
        if (attempt < this.options.maxRetries) {
          const delay = this.options.retryDelay * Math.pow(2, attempt - 1); // Backoff exponentiel
          this.log(`Attente de ${delay}ms avant retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // Méthodes d'authentification avec gestion d'erreurs avancée
  async register(username, password) {
    this.validateCredentials(username, password);
    
    const { data } = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }, true);
    
    return data;
  }

  async login(username, password) {
    const { data } = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }, true);
    
    return data;
  }

  async getProfile() {
    const { data } = await this.makeRequest('/api/auth/profile');
    return data;
  }

  async logout() {
    const { data } = await this.makeRequest('/api/auth/logout', {
      method: 'POST'
    }, true);
    
    // Nettoyer le cache après déconnexion
    this.csrfToken = null;
    this.lastTokenFetch = 0;
    
    return data;
  }

  async healthCheck() {
    const { data } = await this.makeRequest('/api/health');
    return data;
  }

  // Validation côté client
  validateCredentials(username, password) {
    const usernameRegex = /^[a-zA-Z0-9]{3,30}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!usernameRegex.test(username)) {
      throw new Error('Le nom d\'utilisateur doit contenir 3-30 caractères alphanumériques');
    }
    
    if (!passwordRegex.test(password)) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères avec 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial');
    }
  }

  // Méthodes utilitaires
  async isAuthenticated() {
    try {
      await this.getProfile();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Nettoyage des ressources
  cleanup() {
    this.csrfToken = null;
    this.lastTokenFetch = 0;
    this.tokenCache.clear();
  }
}

// Factory pattern pour différentes configurations
class APIClientFactory {
  static createDevelopmentClient() {
    return new SecureAPIClient('http://localhost:3000', {
      debug: true,
      timeout: 5000,
      maxRetries: 2
    });
  }
  
  static createProductionClient(baseURL) {
    return new SecureAPIClient(baseURL, {
      debug: false,
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 2000
    });
  }
  
  static createTestClient() {
    return new SecureAPIClient('http://localhost:3001', {
      debug: true,
      timeout: 1000,
      maxRetries: 1
    });
  }
}

// Hook React avec context
import React, { createContext, useContext, useState, useEffect } from 'react';

const APIContext = createContext();

export function APIProvider({ children, baseURL = 'http://localhost:3000' }) {
  const [api] = useState(() => new SecureAPIClient(baseURL, { debug: true }));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier l'authentification au montage
  useEffect(() => {
    api.isAuthenticated()
      .then(authenticated => {
        if (authenticated) {
          return api.getProfile();
        }
        return null;
      })
      .then(profile => {
        setUser(profile?.user || null);
      })
      .catch(error => {
        console.error('Erreur lors de la vérification d\'authentification:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [api]);

  const value = {
    api,
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <APIContext.Provider value={value}>
      {children}
    </APIContext.Provider>
  );
}

export function useAPI() {
  const context = useContext(APIContext);
  if (!context) {
    throw new Error('useAPI doit être utilisé dans un APIProvider');
  }
  return context;
}

// Hook personnalisé pour l'authentification
export function useAuth() {
  const { api, user, setUser } = useAPI();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  const register = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.register(username, password);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.login(username, password);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await api.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    clearError,
    register,
    login,
    logout,
    isAuthenticated: !!user
  };
}

// Exemple d'utilisation complète avec gestion d'erreurs
async function exampleUsage() {
  const api = APIClientFactory.createDevelopmentClient();
  
  try {
    // 1. Vérifier l'état de l'API
    console.log('🔍 Vérification de l\'API...');
    const health = await api.healthCheck();
    console.log('✅ API Status:', health.status);

    // 2. S'inscrire
    console.log('📝 Inscription...');
    const registerResult = await api.register('testuser', 'Password123!');
    console.log('✅ Inscription réussie:', registerResult.user);

    // 3. Vérifier l'authentification
    console.log('🔐 Vérification de l\'authentification...');
    const isAuth = await api.isAuthenticated();
    console.log('✅ Authentifié:', isAuth);

    // 4. Accéder au profil
    console.log('👤 Récupération du profil...');
    const profile = await api.getProfile();
    console.log('✅ Profil:', profile.user);

    // 5. Se déconnecter
    console.log('🚪 Déconnexion...');
    const logoutResult = await api.logout();
    console.log('✅ Déconnexion réussie:', logoutResult.message);

    // 6. Vérifier que l'accès est bien coupé
    console.log('🔒 Vérification de la déconnexion...');
    const isStillAuth = await api.isAuthenticated();
    console.log('✅ Toujours authentifié:', isStillAuth);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    api.cleanup();
  }
}

// Export pour utilisation
export { SecureAPIClient, APIClientFactory, exampleUsage };
```

---

## 🚨 Gestion d'Erreurs

### Format d'erreur standard
```json
{
  "error": "Message d'erreur lisible",
  "details": ["Détail 1", "Détail 2"], // Optionnel pour validation
  "code": "ERROR_CODE" // Optionnel pour codes spécifiques
}
```

### Erreurs spécifiques
- **CSRF_INVALID** : Token CSRF manquant ou invalide
- **VALIDATION_ERROR** : Données d'entrée invalides
- **USER_EXISTS** : Nom d'utilisateur déjà pris
- **INVALID_CREDENTIALS** : Mauvais identifiants
- **UNAUTHORIZED** : Session expirée ou manquante

---

## 📈 Monitoring et Logs

### Headers de réponse utiles
```
X-Response-Time: 150ms
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

### Logs côté serveur
- **Info** : Connexions réussies, créations d'utilisateurs
- **Warning** : Tentatives de connexion échouées, tokens CSRF invalides
- **Error** : Erreurs de base de données, erreurs serveur

---

## � Exemples d'intégration avancés

### Integration avec Vue.js 3 + Composition API
```javascript
// composables/useSecureAPI.js
import { ref, computed } from 'vue';
import { SecureAPIClient } from '@/utils/api-client';

export function useSecureAPI() {
  const api = new SecureAPIClient();
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!user.value);

  const login = async (credentials) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await api.login(credentials.username, credentials.password);
      user.value = result.user;
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated,
    login,
    logout: async () => {
      await api.logout();
      user.value = null;
    }
  };
}
```

### Integration avec Angular Service
```typescript
// services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

interface User {
  id: number;
  username: string;
  createdAt: string;
}

interface ApiResponse<T> {
  message?: string;
  user?: User;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SecureAPIService {
  private baseUrl = 'http://localhost:3000/api';
  private csrfToken: string | null = null;
  private userSubject = new BehaviorSubject<User | null>(null);
  
  public user$ = this.userSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  private async getCsrfToken(): Promise<string> {
    if (!this.csrfToken) {
      const response = await this.http.get<{csrfToken: string}>(`${this.baseUrl}/auth/csrf-token`, {
        withCredentials: true
      }).toPromise();
      
      this.csrfToken = response!.csrfToken;
    }
    
    return this.csrfToken;
  }

  private getHeaders(includeCsrf = false): Promise<HttpHeaders> {
    return new Promise(async (resolve) => {
      let headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      
      if (includeCsrf) {
        const token = await this.getCsrfToken();
        headers = headers.append('X-CSRF-Token', token);
      }
      
      resolve(headers);
    });
  }

  async register(username: string, password: string): Promise<ApiResponse<User>> {
    const headers = await this.getHeaders(true);
    
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/auth/register`, 
      { username, password }, 
      { headers, withCredentials: true }
    ).pipe(
      map(response => {
        if (response.user) {
          this.userSubject.next(response.user);
        }
        return response;
      }),
      catchError(this.handleError)
    ).toPromise()!;
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.error || 'Données invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé';
          this.userSubject.next(null);
          break;
        case 403:
          if (error.error?.error?.includes('CSRF')) {
            this.csrfToken = null; // Force token refresh
            errorMessage = 'Token de sécurité invalide';
          }
          break;
        case 409:
          errorMessage = error.error?.error || 'Ressource déjà existante';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.error?.error || error.message}`;
      }
    }
    
    return throwError(errorMessage);
  };

  private async checkAuthStatus(): Promise<void> {
    try {
      const response = await this.http.get<ApiResponse<User>>(`${this.baseUrl}/auth/profile`, {
        withCredentials: true
      }).toPromise();
      
      if (response?.user) {
        this.userSubject.next(response.user);
      }
    } catch (error) {
      // User not authenticated
      this.userSubject.next(null);
    }
  }
}
```

### WebSocket integration pour notifications temps réel
```javascript
// utils/websocket-client.js
class SecureWebSocketClient {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  async connect() {
    try {
      // S'assurer que l'utilisateur est authentifié
      if (!await this.apiClient.isAuthenticated()) {
        throw new Error('Utilisateur non authentifié');
      }

      const wsUrl = this.apiClient.baseURL.replace('http', 'ws') + '/ws';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connecté');
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.emit(data.type, data.payload);
      };

      this.ws.onclose = () => {
        console.log('WebSocket fermé');
        this.emit('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Erreur de connexion WebSocket:', error);
      throw error;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Tentative de reconnexion ${this.reconnectAttempts}...`);
        this.connect();
      }, delay);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur dans le listener ${event}:`, error);
        }
      });
    }
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket non connecté, impossible d\'envoyer:', { type, payload });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Utilisation
const api = new SecureAPIClient();
const wsClient = new SecureWebSocketClient(api);

// Écouter les notifications
wsClient.on('notification', (notification) => {
  console.log('Nouvelle notification:', notification);
});

// Se connecter après authentification
await api.login('username', 'password');
await wsClient.connect();
```

---

## 🔗 Ressources et Documentation

### Documentation technique
- **🏗️ Architecture** : [src/README.md](src/README.md) - Guide complet de l'architecture du code source
- **🧪 Tests** : [tests/README.md](tests/README.md) - Documentation des tests et stratégies de test
- **🗄️ Base de données** : [prisma/README.md](prisma/README.md) - Guide Prisma et gestion de la base de données
- **🛡️ Sécurité** : [SECURITY.md](SECURITY.md) - Guide de sécurité complet et bonnes pratiques

### Liens de référence
- **📚 Express.js** : [Documentation officielle](https://expressjs.com/)
- **🔒 CSRF Protection** : [Documentation csurf](https://github.com/expressjs/csurf)
- **🗃️ Prisma ORM** : [Documentation Prisma](https://www.prisma.io/docs/)
- **✅ Jest Testing** : [Documentation Jest](https://jestjs.io/docs/getting-started)
- **🔧 API Testing** : [Postman Collection](./postman-collection.json) (si disponible)

### Outils de développement recommandés
- **🌐 Client REST** : [Insomnia](https://insomnia.rest/) ou [Postman](https://www.postman.com/)
- **🖥️ Client de base de données** : [DBeaver](https://dbeaver.io/) ou [MySQL Workbench](https://www.mysql.com/products/workbench/)
- **📊 Monitoring** : [PM2](https://pm2.keymetrics.io/) pour la production
- **🔍 Debug** : [VS Code REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

### Standards et bonnes pratiques
- **🌐 API Design** : [REST API Guidelines](https://github.com/microsoft/api-guidelines)
- **🔐 Security Headers** : [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
- **✨ Code Quality** : [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)
- **📝 Documentation** : [JSDoc](https://jsdoc.app/) pour la documentation du code

---

*Cette documentation API est maintenue et mise à jour régulièrement. Pour signaler des erreurs ou suggérer des améliorations, créez une issue dans le repository.*