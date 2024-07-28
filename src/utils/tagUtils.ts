import { config } from './config';
import Photo from '../models/photoModel';
import Tag from '../models/tagModel';
import { sendNotification } from './photoUtils';

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
          const newTag = new Tag({
            creatorId: pictureTaker,
            taggedUserId,
            createdAt: currentTimestamp,
            isCompleted: true,
            location: geoLocation,
          });
          await newTag.save();
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
