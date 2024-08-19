import { Request, Response } from 'express';
import axios from 'axios';
import Photo from '../models/photoModel';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../utils/config';
import { parsePhotoRequestBody } from '../utils/photoUtils';
import { handleTags } from '../utils/tagUtils';

const getImage = async (req: Request, res: Response) => {
  const { publicId } = req.params;
  if (!publicId) {
    return res.status(400).json({ message: 'Missing publicId' });
  }

  const cloudinaryUrl = `https://res.cloudinary.com/${config.cloudinary.cloud_name}/image/upload/${publicId.replace(/:/g, '/')}`;

  try {
    const response = await axios.get(cloudinaryUrl, {
      responseType: 'stream',
    });

    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch image' });
  }
};

const uploadPhoto = async (req: Request, res: Response) => {
  const currentTimestamp = Date.now();

  if (!req.file) {
    throw new Error('Photo is required');
  }

  const { location, taggedUsers } = parsePhotoRequestBody(req.body);
  const pictureTaker = res.locals.userId;
  const geoLocation = {
    type: 'Point',
    coordinates: [location.lon, location.lat],
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
              throw new Error(error.message);
            } else {
              resolve(result);
            }
          }
        )
        .end(req.file?.buffer);
    });

    await handleTags(taggedUsers, pictureTaker, geoLocation, currentTimestamp);

    const cloudinaryUrl = (result as any).secure_url as string;
    const publicId = cloudinaryUrl
      .replace(
        `https://res.cloudinary.com/${config.cloudinary.cloud_name}/image/upload/`,
        ''
      )
      .replace(/\//g, ':');

    const newPhoto = new Photo({
      publicId: publicId,
      pictureTaker,
      taggedUsers,
    });
    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (err) {
    if (err instanceof Error) {
      res
        .status(500)
        .json({ message: 'Failed to upload photo', error: err.message });
    } else {
      console.error('Unknown error:', err); // Added logging for better diagnostics
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

const getFeed = async (req: Request, res: Response) => {
  const skip = parseInt(req.query.skip as string) || 0;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 30);

  try {
    const photos = await Photo.find()
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip(skip)
      .limit(limit)
      .populate('pictureTaker', 'username profilePicture')
      .populate('taggedUsers', 'username profilePicture');

    const totalPhotos = await Photo.countDocuments();

    res.json({
      photos: photos,
      total: totalPhotos,
      skip: skip,
      limit: limit,
    });
  } catch (err) {
    if (err instanceof Error) {
      res
        .status(500)
        .json({ message: 'Failed to retrieve photos', error: err.message });
    }
  }
};

export { getImage, uploadPhoto, getFeed };
