import { jest } from '@jest/globals';
import { requireAuth as authMiddleware } from '../../src/middlewares/auth.js';

describe('Middleware d\'authentification', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      session: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('devrait autoriser un utilisateur connecté', () => {
    mockReq.session.userId = 123;

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('devrait rejeter un utilisateur non connecté', () => {
    // Session sans userId
    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Non autorisé'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('devrait rejeter une session inexistante', () => {
    mockReq.session = null;

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Non autorisé'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('devrait rejeter un userId undefined', () => {
    mockReq.session.userId = undefined;

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Non autorisé'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('devrait rejeter un userId null', () => {
    mockReq.session.userId = null;

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Non autorisé'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('devrait accepter différents types d\'userId valides', () => {
    // Test avec un string
    mockReq.session.userId = '123';
    authMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();

    // Reset des mocks
    mockNext.mockClear();
    mockRes.status.mockClear();

    // Test avec un number
    mockReq.session.userId = 456;
    authMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});