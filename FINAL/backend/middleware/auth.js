import jwt from 'jsonwebtoken';
import { redisClient } from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (redisClient) {
      const blacklisted = await redisClient.get(`blacklist:${token}`);
      if (blacklisted) {
        return res.status(401).json({ error: 'Token is invalid' });
      }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
