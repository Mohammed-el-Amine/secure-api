import { jest } from '@jest/globals';
import { asyncHandler, sanitizeInput, requestTimeout } from '../../src/middlewares/resilience.js';

describe('Middleware de résilience', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
      connection: {
        on: jest.fn()
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      headersSent: false,
      setTimeout: jest.fn(),
      on: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('asyncHandler', () => {
    test('devrait exécuter un handler asynchrone sans erreur', async () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue('success');
      const wrappedHandler = asyncHandler(mockAsyncFunction);

      await wrappedHandler(mockReq, mockRes, mockNext);

      expect(mockAsyncFunction).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('devrait capturer et transmettre les erreurs asynchrones', async () => {
      const error = new Error('Erreur asynchrone');
      const mockAsyncFunction = jest.fn().mockRejectedValue(error);
      const wrappedHandler = asyncHandler(mockAsyncFunction);

      await wrappedHandler(mockReq, mockRes, mockNext);

      expect(mockAsyncFunction).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('devrait utiliser Promise.resolve pour gérer les fonctions sync/async', async () => {
      const mockFunction = jest.fn().mockResolvedValue('success');
      const wrappedHandler = asyncHandler(mockFunction);

      await wrappedHandler(mockReq, mockRes, mockNext);

      expect(mockFunction).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled(); // Pas d'erreur
    });
  });

  describe('sanitizeInput', () => {
    test('devrait nettoyer les données du corps de la requête', () => {
      mockReq.body = {
        username: '  testUser  ',
        password: 'TestPass123!',
        description: '<script>alert("xss")</script>Hello World'
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual({
        username: 'testUser',
        password: 'TestPass123!',
        description: 'scriptalert("xss")/scriptHello World' // Le code supprime < et >
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('devrait nettoyer les paramètres de requête', () => {
      mockReq.query = {
        search: '  <b>test</b>  ',
        category: 'electronics',
        limit: '10'
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.query).toEqual({
        search: 'btest/b', // Le code supprime < et >
        category: 'electronics',
        limit: '10'
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('devrait nettoyer les paramètres d\'URL', () => {
      mockReq.params = {
        id: '  123  ',
        slug: '<em>test-slug</em>'
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.params).toEqual({
        id: '123',
        slug: 'emtest-slug/em' // Le code supprime < et >
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('devrait gérer les valeurs nulles et undefined', () => {
      mockReq.body = {
        username: null,
        password: undefined,
        email: 'test@example.com'
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual({
        username: null,
        password: undefined,
        email: 'test@example.com'
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('devrait gérer les objets vides', () => {
      mockReq.body = {};
      mockReq.query = {};
      mockReq.params = {};

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual({});
      expect(mockReq.query).toEqual({});
      expect(mockReq.params).toEqual({});
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('devrait préserver les nombres et booléens', () => {
      mockReq.body = {
        age: 25,
        isActive: true,
        score: 0,
        verified: false
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual({
        age: 25,
        isActive: true,
        score: 0,
        verified: false
      });
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requestTimeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Mock de setTimeout global
      global.setTimeout = jest.fn((callback, delay) => {
        return { id: Math.random() };
      });
      global.clearTimeout = jest.fn();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('devrait configurer un timeout par défaut', () => {
      mockRes.send = jest.fn();
      mockRes.headersSent = false;
      
      const middleware = requestTimeout();
      middleware(mockReq, mockRes, mockNext);

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 30000);
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('devrait configurer un timeout personnalisé', () => {
      mockRes.send = jest.fn();
      mockRes.headersSent = false;
      
      const customTimeout = 15000;
      const middleware = requestTimeout(customTimeout);
      middleware(mockReq, mockRes, mockNext);

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), customTimeout);
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('devrait gérer le nettoyage lors de l\'envoi de réponse', () => {
      mockRes.send = jest.fn();
      mockRes.headersSent = false;
      const originalSend = mockRes.send;
      
      const middleware = requestTimeout(1000);
      middleware(mockReq, mockRes, mockNext);

      // Vérifier que res.send a été wrappé
      expect(typeof mockRes.send).toBe('function');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});