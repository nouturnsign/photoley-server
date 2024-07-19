import { Router } from 'express';
import { register, login } from '../controllers/authController';
import {
  getPhotos,
  uploadPhoto,
  getTaggedPhotos,
} from '../controllers/photoController';
import { getProfile, updateProfile } from '../controllers/profileController';
import { authenticateToken } from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware';

const router = Router();

// Public routes
router.post('/register', upload.single('profilePicture'), register);
router.post('/login', login);
router.get('/photo', authenticateToken, getPhotos);
router.post('/photo', authenticateToken, upload.single('photo'), uploadPhoto);
router.get('/profile', authenticateToken, getProfile);
router.put(
  '/profile',
  authenticateToken,
  upload.single('profilePicture'),
  updateProfile
);
router.get('/tags', authenticateToken, getTaggedPhotos);

export default router;
