import { IStickerPosition } from '../models/photoModel';
import User from '../models/userModel';
import Tag from '../models/tagModel';
import { config } from './config';

const getStickerPublicID = (name: string) => {
  return 'stickers:' + name;
};

const sendNotification = async (userId: string, message: string) => {
  // temporary implementation without APNs
  console.log(`Notification sent to user ${userId}: ${message}`);
};

const parsePhotoRequestBody = (body: any) => {
  try {
    const location = JSON.parse(body.location);
    const taggedUsers = JSON.parse(body.taggedUsers);

    if (
      typeof location.lat !== 'number' ||
      typeof location.lon !== 'number' ||
      !Array.isArray(taggedUsers)
    ) {
      throw new Error('Invalid input format');
    }

    return {
      location,
      taggedUsers,
    };
  } catch (error) {
    throw new Error('Invalid input format');
  }
};

export { getStickerPublicID, sendNotification, parsePhotoRequestBody };
