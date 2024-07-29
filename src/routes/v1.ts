import { Router } from 'express';
import { register, login, validateToken } from '../controllers/authController';
import { getFeed, getImage, uploadPhoto } from '../controllers/photoController';
import { getProfile, updateProfile } from '../controllers/profileController';
import { getHeatmap, getStickers, getTags } from '../controllers/tagController';
import { authenticateToken } from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware';

const router = Router();

// Public routes
router.post('/register', upload.single('profilePicture'), register);
router.post('/login', login);
router.get('/validate', authenticateToken, validateToken);
router.get('/image/:publicId', authenticateToken, getImage);
router.get('/feed', authenticateToken, getFeed);
router.post('/photo', authenticateToken, upload.single('photo'), uploadPhoto);
router.get('/profile', authenticateToken, getProfile);
router.put(
  '/profile',
  authenticateToken,
  upload.single('profilePicture'),
  updateProfile
);
router.get('/tags', authenticateToken, getTags);
router.get('/heatmap', authenticateToken, getHeatmap);
router.get('/stickers', getStickers);

export default router;
