import { Request, Response } from 'express';
import User, { IUser } from '../models/userModel';
import { v2 as cloudinary } from 'cloudinary';

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
const updateProfile = async (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { username } = req.body;

  try {
    const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    let updatedFields: Partial<IUser> = { username };
    if (req.file) {
      const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'profile_pictures' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(req.file?.buffer);
      });
      updatedFields.profilePicture = (uploadResponse as any).secure_url;
    }

    const user = await User.findByIdAndUpdate(userId, updatedFields, { new: true }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: 'Failed to update user profile', error: err.message });
    }
  }
};

export { getProfile, updateProfile };
