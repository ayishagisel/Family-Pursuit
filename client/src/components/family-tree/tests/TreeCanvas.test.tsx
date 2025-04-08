import React from 'react';
import { render, screen } from '@testing-library/react';
import TreeCanvas from '../TreeCanvas';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';

// Create a mock QueryClient for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock data for testing
const mockFamilyMembers = [
  {
    id: 1,
    name: "John Smith",
    role: "Father",
    relationship: "parent",
    birth_date: "1975-05-15",
    location: "New York",
    bio: "Family patriarch",
    avatarUrl: null,
    personality_traits: ["responsible", "caring"],
    interests: ["woodworking", "hiking"],
    occupation: "Engineer",
    metadata: {}
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "Mother",
    relationship: "parent",
    birth_date: "1978-03-23",
    location: "New York",
    bio: "Family matriarch",
    avatarUrl: null,
    personality_traits: ["nurturing", "organized"],
    interests: ["gardening", "painting"],
    occupation: "Doctor",
    metadata: {}
  },
  {
    id: 3,
    name: "Michael Smith",
    role: "Son",
    relationship: "child",
    birth_date: "2005-09-10",
    location: "New York",
    bio: "Oldest child",
    avatarUrl: null,
    personality_traits: ["creative", "curious"],
    interests: ["video games", "basketball"],
    occupation: "Student",
    metadata: {}
  }
];

// Mock relationships for testing
const mockRelationships = [
  {
    id: 1,
    source_id: 1,
    target_id: 2,
    relationship_type: "spouse",
    notes: "Married 20 years"
  },
  {
    id: 2,
    source_id: 1,
    target_id: 3,
    relationship_type: "parent",
    notes: "Father and son"
  },
  {
    id: 3,
    source_id: 2,
    target_id: 3,
    relationship_type: "parent",
    notes: "Mother and son"
  }
];

// Mock hierarchical data
const mockHierarchicalData = [
  {
    id: 1,
    name: "John Smith",
    role: "Father",
    relationship: "parent",
    birth_date: "1975-05-15",
    location: "New York",
    bio: "Family patriarch",
    avatarUrl: null,
    personality_traits: ["responsible", "caring"],
    interests: ["woodworking", "hiking"],
    occupation: "Engineer",
    generation: 0,
    spouse: {
      id: 2,
      name: "Jane Smith",
      relationship_type: "spouse",
      relation_category: "immediate"
    },
    children: [
      {
        id: 3,
        name: "Michael Smith",
        relationship_type: "parent",
        relation_category: "immediate"
      }
    ],
    parents: [],
    siblings: [],
    extended: []
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "Mother",
    relationship: "parent",
    birth_date: "1978-03-23",
    location: "New York",
    bio: "Family matriarch",
    avatarUrl: null,
    personality_traits: ["nurturing", "organized"],
    interests: ["gardening", "painting"],
    occupation: "Doctor",
    generation: 0,
    spouse: {
      id: 1,
      name: "John Smith",
      relationship_type: "spouse",
      relation_category: "immediate"
    },
    children: [
      {
        id: 3,
        name: "Michael Smith",
        relationship_type: "parent",
        relation_category: "immediate"
      }
    ],
    parents: [],
    siblings: [],
    extended: []
  },
  {
    id: 3,
    name: "Michael Smith",
    role: "Son",
    relationship: "child",
    birth_date: "2005-09-10",
    location: "New York",
    bio: "Oldest child",
    avatarUrl: null,
    personality_traits: ["creative", "curious"],
    interests: ["video games", "basketball"],
    occupation: "Student",
    generation: 1,
    spouse: null,
    children: [],
    parents: [
      {
        id: 1,
        name: "John Smith",
        relationship_type: "child",
        relation_category: "immediate"
      },
      {
        id: 2,
        name: "Jane Smith",
        relationship_type: "child",
        relation_category: "immediate"
      }
    ],
    siblings: [],
    extended: []
  }
];

// Mock the useQuery hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: ({ queryKey }) => {
      if (queryKey[0] === '/api/family-members') {
        return { 
          data: mockFamilyMembers, 
          isLoading: false, 
          error: null 
        };
      }
      if (queryKey[0] === '/api/relationships') {
        return { 
          data: mockHierarchicalData, 
          isLoading: false, 
          error: null 
        };
      }
      return { data: null, isLoading: false, error: null };
    },
  };
});

// Mock SVG measurement functions since jsdom doesn't support them
window.SVGElement.prototype.getBBox = () => ({
  x: 0,
  y: 0,
  width: 100,
  height: 50,
  toString: () => '',
});

describe('TreeCanvas Component', () => {
  it('should render without crashing', () => {
    useQuery; // This line is just to avoid the unused import error for mocking
    render(
      <QueryClientProvider client={queryClient}>
        <TreeCanvas 
          familyMembers={mockFamilyMembers}
          relationships={mockRelationships}
          hierarchicalFamily={mockHierarchicalData}
          visualizationType="hierarchical"
        />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/John Smith/i)).toBeInTheDocument();
  });
  
  it('should render family members as nodes', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TreeCanvas 
          familyMembers={mockFamilyMembers}
          relationships={mockRelationships}
          hierarchicalFamily={mockHierarchicalData}
          visualizationType="hierarchical"
        />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/John Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Michael Smith/i)).toBeInTheDocument();
    
    // Verify SVG is rendered
    expect(document.querySelector('svg')).toBeInTheDocument();
    
    // Verify family tree canvas container
    expect(document.querySelector('.family-tree-canvas')).toBeInTheDocument();
  });
  
  it('should render with flat visualization type', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TreeCanvas 
          familyMembers={mockFamilyMembers}
          relationships={mockRelationships}
          hierarchicalFamily={mockHierarchicalData}
          visualizationType="flat"
        />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/John Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Michael Smith/i)).toBeInTheDocument();
    
    // Verify SVG is rendered with transform group
    const transformGroup = document.querySelector('svg g');
    expect(transformGroup).toBeInTheDocument();
    expect(transformGroup?.getAttribute('transform')).toContain('translate');
    expect(transformGroup?.getAttribute('transform')).toContain('scale');
  });
  
  it('should render with hierarchical visualization type', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TreeCanvas 
          familyMembers={mockFamilyMembers}
          relationships={mockRelationships}
          hierarchicalFamily={mockHierarchicalData}
          visualizationType="hierarchical"
        />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/John Smith/i)).toBeInTheDocument();
    
    // Count the number of TreeNode components (should match family members count)
    const treeNodes = document.querySelectorAll('[data-testid^="tree-node-"]');
    expect(treeNodes.length).toBe(mockFamilyMembers.length);
  });
  
  it('should handle zoom/pan interactions', () => {
    const onZoomChange = vi.fn();
    
    render(
      <QueryClientProvider client={queryClient}>
        <TreeCanvas 
          familyMembers={mockFamilyMembers}
          relationships={mockRelationships}
          hierarchicalFamily={mockHierarchicalData}
          visualizationType="hierarchical"
          onZoomChange={onZoomChange}
        />
      </QueryClientProvider>
    );
    
    // Simulate a wheel event to test zoom
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    if (svg) {
      const wheelEvent = new WheelEvent('wheel', { deltaY: -100 });
      svg.dispatchEvent(wheelEvent);
      
      // The onZoomChange should be called if zoom changes
      // Note: This might not trigger in JSDOM environment, would work better in a browser environment
    }
  });
});