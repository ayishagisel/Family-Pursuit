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
import { useQuery } from "@tanstack/react-query";

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

  // Load hierarchical family tree from the relationships API
  const { data: familyTreeData, isLoading, error } = useFamilyTree();

  React.useEffect(() => {
    console.log("📦 Raw flat data from API:", familyTreeData);
  }, [familyTreeData]);

  // Make sure we handle undefined data
  const tree = familyTreeData ? buildFamilyTree(familyTreeData) : [];

  React.useEffect(() => {
    console.log("🌳 Final nested tree (used by TreeCanvas):", tree);
  }, [tree]);

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

        <div className="flex flex-col gap-6">
          {/* Full-width tree visualization */}
          <div className="w-full bg-background border rounded-xl shadow-sm overflow-hidden h-[600px]">
            <TreeCanvas
              nodes={tree}
              visualizationType={visualizationType as "hierarchical" | "ancestor" | "descendant" | "sociogram" | "flat"}
              onNodeClick={handleMemberClick}
              onZoomChange={handleZoomChange}
              zoomIn={zoomIn}
              zoomOut={zoomOut}
              resetView={resetView}
            />
          </div>

          {/* Family member details below the tree */}
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

                    <TabsContent value="info" className="mt-4">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col space-y-3">
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
                                  ? new Date(selectedMember.birth_date).toLocaleDateString()
                                  : "Not specified"}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-medium text-sm">Location</h3>
                              <p className="text-muted-foreground">
                                {selectedMember.location || "Not specified"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-3">
                            <div>
                              <h3 className="font-medium text-sm">Occupation</h3>
                              <p className="text-muted-foreground">
                                {selectedMember.occupation || "Not specified"}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-medium text-sm">Personality</h3>
                              <p className="text-muted-foreground">
                                {selectedMember.personality_traits?.join(", ") || "Not specified"}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-medium text-sm">Interests</h3>
                              <p className="text-muted-foreground">
                                {selectedMember.interests?.join(", ") || "Not specified"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">Bio</h3>
                          <p className="text-muted-foreground">
                            {selectedMember.bio || "No biography available."}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="narrative" className="mt-4">
                      <ScrollArea className="h-[400px] rounded-md border p-4">
                        {isDetailLoading ? (
                          <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : memberDetails?.narrative ? (
                          <div className="prose max-w-none dark:prose-invert">
                            <h3>Personal Story</h3>
                            <p>{memberDetails.narrative}</p>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <p>No personal story available for this family member.</p>
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="relationships" className="mt-4">
                      <div className="space-y-4">
                        {selectedMember.spouses && selectedMember.spouses.length > 0 && (
                          <div>
                            <h3 className="font-medium text-sm mb-2">Spouse</h3>
                            <ul className="list-disc pl-5 text-muted-foreground">
                              {selectedMember.spouses.map((spouse) => (
                                <li key={spouse.id}>
                                  {spouse.name}{" "}
                                  <span className="text-xs opacity-70">
                                    ({spouse.notes || "Spouse"})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedMember.children && selectedMember.children.length > 0 && (
                          <div>
                            <h3 className="font-medium text-sm mb-2">Children</h3>
                            <ul className="list-disc pl-5 text-muted-foreground">
                              {selectedMember.children.map((child) => (
                                <li key={child.id}>
                                  {child.name}{" "}
                                  <span className="text-xs opacity-70">
                                    ({child.relationship_type || "Child"})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedMember.parents && selectedMember.parents.length > 0 && (
                          <div>
                            <h3 className="font-medium text-sm mb-2">Parents</h3>
                            <ul className="list-disc pl-5 text-muted-foreground">
                              {selectedMember.parents.map((parent) => (
                                <li key={parent.id}>
                                  {parent.name}{" "}
                                  <span className="text-xs opacity-70">
                                    ({parent.relationship_type || "Parent"})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedMember.siblings && selectedMember.siblings.length > 0 && (
                          <div>
                            <h3 className="font-medium text-sm mb-2">Siblings</h3>
                            <ul className="list-disc pl-5 text-muted-foreground">
                              {selectedMember.siblings.map((sibling) => (
                                <li key={sibling.id}>
                                  {sibling.name}{" "}
                                  <span className="text-xs opacity-70">
                                    ({sibling.relationship_type || "Sibling"})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedMember.extended && selectedMember.extended.length > 0 && (
                          <div>
                            <h3 className="font-medium text-sm mb-2">Extended Family</h3>
                            <ul className="list-disc pl-5 text-muted-foreground">
                              {selectedMember.extended.map((relative) => (
                                <li key={relative.id}>
                                  {relative.name}{" "}
                                  <span className="text-xs opacity-70">
                                    ({relative.relationship_type || "Relative"})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="insights" className="mt-4">
                      <ScrollArea className="h-[400px] rounded-md border p-4">
                        {isDetailLoading ? (
                          <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : memberDetails?.insights ? (
                          <div className="prose max-w-none dark:prose-invert">
                            <h3>Family Insights</h3>
                            <p>{memberDetails.insights}</p>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <p>No insights available for this family member.</p>
                            <p className="text-sm mt-2">Select 'Story' to see their narrative instead.</p>
                          </div>
                        )}
                      </ScrollArea>
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
