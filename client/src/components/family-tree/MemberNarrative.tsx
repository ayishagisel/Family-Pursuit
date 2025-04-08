import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface MemberNarrativeProps {
  memberId: number | null;
  memberName: string | null;
}

export function MemberNarrative({ memberId, memberName }: MemberNarrativeProps) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mutation to generate narrative
  const generateNarrative = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("GET", `/api/family-members/${id}/narrative`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate narrative");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setNarrative(data.narrative);
      setError(null);
    },
    onError: (error: Error) => {
      console.error("Error generating narrative:", error);
      setError(error.message);
      
      // Check if error is related to OpenAI API key
      if (error.message.includes("OpenAI API key")) {
        setError("Missing or invalid OpenAI API key. Please ask the administrator to configure the API key.");
      }
    }
  });

  // When selected member changes, fetch their narrative
  useEffect(() => {
    if (memberId) {
      generateNarrative.mutate(memberId);
    } else {
      setNarrative(null);
      setError(null);
    }
  }, [memberId]);

  // If no member is selected
  if (!memberId) {
    return null;
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Personal Narrative</span>
          {generateNarrative.isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
        <CardDescription>
          AI-generated biography for {memberName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {generateNarrative.isPending ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground text-sm">Generating narrative...</p>
          </div>
        ) : error ? (
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
                onClick={() => memberId && generateNarrative.mutate(memberId)}
                disabled={generateNarrative.isPending}
                className="mt-4"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        ) : narrative ? (
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: narrative
                .replace(/\n\s*\n/g, '<br><br>')
                .replace(/\n(?!\s*<)/g, '<br>')
            }} />
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Narrative Available</AlertTitle>
            <AlertDescription>
              Unable to generate a narrative for this family member.
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => memberId && generateNarrative.mutate(memberId)}
                disabled={generateNarrative.isPending}
                className="mt-4"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}