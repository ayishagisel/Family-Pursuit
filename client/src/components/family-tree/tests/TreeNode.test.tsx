import React from 'react';
import { render, screen } from '@testing-library/react';
import TreeNode from '../TreeNode';
import { describe, it, expect } from 'vitest';

describe('TreeNode Component', () => {
  // Mock data for testing
  const mockMember = {
    id: 1,
    name: "John Smith",
    role: "Father",
    relationship: "parent",
    birth_date: "1975-05-15",
    location: "New York",
    bio: "Family patriarch",
    avatarUrl: null,
    user_id: null,
    personality_traits: ["responsible", "caring"],
    interests: ["woodworking", "hiking"],
    occupation: "Engineer",
    metadata: {}
  };
  
  const mockHierarchicalMember = {
    id: 1,
    name: "John Smith",
    role: "Father",
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
  };
  
  it('should render the node with the member name', () => {
    render(
      <svg>
        <TreeNode 
          member={mockMember}
          x={100}
          y={100}
          size={40}
        />
      </svg>
    );
    
    expect(screen.getByText(/JS/)).toBeInTheDocument(); // Initials
  });
  
  it('should apply the correct position based on x and y props', () => {
    const { container } = render(
      <svg>
        <TreeNode 
          member={mockMember}
          x={100}
          y={150}
          size={40}
        />
      </svg>
    );
    
    // Find the group element that wraps the node
    const group = container.querySelector('g');
    expect(group).toBeInTheDocument();
    expect(group?.getAttribute('transform')).toBe('translate(100, 150)');
  });
  
  it('should render with the correct size', () => {
    const { container } = render(
      <svg>
        <TreeNode 
          member={mockMember}
          x={100}
          y={100}
          size={60} // Larger size
        />
      </svg>
    );
    
    // Find the circle element
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle?.getAttribute('r')).toBe('30'); // radius is half the size
  });
  
  it('should highlight when isCurrentUser is true', () => {
    const { container } = render(
      <svg>
        <TreeNode 
          member={mockMember}
          x={100}
          y={100}
          size={40}
          isCurrentUser={true}
        />
      </svg>
    );
    
    // Find the circle element
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    
    // Should have a highlight style (could be a stroke or different fill)
    const stroke = circle?.getAttribute('stroke');
    const strokeWidth = circle?.getAttribute('stroke-width');
    
    expect(stroke).toBeTruthy(); // Should have some stroke color
    expect(strokeWidth).toBeTruthy(); // Should have a stroke width
  });
  
  it('should render additional information from hierarchical data', () => {
    const { container } = render(
      <svg>
        <TreeNode 
          member={mockMember}
          x={100}
          y={100}
          size={40}
          relationInfo={mockHierarchicalMember}
        />
      </svg>
    );
    
    // The node should contain additional visual cues for relationships
    // This could be tested by checking for specific elements or classes
    // For example, checking if generation data is reflected visually
    
    const text = container.querySelector('text')?.textContent;
    expect(text).toContain('JS'); // Should include initials
  });
  
  it('should handle click events', () => {
    const handleClick = vi.fn();
    
    render(
      <svg>
        <TreeNode 
          member={mockMember}
          x={100}
          y={100}
          size={40}
          onClick={handleClick}
        />
      </svg>
    );
    
    // Find the group element and trigger a click
    const group = screen.getByTestId(`tree-node-${mockMember.id}`);
    group.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    // The click handler should have been called
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockMember);
  });
});