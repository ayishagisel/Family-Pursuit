import { useQuery } from "@tanstack/react-query";

export function useFamilyTree() {
  return useQuery({
    queryKey: ["hierarchical-family"],
    queryFn: async () => {
      // Use the relationships endpoint with hierarchical structure
      const res = await fetch("/api/relationships?type=hierarchical");
      if (!res.ok) throw new Error("Failed to fetch family tree");
      return res.json();
    },
  });
}
