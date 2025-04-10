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

// Add d3-hierarchy module declaration to fix TypeScript errors
declare module 'd3-hierarchy';

// Interface for processed nodes that include position coordinates
interface PositionedNode extends FamilyMember {
  x: number;
  y: number;
  children?: PositionedNode[];
  _children?: PositionedNode[];
  parent?: PositionedNode;
  spouse?: PositionedNode;
  relationshipType?: string;
  _uniqueKey?: string; // Unique key for React rendering
}

// Interface for relationship lines
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
      
      // Determine line style based on relationship type
      if (rel.type === "spouse") {
        lineStyle = "horizontal";
      } else if (rel.type === "parent-child") {
        lineStyle = "vertical";
      } else if (rel.type === "sibling") {
        lineStyle = "curved";
      } else if (rel.type === "extended") {
        lineStyle = "dashed";
      }
      
      // Check for special relationship types
      const srcRole = rel.source.role?.toLowerCase() || "";
      const tgtRole = rel.target.role?.toLowerCase() || "";
      const relType = rel.relationshipType?.toLowerCase() || "";
      
      // Handle step relationships
      if (
        relType.includes("step") || 
        srcRole.includes("step") || 
        tgtRole.includes("step")
      ) {
        lineStyle = "dashed";
      }
      
      // Handle adoptive relationships
      if (
        relType.includes("adopt") || 
        srcRole.includes("adopt") || 
        tgtRole.includes("adopt")
      ) {
        lineStyle = "dashed";
      }
      
      // Handle grand relationships
      if (
        srcRole.includes("grand") || 
        tgtRole.includes("grand")
      ) {
        // Use vertical, but might modify the style
        lineStyle = "vertical";
      }
      
      // Create a unique key for the relationship line
      const relationshipKey = `rel-${index}-${rel.source.id}-${rel.target.id}-${rel.type}`;
      
      return (
        <RelationshipLine
          key={relationshipKey}
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

// Helper function to process hierarchical data
function processHierarchicalData(nodes: any[], visualizationType: VisualizationType) {
  if (!nodes || nodes.length === 0) {
    console.log("No nodes to process");
    return { positionedNodes: [], relationships: [] };
  }
  
  console.log("Processing", nodes.length, "nodes with visualization type:", visualizationType);
  
  // Apply the appropriate layout algorithm based on visualization type
  let positionedNodes: PositionedNode[] = [];
  switch (visualizationType) {
    case "hierarchical":
      // For hierarchical, use either the generation data from the API or calculate it
      if (nodes[0]?.generation !== undefined) {
        // If the API provides generation data, use it directly
        console.log("Using generation data from API");
        positionedNodes = applyGenerationBasedLayout(nodes);
      } else {
        // Otherwise, calculate hierarchy and apply tree layout
        console.log("Using calculated hierarchy for tree layout");
        const hierarchy = createFamilyHierarchy(nodes);
        positionedNodes = applyHierarchicalLayout(hierarchy);
      }
      break;
    case "flat":
      positionedNodes = applyFlatLayout(nodes);
      break;
    case "sociogram":
      positionedNodes = applySociogramLayout(nodes);
      break;
    default:
      positionedNodes = applyGenerationBasedLayout(nodes);
  }
  
  // Extract relationships from the positioned nodes
  const relationships = extractRelationships(positionedNodes, nodes);
  
  console.log("Generated", positionedNodes.length, "positioned nodes with", relationships.length, "relationships");
  return { positionedNodes, relationships };
}

// Create a family hierarchy for d3
function createFamilyHierarchy(nodes: any[]) {
  // Root for the hierarchy
  const rootNode = {
    id: "root",
    name: "Family Root",
    children: []
  };
  
  // Map of all nodes for quick lookup
  const nodeMap = new Map();
  
  // First pass: Create nodes
  nodes.forEach(node => {
    nodeMap.set(node.id, { 
      ...node, 
      children: [],
      hierarchyPosition: {},
      _processed: false
    });
  });
  
  // Handle parent-child relationships
  nodes.forEach(node => {
    // Process children if they exist
    if (node.children && node.children.length > 0) {
      const parentNode = nodeMap.get(node.id);
      node.children.forEach((childRef: any) => {
        const childNode = nodeMap.get(childRef.id);
        if (childNode) {
          parentNode.children.push(childNode);
          childNode.parent = parentNode;
        }
      });
    }
    
    // Process spouse relationships
    if (node.spouses && node.spouses.length > 0) {
      const currentNode = nodeMap.get(node.id);
      // Only add the first spouse for simplicity in this implementation
      const spouseRef = node.spouses[0];
      if (spouseRef) {
        const spouseNode = nodeMap.get(spouseRef.id);
        if (spouseNode) {
          currentNode.spouse = spouseNode;
          spouseNode.spouse = currentNode; // Bidirectional
        }
      }
    }
    
    // Process parent relationships
    if (node.parents && node.parents.length > 0) {
      const childNode = nodeMap.get(node.id);
      node.parents.forEach((parentRef: any) => {
        const parentNode = nodeMap.get(parentRef.id);
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = [];
          }
          
          // Avoid duplicate children
          const alreadyAdded = parentNode.children.some((c: any) => c.id === childNode.id);
          if (!alreadyAdded) {
            parentNode.children.push(childNode);
            childNode.parent = parentNode;
          }
        }
      });
    }
  });
  
  // Find root nodes (those without parents)
  const rootNodes: any[] = [];
  nodes.forEach(node => {
    const processedNode = nodeMap.get(node.id);
    if (!processedNode.parent) {
      rootNodes.push(processedNode);
      
      // Add to the artificial root for D3 hierarchy
      rootNode.children.push(processedNode);
    }
  });
  
  console.log("Created hierarchy with", rootNodes.length, "root nodes");
  return rootNode;
}

