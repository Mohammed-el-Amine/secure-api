import { jest } from '@jest/globals';
import { errorHandler } from '../../src/middlewares/errorHandler.js';

describe('Middleware de gestion d\'erreurs', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test User Agent')
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      headersSent: false
    };
    mockNext = jest.fn();

    // Mock console.error pour éviter les logs pendant les tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('devrait gérer une erreur générique', () => {
    // En mode test, les erreurs sont masquées (comme en production)
    const error = new Error('Erreur de test');
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(console.error).toHaveBeenCalledWith('❌ Erreur capturée:', expect.objectContaining({
      message: 'Erreur de test',
      method: 'GET',
      ip: '127.0.0.1'
    }));
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Erreur interne du serveur', // En mode test, on masque comme en production
      code: 'INTERNAL_ERROR'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('devrait gérer une erreur avec status personnalisé', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Ressource non trouvée');
    error.status = 404;
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Ressource non trouvée',
      code: 'INTERNAL_ERROR',
      stack: expect.any(String)
    });
  });

  test('devrait gérer les erreurs CSRF', () => {
    const error = new Error('Token CSRF invalide');
    error.code = 'EBADCSRFTOKEN';
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Token CSRF invalide',
      code: 'CSRF_TOKEN_INVALID'
    });
  });

  test('devrait gérer les erreurs Prisma', () => {
    const error = new Error('Erreur de base de données');
    error.code = 'P2002';
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Erreur de base de données',
      code: 'DATABASE_ERROR'
    });
  });

  test('devrait gérer les erreurs Joi de validation', () => {
    const error = new Error('Validation échouée');
    error.isJoi = true;
    error.details = [{ message: 'Le champ est requis' }];
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Le champ est requis',
      code: 'VALIDATION_ERROR'
    });
  });

  test('devrait gérer les erreurs JSON malformé', () => {
    const error = new SyntaxError('JSON malformé');
    error.status = 400;
    error.body = {};
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'JSON malformé',
      code: 'INVALID_JSON'
    });
  });

  test('devrait gérer les erreurs de taille de fichier', () => {
    const error = new Error('Fichier trop volumineux');
    error.code = 'LIMIT_FILE_SIZE';
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(413);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Fichier trop volumineux',
      code: 'FILE_TOO_LARGE'
    });
  });

  test('devrait masquer les erreurs en production', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Erreur sensible');
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  });

  test('devrait afficher les détails en développement', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Erreur détaillée');
    error.status = 400;
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Erreur détaillée',
      code: 'INTERNAL_ERROR',
      stack: expect.any(String)
    });
  });

  test('devrait gérer les erreurs sans message en production', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error();
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  });
});