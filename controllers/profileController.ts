import { Request, Response } from 'express';
import User from '../models/userModel';

// Get profile
async function getProfile(req: Request, res: Response) {
  try {
    const user = await User.findById(res.locals.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Edit profile
async function updateProfile(req: Request, res: Response) {
  try {
    const { username, profilePicture } = req.body;
    const user = await User.findByIdAndUpdate(
      res.locals.userId,
      { username, profilePicture },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export { getProfile, updateProfile };
