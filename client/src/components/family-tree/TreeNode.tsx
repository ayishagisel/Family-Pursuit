import { FamilyMember } from "@shared/schema";
import { useState } from "react";

interface TreeNodeProps {
  member: FamilyMember;
  x: number;
  y: number;
  size: number;
  onClick: () => void;
  isCurrentUser?: boolean;
}

const TreeNode = ({ member, x, y, size, onClick, isCurrentUser = false }: TreeNodeProps) => {
  const [imageError, setImageError] = useState(false);
  
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

  const nodeColor = getNodeColor();

  return (
    <g 
      className={`tree-node cursor-pointer ${isCurrentUser ? 'pulse-animation' : ''}`}
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
    >
      {/* Background circle for node */}
      <circle 
        r={size} 
        fill={nodeColor}
      />
      
      {!imageError ? (
        // Avatar image
        <image 
          href={member.avatarUrl || ""} 
          x={-size * 0.875} 
          y={-size * 0.875} 
          height={size * 1.75} 
          width={size * 1.75} 
          clipPath={`circle(${size * 0.875}px at ${size * 0.875}px ${size * 0.875}px)`}
          onError={() => setImageError(true)}
        />
      ) : (
        // Fallback text with initials when image fails to load
        <text
          x="0"
          y="5"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-bold text-xl fill-white"
          fontSize={size * 0.8}
        >
          {getInitials()}
        </text>
      )}
      
      {/* White background for name text (better contrast in dark mode) */}
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
    </g>
  );
};

export default TreeNode;
