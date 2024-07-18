import express from 'express';
import { getPhotos, uploadPhoto } from '../controllers/photoController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, getPhotos);
router.post('/', authenticateToken, uploadPhoto);

export default router;