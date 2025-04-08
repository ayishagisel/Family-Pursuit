import { describe, it, expect, beforeAll, afterAll } from 'jest';
import { db } from '../db';
import { DatabaseStorage } from '../storage.db';
import { FamilyMember, Relationship } from '@shared/schema';

const storage = new DatabaseStorage();

// Mock family data for testing
const mockFamilyMembers: FamilyMember[] = [
  {
    id: 1,
    name: "John Smith",
    role: "Grandfather",
    relationship: "Grandfather",
    birth_date: "1950-01-01",
    location: "New York",
    bio: "Family patriarch",
    avatarUrl: null,
    user_id: null,
    personality_traits: [],
    interests: [],
    occupation: "Retired"
  },
  {
    id: 2,
    name: "Mary Smith",
    role: "Grandmother",
    relationship: "Grandmother",
    birth_date: "1952-03-15",
    location: "New York",
    bio: "Family matriarch",
    avatarUrl: null,
    user_id: null,
    personality_traits: [],
    interests: [],
    occupation: "Retired"
  },
  {
    id: 3,
    name: "Robert Smith",
    role: "Father",
    relationship: "Father",
    birth_date: "1975-06-10",
    location: "Boston",
    bio: "John and Mary's son",
    avatarUrl: null,
    user_id: null,
    personality_traits: [],
    interests: [],
    occupation: "Engineer"
  },
  {
    id: 4,
    name: "Lisa Smith",
    role: "Mother",
    relationship: "Mother",
    birth_date: "1978-08-20",
    location: "Boston",
    bio: "Robert's wife",
    avatarUrl: null,
    user_id: null,
    personality_traits: [],
    interests: [],
    occupation: "Teacher"
  },
  {
    id: 5,
    name: "Emily Smith",
    role: "Daughter",
    relationship: "Daughter",
    birth_date: "2005-12-25",
    location: "Boston",
    bio: "Robert and Lisa's daughter",
    avatarUrl: null,
    user_id: null,
    personality_traits: [],
    interests: [],
    occupation: "Student"
  }
];

// Mock relationship data for testing
const mockRelationships: Relationship[] = [
  // John and Mary (spouses)
  {
    id: 1,
    source_id: 1,
    target_id: 2,
    relationship_type: "spouse",
    relation_category: "immediate"
  },
  // John and Robert (father-son)
  {
    id: 2,
    source_id: 1,
    target_id: 3,
    relationship_type: "father",
    relation_category: "immediate"
  },
  // Mary and Robert (mother-son)
  {
    id: 3,
    source_id: 2,
    target_id: 3,
    relationship_type: "mother",
    relation_category: "immediate"
  },
  // Robert and Lisa (spouses)
  {
    id: 4,
    source_id: 3,
    target_id: 4,
    relationship_type: "spouse",
    relation_category: "immediate"
  },
  // Robert and Emily (father-daughter)
  {
    id: 5,
    source_id: 3,
    target_id: 5,
    relationship_type: "father",
    relation_category: "immediate"
  },
  // Lisa and Emily (mother-daughter)
  {
    id: 6,
    source_id: 4,
    target_id: 5,
    relationship_type: "mother",
    relation_category: "immediate"
  }
];

// Test suite for hierarchical data transformation
describe('Hierarchical Family Structure Tests', () => {
  
  it('should correctly identify spouse relationships', () => {
    const result = identifySpouseRelationships(mockRelationships);
    expect(result.has(1)).toBeTruthy();
    expect(result.get(1)).toBe(2);
    expect(result.has(3)).toBeTruthy();
    expect(result.get(3)).toBe(4);
  });

  it('should correctly identify parent-child relationships', () => {
    const { parentChildMap, childParentMap } = identifyParentChildRelationships(mockRelationships);
    
    // Check parent-child map
    expect(parentChildMap.has(1)).toBeTruthy();
    expect(parentChildMap.get(1)).toContain(3);
    expect(parentChildMap.has(3)).toBeTruthy();
    expect(parentChildMap.get(3)).toContain(5);
    
    // Check child-parent map
    expect(childParentMap.has(3)).toBeTruthy();
    expect(childParentMap.get(3)).toContain(1);
    expect(childParentMap.get(3)).toContain(2);
    expect(childParentMap.has(5)).toBeTruthy();
    expect(childParentMap.get(5)).toContain(3);
    expect(childParentMap.get(5)).toContain(4);
  });

  it('should correctly calculate generations', () => {
    const membersMap = new Map();
    mockFamilyMembers.forEach(member => {
      membersMap.set(member.id, { ...member, children: [], parents: [], siblings: [], extended: [] });
    });
    
    const { parentChildMap } = identifyParentChildRelationships(mockRelationships);
    calculateGenerations(membersMap, parentChildMap);
    
    // Grandparents should be generation 0
    expect(membersMap.get(1).generation).toBe(0);
    expect(membersMap.get(2).generation).toBe(0);
    
    // Parents should be generation 1
    expect(membersMap.get(3).generation).toBe(1);
    expect(membersMap.get(4).generation).toBe(1);
    
    // Children should be generation 2
    expect(membersMap.get(5).generation).toBe(2);
  });

  it('should generate a complete hierarchical structure', () => {
    const hierarchicalStructure = generateHierarchicalStructure(mockFamilyMembers, mockRelationships);
    
    // Check structure size
    expect(hierarchicalStructure.length).toBe(5);
    
    // Check spouse relationships
    const john = hierarchicalStructure.find(m => m.id === 1);
    expect(john.spouse).toBeDefined();
    expect(john.spouse.id).toBe(2);
    
    const robert = hierarchicalStructure.find(m => m.id === 3);
    expect(robert.spouse).toBeDefined();
    expect(robert.spouse.id).toBe(4);
    
    // Check parent-child relationships
    expect(john.children.length).toBe(1);
    expect(john.children[0].id).toBe(3);
    
    expect(robert.children.length).toBe(1);
    expect(robert.children[0].id).toBe(5);
    
    const emily = hierarchicalStructure.find(m => m.id === 5);
    expect(emily.parents.length).toBe(2);
    expect(emily.parents.map(p => p.id).sort()).toEqual([3, 4]);
    
    // Check generations
    expect(john.generation).toBe(0);
    expect(robert.generation).toBe(1);
    expect(emily.generation).toBe(2);
  });
});

