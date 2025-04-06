interface RelationshipLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: string;
}

const RelationshipLine = ({ x1, y1, x2, y2, type }: RelationshipLineProps) => {
  // Get stroke properties based on relationship type
  const getStrokeProperties = () => {
    switch (type) {
      case "biological":
        return {
          color: "#5AAE61", // Green
          dashArray: "none", 
          width: 3
        };
      case "adoptive":
        return {
          color: "#9B7EDE", // Purple
          dashArray: "5,5", 
          width: 3
        };
      case "step":
        return {
          color: "#F2994A", // Orange
          dashArray: "10,5", 
          width: 3
        };
      default:
        return {
          color: "#4A6FA5", // Default blue
          dashArray: "none", 
          width: 3
        };
    }
  };

  const strokeProps = getStrokeProperties();

  return (
    <>
      {/* Background line (shadow effect) */}
      <line 
        x1={x1} 
        y1={y1} 
        x2={x2} 
        y2={y2} 
        className="relationship-line-bg" 
        stroke="#ffffff"
        strokeWidth={strokeProps.width + 2}
        strokeLinecap="round"
        strokeOpacity={0.6}
      />
      
      {/* Colored relationship line */}
      <line 
        x1={x1} 
        y1={y1} 
        x2={x2} 
        y2={y2} 
        className="relationship-line" 
        stroke={strokeProps.color}
        strokeWidth={strokeProps.width}
        strokeLinecap="round"
        strokeDasharray={strokeProps.dashArray}
      />
    </>
  );
};

export default RelationshipLine;
