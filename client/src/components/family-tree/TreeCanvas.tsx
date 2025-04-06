import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TreeNode from "./TreeNode";
import RelationshipLine from "./RelationshipLine";
import { FamilyMember, Relationship } from "@shared/schema";

interface TreeCanvasProps {
  onNodeClick?: (member: FamilyMember) => void;
  onZoomChange?: (scale: number) => void;
  zoomIn?: boolean;
  zoomOut?: boolean;
  resetView?: boolean;
}

const TreeCanvas = ({ 
  onNodeClick, 
  onZoomChange,
  zoomIn,
  zoomOut,
  resetView
}: TreeCanvasProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fetch family members
  const { data: familyMembers = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ["/api/family-members"],
  });

  // Fetch relationships
  const { data: relationships = [], isLoading: isRelationshipsLoading } = useQuery({
    queryKey: ["/api/relationships"],
  });

  // Layout calculations
  const getNodePosition = (member: FamilyMember) => {
    // This is a simplified layout algorithm
    // In a real app, you'd want a more sophisticated algorithm to handle
    // complex family structures
    
    const positions: Record<number, { x: number, y: number }> = {
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
    
    return positions[member.id] || { x: 0, y: 0 };
  };

  const getNodeSize = (member: FamilyMember) => {
    // Size based on generation (simplified)
    const sizes: Record<number, number> = {
      // Generation 1
      1: 40,
      
      // Generation 2
      2: 35,
      3: 35,
      4: 35,
      
      // Generation 3
      5: 30,
      6: 30,
      7: 30,
      8: 30,
      9: 30,
    };
    
    return sizes[member.id] || 30;
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
      setTransform({ x: 0, y: 0, scale: 1 });
    }
  }, [resetView]);

  if (isMembersLoading || isRelationshipsLoading) {
    return (
      <div className="family-tree-canvas flex items-center justify-center p-6">
        <div className="text-neutral-500">Loading family tree...</div>
      </div>
    );
  }

  return (
    <div className="family-tree-canvas p-6 overflow-x-auto">
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox="0 0 1000 500" 
        preserveAspectRatio="xMidYMid meet"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Relationship Lines */}
          {relationships.map((relationship: Relationship) => {
            const sourceMember = familyMembers.find((m: FamilyMember) => m.id === relationship.source_id);
            const targetMember = familyMembers.find((m: FamilyMember) => m.id === relationship.target_id);
            
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
          })}
          
          {/* Family Member Nodes */}
          {familyMembers.map((member: FamilyMember) => {
            const position = getNodePosition(member);
            const size = getNodeSize(member);
            
            return (
              <TreeNode 
                key={member.id}
                member={member}
                x={position.x}
                y={position.y}
                size={size}
                onClick={() => onNodeClick && onNodeClick(member)}
                isCurrentUser={member.id === 7} // Hardcoded for demo, would use auth in real app
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default TreeCanvas;
