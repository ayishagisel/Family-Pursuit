import { describe, it, expect, beforeAll, afterAll } from 'jest';
import request from 'supertest';
import express from 'express';
import { Express } from 'express-serve-static-core';
import { registerRoutes } from '../routes';
import { db } from '../db';

describe('Relationship API Tests', () => {
  let app: Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    server.listen(0); // Use any available port for testing
  });

  afterAll(async () => {
    server.close();
    await db.end();
  });

  it('should return hierarchical family structure from /api/relationships', async () => {
    const response = await request(app)
      .get('/api/relationships')
      .query({ type: 'hierarchical' });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // Check for hierarchical structure properties
    if (response.body.length > 0) {
      const member = response.body[0];
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('generation');
      expect(member).toHaveProperty('children');
      expect(member).toHaveProperty('parents');
      expect(member).toHaveProperty('siblings');
      expect(member).toHaveProperty('extended');
      
      // Children should be an array with proper format
      if (member.children.length > 0) {
        const child = member.children[0];
        expect(child).toHaveProperty('id');
        expect(child).toHaveProperty('name');
        expect(child).toHaveProperty('relationship_type');
        expect(child).toHaveProperty('relation_category');
      }
    }
  });

  it('should return ancestor view from /api/relationships', async () => {
    const response = await request(app)
      .get('/api/relationships')
      .query({ type: 'ancestor', rootId: 5 }); // Using Emily (id=5) as root
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // The response should include Emily and her ancestors
    const memberIds = response.body.map((m: any) => m.id);
    expect(memberIds).toContain(5); // Emily
    expect(memberIds).toContain(3); // Robert (father)
    expect(memberIds).toContain(4); // Lisa (mother)
    expect(memberIds).toContain(1); // John (grandfather)
    expect(memberIds).toContain(2); // Mary (grandmother)
  });

  it('should return descendant view from /api/relationships', async () => {
    const response = await request(app)
      .get('/api/relationships')
      .query({ type: 'descendant', rootId: 1 }); // Using John (id=1) as root
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // The response should include John and his descendants
    const memberIds = response.body.map((m: any) => m.id);
    expect(memberIds).toContain(1); // John
    expect(memberIds).toContain(3); // Robert (son)
    expect(memberIds).toContain(5); // Emily (granddaughter)
  });

  it('should return sociogram view from /api/relationships', async () => {
    const response = await request(app)
      .get('/api/relationships')
      .query({ type: 'sociogram' });
    
    expect(response.status).toBe(200);
    
    // The sociogram should have both nodes and links
    expect(response.body).toHaveProperty('nodes');
    expect(response.body).toHaveProperty('links');
    expect(Array.isArray(response.body.nodes)).toBe(true);
    expect(Array.isArray(response.body.links)).toBe(true);
    
    // Check node structure
    if (response.body.nodes.length > 0) {
      const node = response.body.nodes[0];
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('name');
    }
    
    // Check link structure
    if (response.body.links.length > 0) {
      const link = response.body.links[0];
      expect(link).toHaveProperty('source');
      expect(link).toHaveProperty('target');
      expect(link).toHaveProperty('type');
      expect(link).toHaveProperty('category');
    }
  });

  it('should return flat relationship list with format=flat parameter', async () => {
    const response = await request(app)
      .get('/api/relationships')
      .query({ format: 'flat' });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // Check for flat relationship structure
    if (response.body.length > 0) {
      const relationship = response.body[0];
      expect(relationship).toHaveProperty('id');
      expect(relationship).toHaveProperty('source_id');
      expect(relationship).toHaveProperty('target_id');
      expect(relationship).toHaveProperty('relationship_type');
    }
  });
});