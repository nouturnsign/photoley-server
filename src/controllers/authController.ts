import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { comparePassword } from '../utils/authUtils';
import { createAccessToken, createRefreshToken } from '../utils/tokenUtils';
import User from '../models/userModel';
import { config, isProduction } from '../utils/config';

// Register endpoint
const register = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res
      .status(400)
      .json({ message: 'Email, password, and username are required' });
  }

  try {
    // Check if user already exists
    const existingEmail = await User.findOne({ email: email });

    if (existingEmail) {
      return res
        .status(409)
        .json({ message: 'User with this email already exists' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Upload profile picture to Cloudinary
    let profilePictureUrl = '';
    if (req.file) {
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
      profilePictureUrl = (uploadResponse as any).secure_url;
    }

    // Create a new user
    const newUser = new User({
      email,
      password,
      username,
      profilePicture: profilePictureUrl,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Create tokens
    const accessToken = await createAccessToken(savedUser.id);
    const refreshToken = await createRefreshToken(savedUser.id);

    // Send access token in the response header
    res.setHeader('Authorization', `Bearer ${accessToken}`);

    // Set refresh token as an HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // Use secure cookies in production
      sameSite: 'strict', // Mitigate CSRF attacks
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Send tokens as response
    res.status(201).json({
      user: {
        id: savedUser.id,
        email: savedUser.email,
        username: savedUser.username,
        profilePicture: savedUser.profilePicture,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status(500)
        .json({ message: 'Internal server error', error: error.message });
    }
  }
};

// Login endpoint
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare the provided password with the stored hash
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create access and refresh tokens
    const accessToken = await createAccessToken(user.id);
    const refreshToken = await createRefreshToken(user.id);

    // Send access token in the response header
    res.setHeader('Authorization', `Bearer ${accessToken}`);

    // Set refresh token as an HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // Use secure cookies in production
      sameSite: 'strict', // Mitigate CSRF attacks
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Send tokens as response
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export { register, login };
