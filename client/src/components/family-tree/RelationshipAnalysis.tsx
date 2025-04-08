import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, AlertCircle, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function RelationshipAnalysis() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mutation to generate relationship analysis
  const generateAnalysis = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/analyze/relationships");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate analysis");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setError(null);
    },
    onError: (error: Error) => {
      console.error("Error generating analysis:", error);
      setError(error.message);
      
      // Check if error is related to OpenAI API key
      if (error.message.includes("OpenAI API key")) {
        setError("Missing or invalid OpenAI API key. Please ask the administrator to configure the API key.");
      }
    }
  });

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span>Family Relationship Analysis</span>
          {generateAnalysis.isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
        <CardDescription>
          AI-powered insights about your family relationships
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!analysis && !error && !generateAnalysis.isPending && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-sm mb-4">
              Generate an AI analysis of your family structure and relationships
            </p>
            <Button 
              onClick={() => generateAnalysis.mutate()}
              disabled={generateAnalysis.isPending}
            >
              Generate Analysis
            </Button>
          </div>
        )}

        {generateAnalysis.isPending && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground text-sm">Analyzing family relationships...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="mt-2">
              {error}
              {error.includes("OpenAI API key") && (
                <div className="mt-4">
                  <p className="text-sm mb-2">To fix this issue:</p>
                  <ol className="text-sm list-decimal pl-5 space-y-1">
                    <li>Ensure the OpenAI API key is properly set in the server environment</li>
                    <li>The key should start with "sk-" and be added to the .env file</li>
                    <li>Restart the server after adding the API key</li>
                  </ol>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => generateAnalysis.mutate()}
                disabled={generateAnalysis.isPending}
                className="mt-4"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {analysis && !error && (
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: analysis
                .replace(/## (.*)/g, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
                .replace(/\n\s*\n/g, '<br><br>')
                .replace(/\n(?!\s*<)/g, '<br>') 
            }} />
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => generateAnalysis.mutate()}
                disabled={generateAnalysis.isPending}
              >
                Refresh Analysis
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}