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

describe('Relationship API Tests', () => {
  let app: express.Express;
  let server: any;
  
  beforeAll(async () => {
    // Create an Express app for testing
    app = express();
    app.use(json());
    app.use(urlencoded({ extended: true }));
    
    server = await registerRoutes(app);
    await db.$transaction([]);
  });
  
  afterAll(async () => {
    server?.close();
    await pool.end();
  });
  
  it('should retrieve all relationships from /api/relationships', async () => {
    const response = await supertest(app).get('/api/relationships');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Validate the structure of the returned data
    const firstMember = response.body[0];
    expect(firstMember).toHaveProperty('id');
    expect(firstMember).toHaveProperty('name');
    
    // Check if the hierarchical structure is present
    expect(firstMember).toHaveProperty('spouse');
    expect(firstMember).toHaveProperty('children');
    expect(firstMember).toHaveProperty('parents');
    expect(firstMember).toHaveProperty('siblings');
    expect(firstMember).toHaveProperty('extended');
  });
  
  it('should retrieve hierarchical data with visualization type parameter', async () => {
    const response = await supertest(app)
      .get('/api/relationships?type=hierarchical');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // Check for indicators of hierarchical structure
    const memberWithChildren = response.body.find((m: any) => m.children && m.children.length > 0);
    if (memberWithChildren) {
      expect(memberWithChildren).toHaveProperty('generation');
      expect(typeof memberWithChildren.generation).toBe('number');
    }
  });
  
  it('should filter hierarchical data with root member parameter', async () => {
    // Find a member with children to use as root
    const allResponse = await supertest(app).get('/api/relationships');
    const memberWithChildren = allResponse.body.find((m: any) => m.children && m.children.length > 0);
    
    if (memberWithChildren) {
      const rootId = memberWithChildren.id;
      const response = await supertest(app)
        .get(`/api/relationships?type=hierarchical&rootId=${rootId}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // The root member should be included in the response
      const rootMember = response.body.find((m: any) => m.id === rootId);
      expect(rootMember).toBeDefined();
      
      // Verify children are included
      if (memberWithChildren.children.length > 0) {
        const childId = memberWithChildren.children[0].id;
        const childMember = response.body.find((m: any) => m.id === childId);
        expect(childMember).toBeDefined();
      }
    }
  });
  
  it('should retrieve ancestor data with visualization type parameter', async () => {
    // Find a member with parents to use as starting point
    const allResponse = await supertest(app).get('/api/relationships');
    const memberWithParents = allResponse.body.find((m: any) => m.parents && m.parents.length > 0);
    
    if (memberWithParents) {
      const memberId = memberWithParents.id;
      const response = await supertest(app)
        .get(`/api/relationships?type=ancestor&rootId=${memberId}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // The member should be included in the response
      const member = response.body.find((m: any) => m.id === memberId);
      expect(member).toBeDefined();
      
      // Verify parents are included if available
      if (memberWithParents.parents.length > 0) {
        const parentId = memberWithParents.parents[0].id;
        const parentMember = response.body.find((m: any) => m.id === parentId);
        expect(parentMember).toBeDefined();
      }
    }
  });
  
  it('should retrieve descendant data with visualization type parameter', async () => {
    // Find a member with children to use as starting point
    const allResponse = await supertest(app).get('/api/relationships');
    const memberWithChildren = allResponse.body.find((m: any) => m.children && m.children.length > 0);
    
    if (memberWithChildren) {
      const memberId = memberWithChildren.id;
      const response = await supertest(app)
        .get(`/api/relationships?type=descendant&rootId=${memberId}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // The member should be included in the response
      const member = response.body.find((m: any) => m.id === memberId);
      expect(member).toBeDefined();
      
      // Verify children are included
      if (memberWithChildren.children.length > 0) {
        const childId = memberWithChildren.children[0].id;
        const childMember = response.body.find((m: any) => m.id === childId);
        expect(childMember).toBeDefined();
      }
    }
  });
  
  it('should handle errors gracefully when invalid parameters are provided', async () => {
    // Test with invalid root ID
    const response = await supertest(app)
      .get('/api/relationships?type=hierarchical&rootId=999999');
    
    // Should still return 200 even with invalid root ID
    // (Endpoint should handle this gracefully and return an appropriate result)
    expect(response.status).toBe(200);
    
    // Test with invalid visualization type
    const invalidTypeResponse = await supertest(app)
      .get('/api/relationships?type=invalid_type');
    
    // Should still return 200 with the default visualization type
    expect(invalidTypeResponse.status).toBe(200);
    expect(Array.isArray(invalidTypeResponse.body)).toBe(true);
  });
});