import express from 'express';
import { getPhotos, addPhoto } from '../controllers/photosController';

const router = express.Router();

router.get('/', getPhotos);
router.post('/', addPhoto);

export default router;