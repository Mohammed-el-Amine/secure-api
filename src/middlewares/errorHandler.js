export const errorHandler = (err, req, res, next) => {
  // Logging détaillé de l'erreur
  console.error('❌ Erreur capturée:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Gestion spécifique des erreurs CSRF
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Token CSRF invalide',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  // Gestion des erreurs Prisma/Base de données
  if (err.code && err.code.startsWith('P')) {
    console.error('❌ Erreur Prisma:', err.code, err.message);
    return res.status(500).json({
      error: 'Erreur de base de données',
      code: 'DATABASE_ERROR'
    });
  }

  // Gestion des erreurs de validation Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: err.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Gestion des erreurs de syntaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON malformé',
      code: 'INVALID_JSON'
    });
  }

  // Erreurs de limite de taille
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Fichier trop volumineux',
      code: 'FILE_TOO_LARGE'
    });
  }

  // Erreur par défaut - ne jamais exposer les détails internes en production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Erreur interne du serveur',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack })
  });
};
