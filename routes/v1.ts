import { Router } from 'express';
import authRouter from './authRouter';
import photoRouter from './photoRouter';
import profileRouter from './profileRouter';

const router = Router();

// Public routes
router.use('/auth', authRouter);
router.use('/photo', photoRouter);
router.use('/profile', profileRouter);

export default router;
