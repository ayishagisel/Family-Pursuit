import React from 'react';
import { render } from '@testing-library/react';
import RelationshipLine from '../RelationshipLine';
import { vi } from 'vitest';

describe('RelationshipLine Component', () => {
  it('renders straight line for parent-child relationship', () => {
    const { container } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={100}
          y2={200}
          type="father"
          lineStyle="vertical"
        />
      </svg>
    );

    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    
    // Check path has father-relationship class
    expect(path).toHaveClass('father-relationship');
  });

  it('renders horizontal line for spouse relationship', () => {
    const { container } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={100}
          type="spouse"
          lineStyle="horizontal"
        />
      </svg>
    );

    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    
    // Check path has spouse-relationship class
    expect(path).toHaveClass('spouse-relationship');
  });

  it('renders curved line for sibling relationship', () => {
    const { container } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={100}
          type="sibling"
          lineStyle="curved"
        />
      </svg>
    );

    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    
    // Check path has sibling-relationship class and curved styles
    expect(path).toHaveClass('sibling-relationship');
  });

  it('renders dashed line for extended relationship', () => {
    const { container } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={200}
          type="cousin"
          lineStyle="dashed"
        />
      </svg>
    );

    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    
    // Check path has cousin-relationship class and dashed styles
    expect(path).toHaveClass('cousin-relationship');
    expect(path).toHaveAttribute('stroke-dasharray');
  });

  it('uses different styling based on relationship category', () => {
    const { container: immediateContainer } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={100}
          type="father"
          category="immediate"
        />
      </svg>
    );

    const { container: extendedContainer } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={100}
          type="uncle"
          category="extended"
        />
      </svg>
    );

    const { container: adoptiveContainer } = render(
      <svg>
        <RelationshipLine
          x1={100}
          y1={100}
          x2={200}
          y2={100}
          type="adoptive-father"
          category="adoptive"
        />
      </svg>
    );

    const immediatePath = immediateContainer.querySelector('path');
    const extendedPath = extendedContainer.querySelector('path');
    const adoptivePath = adoptiveContainer.querySelector('path');
    
    expect(immediatePath).toHaveAttribute('stroke-width', '2');
    expect(extendedPath).toHaveAttribute('stroke-width', '1.5');
    expect(adoptivePath).toHaveAttribute('stroke-dasharray');
  });
});