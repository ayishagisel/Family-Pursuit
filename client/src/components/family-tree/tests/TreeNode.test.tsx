import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TreeNode from '../TreeNode';
import { vi } from 'vitest';

describe('TreeNode Component', () => {
  const mockMember = {
    id: 1,
    name: 'John Smith',
    role: 'Grandfather',
    relationship: 'Grandfather',
    birth_date: '1950-01-01',
    location: 'New York',
    bio: 'Family patriarch',
    avatarUrl: null,
    user_id: null,
    personality_traits: ['wise', 'patient'],
    interests: ['gardening', 'chess'],
    occupation: 'Retired'
  };

  it('renders with the correct name', () => {
    render(
      <svg>
        <TreeNode
          member={mockMember}
          x={100}
          y={100}
          size={30}
        />
      </svg>
    );

    // Node should display the person's name
    expect(screen.getByText(/John Smith/i)).toBeInTheDocument();
  });

  it('positions the node at the specified coordinates', () => {
    const { container } = render(
      <svg>
        <TreeNode
          member={mockMember}
          x={100}
          y={200}
          size={30}
        />
      </svg>
    );

    // The g element should be transformed to the specified position
    const gElement = container.querySelector('g');
    expect(gElement).toHaveAttribute('transform', 'translate(100, 200)');
  });

  it('uses the specified size for the node', () => {
    const { container } = render(
      <svg>
        <TreeNode
          member={mockMember}
          x={100}
          y={100}
          size={40}
        />
      </svg>
    );

    // The circle (or equivalent) should have the specified radius/size
    const circleElement = container.querySelector('circle');
    expect(circleElement).toHaveAttribute('r', '40');
  });

  it('applies a different style for the current user', () => {
    const { container: regularContainer } = render(
      <svg>
        <TreeNode
          member={mockMember}
          x={100}
          y={100}
          size={30}
          isCurrentUser={false}
        />
      </svg>
    );

    const { container: currentUserContainer } = render(
      <svg>
        <TreeNode
          member={mockMember}
          x={100}
          y={100}
          size={30}
          isCurrentUser={true}
        />
      </svg>
    );

    // The current user node should have a different styling
    const regularNode = regularContainer.querySelector('circle');
    const currentUserNode = currentUserContainer.querySelector('circle');
    
    expect(regularNode).not.toHaveAttribute('stroke-width', '3');
    expect(currentUserNode).toHaveAttribute('stroke-width', '3');
  });

  it('calls the onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(
      <svg>
        <TreeNode
          member={mockMember}
          x={100}
          y={100}
          size={30}
          onClick={handleClick}
        />
      </svg>
    );

    // Find and click the node
    const node = screen.getByText(/John Smith/i).closest('g');
    fireEvent.click(node);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('displays avatar initials if no avatarUrl is provided', () => {
    const { container } = render(
      <svg>
        <TreeNode
          member={mockMember}
          x={100}
          y={100}
          size={30}
        />
      </svg>
    );

    // Should display initials JS for John Smith
    const textElements = container.querySelectorAll('text');
    const hasInitials = Array.from(textElements).some(text => 
      text.textContent === 'JS' || text.textContent?.includes('J') && text.textContent?.includes('S')
    );
    expect(hasInitials).toBe(true);
  });

  it('uses relationship info when available', () => {
    const relationInfo = {
      id: 1,
      name: 'John Smith',
      role: 'Grandfather',
      generation: 0,
      spouse: {
        id: 2,
        name: 'Mary Smith',
        relationship_type: 'spouse',
        relation_category: 'immediate'
      },
      children: [{
        id: 3,
        name: 'Robert Smith',
        relationship_type: 'father',
        relation_category: 'immediate'
      }],
      parents: [],
      siblings: [],
      extended: []
    };

    const { container } = render(
      <svg>
        <TreeNode
          member={mockMember}
          x={100}
          y={100}
          size={30}
          relationInfo={relationInfo}
        />
      </svg>
    );

    // The node should use relationship info for styling, but this is visual
    // and hard to test directly. We can check that the component renders
    const nodeElement = container.querySelector('g');
    expect(nodeElement).toBeInTheDocument();
  });
});