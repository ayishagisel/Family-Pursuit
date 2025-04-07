import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, RefreshCw, BookOpen, LightbulbIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RelationshipAnalysis() {
  const { toast } = useToast();
  const [hasRefreshed, setHasRefreshed] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["/api/analyze/relationships"],
  });

  const handleRefresh = async () => {
    try {
      setHasRefreshed(true);
      toast({
        title: "Updating analysis",
        description: "Refreshing the family relationship analysis...",
      });
      await refetch();
      toast({
        title: "Analysis updated",
        description: "Family relationship analysis has been refreshed.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Could not refresh the analysis. Please try again later.",
      });
    }
  };

  if (isLoading && !hasRefreshed) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Analyzing Family Relationships</CardTitle>
          <CardDescription>Generating insights based on your family structure...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load family analysis. {(error as Error)?.message || "Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }

  // Initialize with default values
  const analysisData = data as { insights: string; recommendations: string } || { insights: "", recommendations: "" };
  const insights = analysisData?.insights || "";
  const recommendations = analysisData?.recommendations || "";

  // Determine if we have meaningful content
  const hasInsights = insights && insights !== "Unable to analyze relationships at this time.";
  const hasRecommendations = recommendations && recommendations !== "Please try again later.";
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Family Relationship Analysis
        </CardTitle>
        <CardDescription>
          AI-powered insights about your family structure and connections
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-md font-semibold flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4" />
            Key Insights
          </h3>
          <ScrollArea className="h-[150px] rounded-md border p-4">
            {hasInsights ? (
              <div className="space-y-2">
                {insights.split('\n').map((paragraph: string, index: number) => (
                  <p key={index} className="text-sm">{paragraph}</p>
                ))}
              </div>
            ) : (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No insights available</AlertTitle>
                <AlertDescription>
                  We couldn't generate insights for your family relationships at this time.
                  Try adding more family members and defining their relationships.
                </AlertDescription>
              </Alert>
            )}
          </ScrollArea>
        </div>
        
        <div>
          <h3 className="text-md font-semibold flex items-center gap-2 mb-2">
            <LightbulbIcon className="h-4 w-4" />
            Recommendations
          </h3>
          <ScrollArea className="h-[150px] rounded-md border p-4">
            {hasRecommendations ? (
              <div className="space-y-2">
                {recommendations.split('\n').map((paragraph: string, index: number) => (
                  <p key={index} className="text-sm">{paragraph}</p>
                ))}
              </div>
            ) : (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No recommendations available</AlertTitle>
                <AlertDescription>
                  We couldn't generate recommendations for your family relationships.
                  Try adding more family member details to get personalized recommendations.
                </AlertDescription>
              </Alert>
            )}
          </ScrollArea>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between px-6 py-4 border-t">
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isLoading ? "Refreshing..." : "Refresh Analysis"}
        </Button>
        <div className="text-sm text-muted-foreground">
          {hasInsights && "Analysis based on current family structure."}
        </div>
      </CardFooter>
    </Card>
  );
}