import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../routes';
import { db } from '../db';
import { users } from '@shared/schema';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock the storage implementation
jest.mock('../storage', () => {
  return {
    storage: {
      getUser: jest.fn(),
      getUserByUsername: jest.fn(),
      createUser: jest.fn(),
      getFamilyMember: jest.fn(),
      getAllFamilyMembers: jest.fn(),
      createFamilyMember: jest.fn(),
      updateFamilyMember: jest.fn(),
      deleteFamilyMember: jest.fn(),
      getRelationship: jest.fn(),
      getRelationshipsByMember: jest.fn(),
      getAllRelationships: jest.fn(),
      createRelationship: jest.fn(),
      updateRelationship: jest.fn(),
      deleteRelationship: jest.fn(),
      getEvent: jest.fn(),
      getAllEvents: jest.fn(),
      getUpcomingEvents: jest.fn(),
      createEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
      addAttendee: jest.fn(),
      removeAttendee: jest.fn(),
      getDocument: jest.fn(),
      getAllDocuments: jest.fn(),
      getSecureDocuments: jest.fn(),
      createDocument: jest.fn(),
      updateDocument: jest.fn(),
      deleteDocument: jest.fn(),
      getHelpRequest: jest.fn(),
      getAllHelpRequests: jest.fn(),
      createHelpRequest: jest.fn(),
      updateHelpRequest: jest.fn(),
      deleteHelpRequest: jest.fn(),
      addVolunteer: jest.fn(),
      removeVolunteer: jest.fn(),
      getMessage: jest.fn(),
      getMessagesBySender: jest.fn(),
      getMessagesByReceiver: jest.fn(),
      createMessage: jest.fn(),
      markMessageAsRead: jest.fn(),
      deleteMessage: jest.fn(),
    }
  };
});

// Mock the jwt module
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('API Routes', () => {
  let app: Express;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user', async () => {
        const storage = require('../storage').storage;
        storage.getUserByUsername.mockResolvedValue(undefined);
        storage.createUser.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedpassword',
          is_admin: false
        });
        
        mockedBcrypt.hash.mockResolvedValue('hashedpassword');

        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('token');
        expect(storage.createUser).toHaveBeenCalled();
      });

      it('should return 400 if username already exists', async () => {
        const storage = require('../storage').storage;
        storage.getUserByUsername.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'existing@example.com',
          password: 'hashedpassword',
          is_admin: false
        });

        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(storage.createUser).not.toHaveBeenCalled();
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login a user with valid credentials', async () => {
        const storage = require('../storage').storage;
        storage.getUserByUsername.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedpassword',
          is_admin: false
        });
        
        mockedBcrypt.compare.mockResolvedValue(true);
        mockedJwt.sign.mockReturnValue('valid-token');

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'testuser',
            password: 'password123'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token', 'valid-token');
      });

      it('should return 401 with invalid credentials', async () => {
        const storage = require('../storage').storage;
        storage.getUserByUsername.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedpassword',
          is_admin: false
        });
        
        mockedBcrypt.compare.mockResolvedValue(false);

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'testuser',
            password: 'wrongpassword'
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });

      it('should return 404 if user not found', async () => {
        const storage = require('../storage').storage;
        storage.getUserByUsername.mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'nonexistentuser',
            password: 'password123'
          });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Family Member Endpoints', () => {
    describe('GET /api/family-members', () => {
      it('should return all family members', async () => {
        const storage = require('../storage').storage;
        storage.getAllFamilyMembers.mockResolvedValue([
          { id: 1, name: 'John Smith', role: 'Father' },
          { id: 2, name: 'Sarah Smith', role: 'Mother' }
        ]);

        const response = await request(app).get('/api/family-members');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(storage.getAllFamilyMembers).toHaveBeenCalled();
      });
    });

    describe('GET /api/family-members/:id', () => {
      it('should return a specific family member', async () => {
        const storage = require('../storage').storage;
        storage.getFamilyMember.mockResolvedValue({
          id: 1,
          name: 'John Smith',
          role: 'Father'
        });

        const response = await request(app).get('/api/family-members/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', 1);
        expect(storage.getFamilyMember).toHaveBeenCalledWith(1);
      });

      it('should return 404 if family member not found', async () => {
        const storage = require('../storage').storage;
        storage.getFamilyMember.mockResolvedValue(undefined);

        const response = await request(app).get('/api/family-members/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Relationship Endpoints', () => {
    describe('GET /api/relationships', () => {
      it('should return all relationships', async () => {
        const storage = require('../storage').storage;
        storage.getAllRelationships.mockResolvedValue([
          { id: 1, source_id: 1, target_id: 2, relationship_type: 'biological' },
          { id: 2, source_id: 1, target_id: 3, relationship_type: 'biological' }
        ]);

        const response = await request(app).get('/api/relationships');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(storage.getAllRelationships).toHaveBeenCalled();
      });
    });
  });

  // Add more test cases for other API endpoints as needed
});