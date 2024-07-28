import Photo from '../models/photoModel';

const getStickerPublicID = (name: string) => {
  return 'stickers:' + name;
};

const sendNotification = (userId: string, message: string) => {
  // temporary implementation without APNs
  console.log(`Notification sent to user ${userId}: ${message}`);
};

const getHeatmapData = async (
  longitude: number,
  latitude: number,
  minDistance: number,
  maxDistance: number
) => {
  const heatmapData = await Photo.aggregate([
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
      $project: {
        _id: 0,
        location: '$location',
        tagCount: { $size: { $ifNull: ['$taggedUsers', []] } },
      },
    },
  ]);

  return heatmapData;
};

export { getStickerPublicID, sendNotification, getHeatmapData };
