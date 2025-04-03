interface RelationshipLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: string;
}

const RelationshipLine = ({ x1, y1, x2, y2, type }: RelationshipLineProps) => {
  // Get stroke color based on relationship type
  const getStrokeColor = () => {
    switch (type) {
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
    <line 
      x1={x1} 
      y1={y1} 
      x2={x2} 
      y2={y2} 
      className="relationship-line" 
      stroke={getStrokeColor()}
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
};

export default RelationshipLine;
