import { Request, Response } from 'express';
import Photo from '../models/photoModel';
import { v2 as cloudinary } from 'cloudinary';

const uploadPhoto = async (req: Request, res: Response) => {
  const { photo, location } = req.body;
  const userId = res.locals.userId;

  try {
    const result = await cloudinary.uploader.upload(photo, {
      folder: 'photos',
      use_filename: true,
    });

    const newPhoto = new Photo({
      photoUrl: result.secure_url,
      location,
      userId,
    });

    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload photo' });
  }
};

const getPhotos = async (req: Request, res: Response) => {
  try {
    const photos = await Photo.find().populate('userId', 'username profilePicture');
    res.json(photos);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve photos' });
  }
};

export { uploadPhoto, getPhotos };
