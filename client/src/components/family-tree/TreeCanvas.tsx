import { useEffect, useRef, useState, useMemo } from "react";
import TreeNode from "./TreeNode";
import RelationshipLine from "./RelationshipLine";
import { FamilyMember } from "@shared/schema";
import { Loader2 } from "lucide-react";
import * as d3Hierarchy from "d3-hierarchy";

// Define visualization types
type VisualizationType =
  | "hierarchical"
  | "ancestor"
  | "descendant"
  | "sociogram"
  | "flat";

// Interface for TreeCanvas component props
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

// Interface for processed nodes that include position coordinates
interface PositionedNode extends FamilyMember {
  x: number;
  y: number;
  children?: PositionedNode[];
  _children?: PositionedNode[];
  parent?: PositionedNode | null;
  spouse?: PositionedNode | null;
  relationshipType?: string;
  _uniqueKey?: string;
  generation?: number;
}

// Interface for relationship lines
interface RelationshipLineData {
  source: PositionedNode;
  target: PositionedNode;
  type: string;
  relationshipType: string;
}

// Main component
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

  useEffect(() => {
    console.log("📦 Received tree with", nodes.length, "root nodes");
  }, [nodes]);

  // Process the data for hierarchical layout
  const { positionedNodes, relationships } = useMemo(() => {
    return processHierarchicalData(nodes, visualizationType);
  }, [nodes, visualizationType]);

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY / 500;
    const newScale = Math.max(0.5, Math.min(2, transform.scale + delta));

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
      
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
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

  // Get size for a node (can be customized based on role or importance)
  const getNodeSize = (member: FamilyMember) => {
    return 30; // Default size, can be customized
  };

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

  // Render relationship lines between nodes
  const renderRelationships = () => {
    console.log("🔗 Drawing", relationships.length, "relationship lines");

    return relationships.map((rel, index) => {
      // Choose line style based on relationship type
      let lineStyle: "straight" | "horizontal" | "vertical" | "curved" | "dashed" = "straight";
      
      if (rel.type === "spouse") {
        lineStyle = "horizontal";
      } else if (rel.type === "parent-child") {
        lineStyle = "vertical";
      } else if (rel.type === "sibling") {
        lineStyle = "curved";
      }
      
      // If this is a step, adoptive, or extended relationship, use dashed lines
      if (rel.relationshipType.includes("step") || 
          rel.relationshipType.includes("adopt") || 
          rel.relationshipType === "extended") {
        lineStyle = "dashed";
      }
      
      return (
        <RelationshipLine
          key={`rel-${index}-${rel.source.id}-${rel.target.id}`}
          x1={rel.source.x}
          y1={rel.source.y}
          x2={rel.target.x}
          y2={rel.target.y}
          type={rel.relationshipType || "family"}
          lineStyle={lineStyle}
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
          {/* Render the relationships first so they appear behind the nodes */}
          {renderRelationships()}
          
          {/* Render the nodes */}
          {positionedNodes.map(member => (
            <TreeNode
              key={member._uniqueKey || `member-${member.id}`}
              member={member}
              x={member.x}
              y={member.y}
              size={getNodeSize(member)}
              onClick={() => onNodeClick?.(member)}
              relationInfo={member as any}  // Pass hierarchical info
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default TreeCanvas;

// Helper function to process hierarchical data with improved handling for parent-child relationships
function processHierarchicalData(nodes: any[], visualizationType: VisualizationType) {
  if (!nodes || nodes.length === 0) {
    return { positionedNodes: [], relationships: [] };
  }
  
  // Create a tree representation suitable for d3.hierarchy
  const hierarchyData = createFamilyHierarchy(nodes);
  
  // Apply the appropriate layout algorithm based on visualization type
  let positionedNodes: PositionedNode[] = [];
  switch (visualizationType) {
    case "hierarchical":
      positionedNodes = applyHierarchicalLayout(hierarchyData);
      break;
    case "flat":
      positionedNodes = applyFlatLayout(nodes);
      break;
    case "sociogram":
      positionedNodes = applySociogramLayout(nodes);
      break;
    default:
      positionedNodes = applyHierarchicalLayout(hierarchyData);
  }
  
  // Extract relationships from the positioned nodes
  const relationships = extractRelationships(positionedNodes, nodes);
  
  return { positionedNodes, relationships };
}

// Create a family hierarchy with proper parent-child relationships
function createFamilyHierarchy(nodes: any[]) {
  // Create an artificial root node for the hierarchy
  const rootNode = {
    id: "root",
    name: "Family Root",
    children: [] as any[]
  };
  
  // Map of all nodes for quick lookup
  const nodeMap = new Map<number | string, any>();
  
  // Initialize nodes with proper structure for hierarchy processing
  nodes.forEach(node => {
    const processedNode = { 
      ...node, 
      children: [],
      _processed: false,
      generation: node.generation || 0
    };
    nodeMap.set(node.id, processedNode);
  });
  
  // Find parents with children and establish the relationships
  nodes.forEach(node => {
    // Skip already processed nodes
    if (nodeMap.get(node.id)._processed) return;
    
    const currentNode = nodeMap.get(node.id);
    
    // Process children
    if (node.children && node.children.length > 0) {
      node.children.forEach((childRef: any) => {
        const childNode = nodeMap.get(childRef.id);
        if (childNode && !childNode._processed) {
          // Add child to parent's children array
          currentNode.children.push(childNode);
          // Mark as processed to avoid duplicates
          childNode._processed = true;
        }
      });
    }
    
    // Process spouses - add to parent node's special property
    if (node.spouses && node.spouses.length > 0) {
      currentNode.spouses = [];
      node.spouses.forEach((spouseRef: any) => {
        const spouseNode = nodeMap.get(spouseRef.id);
        if (spouseNode) {
          // Store spouse reference
          currentNode.spouses.push(spouseNode);
          
          // First spouse is primary
          if (!currentNode.spouse) {
            currentNode.spouse = spouseNode;
          }
        }
      });
    }
    
    // Mark as processed
    currentNode._processed = true;
  });
  
  // Find nodes without parents to serve as roots
  const rootNodes = [];
  
  // Converting entries to array to avoid iterator issues
  const nodeEntries = Array.from(nodeMap.entries());
  for (const [id, node] of nodeEntries) {
    // A node is a root if it has no parent or its generation is 0
    const isRoot = (node.generation === 0 || node.generation === 1) && 
                  (!node.parent || node.parent === null);
    
    if (isRoot) {
      rootNodes.push(node);
    }
  }
  
  // If we found valid roots, add them to the artificial root
  if (rootNodes.length > 0) {
    rootNode.children = rootNodes;
  } else {
    // If no roots were found, use all nodes as roots
    // This can happen with inconsistent data
    rootNode.children = Array.from(nodeMap.values());
  }
  
  return rootNode;
}

// Apply hierarchical tree layout using d3-hierarchy
function applyHierarchicalLayout(hierarchyRoot: any) {
  // Convert to d3 hierarchy for layout calculation
  const root = d3Hierarchy.hierarchy(hierarchyRoot);
  
  // Configure the tree layout for good spacing
  const treeLayout = d3Hierarchy.tree<any>()
    .nodeSize([150, 180]) // [width, height] spacing between nodes
    .separation((a, b) => {
      // Increase separation between different parent subtrees
      return a.parent === b.parent ? 1.2 : 1.8;
    });
  
  // Apply the layout to get positions
  const treeData = treeLayout(root);
  
  // Convert back to our format with positions
  const positionedNodes: PositionedNode[] = [];
  const processedSpouses = new Set<number>();
  
  // Process all nodes using d3 hierarchy
  // Since descendants() might not be directly available in the type definition,
  // we'll use a manual traversal function
  function traverseTree(node: any, isRoot = false) {
    if (!node || !node.data) return;
    
    // Skip the artificial root node
    if (isRoot) {
      // Process children of root
      if (node.children) {
        node.children.forEach((child: any) => traverseTree(child));
      }
      return;
    }
    
    const originalNode = node.data;
    
    // Skip the artificial root node
    if (originalNode.id === "root") return;
    
    // Create a unique key for the node
    const uniqueNodeId = `node-${originalNode.id}`;
    
    // Add the node to the positioned nodes list
    positionedNodes.push({
      ...originalNode,
      x: node.x || 0,      // d3 tree layout uses x for horizontal position
      y: node.y || 0,      // and y for vertical position
      _uniqueKey: uniqueNodeId
    });
    
    // Handle spouse positioning side-by-side
    if (originalNode.spouse && !processedSpouses.has(originalNode.spouse.id)) {
      const uniqueSpouseId = `spouse-${originalNode.spouse.id}`;
      
      positionedNodes.push({
        ...originalNode.spouse,
        x: (node.x || 0) + 80, // Position spouse to the right
        y: node.y || 0,      // Same vertical level as the person
        _uniqueKey: uniqueSpouseId
      });
      
      // Mark the spouse as processed to avoid duplicates
      processedSpouses.add(originalNode.spouse.id);
    }
    
    // Recursively process children
    if (node.children) {
      node.children.forEach((child: any) => traverseTree(child));
    }
  }
  
  // Start traversal from the root
  traverseTree(treeData, true);
  
  return positionedNodes;
}

// Apply flat layout for visualization
function applyFlatLayout(nodes: any[]) {
  return nodes.map((node, index) => ({
    ...node,
    x: index * 150,
    y: 200,
    _uniqueKey: `flat-${node.id}`
  }));
}

// Apply sociogram layout (radial)
function applySociogramLayout(nodes: any[]) {
  const centerX = 300;
  const centerY = 300;
  const radius = 200;
  const angleStep = (2 * Math.PI) / nodes.length;

  return nodes.map((node, i) => ({
    ...node,
    x: centerX + radius * Math.cos(i * angleStep),
    y: centerY + radius * Math.sin(i * angleStep),
    _uniqueKey: `sociogram-${node.id}`
  }));
}

// Extract relationships for rendering lines
function extractRelationships(positionedNodes: PositionedNode[], originalNodes: any[]): RelationshipLineData[] {
  const relationships: RelationshipLineData[] = [];
  const nodeMap = new Map<number, PositionedNode>();
  
  // Create a map for quick lookup
  positionedNodes.forEach(node => {
    nodeMap.set(node.id, node);
  });
  
  // Process the original nodes to extract relationship data
  originalNodes.forEach(node => {
    const sourceNode = nodeMap.get(node.id);
    if (!sourceNode) return;
    
    // 1. Spouse relationships (horizontal connections)
    if (node.spouses && Array.isArray(node.spouses) && node.spouses.length > 0) {
      node.spouses.forEach((spouseRef: any) => {
        const targetNode = nodeMap.get(spouseRef.id);
        if (targetNode) {
          relationships.push({
            source: sourceNode,
            target: targetNode,
            type: "spouse",
            relationshipType: spouseRef.relationship_type || "spouse"
          });
        }
      });
    }
    
    // 2. Parent-child relationships (vertical connections)
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      node.children.forEach((childRef: any) => {
        const targetNode = nodeMap.get(childRef.id);
        if (targetNode) {
          relationships.push({
            source: sourceNode,
            target: targetNode,
            type: "parent-child",
            relationshipType: childRef.relationship_type || "biological"
          });
        }
      });
    }
    
    // 3. Child-parent relationships (also vertical, but in reverse)
    if (node.parents && Array.isArray(node.parents) && node.parents.length > 0) {
      node.parents.forEach((parentRef: any) => {
        const targetNode = nodeMap.get(parentRef.id);
        if (targetNode) {
          relationships.push({
            source: sourceNode,
            target: targetNode,
            type: "parent-child",
            relationshipType: `child-to-${parentRef.relationship_type || "parent"}`
          });
        }
      });
    }
    
    // 4. Sibling relationships (lateral connections)
    if (node.siblings && Array.isArray(node.siblings) && node.siblings.length > 0) {
      node.siblings.forEach((siblingRef: any) => {
        const targetNode = nodeMap.get(siblingRef.id);
        if (targetNode) {
          relationships.push({
            source: sourceNode,
            target: targetNode,
            type: "sibling",
            relationshipType: siblingRef.relationship_type || "sibling"
          });
        }
      });
    }
    
    // 5. Extended family relationships (various connections)
    if (node.extended && Array.isArray(node.extended) && node.extended.length > 0) {
      node.extended.forEach((extendedRef: any) => {
        const targetNode = nodeMap.get(extendedRef.id);
        if (targetNode) {
          relationships.push({
            source: sourceNode,
            target: targetNode,
            type: "extended",
            relationshipType: extendedRef.relationship_type || "extended"
          });
        }
      });
    }
  });
  
  return relationships;
}