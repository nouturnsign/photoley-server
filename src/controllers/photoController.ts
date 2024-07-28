import { Request, Response } from 'express';
import Photo from '../models/photoModel';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../utils/config';
import {
  getHeatmapData,
  getStickerPublicID,
  sendNotification,
} from '../utils/photoUtils';
import User from '../models/userModel';
import Tag from '../models/tagModel';

interface IStickerPosition {
  x: number;
  y: number;
}

interface ILocation {
  lat: number;
  lon: number;
}

const uploadPhoto = async (req: Request, res: Response) => {
  const { location, taggedUsers, stickerPositions } = req.body;
  const pictureTaker = res.locals.userId;

  const currentTimestamp = Date.now();

  if (!req.file) {
    return res.status(400).json({ message: 'Photo is required' });
  }

  let parsedLocation: ILocation,
    parsedTaggedUsers: string[],
    parsedStickerPositions: IStickerPosition[];

  try {
    parsedLocation = JSON.parse(location);
    parsedTaggedUsers = JSON.parse(taggedUsers);
    parsedStickerPositions = JSON.parse(stickerPositions);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid input format' });
  }

  if (
    !parsedLocation ||
    typeof parsedLocation.lat !== 'number' ||
    typeof parsedLocation.lon !== 'number' ||
    !Array.isArray(parsedTaggedUsers) ||
    !Array.isArray(parsedStickerPositions)
  ) {
    return res.status(400).json({ message: 'Invalid input format' });
  }

  const uniqueTaggedUsers = Array.from(new Set(parsedTaggedUsers));
  if (uniqueTaggedUsers.length !== parsedTaggedUsers.length) {
    return res
      .status(400)
      .json({ message: 'Duplicate tagged users are not allowed' });
  }

  const geoLocation = {
    type: 'Point',
    coordinates: [parsedLocation.lon, parsedLocation.lat],
  };

  try {
    const users = await User.find({ _id: { $in: parsedTaggedUsers } });
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

    // Check existing tags and handle them
    await Promise.all(
      parsedTaggedUsers.map(async (taggedUserId: string) => {
        // from tagged to pictureTaker
        const existingTag = await Tag.findOne({
          creatorId: taggedUserId,
          taggedUserId: pictureTaker,
          isCompleted: false,
          location: geoLocation,
        });

        if (existingTag) {
          // Check if the tag has expired
          const timeDifference =
            currentTimestamp - existingTag.createdAt.getTime();
          if (timeDifference < config.tagDuration) {
            // Complete the existing tag
            await Tag.findByIdAndUpdate(existingTag._id, {
              $set: { isCompleted: true },
            });
            sendNotification(taggedUserId, 'Your tag has been completed!');
          }
          return;
        }

        // from pictureTaker to tagged
        const previousTag = await Tag.findOne({
          creatorId: pictureTaker,
          taggedUserId: taggedUserId,
          isCompleted: false,
        });

        if (previousTag) {
          await Tag.findByIdAndUpdate(previousTag._id, {
            $set: { createdAt: Date.now(), location: geoLocation },
          });
          sendNotification(taggedUserId, 'You have been tagged in a photo!');
          return;
        }

        // otherwise, create a new tag
        const newTag = new Tag({
          creatorId: pictureTaker,
          taggedUserId: taggedUserId,
          createdAt: currentTimestamp,
          isCompleted: false,
          location: geoLocation,
        });
        await newTag.save();
        sendNotification(taggedUserId, 'You have been tagged in a photo!');
      })
    );

    const newPhoto = new Photo({
      url: (result as any).secure_url,
      pictureTaker,
      taggedUsers: parsedTaggedUsers,
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
