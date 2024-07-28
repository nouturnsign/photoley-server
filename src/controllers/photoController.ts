import { Request, Response } from 'express';
import Photo from '../models/photoModel';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../utils/config';
import {
  buildStickerTransformations,
  getHeatmapData,
  handleTags,
  parseRequestBody,
  validateTaggedUsers,
} from '../utils/photoUtils';

const uploadPhoto = async (req: Request, res: Response) => {
  const currentTimestamp = Date.now();

  if (!req.file) {
    throw new Error('Photo is required');
  }

  const { location, taggedUsers, stickerPositions } = parseRequestBody(
    req.body
  );
  const pictureTaker = res.locals.userId;
  const geoLocation = {
    type: 'Point',
    coordinates: [location.lon, location.lat],
  };

  const userStickers = await validateTaggedUsers(taggedUsers, stickerPositions);
  const stickerTransformations = buildStickerTransformations(
    userStickers,
    stickerPositions
  );

  const transformations = ([] as any[]).concat(
    config.cloudinary.photoPreTransformation,
    stickerTransformations,
    config.cloudinary.photoPostTransformation
  );

  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'photos',
            transformation: transformations,
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

    const newPhoto = new Photo({
      url: (result as any).secure_url,
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

const getHeatmap = async (req: Request, res: Response) => {
  if (!req.query.latitude || !req.query.longitude) {
    return res.status(422).json({ message: 'Missing latitude or longitude' });
  }
  const latitude = parseFloat(req.query.latitude as string);
  const longitude = parseFloat(req.query.longitude as string);
  const minDistance = parseFloat(req.query.minDistance as string) || 0;
  const maxDistance = parseFloat(req.query.maxDistance as string) || 400000;

  if (minDistance >= maxDistance) {
    return res
      .status(409)
      .json({ message: 'Minimum distance should not exceed maximum distance' });
  }

  try {
    const heatmapData = await getHeatmapData(
      longitude,
      latitude,
      minDistance,
      maxDistance
    );
    res.json(heatmapData);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({
        message: 'Failed to retrieve heatmap data',
        error: err.message,
      });
    }
  }
};

export { uploadPhoto, getFeed, getHeatmap };
