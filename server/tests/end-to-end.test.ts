import { describe, it, expect, beforeAll, afterAll } from 'jest';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import supertest from 'supertest';
import express from 'express';
import { json, urlencoded } from 'express';
import { registerRoutes } from '../routes';

// Test database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

describe('End-to-End Integration Tests', () => {
  let app: express.Express;
  let server: any;
  let authToken: string;
  let createdMemberId: number;
  
  beforeAll(async () => {
    // Create an Express app for testing
    app = express();
    app.use(json());
    app.use(urlencoded({ extended: true }));
    
    server = await registerRoutes(app);
    await db.$transaction([]);
    
    // Login to get an auth token
    const loginResponse = await supertest(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });
    
    if (loginResponse.body && loginResponse.body.token) {
      authToken = loginResponse.body.token;
    } else {
      console.warn('No authentication token retrieved. Some tests may fail.');
    }
  });
  
  afterAll(async () => {
    // Clean up any test data if needed
    if (createdMemberId) {
      try {
        await supertest(app)
          .delete(`/api/family-members/${createdMemberId}`)
          .set('Authorization', `Bearer ${authToken}`);
      } catch (err) {
        console.error('Error cleaning up test data:', err);
      }
    }
    
    server?.close();
    await pool.end();
  });
  
  describe('Family Member CRUD Operations', () => {
    it('should create a new family member', async () => {
      const testMember = {
        name: 'Test Family Member',
        role: 'Test Role',
        relationship: 'Other',
        birth_date: '1990-01-01',
        location: 'Test Location',
        bio: 'Test bio created for automated testing.',
        personality_traits: ['friendly', 'creative'],
        interests: ['reading', 'hiking'],
        occupation: 'Software Tester'
      };
      
      const response = await supertest(app)
        .post('/api/family-members')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testMember);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testMember.name);
      
      // Save the created member ID for later tests and cleanup
      createdMemberId = response.body.id;
    });
    
    it('should retrieve the created family member', async () => {
      if (!createdMemberId) {
        console.warn('No family member created, skipping test');
        return;
      }
      
      const response = await supertest(app)
        .get(`/api/family-members/${createdMemberId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdMemberId);
      expect(response.body).toHaveProperty('name', 'Test Family Member');
      expect(response.body).toHaveProperty('personality_traits');
      expect(Array.isArray(response.body.personality_traits)).toBe(true);
    });
    
    it('should update the created family member', async () => {
      if (!createdMemberId) {
        console.warn('No family member created, skipping test');
        return;
      }
      
      const updateData = {
        name: 'Updated Test Member',
        bio: 'This bio has been updated during automated testing.'
      };
      
      const response = await supertest(app)
        .put(`/api/family-members/${createdMemberId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdMemberId);
      expect(response.body).toHaveProperty('name', 'Updated Test Member');
      expect(response.body).toHaveProperty('bio', 'This bio has been updated during automated testing.');
    });
  });
  
  describe('Relationship Management', () => {
    let parentId: number;
    let relationshipId: number;
    
    it('should create a relationship between family members', async () => {
      if (!createdMemberId) {
        console.warn('No family member created, skipping test');
        return;
      }
      
      // First get an existing family member to create a relationship with
      const membersResponse = await supertest(app)
        .get('/api/family-members')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(membersResponse.status).toBe(200);
      expect(Array.isArray(membersResponse.body)).toBe(true);
      
      // Find a member other than our test member
      const otherMember = membersResponse.body.find((m: any) => m.id !== createdMemberId);
      if (!otherMember) {
        console.warn('No other family member found, skipping test');
        return;
      }
      
      parentId = otherMember.id;
      
      // Create a parent-child relationship
      const relationshipData = {
        source_id: parentId,
        target_id: createdMemberId,
        relationship_type: 'parent'
      };
      
      const response = await supertest(app)
        .post('/api/relationships')
        .set('Authorization', `Bearer ${authToken}`)
        .send(relationshipData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('source_id', parentId);
      expect(response.body).toHaveProperty('target_id', createdMemberId);
      
      relationshipId = response.body.id;
    });
    
    it('should verify the relationship is reflected in hierarchical data', async () => {
      if (!createdMemberId || !parentId) {
        console.warn('Setup not complete, skipping test');
        return;
      }
      
      // Get hierarchical data
      const response = await supertest(app)
        .get('/api/relationships?type=hierarchical')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Find the parent member in the hierarchical data
      const parentMember = response.body.find((m: any) => m.id === parentId);
      expect(parentMember).toBeDefined();
      
      // Verify the parent has the child in their children array
      if (parentMember) {
        const hasChild = parentMember.children.some((c: any) => c.id === createdMemberId);
        expect(hasChild).toBe(true);
      }
      
      // Find the child member in the hierarchical data
      const childMember = response.body.find((m: any) => m.id === createdMemberId);
      expect(childMember).toBeDefined();
      
      // Verify the child has the parent in their parents array
      if (childMember) {
        const hasParent = childMember.parents.some((p: any) => p.id === parentId);
        expect(hasParent).toBe(true);
      }
    });
    
    it('should update the relationship type', async () => {
      if (!relationshipId) {
        console.warn('No relationship created, skipping test');
        return;
      }
      
      const updateData = {
        relationship_type: 'step-parent'
      };
      
      const response = await supertest(app)
        .put(`/api/relationships/${relationshipId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', relationshipId);
      expect(response.body).toHaveProperty('relationship_type', 'step-parent');
    });
    
    it('should verify the updated relationship is reflected in visualization', async () => {
      if (!createdMemberId || !parentId) {
        console.warn('Setup not complete, skipping test');
        return;
      }
      
      // Get hierarchical data
      const response = await supertest(app)
        .get('/api/relationships?type=hierarchical')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      
      // Find the parent member in the hierarchical data
      const parentMember = response.body.find((m: any) => m.id === parentId);
      
      // Find the child in the parent's children array
      if (parentMember) {
        const childRelation = parentMember.children.find((c: any) => c.id === createdMemberId);
        expect(childRelation).toBeDefined();
        if (childRelation) {
          expect(childRelation.relationship_type).toBe('step-parent');
          // Check if relation category is correctly set
          expect(childRelation.relation_category).toBe('step');
        }
      }
    });
    
    it('should delete the relationship', async () => {
      if (!relationshipId) {
        console.warn('No relationship created, skipping test');
        return;
      }
      
      const response = await supertest(app)
        .delete(`/api/relationships/${relationshipId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid family member data', async () => {
      const invalidMember = {
        // Missing required fields like name
        role: 'Test Role'
      };
      
      const response = await supertest(app)
        .post('/api/family-members')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidMember);
      
      expect(response.status).toBe(400);
    });
    
    it('should handle invalid relationship data', async () => {
      const invalidRelationship = {
        // Missing target_id
        source_id: 1,
        relationship_type: 'parent'
      };
      
      const response = await supertest(app)
        .post('/api/relationships')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRelationship);
      
      expect(response.status).toBe(400);
    });
    
    it('should handle requests for non-existent resources', async () => {
      const response = await supertest(app)
        .get('/api/family-members/99999') // Assuming this ID doesn't exist
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('Cleanup', () => {
    it('should delete the test family member', async () => {
      if (!createdMemberId) {
        console.warn('No family member created, skipping test');
        return;
      }
      
      const response = await supertest(app)
        .delete(`/api/family-members/${createdMemberId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Check that the member is actually deleted
      const getResponse = await supertest(app)
        .get(`/api/family-members/${createdMemberId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getResponse.status).toBe(404);
    });
  });
});