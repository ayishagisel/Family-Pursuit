import { describe, it, expect, beforeAll, afterAll } from 'jest';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { familyMembers, relationships } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Test database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

// Mock for the DatabaseStorage class from storage.db.ts
class TestDatabaseStorage {
  private calculateGenerations(membersMap: Map<number, any>): void {
    // Starting with root members (those who don't have parents in the dataset)
    const rootMembers = Array.from(membersMap.values()).filter(
      member => !member.parents || member.parents.length === 0
    );
    
    // Assign generation 0 to root members
    rootMembers.forEach(member => {
      member.generation = 0;
      if (member.children && member.children.length > 0) {
        this.assignGenerationToChildren(member, membersMap);
      }
    });
  }
  
  private assignGenerationToChildren(
    parent: any, 
    membersMap: Map<number, any>, 
    generation = 1
  ): void {
    parent.children.forEach((childRef: any) => {
      const child = membersMap.get(childRef.id);
      if (child) {
        // Only update generation if it's unset or the new value is greater
        if (child.generation === undefined || child.generation < generation) {
          child.generation = generation;
          if (child.children && child.children.length > 0) {
            this.assignGenerationToChildren(child, membersMap, generation + 1);
          }
        }
      }
    });
  }

  private determineRelationCategory(relationType: string): string {
    if (!relationType) return 'other';
  
    // Map relationship types to categories
    if (['parent', 'child', 'spouse', 'sibling'].includes(relationType)) {
      return 'immediate';
    } else if (['grandparent', 'grandchild', 'uncle', 'aunt', 'nephew', 'niece', 'cousin'].includes(relationType)) {
      return 'extended';
    } else if (relationType.includes('step')) {
      return 'step';
    } else if (relationType.includes('half')) {
      return 'half';
    } else if (relationType.includes('adopt')) {
      return 'adoptive';
    } else {
      return 'other';
    }
  }

  async transformToHierarchical(familyMembers: any[], relationships: any[]): Promise<any[]> {
    // Create a map of members for quick access
    const membersMap = new Map();
    
    // Initialize member data with empty arrays for relationships
    familyMembers.forEach(member => {
      membersMap.set(member.id, {
        ...member,
        spouse: null,
        children: [],
        parents: [],
        siblings: [],
        extended: []
      });
    });
    
    // Process relationships to build the hierarchical structure
    relationships.forEach(relationship => {
      const sourceMember = membersMap.get(relationship.source_id);
      const targetMember = membersMap.get(relationship.target_id);
      
      if (!sourceMember || !targetMember) return;
      
      const relationType = relationship.relationship_type;
      const relationCategory = this.determineRelationCategory(relationType);
      
      // Determine relationship category and add to appropriate arrays
      if (relationType === 'spouse') {
        sourceMember.spouse = {
          id: targetMember.id,
          name: targetMember.name,
          relationship_type: relationType,
          relation_category: relationCategory
        };
        targetMember.spouse = {
          id: sourceMember.id,
          name: sourceMember.name,
          relationship_type: relationType,
          relation_category: relationCategory
        };
      } else if (relationType === 'parent') {
        targetMember.parents.push({
          id: sourceMember.id,
          name: sourceMember.name,
          relationship_type: relationType,
          relation_category: relationCategory
        });
        sourceMember.children.push({
          id: targetMember.id,
          name: targetMember.name,
          relationship_type: 'child',
          relation_category: relationCategory
        });
      } else if (relationType === 'child') {
        sourceMember.parents.push({
          id: targetMember.id,
          name: targetMember.name,
          relationship_type: 'parent',
          relation_category: relationCategory
        });
        targetMember.children.push({
          id: sourceMember.id,
          name: sourceMember.name,
          relationship_type: relationType,
          relation_category: relationCategory
        });
      } else if (relationType === 'sibling' || relationType.includes('sibling')) {
        sourceMember.siblings.push({
          id: targetMember.id,
          name: targetMember.name,
          relationship_type: relationType,
          relation_category: relationCategory
        });
        targetMember.siblings.push({
          id: sourceMember.id,
          name: sourceMember.name,
          relationship_type: relationType,
          relation_category: relationCategory
        });
      } else {
        // Extended family and other relationships
        sourceMember.extended.push({
          id: targetMember.id,
          name: targetMember.name,
          relationship_type: relationType,
          relation_category: relationCategory
        });
        targetMember.extended.push({
          id: sourceMember.id,
          name: sourceMember.name,
          relationship_type: this.getInverseRelationshipType(relationType),
          relation_category: relationCategory
        });
      }
    });
    
    // Calculate generation levels for hierarchical visualization
    this.calculateGenerations(membersMap);
    
    // Convert map back to array
    return Array.from(membersMap.values());
  }

