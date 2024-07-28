import { Request, Response } from 'express';
import { config } from '../utils/config';
import Tag from '../models/tagModel';
import { getHeatmapData } from '../utils/tagUtils';

const getTags = async (req: Request, res: Response) => {
  const skip = parseInt(req.query.skip as string) || 0;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 30);

  try {
    const userId = res.locals.userId;

    const earliestValidDate = new Date(Date.now() - config.tagDuration);
    const tags = await Tag.find({
      taggedUserId: userId,
      isCompleted: false,
      createdAt: { $gte: earliestValidDate },
    })
      .sort({ createdAt: 1 }) // Sort by createdAt in ascending order
      .skip(skip)
      .limit(limit)
      .populate('creatorId', 'username profilePicture');

    const totalTags = await Tag.countDocuments({
      taggedUserId: userId,
      isCompleted: false,
    });

    res.json({ tags: tags, total: totalTags, skip: skip, limit: limit });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve tags' });
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

const getStickers = async (req: Request, res: Response) => {
  const stickers = {
    stickers: config.cloudinary.stickers,
  };
  res.json(stickers);
};

export { getTags, getHeatmap, getStickers };
