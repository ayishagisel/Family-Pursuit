import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TreeCanvas from '../TreeCanvas';
import { vi, expect, describe, it } from 'vitest';

// Helper to generate a large family tree
function generateLargeFamilyTree(size: number) {
  const members = [];
  const relationships = [];
  const hierarchicalFamily = [];
  
  // Generate members (multiple generations)
  for (let i = 1; i <= size; i++) {
    // Basic member info
    members.push({
      id: i,
      name: `Person ${i}`,
      role: i <= 2 ? 'Grandparent' : i <= 6 ? 'Parent' : 'Child',
      relationship: i <= 2 ? 'Grandparent' : i <= 6 ? 'Parent' : 'Child',
      birth_date: '2000-01-01',
      location: 'Location',
      bio: `Biography for Person ${i}`,
      avatarUrl: null,
      user_id: null,
      personality_traits: ['trait1', 'trait2'],
      interests: ['interest1', 'interest2'],
      occupation: 'Occupation'
    });
    
    // Hierarchical structure
    const generation = i <= 2 ? 0 : i <= 6 ? 1 : 2;
    const hierarchicalMember = {
      id: i,
      name: `Person ${i}`,
      role: i <= 2 ? 'Grandparent' : i <= 6 ? 'Parent' : 'Child',
      relationship: i <= 2 ? 'Grandparent' : i <= 6 ? 'Parent' : 'Child',
      birth_date: '2000-01-01',
      location: 'Location',
      bio: `Biography for Person ${i}`,
      avatarUrl: null,
      personality_traits: ['trait1', 'trait2'],
      interests: ['interest1', 'interest2'],
      occupation: 'Occupation',
      generation,
      children: [],
      parents: [],
      siblings: [],
      extended: []
    };
    
    // Add spouse for first person in each generation
    if (i === 1 || i === 3) {
      hierarchicalMember.spouse = {
        id: i + 1,
        name: `Person ${i + 1}`,
        relationship_type: 'spouse',
        relation_category: 'immediate'
      };
    }
    
    // Add children relationships for first generation
    if (i <= 2) {
      for (let j = 3; j <= 6; j++) {
        hierarchicalMember.children.push({
          id: j,
          name: `Person ${j}`,
          relationship_type: i === 1 ? 'father' : 'mother',
          relation_category: 'immediate'
        });
        
        // Add relationship
        relationships.push({
          id: relationships.length + 1,
          source_id: i,
          target_id: j,
          relationship_type: i === 1 ? 'father' : 'mother',
          relation_category: 'immediate'
        });
      }
    }
    
    // Add children relationships for second generation
    if (i >= 3 && i <= 6) {
      for (let j = 7; j <= size; j += 4) {
        const childId = j + (i - 3);
        if (childId <= size) {
          hierarchicalMember.children.push({
            id: childId,
            name: `Person ${childId}`,
            relationship_type: i % 2 === 1 ? 'father' : 'mother',
            relation_category: 'immediate'
          });
          
          // Add relationship
          relationships.push({
            id: relationships.length + 1,
            source_id: i,
            target_id: childId,
            relationship_type: i % 2 === 1 ? 'father' : 'mother',
            relation_category: 'immediate'
          });
        }
      }
    }
    
    // Add parent relationships for all except first generation
    if (i >= 3) {
      const parentIds = i <= 6 ? [1, 2] : [3 + ((i - 7) % 4), 4 + ((i - 7) % 4)];
      parentIds.forEach(parentId => {
        if (parentId <= size) {
          hierarchicalMember.parents.push({
            id: parentId,
            name: `Person ${parentId}`,
            relationship_type: parentId % 2 === 1 ? 'father' : 'mother',
            relation_category: 'immediate'
          });
        }
      });
    }
    
    hierarchicalFamily.push(hierarchicalMember);
  }
  
  // Add spouse relationships
  for (let i = 1; i <= size; i += 2) {
    if (i + 1 <= size) {
      relationships.push({
        id: relationships.length + 1,
        source_id: i,
        target_id: i + 1,
        relationship_type: 'spouse',
        relation_category: 'immediate'
      });
    }
  }
  
  return { members, relationships, hierarchicalFamily };
}

// Mock the use query hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  const { members, relationships, hierarchicalFamily } = generateLargeFamilyTree(100);
  
  return {
    ...actual,
    useQuery: vi.fn().mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/family-members') {
        return {
          data: members,
          isLoading: false,
        };
      } else if (queryKey[0] === '/api/relationships' && queryKey[1]?.format === 'flat') {
        return {
          data: relationships,
          isLoading: false,
        };
      } else if (queryKey[0] === '/api/relationships' && !queryKey[1]?.format) {
        return {
          data: hierarchicalFamily,
          isLoading: false,
        };
      }
      
      return { data: [], isLoading: false };
    })
  };
});

// Mock the components to reduce test overhead
vi.mock('../RelationshipLine', () => ({
  default: ({ x1, y1, x2, y2, type }: any) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" />
  ),
}));

vi.mock('../TreeNode', () => ({
  default: ({ member, x, y, size }: any) => (
    <circle cx={x} cy={y} r={size} fill="blue" />
  ),
}));

describe('TreeCanvas Performance Tests', () => {
  const queryClient = new QueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('renders a large family tree within 10 seconds', () => {
    // Measure rendering time
    const startTime = performance.now();
    
    render(
      <Wrapper>
        <TreeCanvas visualizationType="hierarchical" />
      </Wrapper>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    console.log(`Large tree render time: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(10000); // Should render in less than 10 seconds
  });

  it('handles various visualization types efficiently', () => {
    // Test all visualization types
    const types: Array<"hierarchical" | "ancestor" | "descendant" | "sociogram" | "flat"> = [
      "hierarchical", "ancestor", "descendant", "sociogram", "flat"
    ];
    
    for (const type of types) {
      const startTime = performance.now();
      
      const { unmount } = render(
        <Wrapper>
          <TreeCanvas visualizationType={type} />
        </Wrapper>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      console.log(`Render time for ${type}: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(10000); // Should render in less than 10 seconds
      
      // Clean up between tests
      unmount();
    }
  });
});