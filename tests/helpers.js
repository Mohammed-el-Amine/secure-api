import { prisma } from '../src/config/database.js';

/**
 * Nettoie la base de données en supprimant tous les utilisateurs
 */
export async function cleanDatabase() {
  try {
    await prisma.user.deleteMany({});
  } catch (error) {
    // En mode test, on ignore les erreurs de connexion
    if (process.env.NODE_ENV === 'test') {
      console.warn('Base de données de test non disponible:', error.message);
    } else {
      console.error('Erreur lors du nettoyage de la base:', error.message);
    }
  }
}

/**
 * Données de test valides
 */
export const validUserData = {
  username: 'testuser',
  password: 'TestPassword123!'
};

/**
 * Données de test invalides
 */
export const invalidUserData = {
  shortPassword: {
    username: 'testuser',
    password: '123'
  },
  noUppercase: {
    username: 'testuser', 
    password: 'testpassword123!'
  },
  noLowercase: {
    username: 'testuser',
    password: 'TESTPASSWORD123!'
  },
  noNumber: {
    username: 'testuser',
    password: 'TestPassword!'
  },
  noSpecialChar: {
    username: 'testuser',
    password: 'TestPassword123'
  }
};

/**
 * Génère un nom d'utilisateur unique
 */
export function generateUniqueUsername(prefix = 'testuser') {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

/**
 * Attendre un délai (pour les tests de rate limiting)
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));