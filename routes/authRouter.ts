import express from 'express';
import { login, refreshToken } from '../controllers/authController';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);

export default router;
