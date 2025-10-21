const corsOptions = {
  origin: [process.env.CORS_ORIGIN || 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Permet l'envoi de cookies/credentials
  optionsSuccessStatus: 200, // Support des navigateurs legacy (IE11, divers SmartTV)
};

export default corsOptions;
