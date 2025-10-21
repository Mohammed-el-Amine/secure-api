import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import corsOptions from './config/corsOptions.js';
import { validateEnv } from './config/validateEnv.js';
import { errorHandler } from './middlewares/errorHandler.js';
import router from './routes/index.js';

dotenv.config();

// Valider les variables d'environnement au démarrage
const env = validateEnv();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' })); // Limiter la taille des requêtes
app.use(cookieParser());

// CORS
app.use(cors(corsOptions));

// Limitation du taux de requêtes
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limite chaque IP à 100 requêtes par fenêtre de temps
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
  standardHeaders: true, // Retourne les informations de limite dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
}));

// Session (pour demo uniquement - stockage en mémoire)
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Empêche l'accès JavaScript aux cookies
    secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en production
    sameSite: 'lax', // Protection CSRF
    maxAge: 1000 * 60 * 60 * 2 // 2 heures
  }
}));

// Protection CSRF (basée sur les sessions)
app.use(csurf({ cookie: false }));

// Routes
app.use('/api', router);

// Gestionnaire d'erreurs
app.use(errorHandler);

app.listen(port, () => {
  console.log(`✅ Secure API running on port ${port}`);
});
