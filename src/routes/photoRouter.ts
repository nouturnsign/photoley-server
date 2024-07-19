import express from 'express';
import { getPhotos, uploadPhoto } from '../controllers/photoController';
import { authenticateToken } from '../middleware/authMiddleware';
import upload from '../utils/uploadUtils';

const router = express.Router();

router.get('/', authenticateToken, getPhotos);
router.post('/', authenticateToken, upload.single('photo'), uploadPhoto);

export default router;