interface RelationshipLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: string;
  lineStyle?: "straight" | "horizontal" | "vertical" | "curved" | "dashed";
}

const RelationshipLine = ({ x1, y1, x2, y2, type, lineStyle = "straight" }: RelationshipLineProps) => {
  // Get stroke properties based on relationship type
  const getStrokeProperties = () => {
    // Map relationship types to visual properties
    const typeStyles: Record<string, { color: string, dashArray: string, width: number }> = {
      // Immediate family relationships
      "biological": { color: "#5AAE61", dashArray: "none", width: 3 },
      "spouse": { color: "#4A6FA5", dashArray: "none", width: 3 },
      "child": { color: "#5AAE61", dashArray: "none", width: 3 },
      "parent": { color: "#5AAE61", dashArray: "none", width: 3 },
      "sibling": { color: "#5AAE61", dashArray: "none", width: 3 },
      
      // Extended family relationships
      "grandparent": { color: "#4A6FA5", dashArray: "5,3", width: 2.5 },
      "grandchild": { color: "#4A6FA5", dashArray: "5,3", width: 2.5 },
      "aunt": { color: "#4A6FA5", dashArray: "5,3", width: 2.5 },
      "uncle": { color: "#4A6FA5", dashArray: "5,3", width: 2.5 },
      "niece": { color: "#4A6FA5", dashArray: "5,3", width: 2.5 },
      "nephew": { color: "#4A6FA5", dashArray: "5,3", width: 2.5 },
      "cousin": { color: "#4A6FA5", dashArray: "5,3", width: 2.5 },
      
      // Adoptive relationships
      "adoptive-parent": { color: "#9B7EDE", dashArray: "5,5", width: 3 },
      "adoptive-child": { color: "#9B7EDE", dashArray: "5,5", width: 3 },
      
      // Step relationships
      "step-parent": { color: "#F2994A", dashArray: "10,5", width: 3 },
      "step-child": { color: "#F2994A", dashArray: "10,5", width: 3 },
      "step-sibling": { color: "#F2994A", dashArray: "10,5", width: 3 },
      
      // Generic categories
      "adoptive": { color: "#9B7EDE", dashArray: "5,5", width: 3 },
      "step": { color: "#F2994A", dashArray: "10,5", width: 3 },
      "extended": { color: "#4A6FA5", dashArray: "5,3", width: 2.5 },
      
      // Default
      "other": { color: "#808080", dashArray: "2,2", width: 2 }
    };
    
    return typeStyles[type] || typeStyles["other"];
  };

  const strokeProps = getStrokeProperties();
  
  // Create path for curved lines or custom line styles
  const getPath = () => {
    if (lineStyle === "straight") {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    
    if (lineStyle === "horizontal") {
      // Straight horizontal line
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    
    if (lineStyle === "vertical") {
      // Use a path with right angle for parent-child
      // First go down, then go right/left
      const midY = y1 + (y2 - y1) * 0.6; // Go down 60% of the way
      return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
    }
    
    if (lineStyle === "curved") {
      // Bezier curve for sibling relationships
      const controlX1 = x1;
      const controlY1 = (y1 + y2) / 2;
      const controlX2 = x2;
      const controlY2 = (y1 + y2) / 2;
      return `M ${x1} ${y1} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x2} ${y2}`;
    }
    
    // Default to straight line
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  };

  // Use path for all relationship lines to support different styles
  return (
    <>
      {/* Background line (shadow effect) */}
      <path 
        d={getPath()}
        className="relationship-line-bg" 
        stroke="#ffffff"
        strokeWidth={strokeProps.width + 2}
        strokeLinecap="round"
        strokeOpacity={0.6}
        fill="none"
      />
      
      {/* Colored relationship line */}
      <path 
        d={getPath()}
        className="relationship-line" 
        stroke={strokeProps.color}
        strokeWidth={strokeProps.width}
        strokeLinecap="round"
        strokeDasharray={strokeProps.dashArray}
        fill="none"
      />
    </>
  );
};

export default RelationshipLine;
