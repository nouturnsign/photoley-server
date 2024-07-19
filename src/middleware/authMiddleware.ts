import { Request, Response, NextFunction } from 'express';
import { verifyToken, createAccessToken } from '../utils/tokenUtils';

const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const refreshToken = req.cookies.refreshToken;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyToken(token);
    res.locals.userId = payload.userId;
    next();
  } catch (err) {
    if (!refreshToken) {
      return res
        .status(401)
        .json({ message: 'Invalid token and no refresh token provided' });
    }

    try {
      const refreshPayload = await verifyToken(refreshToken);
      const newAccessToken = await createAccessToken(refreshPayload.userId);

      res.setHeader('Authorization', `Bearer ${newAccessToken}`);
      res.locals.userId = refreshPayload.userId;
      next();
    } catch (refreshErr) {
      console.error(refreshErr);
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  }
};

export { authenticateToken };
