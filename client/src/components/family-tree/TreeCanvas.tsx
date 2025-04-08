import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TreeNode from "./TreeNode";
import RelationshipLine from "./RelationshipLine";
import { FamilyMember, Relationship } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Define visualization types
type VisualizationType = "hierarchical" | "ancestor" | "descendant" | "sociogram" | "flat";

// Define hierarchical family member structure
interface HierarchicalFamilyMember {
  id: number;
  name: string;
  role: string;
  relationship: string;
  birth_date: string;
  location: string;
  bio: string;
  personality_traits: string[];
  interests: string[];
  occupation: string;
  avatarUrl: string | null;
  generation?: number; // Generation information for hierarchical layouts
  spouse?: {
    id: number;
    name: string;
    relationship_type: string;
    relation_category: string;
  };
  children: Array<{
    id: number;
    name: string;
    relationship_type: string;
    relation_category: string;
  }>;
  parents: Array<{
    id: number;
    name: string;
    relationship_type: string;
    relation_category: string;
  }>;
  siblings: Array<{
    id: number;
    name: string;
    relationship_type: string;
    relation_category: string;
  }>;
  extended: Array<{
    id: number;
    name: string;
    relationship_type: string;
    relation_category: string;
  }>;
}

interface TreeCanvasProps {
  onNodeClick?: (member: FamilyMember) => void;
  onZoomChange?: (scale: number) => void;
  zoomIn?: boolean;
  zoomOut?: boolean;
  resetView?: boolean;
  visualizationType?: VisualizationType;
}

