import React from "react";

export type LineStyle = "straight" | "horizontal" | "vertical" | "curved" | "dashed";

interface RelationshipLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: string;
  lineStyle: LineStyle;
}

/**
 * RelationshipLine component renders a SVG line that connects family members
 * based on their relationship type.
 */
const RelationshipLine: React.FC<RelationshipLineProps> = ({
  x1,
  y1,
  x2,
  y2,
  type,
  lineStyle,
}) => {
  // Determine stroke style based on relationship type
  const getStrokeStyle = () => {
    if (type.includes("step") || lineStyle === "dashed") {
      return "2,2";
    } else if (type.includes("adoptive")) {
      return "5,2";
    } else {
      return "";
    }
  };

  // Get relationship color based on type
  const getLineColor = () => {
    if (type.includes("spouse") || type === "partner") {
      return "#3b82f6"; // blue-500
    } else if (type.includes("parent") || type.includes("child")) {
      return "#10b981"; // emerald-500
    } else if (type.includes("sibling")) {
      return "#8b5cf6"; // violet-500
    } else if (type.includes("extended") || type.includes("grandparent") || type.includes("grandchild")) {
      return "#f97316"; // orange-500
    } else {
      return "#64748b"; // slate-500 (default)
    }
  };

  // Calculate line path based on line style
  const getLinePath = () => {
    if (lineStyle === "straight") {
      return `M${x1},${y1} L${x2},${y2}`;
    } else if (lineStyle === "horizontal") {
      // Horizontal connection (e.g., spouses)
      return `M${x1},${y1} L${x2},${y2}`;
    } else if (lineStyle === "vertical") {
      // Vertical connection with horizontal segment (e.g., parent-child)
      const midY = (y1 + y2) / 2;
      return `M${x1},${y1} L${x1},${midY} L${x2},${midY} L${x2},${y2}`;
    } else if (lineStyle === "curved") {
      // Curved connection (e.g., siblings)
      const dx = x2 - x1;
      const dy = y2 - y1;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const curveSize = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5;
      
      // Adjust control point to curve away from straight line
      const cpX = midX;
      const cpY = midY - curveSize;
      
      return `M${x1},${y1} Q${cpX},${cpY} ${x2},${y2}`;
    }
    
    // Default to straight line
    return `M${x1},${y1} L${x2},${y2}`;
  };

  // Calculate the position for optional relationship labels
  const getLabelPosition = () => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    return { x: midX, y: midY };
  };

  const labelPosition = getLabelPosition();
  const linePath = getLinePath();
  const strokeDasharray = getStrokeStyle();
  const strokeColor = getLineColor();

  return (
    <g className="relationship-line">
      {/* The actual connection line */}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        opacity={0.8}
      />
      
      {/* Optional visual marker for the relationship */}
      {type === "spouse" && (
        <circle
          cx={labelPosition.x}
          cy={labelPosition.y}
          r={3}
          fill={strokeColor}
          opacity={0.8}
        />
      )}
      
      {/* Optional tooltip/label if we want to show relationship type on hover */}
      {false && (
        <text
          x={labelPosition.x}
          y={labelPosition.y - 5}
          textAnchor="middle"
          fontSize={10}
          fill="currentColor"
          opacity={0.8}
          className="relationship-label"
        >
          {type}
        </text>
      )}
    </g>
  );
};

export default RelationshipLine;