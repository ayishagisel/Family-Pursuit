import { useEffect, useRef, useState } from "react";
import TreeNode from "./TreeNode";
import RelationshipLine from "./RelationshipLine";
import { FamilyMember } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Define visualization types
type VisualizationType = "hierarchical" | "ancestor" | "descendant" | "sociogram" | "flat";

interface TreeCanvasProps {
  nodes: any[]; // The hierarchical family tree data
  layout?: string; // Layout type for visualization
  onNodeClick?: (member: FamilyMember) => void;
  onZoomChange?: (scale: number) => void;
  zoomIn?: boolean;
  zoomOut?: boolean;
  resetView?: boolean;
  visualizationType?: VisualizationType;
}

const TreeCanvas = ({ 
  nodes = [],
  layout = "hierarchical",
  onNodeClick, 
  onZoomChange,
  zoomIn,
  zoomOut,
  resetView,
  visualizationType = "hierarchical"
}: TreeCanvasProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 200, y: 50, scale: 1.2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  // Node dimensions
  const NODE_WIDTH = 60;
  const NODE_HEIGHT = 60;
  const HORIZONTAL_SPACING = 140; // Space between spouse/siblings
  const VERTICAL_SPACING = 120;   // Space between generations

  // Simple grid layout for nodes
  const calculateNodePositions = () => {
    // Create a simple grid layout
    const positions: Record<number, { x: number, y: number }> = {};
    const GRID_COLS = 4;
    const START_X = 100;
    const START_Y = 100;
    
    // Position each node in a grid layout
    nodes.forEach((node, index) => {
      const row = Math.floor(index / GRID_COLS);
      const col = index % GRID_COLS;
      
      positions[node.id] = {
        x: START_X + (col * HORIZONTAL_SPACING),
        y: START_Y + (row * VERTICAL_SPACING)
      };
    });
    
    return positions;
  };

  // Calculate node positions
  const nodePositions = (() => {
    try {
      return calculateNodePositions();
    } catch (error) {
      console.error("Error calculating node positions:", error);
      return {};
    }
  })();
  
  useEffect(() => {
    console.log("Built family tree with", nodes.length, "nodes");
  }, [nodes]);

  // Get position for a specific node
  const getNodePosition = (member: FamilyMember) => {
    if (!member || typeof member.id !== 'number') {
      return { x: 0, y: 0 };
    }
    return nodePositions[member.id] || { x: 0, y: 0 };
  };

  // Get size for a node (can be adjusted based on role or importance)
  const getNodeSize = (member: FamilyMember) => {
    const baseSize = 30;
    return baseSize;
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY / 500;
    const newScale = Math.max(0.5, Math.min(2, transform.scale + delta));
    
    // Zoom centered on mouse position
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newX = transform.x - ((mouseX - transform.x) * (newScale / transform.scale - 1));
      const newY = transform.y - ((mouseY - transform.y) * (newScale / transform.scale - 1));
      
      setTransform({ x: newX, y: newY, scale: newScale });
    }
  };

  // Handle panning with mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setTransform({
        ...transform,
        x: transform.x + dx,
        y: transform.y + dy
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Global mouse up event
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  // Notify parent component of zoom changes
  useEffect(() => {
    if (onZoomChange) {
      onZoomChange(transform.scale);
    }
  }, [transform.scale, onZoomChange]);

  // Handle zoom in button
  useEffect(() => {
    if (zoomIn) {
      const newScale = Math.min(2, transform.scale + 0.2);
      setTransform(prev => ({
        ...prev,
        scale: newScale
      }));
    }
  }, [zoomIn]);

  // Handle zoom out button
  useEffect(() => {
    if (zoomOut) {
      const newScale = Math.max(0.5, transform.scale - 0.2);
      setTransform(prev => ({
        ...prev,
        scale: newScale
      }));
    }
  }, [zoomOut]);

  // Handle reset view button
  useEffect(() => {
    if (resetView) {
      setTransform({ x: 200, y: 50, scale: 1.2 });
    }
  }, [resetView]);

  // Loading indicator
  if (loading) {
    return (
      <div className="family-tree-canvas flex items-center justify-center p-6">
        <div className="text-neutral-500 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading family tree...</span>
        </div>
      </div>
    );
  }

  // Render relationships between nodes
  const renderRelationships = () => {
    const lines: JSX.Element[] = [];
    const processedRelationships = new Set<string>();
    
    // For this simple version, we'll just connect adjacent nodes
    // In a real implementation, you'd process actual relationship data
    for (let i = 0; i < nodes.length - 1; i++) {
      const node1 = nodes[i];
      const node2 = nodes[i + 1];
      
      const pos1 = getNodePosition(node1);
      const pos2 = getNodePosition(node2);
      
      const key = `rel-${node1.id}-${node2.id}`;
      
      lines.push(
        <RelationshipLine
          key={key}
          x1={pos1.x}
          y1={pos1.y}
          x2={pos2.x}
          y2={pos2.y}
          type="family"
          lineStyle="curved"
        />
      );
    }
    
    return lines;
  };

  return (
    <div className="family-tree-canvas relative w-full h-full overflow-hidden bg-background">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <g
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
        >
          {/* Render the relationships first so they appear behind the nodes */}
          {renderRelationships()}
          
          {/* Render the nodes */}
          {nodes.map(member => {
            const position = getNodePosition(member);
            const size = getNodeSize(member);
            
            return (
              <TreeNode
                key={member.id}
                member={member}
                x={position.x}
                y={position.y}
                size={size}
                onClick={() => onNodeClick?.(member)}
              />
            );
          })}
        </g>
      </svg>
      
      {/* Optional UI overlays can go here */}
    </div>
  );
};

export default TreeCanvas;