import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpenIcon, RefreshCwIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface MemberNarrativeProps {
  memberId: number;
  className?: string;
}

const MemberNarrative: React.FC<MemberNarrativeProps> = ({ memberId, className }) => {
  const { data: narrativeData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/family-members/narrative', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/family-members/${memberId}/narrative`);
      if (!response.ok) {
        throw new Error('Failed to load member narrative');
      }
      return response.json() as Promise<{narrative: string}>;
    },
    enabled: !!memberId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  if (!memberId) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">Select a family member to view their story.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Generating family narrative...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">Could not load family member narrative.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
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
          <BookOpenIcon className="h-5 w-5 text-primary" />
          <CardTitle>Family Story</CardTitle>
        </div>
        <CardDescription>
          AI-generated narrative based on family connections
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-line">
            {narrativeData?.narrative || "No narrative available for this family member."}
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Generated using OpenAI
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-xs gap-1"
        >
          <RefreshCwIcon className="h-3 w-3" />
          Regenerate
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MemberNarrative;