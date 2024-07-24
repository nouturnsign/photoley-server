import Photo from '../models/photoModel';

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
        tagCount: { $size: { $ifNull: ['$tags', []] } },
        distance: 1,
      },
    },
  ]);

  return heatmapData;
};

export { getHeatmapData };
