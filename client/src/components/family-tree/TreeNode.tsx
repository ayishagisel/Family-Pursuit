import React from "react";
import { FamilyMember } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

type RelationshipInfo = {
  type?: string;
  relationshipType?: string;
  relation_category?: string;
};

interface TreeNodeProps {
  member: FamilyMember;
  x: number;
  y: number;
  size: number;
  onClick?: () => void;
  relationInfo?: RelationshipInfo;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  member,
  x,
  y,
  size,
  onClick,
  relationInfo,
}) => {
  // Color coding based on relationship type
  const getNodeColor = () => {
    if (!relationInfo) return "bg-indigo-500";

    const type = relationInfo.type || "";
    const category = relationInfo.relation_category || "";
    
    if (type.includes("father") || type.includes("mother") || category === "immediate") {
      return "bg-blue-500"; // Parents
    } else if (type.includes("son") || type.includes("daughter") || type.includes("child")) {
      return "bg-green-500"; // Children
    } else if (type.includes("spouse") || type === "partner") {
      return "bg-pink-500"; // Spouses
    } else if (type.includes("sibling")) {
      return "bg-violet-500"; // Siblings
    } else if (type.includes("step")) {
      return "bg-amber-500"; // Step-relations
    } else if (type.includes("adoptive")) {
      return "bg-cyan-500"; // Adoptive relations
    } else if (category === "extended") {
      return "bg-orange-400"; // Extended family
    }
    
    // Default color for other relationships
    return "bg-slate-500";
  };

  // Determine whether to show a special indicator
  const showSpecialIndicator = () => {
    if (!relationInfo || !relationInfo.relationshipType) return false;
    
    const relType = relationInfo.relationshipType.toLowerCase();
    return relType.includes("step") || 
           relType.includes("adopt") || 
           relType.includes("half") ||
           relType === "guardian";
  };
  
  const getBorderStyle = () => {
    if (!relationInfo || !relationInfo.relationshipType) return "border-transparent";
    
    const relType = relationInfo.relationshipType.toLowerCase();
    
    if (relType.includes("step")) {
      return "border-amber-500 border-dashed";
    } else if (relType.includes("adopt")) {
      return "border-cyan-500 border-dotted";
    } else if (relType.includes("half")) {
      return "border-violet-500 border-dashed";
    } else if (relType === "guardian") {
      return "border-indigo-500 border-2";
    }
    
    return "border-transparent";
  };

  const nodeColor = getNodeColor();
  const borderStyle = getBorderStyle();
  const hasSpecialIndicator = showSpecialIndicator();
  
  // Ensure we have a safe name value
  const name = member?.name || "Unknown";
  const initials = getInitials(name);
  
  // Default avatar if not provided
  const avatarUrl = member?.avatarUrl || null;

  return (
    <g
      className="family-tree-node"
      transform={`translate(${x - size / 2}, ${y - size / 2})`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Node circle background with pulse animation */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 + 10}
        className="fill-transparent peer"
      />
      
      {/* Main node circle */}
      <foreignObject x={0} y={0} width={size} height={size}>
        <div className="h-full w-full flex items-center justify-center">
          <Avatar className={`h-full w-full rounded-full hover:ring-2 hover:ring-primary border-2 ${borderStyle}`}>
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name} />
            ) : (
              <AvatarFallback className={`text-white text-sm font-medium ${nodeColor}`}>
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      </foreignObject>
      
      {/* Special indicator for step/adoptive/etc. relationships */}
      {hasSpecialIndicator && (
        <circle
          cx={size - 2}
          cy={4}
          r={4}
          className="fill-amber-500 stroke-white stroke-1"
        />
      )}
      
      {/* Name label */}
      <text
        x={size / 2}
        y={size + 15}
        textAnchor="middle"
        className="fill-current text-foreground text-xs font-medium"
      >
        {name}
      </text>
      
      {/* Role label (smaller and lighter below the name) */}
      {member.role && (
        <text
          x={size / 2}
          y={size + 30}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          {member.role}
        </text>
      )}
    </g>
  );
};

export default TreeNode;