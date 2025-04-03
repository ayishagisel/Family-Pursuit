import { Search, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TreeControlsProps {
  onSearch?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  currentZoom?: number;
}

const TreeControls = ({ 
  onSearch, 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  currentZoom = 1
}: TreeControlsProps) => {
  return (
    <div className="flex items-center space-x-2">
      {onSearch && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearch}
          title="Search Family Tree"
          className="h-8 w-8"
        >
          <Search className="h-4 w-4" />
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        title="Zoom In"
        className="h-8 w-8"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      {currentZoom !== 1 && (
        <span className="text-xs text-muted-foreground px-1">
          {Math.round(currentZoom * 100)}%
        </span>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        title="Zoom Out" 
        className="h-8 w-8"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        title="Reset View"
        className="h-8 w-8"
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default TreeControls;
