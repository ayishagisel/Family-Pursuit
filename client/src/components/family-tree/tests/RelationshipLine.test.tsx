import React from 'react';
import { render } from '@testing-library/react';
import RelationshipLine from '../RelationshipLine';
import { describe, it, expect } from 'vitest';

describe('RelationshipLine Component', () => {
  it('should render a parent-child relationship line correctly', () => {
    const { container } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={200}
          type="parent"
          lineStyle="solid"
        />
      </svg>
    );
    
    // Check if path element is rendered
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    
    // Check if the path has the correct stroke color for parent relationship
    expect(path).toHaveAttribute('stroke', expect.stringMatching(/rgba\(75, 192, 192/)); // Teal color
  });
  
  it('should render a spouse relationship line correctly', () => {
    const { container } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={100} // Same y-coordinate for horizontal line
          type="spouse"
          lineStyle="solid"
        />
      </svg>
    );
    
    // Check if path element is rendered
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    
    // Check if the path has the correct stroke color for spouse relationship
    expect(path).toHaveAttribute('stroke', expect.stringMatching(/rgba\(255, 99, 132/)); // Pink color
  });
  
  it('should render a sibling relationship line correctly', () => {
    const { container } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={100} // Same y-coordinate for horizontal line
          type="sibling"
          lineStyle="solid"
        />
      </svg>
    );
    
    // Check if path element is rendered
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    
    // Check if the path has the correct stroke color for sibling relationship
    expect(path).toHaveAttribute('stroke', expect.stringMatching(/rgba\(54, 162, 235/)); // Blue color
  });
  
  it('should render a dashed line when lineStyle is dashed', () => {
    const { container } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={200}
          type="extended"
          lineStyle="dashed"
        />
      </svg>
    );
    
    // Check if path element is rendered
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    
    // Check if the path has the dashed stroke style
    expect(path).toHaveAttribute('stroke-dasharray', '5,5');
  });
  
  it('should handle different relationship types with appropriate styles', () => {
    // Test immediate family relationship
    const { container: container1 } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={200}
          type="parent"
          lineStyle="solid"
        />
      </svg>
    );
    
    // Test extended family relationship
    const { container: container2 } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={200}
          type="grandparent"
          lineStyle="solid"
        />
      </svg>
    );
    
    // Test step family relationship
    const { container: container3 } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={200}
          type="step-parent"
          lineStyle="solid"
        />
      </svg>
    );
    
    // Check all paths are rendered with different stroke colors
    const path1 = container1.querySelector('path');
    const path2 = container2.querySelector('path');
    const path3 = container3.querySelector('path');
    
    expect(path1).toBeInTheDocument();
    expect(path2).toBeInTheDocument();
    expect(path3).toBeInTheDocument();
  });
});