// Helper functions (these would typically be imported from your actual code)
function identifySpouseRelationships(relationships: Relationship[]): Map<number, number> {
  const spouseMap = new Map<number, number>();
  
  relationships
    .filter(rel => rel.relationship_type === 'spouse')
    .forEach(rel => {
      spouseMap.set(rel.source_id, rel.target_id);
      spouseMap.set(rel.target_id, rel.source_id);
    });
  
  return spouseMap;
}

function identifyParentChildRelationships(relationships: Relationship[]) {
  const parentChildMap = new Map<number, number[]>();
  const childParentMap = new Map<number, number[]>();
  
  relationships
    .filter(rel => rel.relationship_type === 'father' || rel.relationship_type === 'mother')
    .forEach(rel => {
      // Add to parent-child map
      if (!parentChildMap.has(rel.source_id)) {
        parentChildMap.set(rel.source_id, []);
      }
      parentChildMap.get(rel.source_id).push(rel.target_id);
      
      // Add to child-parent map
      if (!childParentMap.has(rel.target_id)) {
        childParentMap.set(rel.target_id, []);
      }
      childParentMap.get(rel.target_id).push(rel.source_id);
    });
  
  return { parentChildMap, childParentMap };
}

function calculateGenerations(membersMap: Map<number, any>, parentChildMap: Map<number, number[]>) {
  // Find members without parents (root nodes)
  const rootMembers: number[] = [];
  membersMap.forEach((_, key) => {
    const member = membersMap.get(key);
    if (member.parents.length === 0) {
      rootMembers.push(key);
    }
  });
  
  // Assign generation 0 to root members and calculate generations for descendants
  rootMembers.forEach(id => {
    assignGeneration(id, 0);
  });
  
  function assignGeneration(memberId: number, generation: number) {
    const member = membersMap.get(memberId);
    
    // Skip if this member already has a lower (older) generation number
    if (member.generation !== undefined && member.generation <= generation) {
      return;
    }
    
    // Assign generation to this member
    member.generation = generation;
    
    // Recursively assign generations to children
    const children = parentChildMap.get(memberId) || [];
    children.forEach(childId => {
      assignGeneration(childId, generation + 1);
    });
  }
}

function generateHierarchicalStructure(
  members: FamilyMember[],
  relationships: Relationship[]
) {
  // Create a map for easy member lookup
  const membersMap = new Map();
  members.forEach(member => {
    membersMap.set(member.id, {
      ...member,
      children: [],
      parents: [],
      siblings: [],
      extended: []
    });
  });
  
  // Identify spouse relationships
  const spouseMap = identifySpouseRelationships(relationships);
  
  // Set spouse for each member
  spouseMap.forEach((spouseId, memberId) => {
    const member = membersMap.get(memberId);
    const spouse = membersMap.get(spouseId);
    
    // Only set once to avoid circular reference
    if (member && spouse && memberId < spouseId) {
      member.spouse = {
        id: spouseId,
        name: spouse.name,
        relationship_type: 'spouse',
        relation_category: 'immediate'
      };
      
      spouse.spouse = {
        id: memberId,
        name: member.name,
        relationship_type: 'spouse',
        relation_category: 'immediate'
      };
    }
  });
  
  // Identify parent-child relationships
  const { parentChildMap, childParentMap } = identifyParentChildRelationships(relationships);
  
  // Add children to parents
  parentChildMap.forEach((childIds, parentId) => {
    const parent = membersMap.get(parentId);
    childIds.forEach(childId => {
      const child = membersMap.get(childId);
      if (parent && child) {
        const rel = relationships.find(
          r => r.source_id === parentId && r.target_id === childId
        );
        
        parent.children.push({
          id: childId,
          name: child.name,
          relationship_type: rel?.relationship_type || 'child',
          relation_category: rel?.relation_category || 'immediate'
        });
      }
    });
  });
  
  // Add parents to children
  childParentMap.forEach((parentIds, childId) => {
    const child = membersMap.get(childId);
    parentIds.forEach(parentId => {
      const parent = membersMap.get(parentId);
      if (child && parent) {
        const rel = relationships.find(
          r => r.source_id === parentId && r.target_id === childId
        );
        
        child.parents.push({
          id: parentId,
          name: parent.name,
          relationship_type: rel?.relationship_type || 'parent',
          relation_category: rel?.relation_category || 'immediate'
        });
      }
    });
  });
  
  // Calculate generations
  calculateGenerations(membersMap, parentChildMap);
  
  // Convert map to array
  const result: any[] = [];
  membersMap.forEach(member => {
    result.push(member);
  });
  
  return result;
}