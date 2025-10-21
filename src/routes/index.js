import { Router } from 'express';
import authRoutes from './auth.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur ton API sécurisée 🔒' });
});

router.use('/auth', authRoutes);

export default router;
