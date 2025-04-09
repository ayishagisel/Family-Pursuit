import { useEffect, useRef, useState } from "react";
import TreeNode from "./TreeNode";
import RelationshipLine from "./RelationshipLine";
import { FamilyMember } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Define visualization types
type VisualizationType =
  | "hierarchical"
  | "ancestor"
  | "descendant"
  | "sociogram"
  | "flat";

interface TreeCanvasProps {
  nodes: FamilyMember[]; // The hierarchical family tree data
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
  visualizationType = "hierarchical",
}: TreeCanvasProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 200, y: 50, scale: 1.2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  const positionedNodes = layoutNodes(nodes, visualizationType);

  useEffect(() => {
    console.log("Built family tree with", nodes.length, "nodes");
  }, [nodes]);

  const getNodeSize = (member: FamilyMember) => 30;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY / 500;
    const newScale = Math.max(0.5, Math.min(2, transform.scale + delta));

    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const newX =
        transform.x - (mouseX - transform.x) * (newScale / transform.scale - 1);
      const newY =
        transform.y - (mouseY - transform.y) * (newScale / transform.scale - 1);
      setTransform({ x: newX, y: newY, scale: newScale });
    }
  };

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
      setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
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

  const renderRelationships = () => {
    const lines: JSX.Element[] = [];
    for (let i = 0; i < positionedNodes.length - 1; i++) {
      const node1 = positionedNodes[i];
      const node2 = positionedNodes[i + 1];

      lines.push(
        <RelationshipLine
          key={`rel-${node1.id}-${node2.id}`}
          x1={node1.x}
          y1={node1.y}
          x2={node2.x}
          y2={node2.y}
          type="family"
          lineStyle="curved"
        />,
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
          {renderRelationships()}
          {positionedNodes.map((member) => (
            <TreeNode
              key={member.id}
              member={member}
              x={member.x}
              y={member.y}
              size={getNodeSize(member)}
              onClick={() => onNodeClick?.(member)}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default TreeCanvas;

// === Layout Functions ===

function layoutNodes(nodes, layout: VisualizationType) {
  switch (layout) {
    case "hierarchical":
      return layoutHierarchical(nodes);
    case "flat":
      return layoutFlat(nodes);
    case "sociogram":
      return layoutSociogram(nodes);
    case "ancestor":
      return layoutHierarchical(nodes); // Customize later
    case "descendant":
      return layoutHierarchical(nodes); // Customize later
    default:
      return layoutHierarchical(nodes);
  }
}

function layoutHierarchical(nodes, depth = 0, xOffset = { value: 0 }) {
  let positioned = [];
  nodes.forEach((node) => {
    const x = xOffset.value * 180;
    const y = depth * 160;
    positioned.push({ ...node, x, y });

    xOffset.value += 1;

    if (node.children?.length) {
      positioned = positioned.concat(
        layoutHierarchical(node.children, depth + 1, xOffset),
      );
    }
  });
  return positioned;
}

function layoutFlat(nodes) {
  return nodes.map((node, index) => ({
    ...node,
    x: index * 180,
    y: 250,
  }));
}

function layoutSociogram(nodes) {
  const centerX = 300;
  const centerY = 300;
  const radius = 200;
  const angleStep = (2 * Math.PI) / nodes.length;

  return nodes.map((node, i) => ({
    ...node,
    x: centerX + radius * Math.cos(i * angleStep),
    y: centerY + radius * Math.sin(i * angleStep),
  }));
}