import { useQuery } from "@tanstack/react-query";

export function useFamilyTree(
  visualizationType: string = "hierarchical",
  selectedPersonId?: number,
) {
  return useQuery({
    queryKey: ["family-tree", visualizationType, selectedPersonId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("type", visualizationType);
      if (selectedPersonId) {
        params.append("root", selectedPersonId.toString());
      }

      const res = await fetch(`/api/family/hierarchical?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch filtered family tree");
      return res.json();
    },
  });
}
