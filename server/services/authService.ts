import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';

const SECRET_KEY = process.env.SECRET_KEY || 'family-app-jwt-secret-key-12345';

/**
 * Hashes a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies a password against a hash
 * @param plainPassword Plain text password
 * @param hashedPassword Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generates a JWT token for a user
 * @param user User object
 * @returns JWT token
 */
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
}

/**
 * Verifies a JWT token
 * @param token JWT token
 * @returns Payload if token is valid, null otherwise
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Extracts JWT token from authorization header
 * @param authHeader Authorization header value
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}