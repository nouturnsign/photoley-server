import { Request, Response } from 'express';
import { comparePassword } from '../utils/authUtils';
import { createAccessToken, createRefreshToken, verifyToken } from '../utils/tokenUtils';
import User from '../models/userModel'; 

// Login endpoint
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

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

    // Send tokens as response
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export { login };
