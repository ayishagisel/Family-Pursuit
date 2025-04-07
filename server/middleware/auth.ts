import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../services/authService';
import { storage } from '../storage';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT tokens
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      console.log('Authentication failed: No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('Authentication failed: Invalid token');
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Fetch user from database to ensure it exists
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      console.log('Authentication failed: User not found', decoded.id);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    console.log('Authentication successful for user:', user.username);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}

/**
 * Middleware to check if a user has admin role
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Check if user has admin role (would typically check a role field)
  // For now we'll assume admin is determined by a specific user ID
  if (req.user.id !== 1) { // Assumes user with ID 1 is admin
    console.log('Admin access denied for user:', req.user.username);
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  console.log('Admin access granted for user:', req.user.username);
  next();
}