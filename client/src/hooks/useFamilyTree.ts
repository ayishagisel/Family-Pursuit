import { useQuery } from "@tanstack/react-query";

export function useFamilyTree() {
  return useQuery({
    queryKey: ["family-tree"],
    queryFn: async () => {
      const res = await fetch("/api/family-tree");
      if (!res.ok) throw new Error("Failed to fetch family tree");
      return res.json();
    },
  });
}
