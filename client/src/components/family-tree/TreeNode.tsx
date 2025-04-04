import { FamilyMember } from "@shared/schema";

interface TreeNodeProps {
  member: FamilyMember;
  x: number;
  y: number;
  size: number;
  onClick: () => void;
  isCurrentUser?: boolean;
}

const TreeNode = ({ member, x, y, size, onClick, isCurrentUser = false }: TreeNodeProps) => {
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

  return (
    <g 
      className={`tree-node cursor-pointer ${isCurrentUser ? 'pulse-animation' : ''}`}
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
    >
      {/* Background circle for node */}
      <circle 
        r={size} 
        fill={getNodeColor()}
      />
      
      {/* Avatar image */}
      <image 
        href={member.avatarUrl || ""} 
        x={-size * 0.875} 
        y={-size * 0.875} 
        height={size * 1.75} 
        width={size * 1.75} 
        clipPath={`circle(${size * 0.875}px at ${size * 0.875}px ${size * 0.875}px)`}
      />
      
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
