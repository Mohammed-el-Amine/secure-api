import { jest } from '@jest/globals';

// Configuration globale des tests
beforeAll(async () => {
  // Configuration initiale si nécessaire
  console.log('🧪 Initialisation des tests...');
});

afterAll(async () => {
  // Nettoyage final
  console.log('🧹 Nettoyage après tests...');
});
global.console = {
  ...console,
  // Supprimer les logs pendant les tests (optionnel)
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Timeout global pour les tests
jest.setTimeout(10000);

// Mock des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.SESSION_SECRET = 'test_secret_with_more_than_32_characters_for_testing_purposes';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.DATABASE_URL = 'mysql://root:root@localhost:3306/secure_api_test';