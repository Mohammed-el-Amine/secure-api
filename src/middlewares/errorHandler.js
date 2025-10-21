export const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err.message);

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Token CSRF invalide' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
  });
};
