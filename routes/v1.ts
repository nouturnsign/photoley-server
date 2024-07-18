import { Router } from 'express';
import { login, refreshToken } from '../controllers/authController';
import { addPhoto, getPhotos } from '../controllers/photosController';

const router = Router();

// Authentication routes
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Photo routes
router.post('/photos', addPhoto);
router.get('/photos', getPhotos);

export default router;
