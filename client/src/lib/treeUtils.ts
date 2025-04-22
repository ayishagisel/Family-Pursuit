import { FamilyMember } from "@shared/schema";

// Extended FamilyMember type for tree visualization
export interface TreeMember extends FamilyMember {
  spouses?: any[];
  children?: any[];
  parents?: any[];
  siblings?: any[];
  extended?: any[];
  childrenCount?: number;
  siblingsCount?: number;
  extendedCount?: number;
  generation?: number;
  x?: number;
  y?: number;
}

export function buildFamilyTree(hierarchicalData: any[]): any[] {
  const roots: any[] = hierarchicalData.filter((member: any) => {
    return !member.parents || member.parents.length === 0;
  });

  if (roots.length === 0 && hierarchicalData.length > 0) {
    console.warn("⚠️ No root members found, using all members as roots");
    return hierarchicalData;
  }

  return roots;
}

// New: Recursively find all ancestors
export function getAncestors(
  person: any,
  allNodes: any[],
  visited = new Set(),
): any[] {
  if (!person || visited.has(person.id)) return [];
  visited.add(person.id);

  const directParents = person.parents || [];
  const parentNodes = directParents
    .map((p: any) => allNodes.find((n) => n.id === p.id))
    .filter(Boolean);

  return [
    person,
    ...parentNodes.flatMap((p: any) => getAncestors(p, allNodes, visited)),
  ];
}

// New: Recursively find all descendants
export function getDescendants(
  person: any,
  allNodes: any[],
  visited = new Set(),
): any[] {
  if (!person || visited.has(person.id)) return [];
  visited.add(person.id);

  const directChildren = person.children || [];
  const childNodes = directChildren
    .map((c: any) => allNodes.find((n) => n.id === c.id))
    .filter(Boolean);

  return [
    person,
    ...childNodes.flatMap((c: any) => getDescendants(c, allNodes, visited)),
  ];
}
