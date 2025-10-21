import { Router } from 'express';
import Joi from 'joi';
import bcrypt from 'bcrypt';

import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';

// Base de données utilisateur simple en mémoire (pour demo uniquement)
const users = new Map(); // clé: username, valeur: { id, username, passwordHash }
// Stockage des tentatives de connexion par IP
const loginAttempts = new Map(); // clé: IP, valeur: { attempts, lastAttempt }
let nextId = 1;

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

// Route: obtenir le token CSRF (utile pour les frontends)
router.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Inscription
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (users.has(username)) {
      return res.status(409).json({ error: 'Utilisateur déjà existant' });
    }
    const hash = await bcrypt.hash(password, 12);
    const user = { id: nextId++, username, passwordHash: hash };
    users.set(username, user);
    // Connexion automatique après inscription
    req.session.userId = user.id;
    req.session.username = user.username;
    res.status(201).json({ message: 'Utilisateur inscrit avec succès', user: { id: user.id, username: user.username } });
  } catch (err) {
    next(err);
  }
});

// Connexion
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Vérifier les tentatives de connexion
    if (!checkLoginAttempts(clientIP)) {
      return res.status(429).json({ 
        error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' 
      });
    }

    const { username, password } = req.body;
    const user = users.get(username);
    if (!user) {
      recordFailedAttempt(clientIP);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      recordFailedAttempt(clientIP);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    // Connexion réussie - effacer les tentatives échouées
    clearFailedAttempts(clientIP);
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ message: 'Connecté avec succès', user: { id: user.id, username: user.username } });
  } catch (err) {
    next(err);
  }
});

// Route protégée du profil
router.get('/profile', requireAuth, (req, res) => {
  const username = req.session.username;
  res.json({ message: 'Profil protégé', user: { username } });
});

// Déconnexion
router.post('/logout', requireAuth, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('sid');
    res.json({ message: 'Déconnecté avec succès' });
  });
});

export default router;