const TreeCanvas = ({ 
  onNodeClick, 
  onZoomChange,
  zoomIn,
  zoomOut,
  resetView,
  visualizationType = "hierarchical"
}: TreeCanvasProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // Start with a zoomed in view centered on the canvas
  const [transform, setTransform] = useState({ x: 200, y: 50, scale: 1.2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fetch family members
  const { data: familyMembers = [], isLoading: isMembersLoading } = useQuery<FamilyMember[]>({
    queryKey: ["/api/family-members"],
  });

  // Fetch relationships based on visualization type
  const { data: relationships = [], isLoading: isRelationshipsLoading } = useQuery<Relationship[]>({
    queryKey: ["/api/relationships", { format: "flat" }],
    enabled: visualizationType === "flat",
  });
  
  // Fetch hierarchical family structure with appropriate visualization type
  const { data: hierarchicalFamily = [], isLoading: isHierarchicalLoading } = useQuery<HierarchicalFamilyMember[]>({
    queryKey: ["/api/relationships", { type: visualizationType }],
    enabled: visualizationType !== "flat",
  });

  // Node dimensions
  const NODE_WIDTH = 60;
  const NODE_HEIGHT = 60;
  const HORIZONTAL_SPACING = 140; // Space between spouses
  const VERTICAL_SPACING = 120;   // Space between generations

  // Layout calculations based on visualization type
  const calculateNodePositions = () => {
    const positions: Record<number, { x: number, y: number }> = {};
    
    if (visualizationType !== "flat" && hierarchicalFamily.length > 0) {
      console.log("Using hierarchical layout calculation");
      
      // Create a map of members by ID for quick lookup
      const membersById = new Map<number, HierarchicalFamilyMember>();
      hierarchicalFamily.forEach(member => {
        membersById.set(member.id, member);
      });
      
      // Create a map of nodes by generation for hierarchical layout
      const nodesByGeneration: Record<number, { id: number, hasSpouse: boolean, spouseId?: number }[]> = {};
      const processedNodes = new Set<number>();
      const spouseRelationships = new Map<number, number>(); // Map of spouse relationships
      
      // First pass - identify all spouse relationships
      hierarchicalFamily.forEach(member => {
        if (member.spouse) {
          spouseRelationships.set(member.id, member.spouse.id);
          spouseRelationships.set(member.spouse.id, member.id);
        }
      });
      
      // Second pass - group nodes by generation
      hierarchicalFamily.forEach(member => {
        // Determine generation (default to 0 if not available)
        const generation = member.generation || 0;
        
        // Skip if this node has already been processed
        if (processedNodes.has(member.id)) {
          return;
        }
        
        // Initialize array for this generation if it doesn't exist
        if (!nodesByGeneration[generation]) {
          nodesByGeneration[generation] = [];
        }
        
        // Check if this member has a spouse
        const spouseId = spouseRelationships.get(member.id);
        const hasSpouse = !!spouseId;
        
        // Add this member to its generation group
        nodesByGeneration[generation].push({
          id: member.id,
          hasSpouse,
          spouseId
        });
        
        // Mark this node as processed
        processedNodes.add(member.id);
        
        // Process spouse if exists and not already processed
        if (hasSpouse && !processedNodes.has(spouseId!)) {
          // Spouse goes in the same generation
          nodesByGeneration[generation].push({
            id: spouseId!,
            hasSpouse: true,
            spouseId: member.id
          });
          processedNodes.add(spouseId!);
        }
      });
      
      // Sort generations from oldest (smallest number, typically negative) to youngest (largest number)
      const generations = Object.keys(nodesByGeneration).map(Number).sort((a, b) => a - b);
      
      // Initial positioning - place each generation
      generations.forEach((generation, genIndex) => {
        const nodesInGeneration = nodesByGeneration[generation];
        const y = 100 + (genIndex * VERTICAL_SPACING);
        
        // Calculate total width needed for this generation
        const totalNodes = nodesInGeneration.length;
        const totalWidth = totalNodes * HORIZONTAL_SPACING;
        const startX = 500 - (totalWidth / 2); // Center in the SVG
        
        // Process spouse pairs first
        const processedForSpacing = new Set<number>();
        
        // First position spouse pairs next to each other
        for (let i = 0; i < nodesInGeneration.length; i++) {
          const node = nodesInGeneration[i];
          
          if (processedForSpacing.has(node.id)) {
            continue;
          }
          
          if (node.hasSpouse && node.spouseId) {
            // Find spouse node index
            const spouseIndex = nodesInGeneration.findIndex(n => n.id === node.spouseId);
            
            if (spouseIndex !== -1) {
              // Calculate positions for the pair
              const pairPosition = i * HORIZONTAL_SPACING;
              
              // Position member
              positions[node.id] = {
                x: startX + pairPosition,
                y: y
              };
              
              // Position spouse to the right
              positions[node.spouseId] = {
                x: startX + pairPosition + HORIZONTAL_SPACING / 2,
                y: y
              };
              
              // Mark both as processed
              processedForSpacing.add(node.id);
              processedForSpacing.add(node.spouseId);
            }
          }
        }
        
        // Then position remaining members
        nodesInGeneration.forEach((node, nodeIndex) => {
          if (!processedForSpacing.has(node.id)) {
            positions[node.id] = {
              x: startX + (nodeIndex * HORIZONTAL_SPACING),
              y: y
            };
            processedForSpacing.add(node.id);
          }
        });
      });
      
      // Adjust child positions to be centered under their parents
      hierarchicalFamily.forEach(member => {
        // Process each member with children
        if (member.children && member.children.length > 0) {
          const memberPosition = positions[member.id];
          if (!memberPosition) return;
          
          // Find spouse position if it exists
          let spousePosition = null;
          if (member.spouse) {
            spousePosition = positions[member.spouse.id];
          }
          
          // Calculate center point between member and spouse (or just member position if no spouse)
          const centerX = spousePosition 
            ? (memberPosition.x + spousePosition.x) / 2
            : memberPosition.x;
            
          // Get all children positions
          const childrenIds = member.children.map(child => child.id);
          const childPositions = childrenIds
            .map(id => positions[id])
            .filter(pos => pos); // Filter out undefined positions
            
          if (childPositions.length > 0) {
            // Calculate current children center
            const childrenXTotal = childPositions.reduce((sum, pos) => sum + pos.x, 0);
            const childrenCenter = childrenXTotal / childPositions.length;
            
            // Calculate offset to center children under parents
            const offset = centerX - childrenCenter;
            
            // Apply offset to all children
            childrenIds.forEach(childId => {
              if (positions[childId]) {
                positions[childId].x += offset;
              }
            });
          }
        }
      });
      
      // Handle special visualization types
      if (visualizationType === "ancestor" || visualizationType === "descendant") {
        // For ancestor/descendant charts, use a more vertical layout
        generations.forEach((generation, genIndex) => {
          const nodesInGeneration = nodesByGeneration[generation];
          
          // Position nodes more vertically for ancestor/descendant charts
          const y = 100 + (genIndex * VERTICAL_SPACING * 1.2); // More vertical spacing
          
          nodesInGeneration.forEach((node) => {
            if (positions[node.id]) {
              positions[node.id].y = y;
            }
          });
        });
      } else if (visualizationType === "sociogram") {
        // For sociogram, use a radial layout
        const centerX = 500;
        const centerY = 300;
        const radius = 200;
        
        // First position immediate family in inner circle
        const immediateFamily = hierarchicalFamily.filter(member => {
          return member.children.length > 0 || member.parents.length > 0 || member.spouse;
        });
        
        // Then position extended family in outer circle
        const extendedFamily = hierarchicalFamily.filter(member => {
          return !immediateFamily.some(imm => imm.id === member.id);
        });
        
        // Position immediate family in inner circle
        immediateFamily.forEach((member, index) => {
          const angle = (index / immediateFamily.length) * Math.PI * 2;
          positions[member.id] = {
            x: centerX + Math.cos(angle) * (radius * 0.6),
            y: centerY + Math.sin(angle) * (radius * 0.6)
          };
        });
        
        // Position extended family in outer circle
        extendedFamily.forEach((member, index) => {
          const angle = (index / extendedFamily.length) * Math.PI * 2;
          positions[member.id] = {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          };
        });
        
        // Ensure spouses are close to each other
        hierarchicalFamily.forEach(member => {
          if (member.spouse) {
            const memberPos = positions[member.id];
            const spousePos = positions[member.spouse.id];
            
            if (memberPos && spousePos) {
              // Move spouse slightly closer to member
              const dx = spousePos.x - memberPos.x;
              const dy = spousePos.y - memberPos.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              // If they're too far apart, move them closer
              if (dist > radius * 0.3) {
                const ratio = (radius * 0.3) / dist;
                spousePos.x = memberPos.x + dx * ratio;
                spousePos.y = memberPos.y + dy * ratio;
              }
            }
          }
        });
      }
      
      return positions;
    } else {
      // Flat layout - grid-based positioning
      console.log("Using flat layout calculation");
      
      // Calculate grid dimensions
      const GRID_COLS = 5;
      const GRID_SPACING_X = 160;
      const GRID_SPACING_Y = 150;
      const GRID_START_X = 100;
      const GRID_START_Y = 100;
      
      // Position each family member in a grid
      familyMembers.forEach((member, index) => {
        const row = Math.floor(index / GRID_COLS);
        const col = index % GRID_COLS;
        
        positions[member.id] = {
          x: GRID_START_X + (col * GRID_SPACING_X),
          y: GRID_START_Y + (row * GRID_SPACING_Y)
        };
      });
      
      return positions;
    }
  };

  // Calculate all node positions, safely handling any errors
  const nodePositions = (() => {
    try {
      return calculateNodePositions() || {};
    } catch (error) {
      console.error("Error calculating node positions:", error);
      return {};
    }
  })();
  
  const getNodePosition = (member: FamilyMember) => {
    if (!member || typeof member?.id !== 'number') {
      return { x: 0, y: 0 };
    }
    return nodePositions[member.id] || { x: 0, y: 0 };
  };

  const getNodeSize = (member: FamilyMember) => {
    // Default node size with optional sizing based on role
    const baseSize = 30;
    
    // Optional: Increase size for important family members
    if (member.role === "Grandfather" || member.role === "Grandmother") {
      return baseSize + 5;
    }
    
    return baseSize;
  };

  // Handle zoom
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

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
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

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  // Handle zoom change notification
  useEffect(() => {
    if (onZoomChange) {
      onZoomChange(transform.scale);
    }
  }, [transform.scale, onZoomChange]);

  // Handle zoom in button click
  useEffect(() => {
    if (zoomIn) {
      const newScale = Math.min(2, transform.scale + 0.2);
      // Zoom centered on canvas center
      setTransform(prev => ({
        ...prev,
        scale: newScale
      }));
    }
  }, [zoomIn]);

  // Handle zoom out button click
  useEffect(() => {
    if (zoomOut) {
      const newScale = Math.max(0.5, transform.scale - 0.2);
      // Zoom centered on canvas center
      setTransform(prev => ({
        ...prev,
        scale: newScale
      }));
    }
  }, [zoomOut]);

  // Handle reset view button click
  useEffect(() => {
    if (resetView) {
      setTransform({ x: 200, y: 50, scale: 1.5 });
    }
  }, [resetView]);

  if (isMembersLoading || isRelationshipsLoading || (visualizationType === "hierarchical" && isHierarchicalLoading)) {
    return (
      <div className="family-tree-canvas flex items-center justify-center p-6">
        <div className="text-neutral-500 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading family tree...</span>
        </div>
      </div>
    );
  }

  // Render relationships based on hierarchical data (parent-child, spouse connections)
  const renderHierarchicalRelationships = () => {
    const lines: JSX.Element[] = [];
    const processedRelationships = new Set<string>(); // Track which relationships we've rendered
    
    if (!hierarchicalFamily || hierarchicalFamily.length === 0) {
      return lines;
    }
    
    hierarchicalFamily.forEach(member => {
      const memberPos = getNodePosition({ id: member.id } as FamilyMember);
      
      // Render spouse connection (horizontal line)
      if (member.spouse) {
        const spouseId = member.spouse.id;
        // Generate a unique key for this spouse relationship
        const relationshipKey = `spouse-${Math.min(member.id, spouseId)}-${Math.max(member.id, spouseId)}`;
        
        // Only render if we haven't processed this relationship yet
        if (!processedRelationships.has(relationshipKey)) {
          const spousePos = getNodePosition({ id: spouseId } as FamilyMember);
          lines.push(
            <RelationshipLine 
              key={relationshipKey}
              x1={memberPos.x}
              y1={memberPos.y}
              x2={spousePos.x}
              y2={spousePos.y}
              type={member.spouse.relationship_type || "spouse"}
              lineStyle="horizontal"
            />
          );
          processedRelationships.add(relationshipKey);
        }
      }
      
      // Render parent-child connections (vertical lines)
      member.children.forEach((child) => {
        const childId = child.id;
        const relationshipKey = `parent-child-${member.id}-${childId}`;
        
        if (!processedRelationships.has(relationshipKey)) {
          const childPos = getNodePosition({ id: childId } as FamilyMember);
          lines.push(
            <RelationshipLine 
              key={relationshipKey}
              x1={memberPos.x}
              y1={memberPos.y}
              x2={childPos.x}
              y2={childPos.y}
              type={child.relationship_type || "parent"}
              lineStyle="vertical"
            />
          );
          processedRelationships.add(relationshipKey);
        }
      });
      
      // Render sibling connections (curved lines)
      member.siblings.forEach((sibling) => {
        const siblingId = sibling.id;
        // Create unique key for the sibling relationship (order by ID to avoid duplicates)
        const relationshipKey = `sibling-${Math.min(member.id, siblingId)}-${Math.max(member.id, siblingId)}`;
        
        if (!processedRelationships.has(relationshipKey)) {
          const siblingPos = getNodePosition({ id: siblingId } as FamilyMember);
          
          // Determine the type of sibling relationship
          let lineType: "straight" | "horizontal" | "vertical" | "curved" | "dashed" = "curved";
          
          // Use dashed line for step-siblings, half-siblings, or extended family
          if (sibling.relationship_type?.includes("step") || 
              sibling.relationship_type?.includes("half") ||
              (sibling.relation_category && sibling.relation_category === "extended")) {
            lineType = "dashed";
          }
          
          lines.push(
            <RelationshipLine 
              key={relationshipKey}
              x1={memberPos.x}
              y1={memberPos.y}
              x2={siblingPos.x}
              y2={siblingPos.y}
              type={sibling.relationship_type?.toString() || "sibling"}
              lineStyle={lineType}
            />
          );
          processedRelationships.add(relationshipKey);
        }
      });
      
      // Render extended connections (dashed lines)
      member.extended.forEach((extended, index) => {
        const extendedPos = getNodePosition({ id: extended.id } as FamilyMember);
        lines.push(
          <RelationshipLine 
            key={`extended-${member.id}-${extended.id}-${index}-${extended.relationship_type}`}
            x1={memberPos.x}
            y1={memberPos.y}
            x2={extendedPos.x}
            y2={extendedPos.y}
            type={extended.relationship_type?.toString() || "extended"}
            lineStyle="dashed"
          />
        );
      });
    });
    
    return lines;
  };

  return (
    <div className="family-tree-canvas p-6 overflow-x-auto w-full" style={{ minHeight: '600px' }}>
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox="0 0 1000 600" 
        preserveAspectRatio="xMidYMid meet"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', minHeight: '500px' }}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Relationship Lines */}
          {visualizationType !== "flat"
            ? renderHierarchicalRelationships() 
            : relationships.map((relationship) => {
                const sourceMember = familyMembers.find((m) => m.id === relationship.source_id);
                const targetMember = familyMembers.find((m) => m.id === relationship.target_id);
                
                if (!sourceMember || !targetMember) return null;
                
                const sourcePos = getNodePosition(sourceMember);
                const targetPos = getNodePosition(targetMember);
                
                return (
                  <RelationshipLine 
                    key={relationship.id}
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    type={relationship.relationship_type?.toString() || "unknown"}
                  />
                );
              })
          }
          
          {/* Family Member Nodes */}
          {familyMembers.map((member) => {
            const position = getNodePosition(member);
            const size = getNodeSize(member);
            
            // Find member in hierarchical data for additional information (with null check)
            const hierarchicalMember = hierarchicalFamily && Array.isArray(hierarchicalFamily) 
              ? hierarchicalFamily.find(m => m && m.id === member.id)
              : undefined;
            
            return (
              <TreeNode 
                key={member.id}
                member={member}
                x={position.x}
                y={position.y}
                size={size}
                onClick={() => onNodeClick && onNodeClick(member)}
                isCurrentUser={member.id === 7} // Hardcoded for demo, would use auth in real app
                relationInfo={hierarchicalMember}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default TreeCanvas;
