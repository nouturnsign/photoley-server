import { IStickerPosition } from '../models/photoModel';
import User from '../models/userModel';
import Tag from '../models/tagModel';
import { config } from './config';

const getStickerPublicID = (name: string) => {
  return 'stickers:' + name;
};

const sendNotification = (userId: string, message: string) => {
  // temporary implementation without APNs
  console.log(`Notification sent to user ${userId}: ${message}`);
};

const parseRequestBody = (body: any) => {
  try {
    const location = JSON.parse(body.location);
    const taggedUsers = JSON.parse(body.taggedUsers);
    const stickerPositions = JSON.parse(body.stickerPositions);

    if (
      typeof location.lat !== 'number' ||
      typeof location.lon !== 'number' ||
      !Array.isArray(taggedUsers) ||
      !Array.isArray(stickerPositions)
    ) {
      throw new Error('Invalid input format');
    }

    return {
      location,
      taggedUsers,
      stickerPositions,
    };
  } catch (error) {
    throw new Error('Invalid input format');
  }
};

const validateTaggedUsers = async (
  taggedUsers: string[],
  stickerPositions: IStickerPosition[]
) => {
  const uniqueTaggedUsers = Array.from(new Set(taggedUsers));
  if (uniqueTaggedUsers.length !== taggedUsers.length) {
    throw new Error('Tagged users should be unique');
  }

  const users = await User.find({ _id: { $in: uniqueTaggedUsers } });
  const userStickers = users.map((user) => user.sticker);

  if (userStickers.length !== stickerPositions.length) {
    throw new Error('Number of users and stickers should match');
  }

  return userStickers;
};

const buildStickerTransformations = (
  userStickers: string[],
  stickerPositions: IStickerPosition[]
) => {
  return userStickers.map((stickerID, i) => ({
    overlay: getStickerPublicID(stickerID),
    gravity: 'north_west',
    width: config.cloudinary.stickerSize,
    height: config.cloudinary.stickerSize,
    x: stickerPositions[i].x,
    y: stickerPositions[i].y,
  }));
};

const handleTags = async (
  taggedUsers: string[],
  pictureTaker: string,
  geoLocation: any,
  currentTimestamp: number
) => {
  await Promise.all(
    taggedUsers.map(async (taggedUserId: string) => {
      let existingTag = await Tag.findOne({
        creatorId: taggedUserId,
        taggedUserId: pictureTaker,
        isCompleted: false,
        location: geoLocation,
      });

      if (existingTag) {
        const timeDifference =
          currentTimestamp - existingTag.createdAt.getTime();
        if (timeDifference < config.tagDuration) {
          await Tag.findByIdAndUpdate(existingTag._id, {
            $set: { isCompleted: true },
          });
          sendNotification(taggedUserId, 'Your tag has been completed!');
          return;
        }
      }

      const previousTag = await Tag.findOne({
        creatorId: pictureTaker,
        taggedUserId,
        isCompleted: false,
      });

      if (previousTag) {
        await Tag.findByIdAndUpdate(previousTag._id, {
          $set: { createdAt: Date.now(), location: geoLocation },
        });
        sendNotification(taggedUserId, 'You have been tagged in a photo!');
        return;
      }

      const newTag = new Tag({
        creatorId: pictureTaker,
        taggedUserId,
        createdAt: currentTimestamp,
        isCompleted: false,
        location: geoLocation,
      });
      await newTag.save();
      sendNotification(taggedUserId, 'You have been tagged in a photo!');
    })
  );
};

export {
  getStickerPublicID,
  sendNotification,
  parseRequestBody,
  validateTaggedUsers,
  buildStickerTransformations,
};
