#!/bin/bash
# test-api.sh - Script de test automatisé pour l'API sécurisée

API_URL="http://localhost:3000"
COOKIES_FILE="cookies.txt"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour récupérer le token CSRF
get_csrf_token() {
    local token=$(curl -s -b $COOKIES_FILE -c $COOKIES_FILE $API_URL/api/auth/csrf-token | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    echo "$token"
}

# Fonction pour afficher les messages colorés
log_info() {
    echo -e "${BLUE}📡 $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo -e "${BLUE}🚀 Test automatisé de l'API sécurisée${NC}"
echo "=================================="

# Nettoyer les anciens cookies
if [ -f "$COOKIES_FILE" ]; then
    rm $COOKIES_FILE
    log_info "Nettoyage des anciens cookies"
fi

# 1. Vérifier que l'API fonctionne
log_info "Test de connectivité..."
HEALTH_RESPONSE=$(curl -s $API_URL/api/health)
if [ $? -eq 0 ] && echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    log_success "API accessible et fonctionnelle"
else
    log_error "API non accessible - Vérifiez que le serveur fonctionne sur le port 3000"
    log_warning "Commande pour démarrer le serveur : npm run dev"
    exit 1
fi

# 2. Récupérer le token CSRF
log_info "Récupération du token CSRF..."
CSRF_TOKEN=$(get_csrf_token)
if [ -n "$CSRF_TOKEN" ] && [ ${#CSRF_TOKEN} -gt 10 ]; then
    log_success "Token CSRF récupéré : ${CSRF_TOKEN:0:15}..."
else
    log_error "Impossible de récupérer le token CSRF"
    log_warning "Réponse reçue : $(curl -s -c $COOKIES_FILE $API_URL/api/auth/csrf-token)"
    exit 1
fi

# 3. Test d'inscription
log_info "Test d'inscription..."
UNIQUE_USERNAME="testuser$(date +%s)"
REGISTER_RESPONSE=$(curl -s -b $COOKIES_FILE -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d "{\"username\":\"$UNIQUE_USERNAME\",\"password\":\"TestPassword123!\"}")

if echo "$REGISTER_RESPONSE" | grep -q "inscrit avec succès"; then
    log_success "Inscription réussie"
    USERNAME=$(echo "$REGISTER_RESPONSE" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
    echo "   👤 Utilisateur créé : $USERNAME"
else
    log_error "Échec de l'inscription"
    echo "   📄 Réponse : $REGISTER_RESPONSE"
    
    # Si l'utilisateur existe déjà, continuer avec une connexion
    if echo "$REGISTER_RESPONSE" | grep -q "déjà existant"; then
        log_warning "Utilisateur déjà existant, test de connexion..."
        
        # Récupérer un nouveau token pour la connexion
        CSRF_TOKEN=$(get_csrf_token)
        LOGIN_RESPONSE=$(curl -s -b $COOKIES_FILE -X POST $API_URL/api/auth/login \
          -H "Content-Type: application/json" \
          -H "X-CSRF-Token: $CSRF_TOKEN" \
          -d "{\"username\":\"$UNIQUE_USERNAME\",\"password\":\"TestPassword123!\"}")
        
        if echo "$LOGIN_RESPONSE" | grep -q "Connecté avec succès"; then
            log_success "Connexion réussie avec utilisateur existant"
        else
            log_error "Échec de la connexion"
            exit 1
        fi
    else
        exit 1
    fi
fi

# 4. Test du profil (utilisateur connecté)
log_info "Test d'accès au profil utilisateur..."
PROFILE_RESPONSE=$(curl -s -b $COOKIES_FILE $API_URL/api/auth/profile)
if echo "$PROFILE_RESPONSE" | grep -q "Profil protégé"; then
    log_success "Accès au profil autorisé"
    USER_INFO=$(echo "$PROFILE_RESPONSE" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
    echo "   👤 Profil de : $USER_INFO"
else
    log_error "Accès au profil refusé"
    echo "   📄 Réponse : $PROFILE_RESPONSE"
fi

# Test de validation (mot de passe faible)
log_info "Test de validation - mot de passe faible..."
CSRF_TOKEN=$(get_csrf_token)
WEAK_PASSWORD_RESPONSE=$(curl -s -b $COOKIES_FILE -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d "{\"username\":\"weakuser$(date +%s)\",\"password\":\"123\"}")

if echo "$WEAK_PASSWORD_RESPONSE" | grep -q "8 caractères"; then
    log_success "Validation des mots de passe fonctionne"
else
    log_error "La validation des mots de passe ne fonctionne pas correctement"
fi

# Test sans token CSRF (sécurité)
log_info "Test de sécurité - requête sans token CSRF..."
NO_CSRF_RESPONSE=$(curl -s -b $COOKIES_FILE -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"nocsrf$(date +%s)\",\"password\":\"TestPassword123!\"}")

if echo "$NO_CSRF_RESPONSE" | grep -q -i "forbidden\|csrf"; then
    log_success "Protection CSRF active"
else
    log_error "Protection CSRF non fonctionnelle"
    echo "   📄 Réponse : $NO_CSRF_RESPONSE"
fi

# 7. Déconnexion
log_info "Test de déconnexion..."
CSRF_TOKEN=$(get_csrf_token)
LOGOUT_RESPONSE=$(curl -s -b $COOKIES_FILE -X POST $API_URL/api/auth/logout \
  -H "X-CSRF-Token: $CSRF_TOKEN")

if echo "$LOGOUT_RESPONSE" | grep -q "Déconnecté avec succès"; then
    log_success "Déconnexion réussie"
else
    log_error "Échec de la déconnexion"
    echo "   📄 Réponse : $LOGOUT_RESPONSE"
fi

# 8. Test d'accès non autorisé
log_info "Test de sécurité - accès non autorisé après déconnexion..."
UNAUTH_RESPONSE=$(curl -s -b $COOKIES_FILE $API_URL/api/auth/profile)
if echo "$UNAUTH_RESPONSE" | grep -q "Non autorisé"; then
    log_success "Sécurité OK - Accès refusé aux utilisateurs non connectés"
else
    log_error "Problème de sécurité détecté"
    echo "   📄 Réponse : $UNAUTH_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 Tests terminés !${NC}"
echo -e "${BLUE}📋 Résumé des tests effectués :${NC}"
echo "   • Connectivité API"
echo "   • Récupération token CSRF" 
echo "   • Inscription utilisateur"
echo "   • Accès profil protégé"
echo "   • Validation mot de passe"
echo "   • Protection CSRF"
echo "   • Déconnexion"
echo "   • Sécurité accès non autorisé"
echo ""
echo -e "${YELLOW}💡 Nettoyage : ${NC}rm $COOKIES_FILE"

# Nettoyer automatiquement
rm -f $COOKIES_FILE