import React from 'react';
import { useFamilyInsights } from '@/hooks/useFamilyInsights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, HeartPulse } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FamilyInsightsProps {
  memberId?: number;
  className?: string;
}

const FamilyInsights: React.FC<FamilyInsightsProps> = ({ memberId, className }) => {
  // Use our custom hook to fetch the insights
  const { data: insightsData, isLoading, error, refetch } = useFamilyInsights(memberId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing relationships...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 border rounded-lg bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-center">Unable to load relationship insights.</p>
        <p className="text-xs text-muted-foreground text-center">
          There was an error communicating with the AI service.
        </p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!insightsData?.analysis) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 border rounded-lg">
        <p className="text-sm text-muted-foreground text-center">No insights available yet.</p>
      </div>
    );
  }

  // Format the markdown content for display
  const formattedContent = insightsData.analysis
    .replace(/\n\s*\n/g, '<br><br>')
    .replace(/\n(?!\s*<)/g, '<br>')
    .replace(/## ([^\n]+)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/# ([^\n]+)/g, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          <CardTitle>Family Relationship Insights</CardTitle>
        </div>
        <CardDescription>
          AI-powered analysis of your family connections
          {insightsData.fallback && " (Fallback Mode)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div 
            className="prose prose-sm max-w-none dark:prose-invert" 
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
          {insightsData.fallback && (
            <div className="mt-4 p-3 border rounded-md bg-amber-50 dark:bg-amber-950/20 text-xs">
              <p className="text-muted-foreground">
                Note: This is a simplified analysis. A more detailed AI-powered analysis is 
                available when full access to the AI service is restored.
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FamilyInsights;