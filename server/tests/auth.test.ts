import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';

// Mock the jsonwebtoken module
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      headers: {},
      user: undefined
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('authenticate middleware', () => {
    it('should return 401 if no token is provided', async () => {
      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Authentication token is required'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if the token is invalid', async () => {
      req.headers = { authorization: 'Bearer invalid-token' };
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Invalid authentication token'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should set the user and call next if the token is valid', async () => {
      req.headers = { authorization: 'Bearer valid-token' };
      const decodedUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      mockedJwt.verify.mockImplementation(() => decodedUser);

      await authenticate(req as Request, res as Response, next);

      expect(req.user).toEqual(decodedUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin middleware', () => {
    it('should return 403 if user is not an admin', () => {
      req.user = { id: 1, username: 'testuser', email: 'test@example.com' };

      requireAdmin(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Admin access required'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user is an admin', () => {
      req.user = { id: 1, username: 'admin', email: 'admin@example.com', isAdmin: true };

      requireAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});

describe('Password Hashing', () => {
  it('should hash passwords correctly', async () => {
    const password = 'securePassword123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Verify that the hashed password is different from the original
    expect(hashedPassword).not.toEqual(password);
    
    // Verify that the password can be compared correctly
    const isMatch = await bcrypt.compare(password, hashedPassword);
    expect(isMatch).toBe(true);
    
    // Verify that an incorrect password fails
    const isNotMatch = await bcrypt.compare('wrongPassword', hashedPassword);
    expect(isNotMatch).toBe(false);
  });
});