// Layout nodes based on generation info from API
function applyGenerationBasedLayout(nodes: any[]): PositionedNode[] {
  // Create a map for quick lookup of nodes and their relationship info
  const nodeMap = new Map<number, any>();
  const positionedNodes: PositionedNode[] = [];
  const processedNodes = new Set<number>(); // Track which nodes have been positioned
  
  // First, create a lookup map and identify family units
  nodes.forEach(node => {
    nodeMap.set(node.id, node);
  });
  
  // Identify primary family units (nuclear families)
  const primaryUnits: {
    parents: number[],
    children: number[],
    generation: number
  }[] = [];
  
  // Find all parent-child combinations to identify family units
  nodes.forEach(node => {
    // If this node has children
    if (node.children && node.children.length > 0) {
      const familyUnit = {
        parents: [node.id],
        children: node.children.map((child: any) => child.id),
        generation: node.generation || 0
      };
      
      // If this node has a spouse, add spouse to the parents
      if (node.spouses && node.spouses.length > 0) {
        familyUnit.parents.push(node.spouses[0].id);
      }
      
      primaryUnits.push(familyUnit);
    }
    
    // If this node has parents
    if (node.parents && node.parents.length > 0) {
      // Make sure parent generations are correct relative to this node
      node.parents.forEach((parent: any) => {
        const parentNode = nodeMap.get(parent.id);
        if (parentNode && parentNode.generation === undefined) {
          parentNode.generation = (node.generation || 0) - 1;
        }
      });
    }
  });
  
  console.log(`Identified ${primaryUnits.length} primary family units`);
  
  // Identify step-families (where a parent has children but is connected to a different spouse)
  const stepFamilies: {
    parentId: number,
    stepParentId: number,
    stepChildren: number[],
    generation: number
  }[] = [];
  
  // Look for step-parent relationships in the nodes
  nodes.forEach(node => {
    if (node.role && node.role.toLowerCase().includes('step')) {
      // This is a step-parent or step-child
      const isStepParent = node.role.toLowerCase().includes('father') || 
                           node.role.toLowerCase().includes('mother');
      
      if (isStepParent) {
        // Find this step-parent's spouse
        if (node.spouses && node.spouses.length > 0) {
          const spouseId = node.spouses[0].id;
          const spouse = nodeMap.get(spouseId);
          
          if (spouse) {
            // Find spouse's children (who would be step-children to this node)
            const stepChildrenIds = spouse.children?.map((child: any) => child.id) || [];
            
            if (stepChildrenIds.length > 0) {
              stepFamilies.push({
                parentId: spouseId,
                stepParentId: node.id,
                stepChildren: stepChildrenIds,
                generation: node.generation || 0
              });
            }
          }
        }
      }
    }
  });
  
  console.log(`Identified ${stepFamilies.length} step-family relationships`);
  
  // Find the min generation to normalize vertical positioning
  let minGeneration = 0;
  nodes.forEach(node => {
    if (node.generation !== undefined && node.generation < minGeneration) {
      minGeneration = node.generation;
    }
  });
  
  // Organize nodes by generation for horizontal positioning
  const generationGroups = new Map<number, any[]>();
  nodes.forEach(node => {
    const generation = node.generation !== undefined ? node.generation : 0;
    if (!generationGroups.has(generation)) {
      generationGroups.set(generation, []);
    }
    generationGroups.get(generation)?.push(node);
  });
  
  // Calculate horizontal positions for each generation
  generationGroups.forEach((generationNodes, generation) => {
    const normalizedGeneration = generation - minGeneration;
    const verticalPosition = normalizedGeneration * 160 + 100; // 160px between generations
    
    // Position nodes horizontally within their generation
    // Sort nodes by family units to keep families together
    const sortedNodes = generationNodes.slice();
    const nodeCount = sortedNodes.length;
    const horizontalSpacing = Math.max(150, 800 / (nodeCount + 1));
    
    // First pass: Position regular nodes
    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      
      // Skip if already processed
      if (processedNodes.has(node.id)) continue;
      
      const xPosition = (i + 1) * horizontalSpacing;
      
      // Create positioned node
      const uniqueNodeId = `node-${node.id}`;
      positionedNodes.push({
        ...node,
        x: xPosition,
        y: verticalPosition,
        _uniqueKey: uniqueNodeId
      });
      
      // Mark as processed
      processedNodes.add(node.id);
      
      // Position spouse, if any
      if (node.spouses && node.spouses.length > 0) {
        // Find a spouse that hasn't been processed yet
        for (let j = 0; j < node.spouses.length; j++) {
          const spouseRef = node.spouses[j];
          if (!processedNodes.has(spouseRef.id)) {
            // Find the spouse node in the original dataset
            const spouseNode = nodeMap.get(spouseRef.id);
            if (spouseNode) {
              // Check if spouse is a step-parent
              const isStepParent = spouseNode.role && 
                                   spouseNode.role.toLowerCase().includes('step') &&
                                   (spouseNode.role.toLowerCase().includes('father') || 
                                    spouseNode.role.toLowerCase().includes('mother'));
              
              // Adjust horizontal position based on relationship type
              let spouseOffset = 100;
              if (isStepParent) {
                // Position step-parents with more distance
                spouseOffset = 150;
              }
              
              const uniqueSpouseId = `spouse-${spouseNode.id}`;
              positionedNodes.push({
                ...spouseNode,
                x: xPosition + spouseOffset,
                y: verticalPosition,
                _uniqueKey: uniqueSpouseId
              });
              
              // Mark spouse as processed
              processedNodes.add(spouseRef.id);
              break; // Only process one spouse (first one found)
            }
          }
        }
      }
    }
  });
  
  // Ensure special family roles are properly positioned
  positionedNodes.forEach(node => {
    // Process grandparents - should always be above regular parents
    if (node.role && node.role.toLowerCase().includes('grand')) {
      // Find the highest parent node (minimum y value)
      const parentNodes = positionedNodes.filter(n => 
        n.generation === 0 && 
        !n.role?.toLowerCase().includes('grand') &&
        (n.role?.toLowerCase().includes('father') || n.role?.toLowerCase().includes('mother'))
      );
      
      if (parentNodes.length > 0) {
        // Position grandparents one generation higher than parents
        const minParentY = Math.min(...parentNodes.map(p => p.y));
        node.y = minParentY - 160;
        
        // Also update generation for correct future positioning
        node.generation = -1;
      }
    }
    
    // Process step-parents - adjust position to show they're different from biological parents
    if (node.role && node.role.toLowerCase().includes('step') &&
        (node.role.toLowerCase().includes('father') || node.role.toLowerCase().includes('mother'))) {
      
      // Find which parent this step-parent is matched with
      const biologicalParentIds = new Set<number>();
      
      // Find biological parents of any children
      positionedNodes.forEach(potentialChild => {
        if (potentialChild.generation === 1) { // Children are in generation 1
          // If this node is listed as a parent of the child
          if (potentialChild.parents) {
            potentialChild.parents.forEach((parent: any) => {
              // Skip if this is the step-parent we're processing
              if (parent.id === node.id) return;
              
              // Find parent by ID
              const parentNode = positionedNodes.find(p => p.id === parent.id);
              if (parentNode && !parentNode.role?.toLowerCase().includes('step')) {
                biologicalParentIds.add(parent.id);
              }
            });
          }
        }
      });
      
      // If we found a biological parent that this step-parent should be positioned with
      if (biologicalParentIds.size > 0) {
        // Take the first biological parent we found
        const biologicalParentId = Array.from(biologicalParentIds)[0];
        const biologicalParent = positionedNodes.find(p => p.id === biologicalParentId);
        
        if (biologicalParent) {
          // Position the step-parent next to the biological parent with an offset
          node.x = biologicalParent.x + 130;
          node.y = biologicalParent.y;
        }
      }
    }
  });
  
  // Ensure all nodes have a unique key
  positionedNodes.forEach((node, index) => {
    if (!node._uniqueKey) {
      node._uniqueKey = `node-${index}-${node.id}`;
    }
  });
  
  return positionedNodes;
}

