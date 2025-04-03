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
      <circle 
        r={size} 
        fill={getNodeColor()}
      />
      <image 
        href={member.avatarUrl} 
        x={-size * 0.875} 
        y={-size * 0.875} 
        height={size * 1.75} 
        width={size * 1.75} 
        clipPath={`circle(${size * 0.875}px at ${size * 0.875}px ${size * 0.875}px)`}
      />
      <text 
        x="0" 
        y={size + 15} 
        textAnchor="middle" 
        fill="#343A40" 
        className="font-medium dark:fill-neutral-100"
      >
        {member.name}
      </text>
      <text 
        x="0" 
        y={size + 30} 
        textAnchor="middle" 
        fill="#6B9AC4" 
        className="text-xs dark:fill-secondary"
      >
        {member.role}
      </text>
    </g>
  );
};

export default TreeNode;
