import { config } from './config';
import Tag from '../models/tagModel';
import { sendNotification } from './photoUtils';
import mongoose from 'mongoose';

const handleTags = async (
  taggedUsers: string[],
  pictureTaker: string,
  geoLocation: any,
  currentTimestamp: number
) => {
  // Start a session for atomic operations
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const taggedUserId of taggedUsers) {
      // Check for an existing tag where taggedUserId and creatorId are swapped
      const existingTag = await Tag.findOne({
        creatorId: taggedUserId,
        taggedUserId: pictureTaker,
        createdAt: { $gte: new Date(currentTimestamp - config.tagDuration) },
      }).session(session);

      if (existingTag) {
        // Update the existing tag and create a new completed tag
        existingTag.isCompleted = true;
        await existingTag.save();

        await Tag.create(
          [
            {
              creatorId: pictureTaker,
              taggedUserId,
              createdAt: currentTimestamp,
              isCompleted: true,
              location: geoLocation,
            },
          ],
          { session }
        );
      } else {
        // Check for an existing incomplete tag
        const previousTag = await Tag.findOne({
          pictureTaker,
          taggedUserId,
          isCompleted: false,
        }).session(session);

        if (previousTag) {
          // Update the previous tag's createdAt
          previousTag.createdAt = new Date(currentTimestamp);
          await previousTag.save();
        } else {
          // Create a new tag
          await Tag.create(
            [
              {
                creatorId: pictureTaker,
                taggedUserId,
                createdAt: currentTimestamp,
                isCompleted: false,
                location: geoLocation,
              },
            ],
            { session }
          );
        }
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    // Abort the transaction in case of an error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getHeatmapData = async (
  longitude: number,
  latitude: number,
  minDistance: number,
  maxDistance: number
) => {
  const heatmapData = await Tag.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude], // [longitude, latitude]
        },
        distanceField: 'distance',
        spherical: true,
        minDistance: minDistance,
        maxDistance: maxDistance,
      },
    },
    {
      $group: {
        _id: '$location', // Group by location
        count: { $sum: 1 }, // Count the number of tags per location
      },
    },
    {
      $project: {
        _id: 0,
        location: '$_id', // Rename _id to location
        tagCount: '$count', // Rename count to tagCount
      },
    },
  ]);

  return heatmapData;
};

export { handleTags, getHeatmapData };
