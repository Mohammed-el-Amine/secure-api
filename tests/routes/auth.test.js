import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../../src/app.js';
import { cleanDatabase, validUserData, invalidUserData, generateUniqueUsername } from '../helpers.js';

describe('Routes d\'authentification', () => {
  let server;
  let agent;

  beforeAll(async () => {
    // Créer un agent pour maintenir les cookies
    agent = request.agent(app);
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    if (server) {
      server.close();
    }
  });

  describe('GET /api/auth/csrf-token', () => {
    test('devrait retourner un token CSRF', async () => {
      const response = await agent
        .get('/api/auth/csrf-token')
        .expect(200);

      expect(response.body).toHaveProperty('csrfToken');
      expect(typeof response.body.csrfToken).toBe('string');
      expect(response.body.csrfToken.length).toBeGreaterThan(10);
    });
  });

  describe('POST /api/auth/register', () => {
    let csrfToken;

    beforeEach(async () => {
      const csrfResponse = await agent.get('/api/auth/csrf-token');
      csrfToken = csrfResponse.body.csrfToken;
    });

    test('devrait créer un utilisateur avec des données valides', async () => {
      const userData = {
        username: generateUniqueUsername(),
        password: validUserData.password
      };

      const response = await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Utilisateur inscrit avec succès');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username', userData.username);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('devrait rejeter l\'inscription sans token CSRF', async () => {
      const userData = {
        username: generateUniqueUsername(),
        password: validUserData.password
      };

      await agent
        .post('/api/auth/register')
        .send(userData)
        .expect(403);
    });

    test('devrait rejeter un mot de passe trop court', async () => {
      const response = await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send(invalidUserData.shortPassword)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('8 caractères');
    });

    test('devrait rejeter un mot de passe sans majuscule', async () => {
      const response = await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send(invalidUserData.noUppercase)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('majuscule');
    });

    test('devrait rejeter un utilisateur déjà existant', async () => {
      const userData = {
        username: generateUniqueUsername(),
        password: validUserData.password
      };

      // Première inscription réussie
      await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send(userData)
        .expect(201);

      // Récupérer un nouveau token CSRF
      const newCsrfResponse = await agent.get('/api/auth/csrf-token');
      const newCsrfToken = newCsrfResponse.body.csrfToken;

      // Seconde inscription avec le même utilisateur
      const response = await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', newCsrfToken)
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Utilisateur déjà existant');
    });
  });

  describe('POST /api/auth/login', () => {
    let csrfToken;
    let testUser;

    beforeEach(async () => {
      const csrfResponse = await agent.get('/api/auth/csrf-token');
      csrfToken = csrfResponse.body.csrfToken;

      // Créer un utilisateur de test
      testUser = {
        username: generateUniqueUsername(),
        password: validUserData.password
      };

      await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send(testUser);

      // Récupérer un nouveau token CSRF pour le login
      const newCsrfResponse = await agent.get('/api/auth/csrf-token');
      csrfToken = newCsrfResponse.body.csrfToken;
    });

    test('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const response = await agent
        .post('/api/auth/login')
        .set('X-CSRF-Token', csrfToken)
        .send(testUser)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Connecté avec succès');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', testUser.username);
    });

    test('devrait rejeter des identifiants invalides', async () => {
      const response = await agent
        .post('/api/auth/login')
        .set('X-CSRF-Token', csrfToken)
        .send({
          username: testUser.username,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Identifiants invalides');
    });

    test('devrait rejeter un utilisateur inexistant', async () => {
      const response = await agent
        .post('/api/auth/login')
        .set('X-CSRF-Token', csrfToken)
        .send({
          username: 'nonexistent',
          password: validUserData.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Identifiants invalides');
    });
  });

  describe('GET /api/auth/profile', () => {
    let testUser;

    beforeEach(async () => {
      // S'inscrire et se connecter
      const csrfResponse = await agent.get('/api/auth/csrf-token');
      const csrfToken = csrfResponse.body.csrfToken;

      testUser = {
        username: generateUniqueUsername(),
        password: validUserData.password
      };

      await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send(testUser);
    });

    test('devrait retourner le profil pour un utilisateur connecté', async () => {
      const response = await agent
        .get('/api/auth/profile')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profil protégé');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', testUser.username);
      expect(response.body.user).toHaveProperty('createdAt');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('devrait rejeter un utilisateur non connecté', async () => {
      // Créer un nouvel agent sans session
      const newAgent = request.agent(app);
      
      const response = await newAgent
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Non autorisé');
    });
  });

  describe('POST /api/auth/logout', () => {
    let testUser, csrfToken;

    beforeEach(async () => {
      // S'inscrire et se connecter
      const csrfResponse = await agent.get('/api/auth/csrf-token');
      csrfToken = csrfResponse.body.csrfToken;

      testUser = {
        username: generateUniqueUsername(),
        password: validUserData.password
      };

      await agent
        .post('/api/auth/register')
        .set('X-CSRF-Token', csrfToken)
        .send(testUser);

      // Récupérer nouveau token pour logout
      const newCsrfResponse = await agent.get('/api/auth/csrf-token');
      csrfToken = newCsrfResponse.body.csrfToken;
    });

    test('devrait déconnecter un utilisateur connecté', async () => {
      const response = await agent
        .post('/api/auth/logout')
        .set('X-CSRF-Token', csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Déconnecté avec succès');

      // Vérifier que l'utilisateur est bien déconnecté
      await agent
        .get('/api/auth/profile')
        .expect(401);
    });

    test('devrait rejeter la déconnexion sans session', async () => {
      const newAgent = request.agent(app);
      const csrfResponse = await newAgent.get('/api/auth/csrf-token');
      const newCsrfToken = csrfResponse.body.csrfToken;

      const response = await newAgent
        .post('/api/auth/logout')
        .set('X-CSRF-Token', newCsrfToken)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Non autorisé');
    });
  });
});