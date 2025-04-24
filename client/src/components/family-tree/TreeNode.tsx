import { FamilyMember } from "@shared/schema";
import { useState } from "react";

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
  children: any[];
  parents: any[];
  siblings: any[];
  extended: any[];
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
  relationInfo,
}: TreeNodeProps) => {
  const [useInitials] = useState(true);

  const getNodeColor = () => {
    if (relationInfo) {
      const relationCategory =
        relationInfo.spouse?.relation_category ||
        relationInfo.children?.[0]?.relation_category ||
        relationInfo.parents?.[0]?.relation_category;

      switch (relationCategory) {
        case "immediate":
          return "#5AAE61";
        case "adoptive":
          return "#9B7EDE";
        case "step":
          return "#F2994A";
        case "half":
          return "#5EAAA8";
        case "extended":
          return "#4A6FA5";
        default:
          return getColorFromRelationshipType(member.relationship);
      }
    }
    return getColorFromRelationshipType(member.relationship);
  };

  const getColorFromRelationshipType = (relationshipType: string) => {
    switch (relationshipType) {
      case "biological":
        return "#5AAE61";
      case "adoptive":
        return "#9B7EDE";
      case "step":
        return "#F2994A";
      case "extended":
        return "#4A6FA5";
      default:
        return "#4A6FA5";
    }
  };

  const getInitials = () => {
    if (!member.name) return "?";
    return member.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getAvatarBackgroundColor = () => {
    const hash = member.name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "#4A6FA5",
      "#E6704B",
      "#5AAE61",
      "#9B7EDE",
      "#F2994A",
      "#4ECDC4",
      "#FF6B6B",
      "#A364FF",
      "#40C9A2",
    ];
    return colors[hash % colors.length];
  };

  const nodeColor = getNodeColor();
  const avatarColor = getAvatarBackgroundColor();
  const pulseAnimation = isCurrentUser
    ? { animation: "pulse 2s infinite" }
    : {};

  const getDisplayRole = () => {
    if (!relationInfo) return member.role;
    if (relationInfo.spouse) return relationInfo.role;
    if (relationInfo.children?.length > 0) return `${member.role} (Parent)`;
    if (relationInfo.parents?.length > 0) return `${member.role} (Child)`;
    return member.role;
  };

  return (
    <g
      className="tree-node cursor-pointer"
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
    >
      <circle
        r={size}
        fill={nodeColor}
        strokeWidth={isCurrentUser ? 3 : 0}
        stroke="#FFF"
        style={pulseAnimation}
      />
      <circle r={size * 0.85} fill={avatarColor} />
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
      <rect
        x={-size * 1.5}
        y={size + 5}
        width={size * 3}
        height={20}
        rx={4}
        fill="white"
        fillOpacity="0.85"
      />
      <text
        x="0"
        y={size + 15}
        textAnchor="middle"
        className="font-medium fill-neutral-900 dark:fill-white"
      >
        {member.name}
      </text>
      <text
        x="0"
        y={size + 30}
        textAnchor="middle"
        className="text-xs fill-primary dark:fill-primary"
      >
        {getDisplayRole()}
      </text>

      {/* Optional animation ring */}
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