// Apply hierarchical tree layout using d3-hierarchy
function applyHierarchicalLayout(hierarchyRoot: any) {
  // Convert to d3 hierarchy
  const root = d3Hierarchy.hierarchy(hierarchyRoot);
  
  // Configure the tree layout
  const treeLayout = d3Hierarchy.tree()
    .nodeSize([150, 160]) // Width x Height spacing between nodes
    .separation((a, b) => {
      // Increase separation between different parents
      return a.parent === b.parent ? 1.2 : 1.8;
    });
  
  // Apply the layout
  const tree = treeLayout(root);
  
  // Convert back to our format with positions
  const positionedNodes: PositionedNode[] = [];
  const processedSpouses = new Set<number>(); // Track processed spouse IDs
  
  // Process all nodes except the artificial root
  tree.descendants().slice(1).forEach(d => {
    const originalNode = d.data;
    
    // Skip the artificial root node
    if (originalNode.id === "root") return;
    
    // Create a unique key for tree nodes to avoid React key warnings
    const uniqueNodeId = `node-${originalNode.id}`;
    positionedNodes.push({
      ...originalNode,
      x: d.x,      // D3 tree layout uses x for horizontal position
      y: d.y,      // And y for vertical position
      _uniqueKey: uniqueNodeId
    });
    
    // Handle spouse positioning (place side by side)
    if (originalNode.spouse && !processedSpouses.has(originalNode.spouse.id)) {
      const uniqueSpouseId = `spouse-${originalNode.spouse.id}`;
      positionedNodes.push({
        ...originalNode.spouse,
        x: d.x + 80, // Position spouse to the right
        y: d.y,      // Same vertical level
        _uniqueKey: uniqueSpouseId
      });
      
      // Mark the spouse as processed to avoid duplicates
      processedSpouses.add(originalNode.spouse.id);
    }
  });
  
  return positionedNodes;
}

