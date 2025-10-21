import Joi from 'joi';

// Schéma de validation pour les variables d'environnement
const envSchema = Joi.object({
  PORT: Joi.number().port().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  SESSION_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'SESSION_SECRET doit contenir au moins 32 caractères pour la sécurité',
    'any.required': 'SESSION_SECRET est requis'
  }),
  CORS_ORIGIN: Joi.string().uri().default('http://localhost:5173')
}).unknown().required();

export const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    console.error('❌ Erreur de configuration des variables d\'environnement:');
    console.error(error.details[0].message);
    process.exit(1);
  }
  
  console.log('✅ Variables d\'environnement validées avec succès');
  return value;
};