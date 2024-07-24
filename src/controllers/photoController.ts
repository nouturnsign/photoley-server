import { Request, Response } from 'express';
import Photo from '../models/photoModel';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../utils/config';
import { resolveUsernamesToIds } from '../utils/userUtils';
import { getHeatmapData } from '../utils/photoUtils';

const uploadPhoto = async (req: Request, res: Response) => {
  const { location, tags } = req.body;
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

  let parsedTags;
  try {
    parsedTags = JSON.parse(tags);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid tags format' });
  }

  if (!parsedTags) {
    return res.status(400).json({ message: 'Invalid tags format' });
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

    const tagIds = parsedTags ? await resolveUsernamesToIds(parsedTags) : [];

    const newPhoto = new Photo({
      photoUrl: (result as any).secure_url,
      location: geoLocation,
      userId,
      tags: tagIds,
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
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 30);

  try {
    const photos = await Photo.find()
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username profilePicture')
      .populate('tags', 'username profilePicture');

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

const getTaggedPhotos = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;

    const photos = await Photo.find({ tags: userId })
      .populate('userId', 'username profilePicture')
      .populate('tags', 'username profilePicture');

    res.json(photos);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve tagged photos' });
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

export { uploadPhoto, getPhotos, getTaggedPhotos, getHeatmap };
