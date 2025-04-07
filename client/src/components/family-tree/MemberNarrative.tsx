import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FamilyMember } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, FileText, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
}

interface MemberNarrativeProps {
  member: FamilyMember;
}

export function MemberNarrative({ member }: MemberNarrativeProps) {
  const [activeTab, setActiveTab] = useState("narrative");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [`/api/family-members/${member.id}/narrative`],
    enabled: !!member.id,
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Generating Narrative</CardTitle>
          <CardDescription>Creating a personalized narrative for {member.name}...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="w-full max-w-3xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load narrative for {member.name}. {(error as Error)?.message || "Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }

  // Initialize with default values
  const narrativeData = data as { narrative: string; timeline: TimelineEvent[] } || { narrative: "", timeline: [] };
  const narrative = narrativeData.narrative || "";
  const timeline = narrativeData.timeline || [];
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {member.name}'s Story
        </CardTitle>
        <CardDescription>
          A personal narrative based on family relationships and available information.
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="narrative" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="narrative">Narrative</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="narrative" className="m-0">
          <CardContent className="p-6">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {narrative ? (
                <div className="space-y-4">
                  {narrative.split('\n\n').map((paragraph: string, index: number) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No narrative available</AlertTitle>
                  <AlertDescription>
                    We couldn't generate a narrative for {member.name} at this time.
                  </AlertDescription>
                </Alert>
              )}
            </ScrollArea>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="timeline" className="m-0">
          <CardContent className="p-6">
            <ScrollArea className="h-[300px] rounded-md border">
              {timeline && timeline.length > 0 ? (
                <div className="p-4 space-y-4">
                  {(timeline as TimelineEvent[]).map((event, index) => (
                    <div key={index} className="relative pl-6 pb-4 border-l border-muted">
                      <div className="absolute left-0 top-0 w-2 h-2 rounded-full bg-primary -translate-x-1/2" />
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.date}
                      </div>
                      {event.description && (
                        <div className="text-sm mt-1">{event.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full p-4">
                  <Alert variant="warning" className="w-full">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No timeline events</AlertTitle>
                    <AlertDescription>
                      We couldn't find any timeline events for {member.name}.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between px-6 py-4 border-t">
        <Button variant="outline" onClick={() => setActiveTab(activeTab === "narrative" ? "timeline" : "narrative")}>
          View {activeTab === "narrative" ? "Timeline" : "Narrative"}
        </Button>
        <div className="text-sm text-muted-foreground">
          Last updated: {formatDistanceToNow(new Date(), { addSuffix: true })}
        </div>
      </CardFooter>
    </Card>
  );
}