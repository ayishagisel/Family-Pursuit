import React, { useState, useCallback, useEffect } from "react";
import TreeCanvas from "@/components/family-tree/TreeCanvas";
import TreeControls from "@/components/family-tree/TreeControls";
import FamilyInsights from "@/components/ai/FamilyInsights";
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
import { useQuery } from "@tanstack/react-query";
import { TreeMember } from "../lib/treeUtils";

const FamilyTreePage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<TreeMember | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomIn, setZoomIn] = useState(false);
  const [zoomOut, setZoomOut] = useState(false);
  const [resetView, setResetView] = useState(false);
  const [visualizationType, setVisualizationType] =
    useState<string>("hierarchical");

  const [familyTreeData, setFamilyTreeData] = useState<TreeMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const rootParam =
            selectedMember?.id &&
            ["ancestor", "descendant"].includes(visualizationType)
              ? `&root=${selectedMember.id}`
              : "";

          const res = await fetch(
            `/api/relationships?type=${visualizationType}${rootParam}`,
          );
          const data = await res.json();

          console.log("✅ API response:", data); // ✅ Debug log

          setFamilyTreeData(Array.isArray(data) ? data : data.nodes || []);
        } catch (err) {
          console.error("❌ Error loading tree:", err);
          setFamilyTreeData([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, 150); // Delay slightly to debounce rapid state changes

    return () => clearTimeout(timeout);
  }, [visualizationType, selectedMember]);

  const { data: memberDetails, isLoading: isDetailLoading } = useQuery<any>({
    queryKey: [`/api/family-members/${selectedMember?.id}/narrative`],
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

  const handleMemberClick = useCallback((member: TreeMember) => {
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
          <button
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
            onClick={() => alert("This feature is coming soon!")}
          >
            <i className="fas fa-plus-circle"></i>
            Add Family Member
          </button>
          <TreeControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleResetView}
            zoomLevel={zoomLevel}
            onVisualizationChange={handleVisualizationChange}
            currentVisualization={visualizationType}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="w-full bg-background border rounded-xl shadow-sm overflow-hidden h-[600px]">
            {isLoading || familyTreeData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading family tree...
              </div>
            ) : (
              <TreeCanvas
                nodes={
                  visualizationType === "sociogram" && "nodes" in familyTreeData
                    ? familyTreeData.nodes
                    : familyTreeData
                }
                visualizationType={
                  visualizationType as
                    | "hierarchical"
                    | "ancestor"
                    | "descendant"
                    | "sociogram"
                    | "flat"
                }
                onNodeClick={handleMemberClick}
                onZoomChange={handleZoomChange}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                resetView={resetView}
                selectedPersonId={selectedMember?.id}
              />
            )}
          </div>

          <div className="w-full">
            <Card>
              <CardHeader>
                <CardTitle>Family Member Details</CardTitle>
                <CardDescription>
                  {selectedMember
                    ? `Viewing details for ${selectedMember.name}`
                    : "Select a family member in the tree above to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedMember ? (
                  <div className="flex justify-center items-center p-8 text-muted-foreground">
                    Click a family member to see their details.
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

                    <TabsContent value="info" className="mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium text-sm">Role</h3>
                          <p className="text-muted-foreground">
                            {selectedMember.role || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">Birth Date</h3>
                          <p className="text-muted-foreground">
                            {selectedMember.birth_date
                              ? new Date(
                                  selectedMember.birth_date,
                                ).toLocaleDateString()
                              : "Not specified"}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">Occupation</h3>
                          <p className="text-muted-foreground">
                            {selectedMember.occupation || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">Location</h3>
                          <p className="text-muted-foreground">
                            {selectedMember.location || "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="font-medium text-sm">Bio</h3>
                        <p className="text-muted-foreground">
                          {selectedMember.bio || "No bio available."}
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="narrative" className="mt-4">
                      <ScrollArea className="h-[400px] rounded-md border p-4">
                        {isDetailLoading ? (
                          <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : memberDetails?.narrative ? (
                          <div className="prose dark:prose-invert max-w-none">
                            <h3>Personal Story</h3>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: memberDetails.narrative
                                  .replace(/\n\s*\n/g, "<br><br>")
                                  .replace(/\n(?!\s*<)/g, "<br>")
                                  .replace(/\# ([^\n]+)/g, "<h4>$1</h4>"),
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">
                            No story available for this person.
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="relationships" className="mt-4">
                      <div className="space-y-3">
                        {[
                          "spouses",
                          "children",
                          "parents",
                          "siblings",
                          "extended",
                        ].map(
                          (group) =>
                            selectedMember[group]?.length > 0 && (
                              <div key={group}>
                                <h3 className="font-medium text-sm capitalize mb-1">
                                  {group}
                                </h3>
                                <ul className="list-disc pl-5 text-muted-foreground">
                                  {selectedMember[group].map((rel: any) => (
                                    <li key={rel.id}>
                                      {rel.name}{" "}
                                      <span className="text-xs opacity-70">
                                        ({rel.relationship_type || "Relative"})
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ),
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="insights" className="mt-4">
                      <FamilyInsights memberId={selectedMember?.id} />
                    </TabsContent>
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
