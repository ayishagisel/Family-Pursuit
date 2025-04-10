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
  if (!nodes || nodes.length === 0) {
    return {
      id: "root",
      name: "Family Root",
      children: []
    };
  }
  
  console.log("Building hierarchical family tree with", nodes.length, "members");
  
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
    
    // Debug logging for generation assignments
    console.log(`ID: ${node.id} | Name: ${node.name} | Parent ID: ${node.parent || 'null'} | Generation: ${node.generation || 'unknown'}`);
  });
  
  // First, establish parent-child relationships
  nodes.forEach(node => {
    const currentNode = nodeMap.get(node.id);
    
    // Skip if already fully processed
    if (currentNode._processed) return;
    
    // If node has a parent, establish the relationship
    if (node.parent) {
      const parentNode = nodeMap.get(node.parent);
      if (parentNode) {
        // Add this node as a child of the parent
        if (!parentNode.children.some((child: any) => child.id === node.id)) {
          parentNode.children.push(currentNode);
        }
      }
    }
    
    // Process explicit children references
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      node.children.forEach((childRef: any) => {
        const childNode = nodeMap.get(childRef.id);
        if (childNode && !currentNode.children.some((c: any) => c.id === childRef.id)) {
          // Add child to parent's children array
          currentNode.children.push(childNode);
          
          // Set parent reference on the child for backward navigation
          childNode.parent = node.id;
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
          
          // Make first spouse the primary spouse
          if (!currentNode.spouse) {
            currentNode.spouse = spouseNode;
          }
          
          // Also establish shared children
          // Children of either spouse become children of both
          if (spouseNode.children && spouseNode.children.length > 0) {
            spouseNode.children.forEach((childNode: any) => {
              if (!currentNode.children.some((c: any) => c.id === childNode.id)) {
                currentNode.children.push(childNode);
              }
            });
          }
        }
      });
    }
    
    // Mark as processed
    currentNode._processed = true;
  });
  
  // Find nodes without parents to serve as roots
  const rootNodes = [];
  
  // Convert entries to array to avoid iterator issues
  const nodeEntries = Array.from(nodeMap.entries());
  for (const [id, node] of nodeEntries) {
    // Determine if this is a root node
    // Root nodes are either explicitly marked as generation 0/1
    // or don't have a parent reference
    const hasParent = node.parent && nodeMap.get(node.parent);
    const isOldestGeneration = node.generation === 0 || node.generation === 1;
    
    // Consider a node a root if it has no parent or is in the oldest generation
    if ((!hasParent) || isOldestGeneration) {
      rootNodes.push(node);
    }
  }
  
  console.log("Found", rootNodes.length, "root nodes in family tree");
  
  // For a true family tree, we should have only 1-2 root nodes
  // If we have too many roots, do some cleanup
  if (rootNodes.length > 2) {
    console.warn("Too many root nodes detected, restructuring by generation");
    
    // Sort roots by generation and relationship
    rootNodes.sort((a, b) => {
      // Prioritize by generation first
      if (a.generation !== b.generation) {
        // Treat undefined generations as higher (newer)
        if (a.generation === undefined) return 1;
        if (b.generation === undefined) return -1;
        return a.generation - b.generation;
      }
      
      // Then prioritize by birth date if available
      if (a.birth_date && b.birth_date) {
        return new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime();
      }
      
      return 0;
    });
    
    // Use just the first two nodes as true roots
    rootNode.children = rootNodes.slice(0, 2);
    
    // Try to establish parent-child relationships for the remaining "root" nodes
    // by looking at generation differences
    const remainingRoots = rootNodes.slice(2);
    remainingRoots.forEach(node => {
      // Find an existing root that could be this node's parent
      const potentialParent = rootNode.children.find((root: any) => {
        return root.generation < node.generation;
      });
      
      if (potentialParent) {
        potentialParent.children.push(node);
      } else {
        // If we can't find a good parent, add to first root
        if (rootNode.children.length > 0) {
          rootNode.children[0].children.push(node);
        }
      }
    });
  } else {
    // If we have a reasonable number of root nodes, use them directly
    rootNode.children = rootNodes;
  }
  
  return rootNode;
}

// Apply hierarchical tree layout using d3-hierarchy
function applyHierarchicalLayout(hierarchyRoot: any) {
  // Convert to d3 hierarchy for layout calculation
  const root = d3Hierarchy.hierarchy(hierarchyRoot);
  
  // Configure the tree layout with good spacing for family trees
  const treeLayout = d3Hierarchy.tree<any>()
    .nodeSize([150, 100]) // [width, height] spacing between nodes
    .separation((a, b) => {
      // Increase separation between different parent subtrees
      return a.parent === b.parent ? 1.5 : 2.2;
    });
  
  // Apply the layout to get positions
  const treeData = treeLayout(root);
  
  // Collect all descendants into a flat array for positioning
  const allNodes = treeData.descendants();
  
  // Convert back to our format with positions
  const positionedNodes: PositionedNode[] = [];
  const processedSpouses = new Set<number>();
  
  // Process all nodes from the tree (skip the root which is artificial)
  for (let i = 1; i < allNodes.length; i++) {
    const node = allNodes[i];
    if (!node || !node.data) continue;
    
    const originalNode = node.data;
    if (originalNode.id === "root") continue;
    
    // Create a unique key for the node
    const uniqueNodeId = `node-${originalNode.id}`;
    
    // Add the node to the positioned nodes list
    positionedNodes.push({
      ...originalNode,
      x: node.x || 0,      // d3 tree layout uses x for horizontal position
      y: node.y || 0,      // and y for vertical position
      _uniqueKey: uniqueNodeId,
      // Preserve relationship type information
      type: originalNode.relationship_type || originalNode.type,
      relation_category: originalNode.relation_category
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
  }
  
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