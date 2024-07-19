import express from 'express';
import { register, login } from '../controllers/authController';
import upload from '../utils/uploadUtils';

const router = express.Router();

router.post('/register', upload.single('profilePicture'), register);
router.post('/login', login);

export default router;
