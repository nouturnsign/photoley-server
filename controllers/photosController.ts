import { Request, Response } from 'express';
import Photo from '../models/photoModel';

export const getPhotos = async (req: Request, res: Response) => {
  const photos = await Photo.find().populate('userId');
  res.json(photos);
};

export const addPhoto = async (req: Request, res: Response) => {
  const { userId, photoUrl, location } = req.body;

  const photo = new Photo({ userId, photoUrl, location });
  await photo.save();

  res.status(201).json(photo);
};
