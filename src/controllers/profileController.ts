import { Request, Response } from 'express';
import User, { IUser } from '../models/userModel';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../utils/config';

// Get profile
async function getProfile(req: Request, res: Response) {
  try {
    const user = await User.findById(res.locals.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.toJSON());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Edit profile
const updateProfile = async (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { username, sticker } = req.body;

  try {
    // Find the current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({ message: 'Username already exists' });
      }
    }

    // Prepare updated fields
    let updatedFields: Partial<IUser> = { username, sticker };
    let oldProfilePicturePublicId: string | null = null;
    if (req.file) {
      // Upload new profile picture to Cloudinary
      const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'profile_pictures',
              transformation: config.cloudinary.profilePictureTransformation,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          )
          .end(req.file?.buffer);
      });
      const cloudinaryUrl = (uploadResponse as any).secure_url as string;
      updatedFields.profilePicture = cloudinaryUrl
        .replace(
          `https://res.cloudinary.com/${config.cloudinary.cloud_name}/image/upload/`,
          ''
        )
        .replace(/\//g, ':');

      // Prepare to delete the old profile picture from Cloudinary
      if (user.profilePicture) {
        oldProfilePicturePublicId = user.profilePicture
          .split(':')
          .slice(-1)[0]
          .split('.')[0];
      }
    }

    // Update the user with new details
    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, {
      new: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found after update' });
    }

    // Delete the old profile picture from Cloudinary if new one was uploaded successfully
    if (oldProfilePicturePublicId) {
      await cloudinary.uploader.destroy(
        `profile_pictures/${oldProfilePicturePublicId}`
      );
    }

    res.json(updatedUser.toJSON());
  } catch (err) {
    if (err instanceof Error) {
      res
        .status(500)
        .json({ message: 'Failed to update user profile', error: err.message });
    }
  }
};

export { getProfile, updateProfile };
