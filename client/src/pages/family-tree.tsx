import React, { useState, useCallback } from "react";
import { useFamilyTree } from "../hooks/useFamilyTree";
import { buildFamilyTree } from "../lib/treeUtils";
import TreeCanvas from "@/components/family-tree/TreeCanvas";
import TreeControls from "@/components/family-tree/TreeControls";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FamilyMember } from "@shared/schema";
import { Loader2 } from "lucide-react";

const FamilyTreePage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null,
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomIn, setZoomIn] = useState(false);
  const [zoomOut, setZoomOut] = useState(false);
  const [resetView, setResetView] = useState(false);
  const [visualizationType, setVisualizationType] =
    useState<string>("hierarchical");

  // ✅ NEW: Load hierarchical family tree
  const { data: familyTreeData, isLoading, error } = useFamilyTree();
  const tree = familyTreeData ? buildFamilyTree(familyTreeData) : [];

  // Optional: Family member detail narrative
  const { data: memberDetails, isLoading: isDetailLoading } = useQuery<any>({
    queryKey: ["/api/family-members", selectedMember?.id, "/narrative"],
    enabled: !!selectedMember?.id,
  });

  const handleZoomIn = useCallback(() => {
    setZoomIn(true);
    setTimeout(() => setZoomIn(false), 100);
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomOut(true);
    setTimeout(() => setZoomOut(false), 100);
  }, []);

  const handleResetView = useCallback(() => {
    setResetView(true);
    setTimeout(() => setResetView(false), 100);
  }, []);

  const handleZoomChange = useCallback((scale: number) => {
    setZoomLevel(scale);
  }, []);

  const handleMemberClick = useCallback((member: FamilyMember) => {
    setSelectedMember(member);
  }, []);

  const handleVisualizationChange = useCallback((type: string) => {
    setVisualizationType(type);
  }, []);

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Family Tree</h1>
            <p className="text-muted-foreground">
              Visualize and navigate your family relationships
            </p>
          </div>
          <TreeControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleResetView}
            zoomLevel={zoomLevel}
            onVisualizationChange={handleVisualizationChange}
            currentVisualization={visualizationType}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-background border rounded-xl shadow-sm overflow-hidden h-[700px]">
            {/* ✅ Feed the built tree to the canvas */}
            <TreeCanvas
              nodes={tree}
              layout={visualizationType as any}
              onNodeClick={handleMemberClick}
              onZoomChange={handleZoomChange}
              zoomIn={zoomIn}
              zoomOut={zoomOut}
              resetView={resetView}
            />
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Family Member Details</CardTitle>
                <CardDescription>
                  {selectedMember
                    ? `Viewing details for ${selectedMember.name}`
                    : "Select a family member to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedMember ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <p>
                      Click on any family member in the tree to view their
                      details
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue="info">
                    <TabsList className="w-full">
                      <TabsTrigger value="info" className="flex-1">
                        Info
                      </TabsTrigger>
                      <TabsTrigger value="narrative" className="flex-1">
                        Story
                      </TabsTrigger>
                      <TabsTrigger value="relationships" className="flex-1">
                        Relationships
                      </TabsTrigger>
                      <TabsTrigger value="insights" className="flex-1">
                        Insights
                      </TabsTrigger>
                    </TabsList>

                    {/* Keep all your original tab content as-is below */}
                    {/* No change needed to your detail tabs. They work perfectly */}
                    {/* I omitted them here for brevity, but leave them exactly as you have! */}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTreePage;
