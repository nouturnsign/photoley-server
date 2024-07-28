import { Request, Response } from 'express';
import Photo from '../models/photoModel';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../utils/config';
import { resolveUsernamesToIds } from '../utils/userUtils';
import { getHeatmapData, getStickerPublicID } from '../utils/photoUtils';
import User from '../models/userModel';

interface IStickerPosition {
  x: number;
  y: number;
}

const uploadPhoto = async (req: Request, res: Response) => {
  const { location, taggedUsers, stickerPositions, originalPhoto } = req.body;
  const pictureTaker = res.locals.userId;

  const currentTimestamp = Date.now();

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

  let parsedTaggedUsers: string[];
  try {
    parsedTaggedUsers = JSON.parse(taggedUsers);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid tagged users format' });
  }

  if (!parsedTaggedUsers) {
    return res.status(400).json({ message: 'Invalid tagged users format' });
  }

  let parsedStickerPositions: IStickerPosition[];
  try {
    parsedStickerPositions = JSON.parse(stickerPositions);
  } catch (error) {
    return res
      .status(400)
      .json({ message: 'Invalid sticker positions format' });
  }

  if (!parsedStickerPositions) {
    return res.status(400).json({ message: 'Invalid tagged users format' });
  }

  let taggedByPhoto;
  try {
    taggedByPhoto =
      originalPhoto && originalPhoto != ''
        ? await Photo.findById(originalPhoto)
        : null;
  } catch (error) {
    return res.status(400).json({ message: 'Invalid tag photo ID' });
  }

  if (originalPhoto && !taggedByPhoto) {
    return res.status(400).json({ message: 'Invalid tag photo ID' });
  }
  if (taggedByPhoto && taggedByPhoto.isTagComplete) {
    return res.status(400).json({ message: 'Photo was already tagged' });
  }

  const geoLocation = {
    type: 'Point',
    coordinates: [parsedLocation.lon, parsedLocation.lat],
  };

  try {
    const tagIds = parsedTaggedUsers
      ? await resolveUsernamesToIds(parsedTaggedUsers)
      : [];
    if (tagIds.includes(pictureTaker)) {
      return res.status(400).json({ message: 'Cannot tag yourself' });
    }
    const users = await User.find({ _id: { $in: tagIds } });
    const userStickers = users.map((user) => user.sticker);
    const stickerCount = userStickers.length;
    if (stickerCount != parsedStickerPositions.length) {
      return res
        .status(400)
        .json({ message: 'Number of users and stickers should match' });
    }

    const stickerTransformations: any[] = [];
    for (let i = 0; i < stickerCount; i++) {
      const stickerID = getStickerPublicID(userStickers[i] as string);
      const position = parsedStickerPositions[i] as IStickerPosition;
      stickerTransformations.push({
        overlay: stickerID,
        gravity: 'north_west',
        width: config.cloudinary.stickerSize,
        height: config.cloudinary.stickerSize,
        x: position.x,
        y: position.y,
      });
    }
    const transformations = ([] as any[]).concat(
      config.cloudinary.photoPreTransformation,
      stickerTransformations,
      config.cloudinary.photoPostTransformation
    );

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
              return res.status(500).json({
                message: 'Failed to upload photo',
                error: error,
              });
            } else {
              resolve(result);
            }
          }
        )
        .end(req.file?.buffer);
    });

    let isTagComplete = false;
    if (taggedByPhoto) {
      const timeDifference =
        currentTimestamp - taggedByPhoto.createdAt.valueOf();
      if (timeDifference < config.tagDuration) {
        await User.findByIdAndUpdate(pictureTaker, {
          $inc: { successCount: 1 },
        });
        await Photo.findByIdAndUpdate(originalPhoto, {
          $set: { isTagComplete: true },
        });
        isTagComplete = true;
      } else {
        isTagComplete = false;
      }
    } else {
      await Promise.all(
        tagIds.map(async (taggedUserId) => {
          await User.findByIdAndUpdate(taggedUserId, {
            $inc: { taggedCount: 1 },
          });
        })
      );
      isTagComplete = false;
    }

    const newPhoto = new Photo({
      url: (result as any).secure_url,
      pictureTaker: pictureTaker,
      taggedUsers: tagIds,
      isTagComplete: isTagComplete,
      location: geoLocation,
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

const getTaggedPhotos = async (req: Request, res: Response) => {
  const skip = parseInt(req.query.skip as string) || 0;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 30);

  try {
    const userId = res.locals.userId;

    const earliestValidDate = new Date(Date.now() - config.tagDuration);
    const photos = await Photo.find({
      taggedUsers: userId,
      isTagComplete: false,
      createdAt: { $gte: earliestValidDate },
    })
      .sort({ createdAt: 1 }) // Sort by createdAt in ascending order
      .skip(skip)
      .limit(limit)
      .populate('pictureTaker', 'username profilePicture');

    const totalPhotos = await Photo.countDocuments();

    res.json({ photos: photos, total: totalPhotos, skip: skip, limit: limit });
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

export { uploadPhoto, getFeed, getTaggedPhotos, getHeatmap };
