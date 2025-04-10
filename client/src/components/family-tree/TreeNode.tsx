import { FamilyMember } from "@shared/schema";
import { useState, useEffect } from "react";

// Interface for hierarchical relationship information
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

interface TreeNodeProps {
  member: FamilyMember;
  x: number;
  y: number;
  size: number;
  onClick: () => void;
  isCurrentUser?: boolean;
  relationInfo?: HierarchicalFamilyMember;
}

const TreeNode = ({ 
  member, 
  x, 
  y, 
  size, 
  onClick, 
  isCurrentUser = false,
  relationInfo
}: TreeNodeProps) => {
  // Always use initials for now since external images are failing
  const [useInitials, setUseInitials] = useState(true);
  
  // Determine color based on relationship type or relation category
  const getNodeColor = () => {
    // If we have hierarchical relation info, use that for more accurate colors
    if (relationInfo) {
      // Use relation_category as priority
      const relationCategory = relationInfo.spouse?.relation_category || 
                              (relationInfo.children.length > 0 ? relationInfo.children[0].relation_category : null) ||
                              (relationInfo.parents.length > 0 ? relationInfo.parents[0].relation_category : null);
      
      switch (relationCategory) {
        case "immediate":
          return "#5AAE61"; // Green for immediate family
        case "adoptive":
          return "#9B7EDE"; // Purple for adoptive relations
        case "step":
          return "#F2994A"; // Orange for step relations
        case "half":
          return "#5EAAA8"; // Teal for half relations
        case "extended":
          return "#4A6FA5"; // Blue for extended family
        default:
          // Fallback to relationship type
          return getColorFromRelationshipType(member.relationship);
      }
    } else {
      // Fallback to old logic
      return getColorFromRelationshipType(member.relationship);
    }
  };
  
  // Helper function to get color from relationship type
  const getColorFromRelationshipType = (relationshipType: string) => {
    switch (relationshipType) {
      case "biological":
        return "#5AAE61"; // Green
      case "adoptive":
        return "#9B7EDE"; // Purple
      case "step":
        return "#F2994A"; // Orange
      case "extended":
        return "#4A6FA5"; // Blue
      default:
        return "#4A6FA5"; // Default blue
    }
  };

  // Generate initials for fallback
  const getInitials = () => {
    if (!member.name) return "?";
    return member.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Get avatar background color (based on name hash)
  const getAvatarBackgroundColor = () => {
    // Simple logic to determine background color
    const hash = member.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "#4A6FA5", // Blue
      "#E6704B", // Orange-red
      "#5AAE61", // Green
      "#9B7EDE", // Purple
      "#F2994A", // Orange
      "#4ECDC4", // Teal
      "#FF6B6B", // Red
      "#A364FF", // Lavender
      "#40C9A2"  // Mint
    ];
    return colors[hash % colors.length];
  };

  const nodeColor = getNodeColor();
  const avatarColor = getAvatarBackgroundColor();

  // Add a highlight animation for the current user
  const pulseAnimation = isCurrentUser ? {
    animation: "pulse 2s infinite"
  } : {};

  // Add a highlight for nodes with spouse relationships
  const hasSpouse = relationInfo && relationInfo.spouse;
  const hasChildren = relationInfo && relationInfo.children.length > 0;
  const isParent = relationInfo && relationInfo.parents.length > 0;

  // Display roles with some additional context
  const getDisplayRole = () => {
    if (!relationInfo) return member.role;
    
    // Enhance role with relation details
    if (hasSpouse && relationInfo.role) {
      return relationInfo.role;
    }
    
    // Add context based on relationships
    if (hasChildren && isParent) {
      return `${member.role} (Parent)`;
    } else if (hasChildren) {
      return `${member.role} (Parent)`;
    } else if (isParent) {
      return `${member.role} (Child)`;
    }
    
    return member.role;
  };

  return (
    <g 
      className="tree-node cursor-pointer"
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
    >
      {/* Background circle for node */}
      <circle 
        r={size} 
        fill={nodeColor}
        strokeWidth={isCurrentUser ? 3 : (hasSpouse ? 2 : 0)}
        stroke={isCurrentUser ? "#FFF" : (hasSpouse ? "#FFF" : "none")}
        style={pulseAnimation}
      />
      
      {/* Circle inside for avatar/initials */}
      <circle 
        r={size * 0.85} 
        fill={avatarColor}
      />
      
      {/* Initials */}
      <text
        x="0"
        y="5"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-bold fill-white"
        fontSize={size * 0.65}
      >
        {getInitials()}
      </text>
      
      {/* White background for name text (better contrast) */}
      <rect
        x={-size * 1.5}
        y={size + 5}
        width={size * 3}
        height={20}
        rx={4}
        fill="white"
        fillOpacity="0.85"
        className="dark:fill-neutral-900 dark:fill-opacity-85"
      />
      
      {/* Name text */}
      <text 
        x="0" 
        y={size + 15} 
        textAnchor="middle" 
        className="font-medium fill-neutral-900 dark:fill-white"
      >
        {member.name}
      </text>
      
      {/* Role text */}
      <text 
        x="0" 
        y={size + 30} 
        textAnchor="middle" 
        className="text-xs fill-primary dark:fill-primary"
      >
        {getDisplayRole()}
      </text>

      {/* Indicators for number of relationships */}
      {relationInfo && (
        <g>
          {/* Child count indicator */}
          {relationInfo.children.length > 0 && (
            <circle
              r={size * 0.3}
              cy={size * 1.2}
              cx={size * 0.8}
              fill="#5AAE61"
              className="opacity-70"
            >
              <title>{relationInfo.children.length} children</title>
            </circle>
          )}
          
          {/* Sibling count indicator */}
          {relationInfo.siblings.length > 0 && (
            <circle
              r={size * 0.3}
              cy={size * 1.2}
              cx={-size * 0.8}
              fill="#4A6FA5"
              className="opacity-70"
            >
              <title>{relationInfo.siblings.length} siblings</title>
            </circle>
          )}
        </g>
      )}

      {/* Pulsing animation for current user */}
      {isCurrentUser && (
        <circle
          r={size + 5}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          opacity="0.5"
          className="animate-ping"
        />
      )}
    </g>
  );
};

export default TreeNode;
