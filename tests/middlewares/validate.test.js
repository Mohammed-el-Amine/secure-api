import { jest } from '@jest/globals';
import { validate, schemas } from '../../src/middlewares/validate.js';

describe('Middleware de validation', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('Validation du schéma utilisateur', () => {
    let validateUserMiddleware;

    beforeEach(() => {
      validateUserMiddleware = validate(schemas.user);
    });

    test('devrait valider des données utilisateur correctes', () => {
      mockReq.body = {
        username: 'testuser',
        password: 'TestPassword123!'
      };

      validateUserMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('devrait rejeter un nom d\'utilisateur manquant', () => {
      mockReq.body = {
        password: 'TestPassword123!'
      };

      validateUserMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Le nom d\'utilisateur est requis'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('devrait rejeter un mot de passe manquant', () => {
      mockReq.body = {
        username: 'testuser'
      };

      validateUserMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Le mot de passe est requis'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('devrait rejeter un nom d\'utilisateur trop court', () => {
      mockReq.body = {
        username: 'ab',
        password: 'TestPassword123!'
      };

      validateUserMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('3 caractères')
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('devrait rejeter un nom d\'utilisateur trop long', () => {
      mockReq.body = {
        username: 'a'.repeat(31),
        password: 'TestPassword123!'
      };

      validateUserMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('30 caractères')
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('devrait rejeter un mot de passe trop court', () => {
      mockReq.body = {
        username: 'testuser',
        password: 'Test1!'
      };

      validateUserMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('8 caractères')
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('devrait rejeter un mot de passe sans majuscule', () => {
      mockReq.body = {
        username: 'testuser',
        password: 'testpassword123!'
      };

      validateUserMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('majuscule')
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('devrait rejeter un mot de passe sans minuscule', () => {
      mockReq.body = {
        username: 'testuser',
        password: 'TESTPASSWORD123!'
      };

      validateUserMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('minuscule')
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('devrait rejeter un mot de passe sans chiffre', () => {
      mockReq.body = {
        username: 'testuser',
        password: 'TestPassword!'
      };

      validateUserMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('chiffre')
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('devrait rejeter un mot de passe sans caractère spécial', () => {
      mockReq.body = {
        username: 'testuser',
        password: 'TestPassword123'
      };

      validateUserMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('spécial')
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Fonction validate générique', () => {
    test('devrait gérer les erreurs de validation multiples', () => {
      const schema = {
        validate: jest.fn().mockReturnValue({
          error: {
            details: [
              { message: 'Erreur 1' },
              { message: 'Erreur 2' }
            ]
          }
        })
      };

      const middleware = validate(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erreur 1'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('devrait gérer l\'absence d\'erreur', () => {
      const schema = {
        validate: jest.fn().mockReturnValue({
          error: null,
          value: { username: 'test', password: 'Test123!' }
        })
      };

      const middleware = validate(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});