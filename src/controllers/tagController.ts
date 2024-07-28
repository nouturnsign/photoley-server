import { Request, Response } from 'express';
import { config } from '../utils/config';
import Tag from '../models/tagModel';

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

export { getTags };
