import { describe, it, expect, beforeAll, afterAll } from 'jest';
import request from 'supertest';
import express from 'express';
import { Express } from 'express-serve-static-core';
import { registerRoutes } from '../routes';
import { db } from '../db';
import { DatabaseStorage } from '../storage.db';

describe('End-to-End Family Tree Tests', () => {
  let app: Express;
  let server: any;
  let storage: DatabaseStorage;
  
  // Test family member data
  const testFamilyMember = {
    name: 'Test Person',
    role: 'Tester',
    relationship: 'Tester',
    birth_date: '2000-01-01',
    location: 'Test Location',
    bio: 'Test biography',
    personality_traits: ['detail-oriented', 'methodical'],
    interests: ['testing', 'quality assurance'],
    occupation: 'Test Engineer'
  };

  // Setup and teardown
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    server.listen(0); // Use any available port
    storage = new DatabaseStorage();
  });

  afterAll(async () => {
    server.close();
    
    // Clean up test data
    try {
      // Delete test relationships
      const members = await storage.getAllFamilyMembers();
      const testMembers = members.filter(m => m.name.startsWith('Test'));
      
      for (const member of testMembers) {
        const relationships = await storage.getRelationshipsByMember(member.id);
        for (const rel of relationships) {
          await storage.deleteRelationship(rel.id);
        }
        await storage.deleteFamilyMember(member.id);
      }
    } catch (err) {
      console.error('Error cleaning up test data:', err);
    }
    
    await db.end();
  });

  it('should create family members and relationships, then render a complete tree', async () => {
    // Step 1: Create the first test family member
    const createMember1Response = await request(app)
      .post('/api/family-members')
      .send(testFamilyMember);
    
    expect(createMember1Response.status).toBe(201);
    expect(createMember1Response.body).toHaveProperty('id');
    const member1Id = createMember1Response.body.id;
    
    // Step 2: Create a second test family member
    const createMember2Response = await request(app)
      .post('/api/family-members')
      .send({
        ...testFamilyMember,
        name: 'Test Spouse',
        role: 'Spouse',
        relationship: 'Spouse'
      });
    
    expect(createMember2Response.status).toBe(201);
    expect(createMember2Response.body).toHaveProperty('id');
    const member2Id = createMember2Response.body.id;
    
    // Step 3: Create a child member
    const createMember3Response = await request(app)
      .post('/api/family-members')
      .send({
        ...testFamilyMember,
        name: 'Test Child',
        role: 'Child',
        relationship: 'Child'
      });
    
    expect(createMember3Response.status).toBe(201);
    expect(createMember3Response.body).toHaveProperty('id');
    const member3Id = createMember3Response.body.id;
    
    // Step 4: Create spouse relationship
    const createSpouseRelationshipResponse = await request(app)
      .post('/api/relationships')
      .send({
        source_id: member1Id,
        target_id: member2Id,
        relationship_type: 'spouse',
        relation_category: 'immediate'
      });
    
    expect(createSpouseRelationshipResponse.status).toBe(201);
    expect(createSpouseRelationshipResponse.body).toHaveProperty('id');
    
    // Step 5: Create parent-child relationships
    const createParentRelationship1Response = await request(app)
      .post('/api/relationships')
      .send({
        source_id: member1Id,
        target_id: member3Id,
        relationship_type: 'father',
        relation_category: 'immediate'
      });
    
    expect(createParentRelationship1Response.status).toBe(201);
    expect(createParentRelationship1Response.body).toHaveProperty('id');
    
    const createParentRelationship2Response = await request(app)
      .post('/api/relationships')
      .send({
        source_id: member2Id,
        target_id: member3Id,
        relationship_type: 'mother',
        relation_category: 'immediate'
      });
    
    expect(createParentRelationship2Response.status).toBe(201);
    expect(createParentRelationship2Response.body).toHaveProperty('id');
    
    // Step 6: Get hierarchical family tree and verify structure
    const getHierarchicalResponse = await request(app)
      .get('/api/relationships')
      .query({ type: 'hierarchical' });
    
    expect(getHierarchicalResponse.status).toBe(200);
    expect(Array.isArray(getHierarchicalResponse.body)).toBe(true);
    
    // Verify test members are in the hierarchical structure
    const testMembers = getHierarchicalResponse.body.filter(
      (m: any) => m.name.startsWith('Test')
    );
    expect(testMembers.length).toBeGreaterThan(0);
    
    // Find our test parent in the hierarchical structure
    const testParent = testMembers.find((m: any) => m.id === member1Id);
    expect(testParent).toBeDefined();
    
    // Verify spouse relationship
    expect(testParent.spouse).toBeDefined();
    expect(testParent.spouse.id).toBe(member2Id);
    
    // Verify child relationship
    expect(testParent.children).toBeDefined();
    expect(testParent.children.length).toBeGreaterThan(0);
    expect(testParent.children.some((c: any) => c.id === member3Id)).toBe(true);
    
    // Step 7: Test ancestor view
    const getAncestorResponse = await request(app)
      .get('/api/relationships')
      .query({ type: 'ancestor', rootId: member3Id });
    
    expect(getAncestorResponse.status).toBe(200);
    expect(Array.isArray(getAncestorResponse.body)).toBe(true);
    
    // Check that child and both parents are included
    const ancestorViewIds = getAncestorResponse.body.map((m: any) => m.id);
    expect(ancestorViewIds).toContain(member1Id);
    expect(ancestorViewIds).toContain(member2Id);
    expect(ancestorViewIds).toContain(member3Id);
    
    // Step 8: Test descendant view
    const getDescendantResponse = await request(app)
      .get('/api/relationships')
      .query({ type: 'descendant', rootId: member1Id });
    
    expect(getDescendantResponse.status).toBe(200);
    expect(Array.isArray(getDescendantResponse.body)).toBe(true);
    
    // Check that parent and child are included
    const descendantViewIds = getDescendantResponse.body.map((m: any) => m.id);
    expect(descendantViewIds).toContain(member1Id);
    expect(descendantViewIds).toContain(member3Id);
    
    // Step 9: Test sociogram view
    const getSociogramResponse = await request(app)
      .get('/api/relationships')
      .query({ type: 'sociogram' });
    
    expect(getSociogramResponse.status).toBe(200);
    expect(getSociogramResponse.body).toHaveProperty('nodes');
    expect(getSociogramResponse.body).toHaveProperty('links');
    
    // Check that our test members are in the nodes
    const nodeIds = getSociogramResponse.body.nodes.map((n: any) => n.id);
    expect(nodeIds).toContain(member1Id);
    expect(nodeIds).toContain(member2Id);
    expect(nodeIds).toContain(member3Id);
    
    // Check that our relationships are in the links
    const links = getSociogramResponse.body.links;
    const hasSpouseLink = links.some(
      (l: any) => 
        (l.source === member1Id && l.target === member2Id) || 
        (l.source === member2Id && l.target === member1Id)
    );
    expect(hasSpouseLink).toBe(true);
    
    const hasParentChildLinks = links.some(
      (l: any) => 
        (l.source === member1Id && l.target === member3Id) || 
        (l.source === member2Id && l.target === member3Id)
    );
    expect(hasParentChildLinks).toBe(true);
  });

  it('should correctly handle complex blended families', async () => {
    // Step 1: Create a biological family (2 parents, 2 children)
    const createBioParent1Response = await request(app)
      .post('/api/family-members')
      .send({
        ...testFamilyMember,
        name: 'Test Bio Parent 1',
        role: 'Biological Parent',
      });
    
    const bioParent1Id = createBioParent1Response.body.id;
    
    const createBioParent2Response = await request(app)
      .post('/api/family-members')
      .send({
        ...testFamilyMember,
        name: 'Test Bio Parent 2',
        role: 'Biological Parent',
      });
    
    const bioParent2Id = createBioParent2Response.body.id;
    
    const createBioChild1Response = await request(app)
      .post('/api/family-members')
      .send({
        ...testFamilyMember,
        name: 'Test Bio Child 1',
        role: 'Biological Child',
      });
    
    const bioChild1Id = createBioChild1Response.body.id;
    
    const createBioChild2Response = await request(app)
      .post('/api/family-members')
      .send({
        ...testFamilyMember,
        name: 'Test Bio Child 2',
        role: 'Biological Child',
      });
    
    const bioChild2Id = createBioChild2Response.body.id;
    
    // Step 2: Create a step-parent
    const createStepParentResponse = await request(app)
      .post('/api/family-members')
      .send({
        ...testFamilyMember,
        name: 'Test Step Parent',
        role: 'Step Parent',
      });
    
    const stepParentId = createStepParentResponse.body.id;
    
    // Step 3: Create a step-child
    const createStepChildResponse = await request(app)
      .post('/api/family-members')
      .send({
        ...testFamilyMember,
        name: 'Test Step Child',
        role: 'Step Child',
      });
    
    const stepChildId = createStepChildResponse.body.id;
    
    // Step 4: Create relationships
    // Original spouse relationship
    await request(app)
      .post('/api/relationships')
      .send({
        source_id: bioParent1Id,
        target_id: bioParent2Id,
        relationship_type: 'spouse',
        relation_category: 'immediate'
      });
    
    // New spouse relationship (after divorce/remarriage)
    await request(app)
      .post('/api/relationships')
      .send({
        source_id: bioParent1Id,
        target_id: stepParentId,
        relationship_type: 'spouse',
        relation_category: 'immediate'
      });
    
    // Biological parent relationships
    await request(app)
      .post('/api/relationships')
      .send({
        source_id: bioParent1Id,
        target_id: bioChild1Id,
        relationship_type: 'father',
        relation_category: 'immediate'
      });
    
    await request(app)
      .post('/api/relationships')
      .send({
        source_id: bioParent2Id,
        target_id: bioChild1Id,
        relationship_type: 'mother',
        relation_category: 'immediate'
      });
    
    await request(app)
      .post('/api/relationships')
      .send({
        source_id: bioParent1Id,
        target_id: bioChild2Id,
        relationship_type: 'father',
        relation_category: 'immediate'
      });
    
    await request(app)
      .post('/api/relationships')
      .send({
        source_id: bioParent2Id,
        target_id: bioChild2Id,
        relationship_type: 'mother',
        relation_category: 'immediate'
      });
    
    // Step-parent relationship
    await request(app)
      .post('/api/relationships')
      .send({
        source_id: stepParentId,
        target_id: bioChild1Id,
        relationship_type: 'step-father',
        relation_category: 'step'
      });
    
    await request(app)
      .post('/api/relationships')
      .send({
        source_id: stepParentId,
        target_id: bioChild2Id,
        relationship_type: 'step-father',
        relation_category: 'step'
      });
    
    // Step-child relationship
    await request(app)
      .post('/api/relationships')
      .send({
        source_id: stepParentId,
        target_id: stepChildId,
        relationship_type: 'father',
        relation_category: 'immediate'
      });
    
    await request(app)
      .post('/api/relationships')
      .send({
        source_id: bioParent1Id,
        target_id: stepChildId,
        relationship_type: 'step-father',
        relation_category: 'step'
      });
    
    // Step 5: Verify hierarchical structure
    const getHierarchicalResponse = await request(app)
      .get('/api/relationships')
      .query({ type: 'hierarchical' });
    
    expect(getHierarchicalResponse.status).toBe(200);
    
    // Get our test members
    const testMembers = getHierarchicalResponse.body.filter(
      (m: any) => m.name.startsWith('Test')
    );
    
    // Find the step parent in hierarchical structure
    const stepParent = testMembers.find((m: any) => m.id === stepParentId);
    expect(stepParent).toBeDefined();
    
    // Step parent should have both biological and step children
    expect(stepParent.children.length).toBeGreaterThan(1);
    
    // Find the biological parent in hierarchical structure
    const bioParent1 = testMembers.find((m: any) => m.id === bioParent1Id);
    expect(bioParent1).toBeDefined();
    
    // Bio parent should have biological and step children
    expect(bioParent1.children.length).toBeGreaterThan(2);
    
    // Verify different relation categories are preserved
    const hasStepRelation = bioParent1.children.some(
      (c: any) => c.id === stepChildId && c.relation_category === 'step'
    );
    expect(hasStepRelation).toBe(true);
    
    const hasBioRelation = bioParent1.children.some(
      (c: any) => c.id === bioChild1Id && c.relation_category === 'immediate'
    );
    expect(hasBioRelation).toBe(true);
  });
});