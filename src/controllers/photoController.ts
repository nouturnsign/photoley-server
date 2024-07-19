import { Request, Response } from 'express';
import Photo from '../models/photoModel';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../utils/configDev';

const uploadPhoto = async (req: Request, res: Response) => {
  const { location } = req.body;
  const userId = res.locals.userId;

  if (!req.file) {
    return res.status(400).json({ message: 'Photo is required' });
  }

  let parsedLocation;
  try {
    parsedLocation = JSON.parse(location);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid location format' });
  }

  if (
    !parsedLocation ||
    typeof parsedLocation.lat !== 'number' ||
    typeof parsedLocation.lon !== 'number'
  ) {
    return res.status(400).json({ message: 'Invalid location format' });
  }

  const geoLocation = {
    type: 'Point',
    coordinates: [parsedLocation.lon, parsedLocation.lat],
  };

  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'photos',
            transformation: config.cloudinary.photoTransformation,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        )
        .end(req.file?.buffer);
    });

    const newPhoto = new Photo({
      photoUrl: (result as any).secure_url,
      location: geoLocation,
      userId,
    });

    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (err) {
    if (err instanceof Error) {
      res
        .status(500)
        .json({ message: 'Failed to upload photo', error: err.message });
    }
  }
};

const getPhotos = async (req: Request, res: Response) => {
  const skip = parseInt(req.query.skip as string) || 0;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const photos = await Photo.find()
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username profilePicture');

    const totalPhotos = await Photo.countDocuments();

    res.json({
      photos,
      total: totalPhotos,
      skip,
      limit,
    });
  } catch (err) {
    if (err instanceof Error) {
      res
        .status(500)
        .json({ message: 'Failed to retrieve photos', error: err.message });
    }
  }
};

export { uploadPhoto, getPhotos };
