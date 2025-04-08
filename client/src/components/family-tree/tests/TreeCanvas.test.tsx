import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TreeCanvas from '../TreeCanvas';
import { vi } from 'vitest';

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock the use query hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn().mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/family-members') {
        return {
          data: [
            {
              id: 1,
              name: 'John Smith',
              role: 'Grandfather',
              relationship: 'Grandfather',
              birth_date: '1950-01-01',
              location: 'New York',
              bio: 'Family patriarch',
              avatarUrl: null,
              user_id: null,
              personality_traits: [],
              interests: [],
              occupation: 'Retired'
            },
            {
              id: 2,
              name: 'Mary Smith',
              role: 'Grandmother',
              relationship: 'Grandmother',
              birth_date: '1952-03-15',
              location: 'New York',
              bio: 'Family matriarch',
              avatarUrl: null,
              user_id: null,
              personality_traits: [],
              interests: [],
              occupation: 'Retired'
            },
            {
              id: 3,
              name: 'Robert Smith',
              role: 'Father',
              relationship: 'Father',
              birth_date: '1975-06-10',
              location: 'Boston',
              bio: "John and Mary's son",
              avatarUrl: null,
              user_id: null,
              personality_traits: [],
              interests: [],
              occupation: 'Engineer'
            }
          ],
          isLoading: false,
        };
      } else if (queryKey[0] === '/api/relationships' && queryKey[1]?.format === 'flat') {
        return {
          data: [
            {
              id: 1,
              source_id: 1,
              target_id: 2,
              relationship_type: 'spouse',
              relation_category: 'immediate'
            },
            {
              id: 2,
              source_id: 1,
              target_id: 3,
              relationship_type: 'father',
              relation_category: 'immediate'
            },
            {
              id: 3,
              source_id: 2,
              target_id: 3,
              relationship_type: 'mother',
              relation_category: 'immediate'
            }
          ],
          isLoading: false,
        };
      } else if (queryKey[0] === '/api/relationships' && !queryKey[1]?.format) {
        // Return hierarchical data
        return {
          data: [
            {
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
              children: [
                {
                  id: 3,
                  name: 'Robert Smith',
                  relationship_type: 'father',
                  relation_category: 'immediate'
                }
              ],
              parents: [],
              siblings: [],
              extended: []
            },
            {
              id: 2,
              name: 'Mary Smith',
              role: 'Grandmother',
              generation: 0,
              spouse: {
                id: 1,
                name: 'John Smith',
                relationship_type: 'spouse',
                relation_category: 'immediate'
              },
              children: [
                {
                  id: 3,
                  name: 'Robert Smith',
                  relationship_type: 'mother',
                  relation_category: 'immediate'
                }
              ],
              parents: [],
              siblings: [],
              extended: []
            },
            {
              id: 3,
              name: 'Robert Smith',
              role: 'Father',
              generation: 1,
              children: [],
              parents: [
                {
                  id: 1,
                  name: 'John Smith',
                  relationship_type: 'father',
                  relation_category: 'immediate'
                },
                {
                  id: 2,
                  name: 'Mary Smith',
                  relationship_type: 'mother',
                  relation_category: 'immediate'
                }
              ],
              siblings: [],
              extended: []
            }
          ],
          isLoading: false,
        };
      }
      
      return { data: [], isLoading: false };
    })
  };
});

// Mock the RelationshipLine component
vi.mock('../RelationshipLine', () => ({
  default: ({ x1, y1, x2, y2, type, lineStyle }: any) => (
    <line
      data-testid={`relationship-line-${type}`}
      data-line-style={lineStyle}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="black"
    />
  ),
}));

// Mock the TreeNode component
vi.mock('../TreeNode', () => ({
  default: ({ member, x, y, size, onClick }: any) => (
    <g
      data-testid={`tree-node-${member.id}`}
      data-x={x}
      data-y={y}
      data-size={size}
      onClick={onClick}
    >
      <text>{member.name}</text>
    </g>
  ),
}));

describe('TreeCanvas Component', () => {
  const Wrapper = createWrapper();

  it('renders loading state', () => {
    vi.mocked(useQuery).mockImplementationOnce(() => ({
      data: undefined,
      isLoading: true,
    }));

    render(
      <Wrapper>
        <TreeCanvas />
      </Wrapper>
    );

    expect(screen.getByText('Loading family tree...')).toBeInTheDocument();
  });

  it('renders family members in hierarchical mode', () => {
    render(
      <Wrapper>
        <TreeCanvas visualizationType="hierarchical" />
      </Wrapper>
    );

    // Check for family member nodes
    expect(screen.getByTestId('tree-node-1')).toBeInTheDocument();
    expect(screen.getByTestId('tree-node-2')).toBeInTheDocument();
    expect(screen.getByTestId('tree-node-3')).toBeInTheDocument();

    // Check for relationship lines
    const spouseLines = screen.getAllByTestId('relationship-line-spouse');
    expect(spouseLines.length).toBeGreaterThan(0);
    
    const fatherLines = screen.getAllByTestId('relationship-line-father');
    expect(fatherLines.length).toBeGreaterThan(0);
  });

  it('renders family members in flat mode', () => {
    render(
      <Wrapper>
        <TreeCanvas visualizationType="flat" />
      </Wrapper>
    );

    // Check for family member nodes
    expect(screen.getByTestId('tree-node-1')).toBeInTheDocument();
    expect(screen.getByTestId('tree-node-2')).toBeInTheDocument();
    expect(screen.getByTestId('tree-node-3')).toBeInTheDocument();

    // In flat mode, relationship lines should be rendered differently
    const relationshipLines = screen.getAllByTestId(/relationship-line/);
    expect(relationshipLines.length).toBeGreaterThan(0);
  });

  it('calls onNodeClick when a node is clicked', () => {
    const onNodeClick = vi.fn();
    render(
      <Wrapper>
        <TreeCanvas visualizationType="hierarchical" onNodeClick={onNodeClick} />
      </Wrapper>
    );

    const node = screen.getByTestId('tree-node-1');
    fireEvent.click(node);
    expect(onNodeClick).toHaveBeenCalled();
  });

  it('supports zoom in/out functionality', () => {
    render(
      <Wrapper>
        <TreeCanvas visualizationType="hierarchical" zoomIn={true} />
      </Wrapper>
    );

    // Zoom is applied via CSS transforms, which can be tested by checking
    // if the transform attribute contains the expected scale value
    const canvasGroup = document.querySelector('g[transform]');
    expect(canvasGroup).toBeInTheDocument();
    expect(canvasGroup?.getAttribute('transform')).toContain('scale');
  });
});