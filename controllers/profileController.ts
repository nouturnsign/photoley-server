import { Request, Response } from 'express';
import User from '../models/userModel';

export const getProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select('username profilePicture');
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(user);
};

export const updateProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { username, profilePicture } = req.body;

  const user = await User.findByIdAndUpdate(userId, { username, profilePicture }, { new: true });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(user);
};
