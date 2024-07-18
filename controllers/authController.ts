import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import User from '../models/userModel';
import { getKeys } from '../config';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const { privateKey } = await getKeys();

  const accessToken = await new SignJWT({ userId: user.id })
    .setExpirationTime('1h')
    .sign(privateKey);

  const refreshToken = await new SignJWT({ userId: user.id })
    .setExpirationTime('30d')
    .sign(privateKey);

  res.json({ accessToken, refreshToken });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    const { publicKey } = await getKeys();
    const { payload } = await jwtVerify(refreshToken, publicKey);

    const { privateKey } = await getKeys();
    const accessToken = await new SignJWT({ userId: payload.userId })
      .setExpirationTime('1h')
      .sign(privateKey);

    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};
