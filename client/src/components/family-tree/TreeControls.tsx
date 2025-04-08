import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Zap, ZoomIn, ZoomOut, RotateCcw, Users, UserCheck, GitMerge, Network } from "lucide-react";

interface TreeControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomLevel: number;
  onVisualizationChange: (type: string) => void;
  currentVisualization: string;
}

const TreeControls: React.FC<TreeControlsProps> = ({ 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  zoomLevel,
  onVisualizationChange,
  currentVisualization = "hierarchical"
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-background border rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onZoomIn}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground w-16 text-center">
          {(zoomLevel * 100).toFixed(0)}%
        </span>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onReset}
          title="Reset View"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Visualization:</span>
        <Select 
          value={currentVisualization}
          onValueChange={onVisualizationChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select visualization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hierarchical">
              <div className="flex items-center gap-2">
                <GitMerge className="h-4 w-4" />
                <span>Hierarchical</span>
              </div>
            </SelectItem>
            <SelectItem value="ancestor">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Ancestor Chart</span>
              </div>
            </SelectItem>
            <SelectItem value="descendant">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span>Descendant Chart</span>
              </div>
            </SelectItem>
            <SelectItem value="sociogram">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                <span>Sociogram</span>
              </div>
            </SelectItem>
            <SelectItem value="flat">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Flat View</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TreeControls;