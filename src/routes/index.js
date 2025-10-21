import { Router } from 'express';
import authRoutes from './auth.js';
import { checkDbHealth } from '../config/database.js';
import { asyncHandler } from '../middlewares/resilience.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur ton API sécurisée 🔒',
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
});

// Route de vérification de santé
router.get('/health', asyncHandler(async (req, res) => {
  const dbHealth = await checkDbHealth();
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  const health = {
    status: dbHealth.status === 'healthy' ? 'OK' : 'ERROR',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    database: dbHealth,
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
    },
    node: process.version
  };

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
}));

router.use('/auth', authRoutes);

export default router;