  private getInverseRelationshipType(relationType: string): string {
    const inverseMap: Record<string, string> = {
      'parent': 'child',
      'child': 'parent',
      'grandparent': 'grandchild',
      'grandchild': 'grandparent',
      'uncle': 'nephew',
      'aunt': 'niece',
      'nephew': 'uncle',
      'niece': 'aunt',
      'cousin': 'cousin'
    };
    
    return inverseMap[relationType] || relationType;
  }
}

describe('Hierarchical Data Transformation Tests', () => {
  let testStorage: TestDatabaseStorage;
  let allFamilyMembers: any[];
  let allRelationships: any[];

  beforeAll(async () => {
    testStorage = new TestDatabaseStorage();

    // Fetch real data from the database for testing with actual data
    allFamilyMembers = await db.select().from(familyMembers);
    allRelationships = await db.select().from(relationships);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should retrieve family members from the database', async () => {
    expect(allFamilyMembers).toBeDefined();
    expect(allFamilyMembers.length).toBeGreaterThan(0);
    
    // Check if required fields are present
    const firstMember = allFamilyMembers[0];
    expect(firstMember).toHaveProperty('id');
    expect(firstMember).toHaveProperty('name');
    expect(firstMember).toHaveProperty('role');
  });

  it('should retrieve relationships from the database', async () => {
    expect(allRelationships).toBeDefined();
    expect(allRelationships.length).toBeGreaterThan(0);
    
    // Check if required fields are present
    const firstRelationship = allRelationships[0];
    expect(firstRelationship).toHaveProperty('id');
    expect(firstRelationship).toHaveProperty('source_id');
    expect(firstRelationship).toHaveProperty('target_id');
    expect(firstRelationship).toHaveProperty('relationship_type');
  });

  it('should transform flat data into hierarchical structure', async () => {
    const hierarchicalData = await testStorage.transformToHierarchical(
      allFamilyMembers,
      allRelationships
    );
    
    expect(hierarchicalData).toBeDefined();
    expect(hierarchicalData.length).toBe(allFamilyMembers.length);
    
    // Check if hierarchical properties are added
    const firstMember = hierarchicalData[0];
    expect(firstMember).toHaveProperty('children');
    expect(firstMember).toHaveProperty('parents');
    expect(firstMember).toHaveProperty('siblings');
  });

  it('should properly assign generation levels', async () => {
    const hierarchicalData = await testStorage.transformToHierarchical(
      allFamilyMembers,
      allRelationships
    );
    
    // Find a parent and child relationship
    let parent, child;
    for (const member of hierarchicalData) {
      if (member.children && member.children.length > 0) {
        parent = member;
        // Find the child member from the parent's children array
        const childRef = parent.children[0];
        child = hierarchicalData.find(m => m.id === childRef.id);
        if (child) break;
      }
    }
    
    if (parent && child) {
      // Verify generation is correctly assigned
      expect(child.generation).toBe(parent.generation + 1);
    }
  });

  it('should handle spouse relationships correctly', async () => {
    const hierarchicalData = await testStorage.transformToHierarchical(
      allFamilyMembers,
      allRelationships
    );
    
    // Find a member with a spouse
    const memberWithSpouse = hierarchicalData.find(member => member.spouse !== null);
    
    if (memberWithSpouse) {
      const spouseId = memberWithSpouse.spouse.id;
      const spouse = hierarchicalData.find(member => member.id === spouseId);
      
      // Verify bidirectional spouse relationship
      expect(spouse).toBeDefined();
      expect(spouse?.spouse).toBeDefined();
      expect(spouse?.spouse.id).toBe(memberWithSpouse.id);
    }
  });

  it('should handle sibling relationships correctly', async () => {
    const hierarchicalData = await testStorage.transformToHierarchical(
      allFamilyMembers,
      allRelationships
    );
    
    // Find a member with siblings
    const memberWithSiblings = hierarchicalData.find(
      member => member.siblings && member.siblings.length > 0
    );
    
    if (memberWithSiblings) {
      const siblingId = memberWithSiblings.siblings[0].id;
      const sibling = hierarchicalData.find(member => member.id === siblingId);
      
      // Verify bidirectional sibling relationship
      expect(sibling).toBeDefined();
      expect(sibling?.siblings.some(s => s.id === memberWithSiblings.id)).toBe(true);
    }
  });

  it('should handle extended family relationships correctly', async () => {
    const hierarchicalData = await testStorage.transformToHierarchical(
      allFamilyMembers,
      allRelationships
    );
    
    // Find a member with extended family relationships
    const memberWithExtended = hierarchicalData.find(
      member => member.extended && member.extended.length > 0
    );
    
    if (memberWithExtended) {
      const extendedId = memberWithExtended.extended[0].id;
      const extended = hierarchicalData.find(member => member.id === extendedId);
      
      // Verify bidirectional extended relationship
      expect(extended).toBeDefined();
      expect(extended?.extended.some(e => e.id === memberWithExtended.id)).toBe(true);
    }
  });
});