// Apply flat layout for visualization
function applyFlatLayout(nodes: any[]) {
  return nodes.map((node, index) => ({
    ...node,
    x: index * 180,
    y: 250,
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
  }));
}

// Extract relationships for rendering lines
function extractRelationships(positionedNodes: PositionedNode[], originalNodes: any[]): RelationshipLineData[] {
  const relationships: RelationshipLineData[] = [];
  const nodeMap = new Map<number, PositionedNode>();
  const processedRelationships = new Set<string>(); // Track processed relationships to avoid duplicates
  
  // Create a map for quick lookup
  positionedNodes.forEach(node => {
    nodeMap.set(node.id, node);
  });
  
  // Process the original nodes to extract relationship data
  originalNodes.forEach(node => {
    const sourceNode = nodeMap.get(node.id);
    if (!sourceNode) return;
    
    // 1. Spouse relationships (horizontal connections)
    if (node.spouses && node.spouses.length > 0) {
      node.spouses.forEach((spouseRef: any) => {
        const targetNode = nodeMap.get(spouseRef.id);
        if (targetNode) {
          // Create a unique ID for this relationship to avoid duplicates
          const relationshipId = `spouse-${Math.min(sourceNode.id, targetNode.id)}-${Math.max(sourceNode.id, targetNode.id)}`;
          if (!processedRelationships.has(relationshipId)) {
            relationships.push({
              source: sourceNode,
              target: targetNode,
              type: "spouse",
              relationshipType: spouseRef.relationship_type || "spouse"
            });
            processedRelationships.add(relationshipId);
          }
        }
      });
    }
    
    // 2. Parent-child relationships (vertical connections)
    // 2a. Check the 'children' array
    if (node.children && node.children.length > 0) {
      node.children.forEach((childRef: any) => {
        const targetNode = nodeMap.get(childRef.id);
        if (targetNode) {
          const relationshipId = `parent-child-${sourceNode.id}-${targetNode.id}`;
          if (!processedRelationships.has(relationshipId)) {
            relationships.push({
              source: sourceNode,
              target: targetNode,
              type: "parent-child",
              relationshipType: childRef.relationship_type || "biological"
            });
            processedRelationships.add(relationshipId);
          }
        }
      });
    }
    
    // 2b. Also check the 'parents' array to create parent-child connections
    if (node.parents && node.parents.length > 0) {
      node.parents.forEach((parentRef: any) => {
        const parentNode = nodeMap.get(parentRef.id);
        if (parentNode) {
          const relationshipId = `parent-child-${parentNode.id}-${sourceNode.id}`;
          if (!processedRelationships.has(relationshipId)) {
            relationships.push({
              source: parentNode,
              target: sourceNode,
              type: "parent-child",
              relationshipType: parentRef.relationship_type || "biological"
            });
            processedRelationships.add(relationshipId);
          }
        }
      });
    }
    
    // 3. Sibling relationships
    if (node.siblings && node.siblings.length > 0) {
      node.siblings.forEach((siblingRef: any) => {
        const targetNode = nodeMap.get(siblingRef.id);
        if (targetNode) {
          const relationshipId = `sibling-${Math.min(sourceNode.id, targetNode.id)}-${Math.max(sourceNode.id, targetNode.id)}`;
          if (!processedRelationships.has(relationshipId)) {
            relationships.push({
              source: sourceNode,
              target: targetNode,
              type: "sibling",
              relationshipType: siblingRef.relationship_type || "biological"
            });
            processedRelationships.add(relationshipId);
          }
        }
      });
    }
    
    // 4. Extended family relationships
    if (node.extended && node.extended.length > 0) {
      node.extended.forEach((extendedRef: any) => {
        const targetNode = nodeMap.get(extendedRef.id);
        if (targetNode) {
          const relationshipId = `extended-${sourceNode.id}-${targetNode.id}`;
          if (!processedRelationships.has(relationshipId)) {
            relationships.push({
              source: sourceNode,
              target: targetNode,
              type: "extended",
              relationshipType: extendedRef.relationship_type || "extended"
            });
            processedRelationships.add(relationshipId);
          }
        }
      });
    }
  });
  
  console.log(`Created ${relationships.length} unique relationship lines`);
  return relationships;
}