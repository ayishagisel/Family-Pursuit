import { useEffect, useRef, useState, useMemo } from "react";
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
  nodes: any[];
  links?: any[]; // only used in sociogram
  layout?: string;
  onNodeClick?: (member: FamilyMember) => void;
  onZoomChange?: (scale: number) => void;
  zoomIn?: boolean;
  zoomOut?: boolean;
  resetView?: boolean;
  visualizationType?: VisualizationType;
  selectedPersonId?: number;
}

interface PositionedNode extends FamilyMember {
  x: number;
  y: number;
  _uniqueKey?: string;
}

interface RelationshipLineData {
  source: PositionedNode;
  target: PositionedNode;
  relationshipType: string;
}

function calculateCenteredTransform(
  nodes: PositionedNode[],
  svgWidth = 800,
  svgHeight = 600,
  scale = 1.0,
) {
  if (nodes.length === 0) {
    return { x: 0, y: 0, scale };
  }

  const minX = Math.min(...nodes.map((n) => n.x));
  const maxX = Math.max(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y));

  const treeWidth = maxX - minX;
  const treeHeight = maxY - minY;

  const centerX = minX + treeWidth / 2;
  const centerY = minY + treeHeight / 2;

  const canvasCenterX = svgWidth / 2;
  const canvasCenterY = svgHeight / 2;

  return {
    x: canvasCenterX - centerX * scale,
    y: canvasCenterY - centerY * scale,
    scale,
  };
}

const TreeCanvas = ({
  nodes = [],
  links = [],
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
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1.0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { positionedNodes, relationships } = useMemo(() => {
    return positionNodes(nodes, visualizationType, selectedPersonId);
  }, [nodes, visualizationType, selectedPersonId]);

  useEffect(() => {
    if (svgRef.current && positionedNodes.length > 0) {
      const bounds = svgRef.current.getBoundingClientRect();
      const centered = calculateCenteredTransform(
        positionedNodes,
        bounds.width,
        bounds.height,
        1.0,
      );
      setTransform(centered);
    }
  }, [positionedNodes]);

  useEffect(() => {
    if (resetView && svgRef.current && positionedNodes.length > 0) {
      const bounds = svgRef.current.getBoundingClientRect();
      const centered = calculateCenteredTransform(
        positionedNodes,
        bounds.width,
        bounds.height,
        1.0,
      );
      setTransform(centered);
    }
  }, [resetView, positionedNodes]);

  useEffect(() => {
    if (onZoomChange) onZoomChange(transform.scale);
  }, [transform.scale, onZoomChange]);

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

  const renderRelationships = () => {
    if (visualizationType === "sociogram" && links && links.length > 0) {
      return links.map((link, index) => {
        const source = positionedNodes.find((n) => n.id === link.source);
        const target = positionedNodes.find((n) => n.id === link.target);
        if (!source || !target) return null;

        return (
          <RelationshipLine
            key={`link-${index}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            type={link.type || "family"}
            lineStyle="curved"
          />
        );
      });
    }

    return relationships.map((rel, index) => (
      <RelationshipLine
        key={`rel-${index}`}
        x1={rel.source.x}
        y1={rel.source.y}
        x2={rel.target.x}
        y2={rel.target.y}
        type={rel.relationshipType || "family"}
        lineStyle="straight"
      />
    ));
  };

  return (
    <div className="family-tree-canvas relative w-full h-full overflow-hidden bg-background">
      {nodes.length === 0 ? (
        <div className="flex justify-center items-center h-full text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading family data...
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default TreeCanvas;

// 💡 Handles ALL visualization types including sociogram
function positionNodes(
  nodes: any[],
  visualizationType: VisualizationType,
  selectedPersonId?: number,
): {
  positionedNodes: PositionedNode[];
  relationships: RelationshipLineData[];
} {
  console.log("🧬 Generation breakdown:");
  nodes.forEach((node) => {
    console.log(`${node.name}: Generation ${node.generation}`);
  });
  if (!nodes || nodes.length === 0)
    return { positionedNodes: [], relationships: [] };

  if (visualizationType === "flat") {
    const positioned: PositionedNode[] = nodes.map((n: any, i: number) => ({
      ...n,
      x: (i % 5) * 180 - 360,
      y: Math.floor(i / 5) * 220,
      _uniqueKey: `flat-${n.id}`,
    }));
    return { positionedNodes: positioned, relationships: [] };
  }

  if (visualizationType === "sociogram") {
    const positioned: PositionedNode[] = nodes.map((n: any, i: number) => ({
      ...n,
      x: n.x ?? Math.cos(i) * 300 + 400,
      y: n.y ?? Math.sin(i) * 300 + 300,
      _uniqueKey: `sociogram-${n.id}`,
    }));
    return { positionedNodes: positioned, relationships: [] };
  }

  const withGeneration = nodes.filter((n) => typeof n.generation === "number");
  const generationGroups = new Map<number, PositionedNode[]>();
  withGeneration.forEach((node) => {
    const gen = node.generation!;
    if (!generationGroups.has(gen)) generationGroups.set(gen, []);
    generationGroups.get(gen)!.push(node);
  });

  const positionedNodes: PositionedNode[] = [];
  generationGroups.forEach((group, gen) => {
    const total = group.length;
    const y = gen * 200;
    group.forEach((member, i) => {
      const x = i * 180 - (total * 180) / 2;
      positionedNodes.push({
        ...member,
        x,
        y,
        _uniqueKey: `node-${member.id}`,
      });
    });
  });

  const relationships: RelationshipLineData[] = [];
  for (const member of positionedNodes) {
    const source = member;
    (member.children || []).forEach((childRef: any) => {
      const target = positionedNodes.find((n) => n.id === childRef.id);
      if (target) {
        relationships.push({
          source,
          target,
          relationshipType: "parent-child",
        });
      }
    });
    (member.spouses || []).forEach((spouseRef: any) => {
      const target = positionedNodes.find((n) => n.id === spouseRef.id);
      if (target) {
        relationships.push({
          source,
          target,
          relationshipType: "spouse",
        });
      }
    });
    (member.siblings || []).forEach((sibRef: any) => {
      const target = positionedNodes.find((n) => n.id === sibRef.id);
      if (target) {
        relationships.push({
          source,
          target,
          relationshipType: "sibling",
        });
      }
    });
  }

  return { positionedNodes, relationships };
}
