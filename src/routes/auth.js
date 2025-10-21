import { Router } from 'express';
import Joi from 'joi';

import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler, sanitizeInput, requestTimeout } from '../middlewares/resilience.js';
import { UserService } from '../services/userService.js';

// Stockage des tentatives de connexion par IP (à migrer vers Redis en production)
const loginAttempts = new Map(); // clé: IP, valeur: { attempts, lastAttempt }

// Configuration des tentatives de connexion
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

const router = Router();

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&)',
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères'
    })
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

// Fonction pour vérifier et gérer les tentatives de connexion
const checkLoginAttempts = (ip) => {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return true;

  if (attempts.attempts >= MAX_LOGIN_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt < LOCKOUT_TIME) {
      return false;
    } else {
      // Réinitialiser après la période de blocage
      loginAttempts.delete(ip);
      return true;
    }
  }
  return true;
};

const recordFailedAttempt = (ip) => {
  const attempts = loginAttempts.get(ip) || { attempts: 0, lastAttempt: 0 };
  attempts.attempts += 1;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(ip, attempts);
};

const clearFailedAttempts = (ip) => {
  loginAttempts.delete(ip);
};

// Appliquer les middlewares de résilience à toutes les routes
router.use(requestTimeout(30000)); // 30 secondes timeout
router.use(sanitizeInput);

// Route: obtenir le token CSRF (utile pour les frontends)
router.get('/csrf-token', asyncHandler(async (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
}));

// Inscription
router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Créer l'utilisateur via le service
  const user = await UserService.createUser(username, password);

  // Connexion automatique après inscription
  req.session.userId = user.id;
  req.session.username = user.username;

  res.status(201).json({
    message: 'Utilisateur inscrit avec succès',
    user
  });
}));

// Connexion
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  // Vérifier les tentatives de connexion
  if (!checkLoginAttempts(clientIP)) {
    return res.status(429).json({
      error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    });
  }

  const { username, password } = req.body;

  // Rechercher l'utilisateur en base
  const user = await UserService.findByUsername(username);
  if (!user) {
    recordFailedAttempt(clientIP);
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  // Vérifier le mot de passe
  const isPasswordValid = await UserService.verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    recordFailedAttempt(clientIP);
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  // Connexion réussie - effacer les tentatives échouées
  clearFailedAttempts(clientIP);
  req.session.userId = user.id;
  req.session.username = user.username;

  res.json({
    message: 'Connecté avec succès',
    user: { id: user.id, username: user.username }
  });
}));

// Route protégée du profil
router.get('/profile', requireAuth, asyncHandler(async (req, res) => {
  const user = await UserService.findById(req.session.userId);

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  res.json({
    message: 'Profil protégé',
    user
  });
}));

// Déconnexion
router.post('/logout', requireAuth, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('sid');
    res.json({ message: 'Déconnecté avec succès' });
  });
});

export default router;
