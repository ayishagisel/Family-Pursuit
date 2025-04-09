import { useEffect, useRef, useState } from "react";
import TreeNode from "./TreeNode";
import RelationshipLine from "./RelationshipLine";
import { FamilyMember } from "@shared/schema";
import { Loader2 } from "lucide-react";

type VisualizationType =
  | "hierarchical"
  | "ancestor"
  | "descendant"
  | "sociogram"
  | "flat";

interface TreeCanvasProps {
  nodes: any[]; // Hierarchical tree with children[]
  layout?: string;
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
    console.log("📦 Received tree with", nodes.length, "root nodes");
  }, [nodes]);

  const getNodeSize = () => 30;

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

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (onZoomChange) onZoomChange(transform.scale);
  }, [transform.scale, onZoomChange]);

  useEffect(() => {
    if (zoomIn) {
      setTransform((prev) => ({
        ...prev,
        scale: Math.min(2, prev.scale + 0.2),
      }));
    }
  }, [zoomIn]);

  useEffect(() => {
    if (zoomOut) {
      setTransform((prev) => ({
        ...prev,
        scale: Math.max(0.5, prev.scale - 0.2),
      }));
    }
  }, [zoomOut]);

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

  // ✅ Recursive relationship renderer (parent to children)
  const renderRelationships = () => {
    const lines: JSX.Element[] = [];

    const drawLines = (node) => {
      if (!node.children || node.children.length === 0) return;
      node.children.forEach((child) => {
        lines.push(
          <RelationshipLine
            key={`rel-${node.id}-${child.id}`}
            x1={node.x}
            y1={node.y}
            x2={child.x}
            y2={child.y}
            type="family"
            lineStyle="curved"
          />,
        );
        drawLines(child);
      });
    };

    positionedNodes.forEach((node) => drawLines(node));

    console.log("🔗 Drawing", lines.length, "relationship lines");
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
          {/* Draw lines first so they appear under the nodes */}
          {renderRelationships()}

          {/* Render all nodes */}
          {positionedNodes.map((member) => (
            <TreeNode
              key={member.id}
              member={member}
              x={member.x}
              y={member.y}
              size={getNodeSize()}
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

function layoutNodes(nodes: any[], layout: VisualizationType) {
  switch (layout) {
    case "hierarchical":
      return layoutHierarchical(nodes);
    case "flat":
      return layoutFlat(nodes);
    case "sociogram":
      return layoutSociogram(nodes);
    case "ancestor":
      return layoutHierarchical(nodes); // Placeholder
    case "descendant":
      return layoutHierarchical(nodes); // Placeholder
    default:
      return layoutHierarchical(nodes);
  }
}

// ✅ Recursive layout to space parent/children vertically
function layoutHierarchical(nodes: any[], depth = 0, xOffset = { value: 0 }) {
  let positioned = [];

  nodes.forEach((node) => {
    const x = xOffset.value * 180;
    const y = depth * 160;
    const positionedNode = { ...node, x, y };
    positioned.push(positionedNode);

    xOffset.value += 1;

    if (node.children?.length > 0) {
      const childNodes = layoutHierarchical(node.children, depth + 1, xOffset);
      positioned = positioned.concat(childNodes);
    }
  });

  return positioned;
}

function layoutFlat(nodes: any[]) {
  return nodes.map((node, index) => ({
    ...node,
    x: index * 180,
    y: 250,
  }));
}

function layoutSociogram(nodes: any[]) {
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
