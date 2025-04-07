import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, LightbulbIcon, HeartIcon, UsersIcon, AlertTriangleIcon } from 'lucide-react';

interface RelationshipInsight {
  summary: string;
  keyPoints: string[];
  suggestions: string[];
}

interface RelationshipInsightsProps {
  memberId?: number;
  className?: string;
}

const RelationshipInsights: React.FC<RelationshipInsightsProps> = ({ memberId, className }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  const { data: insightsData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/analyze/relationships', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/analyze/relationships${memberId ? `?memberId=${memberId}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to load relationship insights');
      }
      return response.json() as Promise<RelationshipInsight>;
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Analyzing relationships...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HeartIcon className="h-5 w-5 text-primary" />
            <CardTitle>Relationship Insights</CardTitle>
          </div>
          <CardDescription>
            AI-powered analysis of family relationships
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangleIcon className="h-8 w-8 text-amber-500" />
            <p className="text-sm font-medium text-center">API rate limit reached. The AI analysis feature is currently unavailable.</p>
            <p className="text-xs text-muted-foreground text-center">This is a temporary limitation that will reset according to your OpenAI usage plan.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HeartIcon className="h-5 w-5 text-primary" />
          <CardTitle>Relationship Insights</CardTitle>
        </div>
        <CardDescription>
          AI-powered analysis of family relationships
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keypoints">Key Points</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-4">
          <TabsContent value="overview" className="mt-0">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm">{insightsData?.summary || "No insights available yet."}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/10">
                  <UsersIcon className="h-3 w-3 mr-1" />
                  Family Health
                </Badge>
                <Badge variant="outline" className="bg-primary/10">
                  <LightbulbIcon className="h-3 w-3 mr-1" />
                  AI Analysis
                </Badge>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="keypoints" className="mt-0">
            <div className="space-y-2">
              {insightsData?.keyPoints?.length ? (
                <ul className="space-y-2">
                  {insightsData.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm">{point}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No key points available.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="suggestions" className="mt-0">
            <div className="space-y-2">
              {insightsData?.suggestions?.length ? (
                <ul className="space-y-2">
                  {insightsData.suggestions.map((suggestion, i) => (
                    <li key={i} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex gap-2 items-start">
                        <LightbulbIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm">{suggestion}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No suggestions available.</p>
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Powered by OpenAI
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          className="text-xs"
        >
          Refresh Analysis
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RelationshipInsights;