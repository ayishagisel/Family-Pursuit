import { useQuery } from '@tanstack/react-query';

interface FamilyInsightsResult {
  analysis: string;
  fallback?: boolean;
}

/**
 * Hook to fetch relationship insights from the API
 * @param memberId Optional member ID to filter insights for a specific family member
 * @returns Query result with insights data
 */
export function useFamilyInsights(memberId?: number) {
  return useQuery<FamilyInsightsResult>({
    queryKey: ['/api/analyze/relationships', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/analyze/relationships${memberId ? `?memberId=${memberId}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to load relationship insights');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}