import Photo from '../models/photoModel';

const getHeatmapData = async () => {
  const heatmapData = await Photo.aggregate([
    {
      $group: {
        _id: '$location',
        tagCount: { $sum: { $size: { $ifNull: ['$tags', []] } } }, // Assuming tags is an array
      },
    },
    {
      $project: {
        _id: 0,
        location: '$_id',
        tagCount: 1,
      },
    },
  ]);

  return heatmapData;
};

export { getHeatmapData };
