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
    // For horizontal lines (like spouse relationships)
    if (lineStyle === "horizontal") {
      // Enhanced horizontal line with slight curve for visual appeal
      const midY = (y1 + y2) / 2 - 5; // Slight curve upward
      return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${midY}, ${x2} ${y2}`;
    }
    
    // For vertical/hierarchical lines (parent-child relationships)
    if (lineStyle === "vertical") {
      // Determine if this is a downward connection (parent -> child)
      const isDownward = y2 > y1;
      
      if (isDownward) {
        // Parent to child: First go down, then horizontally
        const midY = y1 + (y2 - y1) * 0.6; // Go down 60% of the way
        return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
      } else {
        // Child to parent or other vertical relationship
        const midY = y2 + (y1 - y2) * 0.6; // Go up 60% of the way
        return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
      }
    }
    
    // For curved lines (sibling relationships)
    if (lineStyle === "curved") {
      // Enhanced Bezier curve for sibling relationships
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      
      if (dy < 10) { // If on same level, use a simple arc
        const midY = (y1 + y2) / 2 - Math.min(dx / 4, 30); // Arc height based on distance
        return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${midY}, ${x2} ${y2}`;
      } else {
        // For siblings at different levels, use S-curve
        const controlX1 = x1 + (x2 - x1) * 0.2;
        const controlY1 = y1 + (y2 - y1) * 0.4;
        const controlX2 = x1 + (x2 - x1) * 0.8;
        const controlY2 = y1 + (y2 - y1) * 0.6;
        return `M ${x1} ${y1} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x2} ${y2}`;
      }
    }
    
    // For dashed lines (extended family relationships)
    if (lineStyle === "dashed") {
      // Simple direct line for extended family
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    
    // Default case: straight line with slight curve for visual interest
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 5;
    return `M ${x1} ${y1} Q ${midX} ${midY}, ${x2} ${y2}`;
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
