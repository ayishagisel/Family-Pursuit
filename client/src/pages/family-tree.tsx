import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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

  // Family member details fetching (optional)
  const { data: memberDetails, isLoading: isDetailLoading } = useQuery<any>({
    queryKey: ["/api/family-members", selectedMember?.id, "/narrative"],
    enabled: !!selectedMember?.id,
  });

  // Tree controls handlers
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
            <TreeCanvas
              onNodeClick={handleMemberClick}
              onZoomChange={handleZoomChange}
              zoomIn={zoomIn}
              zoomOut={zoomOut}
              resetView={resetView}
              visualizationType={visualizationType as any}
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

                    <TabsContent value="info" className="py-4">
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium">
                            {selectedMember.avatarUrl ? (
                              <img
                                src={selectedMember.avatarUrl}
                                alt={selectedMember.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              selectedMember.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()
                            )}
                          </div>
                        </div>

                        <h3 className="text-xl font-semibold text-center mt-2">
                          {selectedMember.name}
                        </h3>
                        <p className="text-center text-muted-foreground">
                          {selectedMember.role}
                        </p>

                        <div className="pt-4 grid grid-cols-1 gap-3">
                          {selectedMember.birth_date && (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                Birth Date
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(
                                  selectedMember.birth_date,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {selectedMember.location && (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                Location
                              </span>
                              <span className="text-muted-foreground">
                                {selectedMember.location}
                              </span>
                            </div>
                          )}

                          {selectedMember.occupation && (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                Occupation
                              </span>
                              <span className="text-muted-foreground">
                                {selectedMember.occupation}
                              </span>
                            </div>
                          )}

                          {selectedMember.bio && (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                Biography
                              </span>
                              <span className="text-muted-foreground">
                                {selectedMember.bio}
                              </span>
                            </div>
                          )}

                          {selectedMember.personality_traits &&
                            selectedMember.personality_traits.length > 0 && (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  Personality Traits
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedMember.personality_traits.map(
                                    (trait) => (
                                      <span
                                        key={trait}
                                        className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary"
                                      >
                                        {trait}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          {selectedMember.interests &&
                            selectedMember.interests.length > 0 && (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  Interests
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedMember.interests.map((interest) => (
                                    <span
                                      key={interest}
                                      className="px-2 py-1 text-xs rounded-md bg-secondary/10 text-secondary-foreground"
                                    >
                                      {interest}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="narrative" className="py-4">
                      <ScrollArea className="h-[360px] pr-4">
                        {isDetailLoading ? (
                          <div className="flex justify-center items-center h-[200px]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : memberDetails?.narrative ? (
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: memberDetails.narrative.replace(
                                /\n/g,
                                "<br />",
                              ),
                            }}
                          />
                        ) : (
                          <div className="space-y-4">
                            <h4 className="text-lg font-medium">
                              Family Story
                            </h4>
                            <p className="text-muted-foreground">
                              {selectedMember.name}'s story is part of your
                              family's legacy. Their experiences, challenges,
                              and triumphs have shaped not only their life but
                              the lives of everyone connected to them.
                            </p>
                            <div className="bg-primary/5 p-4 rounded-lg">
                              <h5 className="font-medium mb-2">
                                Generational Timeline
                              </h5>
                              <div className="space-y-2">
                                {selectedMember.birth_date && (
                                  <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                    <div>
                                      <span className="text-sm font-medium">
                                        {new Date(
                                          selectedMember.birth_date,
                                        ).getFullYear()}
                                      </span>
                                      <p className="text-sm text-muted-foreground">
                                        Born in{" "}
                                        {selectedMember.location ||
                                          "unknown location"}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {selectedMember.role === "Father" ||
                                selectedMember.role === "Mother" ? (
                                  <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                    <div>
                                      <span className="text-sm font-medium">
                                        Family Formation
                                      </span>
                                      <p className="text-sm text-muted-foreground">
                                        Started a family and became a{" "}
                                        {selectedMember.role.toLowerCase()}
                                      </p>
                                    </div>
                                  </div>
                                ) : null}
                                {selectedMember.role.includes("Step") ? (
                                  <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                    <div>
                                      <span className="text-sm font-medium">
                                        Blended Family
                                      </span>
                                      <p className="text-sm text-muted-foreground">
                                        Joined a blended family
                                      </p>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="relationships" className="py-4">
                      <ScrollArea className="h-[360px] pr-4">
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium">
                            Family Connections
                          </h4>
                          <div className="space-y-3">
                            {selectedMember.role === "Father" ||
                            selectedMember.role === "Mother" ? (
                              <div className="flex items-center justify-between p-2 bg-background border rounded-lg">
                                <span>Parent to children</span>
                                <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-800">
                                  Strong bond
                                </span>
                              </div>
                            ) : null}
                            {selectedMember.role === "Son" ||
                            selectedMember.role === "Daughter" ? (
                              <div className="flex items-center justify-between p-2 bg-background border rounded-lg">
                                <span>Child of parents</span>
                                <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-800">
                                  Strong bond
                                </span>
                              </div>
                            ) : null}
                            {selectedMember.role.includes("Step") ? (
                              <div className="flex items-center justify-between p-2 bg-background border rounded-lg">
                                <span>Step-relationship</span>
                                <span className="text-sm px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                                  Building bond
                                </span>
                              </div>
                            ) : null}
                            {selectedMember.role.includes("Adopted") ? (
                              <div className="flex items-center justify-between p-2 bg-background border rounded-lg">
                                <span>Adoptive relationship</span>
                                <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-800">
                                  Strong bond
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="insights" className="py-4">
                      <ScrollArea className="h-[360px] pr-4">
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium">
                            Relationship Insights
                          </h4>
                          <div className="space-y-3">
                            <div className="bg-primary/5 p-4 rounded-lg">
                              <h5 className="font-medium">
                                Connection Strength
                              </h5>
                              <div className="mt-2 h-2 bg-primary/20 rounded-full overflow-hidden">
                                {selectedMember.relationship ===
                                "biological" ? (
                                  <div className="h-full bg-primary w-[85%]"></div>
                                ) : selectedMember.relationship ===
                                  "adoptive" ? (
                                  <div className="h-full bg-primary w-[80%]"></div>
                                ) : (
                                  <div className="h-full bg-primary w-[60%]"></div>
                                )}
                              </div>
                              <div className="flex justify-between mt-1 text-xs">
                                <span>Distant</span>
                                <span>Connected</span>
                                <span>Close</span>
                              </div>
                            </div>

                            <div className="bg-primary/5 p-4 rounded-lg">
                              <h5 className="font-medium">
                                Interaction Frequency
                              </h5>
                              <div className="grid grid-cols-7 gap-1 mt-2">
                                {Array.from({ length: 7 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`h-6 rounded-sm ${
                                      i < 3
                                        ? "bg-primary/20"
                                        : i < 5
                                          ? "bg-primary/40"
                                          : "bg-primary/60"
                                    }`}
                                  ></div>
                                ))}
                              </div>
                              <div className="flex justify-between mt-1 text-xs">
                                <span>Jan</span>
                                <span>Apr</span>
                                <span>Jul</span>
                              </div>
                            </div>

                            <div className="bg-primary/5 p-4 rounded-lg">
                              <h5 className="font-medium">Common Interests</h5>
                              {selectedMember.interests &&
                              selectedMember.interests.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {selectedMember.interests.map((interest) => (
                                    <span
                                      key={interest}
                                      className="px-2 py-1 text-xs rounded-md bg-secondary/10 text-secondary-foreground"
                                    >
                                      {interest}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground mt-2">
                                  No common interests recorded
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
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

// Note: To implement custom hooks, create the following files:
// 1. src/hooks/useFamilyTree.ts - For data fetching logic
// 2. src/lib/treeUtils.ts - For tree data transformation
