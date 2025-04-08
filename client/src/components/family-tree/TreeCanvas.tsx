import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TreeNode from "./TreeNode";
import RelationshipLine from "./RelationshipLine";
import { FamilyMember, Relationship } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Define visualization types
type VisualizationType = "hierarchical" | "ancestor" | "descendant" | "sociogram";

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

  // Fetch relationships (flat structure)
  const { data: relationships = [], isLoading: isRelationshipsLoading } = useQuery<Relationship[]>({
    queryKey: ["/api/relationships"],
  });
  
  // Fetch hierarchical family structure
  const { data: hierarchicalFamily = [], isLoading: isHierarchicalLoading } = useQuery<HierarchicalFamilyMember[]>({
    queryKey: ["/api/family/hierarchical"],
    enabled: visualizationType === "hierarchical",
  });

  // Node dimensions
  const NODE_WIDTH = 60;
  const NODE_HEIGHT = 60;
  const HORIZONTAL_SPACING = 140; // Space between spouses
  const VERTICAL_SPACING = 120;   // Space between generations

  // Layout calculations based on visualization type
  const calculateNodePositions = () => {
    const positions: Record<number, { x: number, y: number }> = {};
    
    if (visualizationType === "hierarchical" && hierarchicalFamily.length > 0) {
      // Process hierarchical structure
      let currentX = 100;
      let familyUnitWidth = 0;
      
      // First pass - calculate positions for all members with spouses laid out horizontally
      hierarchicalFamily.forEach((member, index) => {
        // Position for this member
        const hasPrimarySpouse = member.spouse !== undefined;
        
        // If this is the start of a family unit (has spouse or children)
        if (hasPrimarySpouse || member.children.length > 0) {
          // Calculate width for this family unit
          familyUnitWidth = hasPrimarySpouse ? HORIZONTAL_SPACING * 2 : HORIZONTAL_SPACING;
          
          // Position this member
          positions[member.id] = { 
            x: currentX, 
            y: 100  // Top level
          };
          
          // Position spouse if exists
          if (hasPrimarySpouse) {
            positions[member.spouse!.id] = { 
              x: currentX + HORIZONTAL_SPACING, 
              y: 100 
            };
          }
          
          // Position children below
          const childrenCount = member.children.length;
          if (childrenCount > 0) {
            const childrenStartX = currentX - ((childrenCount - 1) * HORIZONTAL_SPACING / 2);
            
            member.children.forEach((child, childIndex) => {
              positions[child.id] = { 
                x: childrenStartX + (childIndex * HORIZONTAL_SPACING), 
                y: 250  // Second level 
              };
            });
            
            // Adjust family unit width if children take more space
            const childrenWidth = childrenCount * HORIZONTAL_SPACING;
            if (childrenWidth > familyUnitWidth) {
              familyUnitWidth = childrenWidth;
            }
          }
          
          // Move to next family unit position
          currentX += familyUnitWidth + 50; // Add gap between family units
        } else {
          // Position individual members without family units
          positions[member.id] = { 
            x: currentX, 
            y: 100 
          };
          currentX += HORIZONTAL_SPACING;
        }
      });
      
      return positions;
    } else {
      // Fallback to simplified positions for flat structure
      // Use existing predefined positions for compatibility
      const defaultPositions: Record<number, { x: number, y: number }> = {
        // Generation 1
        1: { x: 500, y: 80 }, // John Smith (Grandfather)
        
        // Generation 2
        2: { x: 300, y: 210 }, // Robert Smith (Father)
        3: { x: 500, y: 210 }, // Linda Smith (Aunt)
        4: { x: 700, y: 210 }, // Michael Johnson (Adopted Son)
        
        // Generation 3
        5: { x: 200, y: 340 }, // Emily Smith (Sister)
        6: { x: 350, y: 340 }, // James Wilson (Step-Brother)
        7: { x: 500, y: 340 }, // Sarah Johnson (You)
        8: { x: 650, y: 340 }, // David Lee (Cousin)
        9: { x: 800, y: 340 }, // Jessica Lee (Cousin)
      };
      
      // Add positions for all family members based on ID
      familyMembers.forEach((member, index) => {
        if (!defaultPositions[member.id]) {
          // Calculate grid-based position for any members without predefined positions
          const row = Math.floor(index / 5);
          const col = index % 5;
          defaultPositions[member.id] = {
            x: 180 + (col * 160),
            y: 100 + (row * 150)
          };
        }
      });
      
      return defaultPositions;
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
    
    if (!hierarchicalFamily || hierarchicalFamily.length === 0) {
      return lines;
    }
    
    hierarchicalFamily.forEach(member => {
      const memberPos = getNodePosition({ id: member.id } as FamilyMember);
      
      // Render spouse connection (horizontal line)
      if (member.spouse) {
        const spousePos = getNodePosition({ id: member.spouse.id } as FamilyMember);
        lines.push(
          <RelationshipLine 
            key={`spouse-${member.id}-${member.spouse.id}`}
            x1={memberPos.x}
            y1={memberPos.y}
            x2={spousePos.x}
            y2={spousePos.y}
            type="spouse"
            lineStyle="horizontal"
          />
        );
      }
      
      // Render parent-child connections (vertical lines)
      member.children.forEach(child => {
        const childPos = getNodePosition({ id: child.id } as FamilyMember);
        lines.push(
          <RelationshipLine 
            key={`child-${member.id}-${child.id}`}
            x1={memberPos.x}
            y1={memberPos.y}
            x2={childPos.x}
            y2={childPos.y}
            type={child.relationship_type}
            lineStyle="vertical"
          />
        );
      });
      
      // Render sibling connections (curved lines)
      member.siblings.forEach(sibling => {
        const siblingPos = getNodePosition({ id: sibling.id } as FamilyMember);
        lines.push(
          <RelationshipLine 
            key={`sibling-${member.id}-${sibling.id}`}
            x1={memberPos.x}
            y1={memberPos.y}
            x2={siblingPos.x}
            y2={siblingPos.y}
            type={sibling.relationship_type}
            lineStyle="curved"
          />
        );
      });
      
      // Render extended connections (dashed lines)
      member.extended.forEach(extended => {
        const extendedPos = getNodePosition({ id: extended.id } as FamilyMember);
        lines.push(
          <RelationshipLine 
            key={`extended-${member.id}-${extended.id}`}
            x1={memberPos.x}
            y1={memberPos.y}
            x2={extendedPos.x}
            y2={extendedPos.y}
            type={extended.relationship_type}
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
          {visualizationType === "hierarchical" 
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
                    type={relationship.relationship_type}
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
