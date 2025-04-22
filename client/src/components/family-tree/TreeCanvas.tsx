import { useEffect, useRef, useState, useMemo } from "react";
import TreeNode from "./TreeNode";
import RelationshipLine from "./RelationshipLine";
import { FamilyMember } from "@shared/schema";
import { Loader2 } from "lucide-react";
import * as d3Hierarchy from "d3-hierarchy";

import { getAncestors, getDescendants } from "../../lib/treeUtils";

type VisualizationType =
  | "hierarchical"
  | "ancestor"
  | "descendant"
  | "sociogram"
  | "flat";

interface TreeCanvasProps {
  nodes: any[];
  layout?: string;
  onNodeClick?: (member: FamilyMember) => void;
  onZoomChange?: (scale: number) => void;
  zoomIn?: boolean;
  zoomOut?: boolean;
  resetView?: boolean;
  visualizationType?: VisualizationType;
  selectedPersonId?: number; // ✨ New prop
}

interface PositionedNode extends FamilyMember {
  x: number;
  y: number;
  children?: PositionedNode[];
  _children?: PositionedNode[];
  parents?: any[];
  siblings?: any[];
  spouses?: any[];
  extended?: any[];
  generation?: number;
  parent?: PositionedNode;
  spouse?: PositionedNode;
  relationshipType?: string;
  _uniqueKey?: string;
}

interface RelationshipLineData {
  source: PositionedNode;
  target: PositionedNode;
  type: string;
  relationshipType: string;
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
  selectedPersonId,
}: TreeCanvasProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 200, y: 50, scale: 1.2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("📦 Received tree with", nodes.length, "root nodes");
  }, [nodes]);

  const { positionedNodes, relationships } = useMemo(() => {
    return processHierarchicalData(nodes, visualizationType, selectedPersonId);
  }, [nodes, visualizationType, selectedPersonId]);

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

      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));

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
      const newScale = Math.min(2, transform.scale + 0.2);
      setTransform((prev) => ({ ...prev, scale: newScale }));
    }
  }, [zoomIn]);

  useEffect(() => {
    if (zoomOut) {
      const newScale = Math.max(0.5, transform.scale - 0.2);
      setTransform((prev) => ({ ...prev, scale: newScale }));
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

  const renderRelationships = () => {
    return relationships.map((rel, index) => {
      const relationshipKey = `rel-${index}-${rel.source.id}-${rel.target.id}-${rel.type}`;
      return (
        <RelationshipLine
          key={relationshipKey}
          x1={rel.source.x}
          y1={rel.source.y}
          x2={rel.target.x}
          y2={rel.target.y}
          type={rel.relationshipType || "family"}
          lineStyle="straight"
        />
      );
    });
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
              key={member._uniqueKey || `member-${member.id}`}
              member={member}
              x={member.x}
              y={member.y}
              size={30}
              onClick={() => onNodeClick?.(member)}
              relationInfo={member}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default TreeCanvas;

// Add filter-based tree processor here
function processHierarchicalData(
  nodes: any[],
  visualizationType: VisualizationType,
  selectedPersonId?: number,
): {
  positionedNodes: PositionedNode[];
  relationships: RelationshipLineData[];
} {
  if (!nodes || nodes.length === 0)
    return { positionedNodes: [], relationships: [] };

  let filteredNodes = [...nodes];

  if (
    (visualizationType === "ancestor" || visualizationType === "descendant") &&
    selectedPersonId
  ) {
    const rootNode = nodes.find((n) => n.id === selectedPersonId);
    if (rootNode) {
      filteredNodes =
        visualizationType === "ancestor"
          ? getAncestors(rootNode, nodes)
          : getDescendants(rootNode, nodes);
    }
  }

  // Dummy layout for now – can plug in your real layout logic
  const positionedNodes = filteredNodes.map((node, i) => ({
    ...node,
    x: i * 150,
    y: 100,
    _uniqueKey: `node-${node.id}`,
  }));

  const relationships: RelationshipLineData[] = []; // Add real relationships if needed

  return { positionedNodes, relationships };
}
