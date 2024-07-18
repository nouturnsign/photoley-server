import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/tokenUtils';

const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  try {
    const payload = await verifyToken(token);
    res.locals.userId = payload.userId;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}

export { authenticateToken };
