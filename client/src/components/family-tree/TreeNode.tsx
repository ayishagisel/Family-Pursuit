import { FamilyMember } from "@shared/schema";
import { useState, useEffect } from "react";

interface TreeNodeProps {
  member: FamilyMember;
  x: number;
  y: number;
  size: number;
  onClick: () => void;
  isCurrentUser?: boolean;
}

const TreeNode = ({ member, x, y, size, onClick, isCurrentUser = false }: TreeNodeProps) => {
  // Always use initials for now since external images are failing
  const [useInitials, setUseInitials] = useState(true);
  
  // Determine color based on relationship type
  const getNodeColor = () => {
    switch (member.relationship) {
      case "biological":
        return "#5AAE61"; // Green
      case "adoptive":
        return "#9B7EDE"; // Purple
      case "step":
        return "#F2994A"; // Orange
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

  // Get gender-based avatar color
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
        strokeWidth={isCurrentUser ? 3 : 0}
        stroke={isCurrentUser ? "#FFF" : "none"}
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
        {member.role}
      </text>

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
