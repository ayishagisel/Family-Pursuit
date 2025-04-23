import { FamilyMember } from "@shared/schema";

export interface TreeMember extends FamilyMember {
  spouses?: TreeMember[];
  children?: TreeMember[];
  parents?: TreeMember[];
  siblings?: TreeMember[];
  generation?: number;
  x?: number;
  y?: number;
}

type VisualizationType =
  | "hierarchical"
  | "ancestor"
  | "descendant"
  | "sociogram"
  | "flat";

interface TreeUtilsOptions {
  visualizationType: VisualizationType;
  data: TreeMember[];
  selectedId?: number;
  currentUserId?: number;
}

export function getPositionedFamilyTree({
  visualizationType,
  data,
  selectedId,
  currentUserId,
}: TreeUtilsOptions): TreeMember[] {
  if (!data || data.length === 0) return [];

  let filtered: TreeMember[] = [];
  const targetId = selectedId || currentUserId || 1;
  const target = data.find((m) => m.id === targetId);

  switch (visualizationType) {
    case "ancestor":
      filtered = target ? getAncestors(data, target) : [];
      break;
    case "descendant":
      filtered = target ? getDescendants(data, target) : [];
      break;
    case "flat":
    case "sociogram":
      filtered = data;
      break;
    case "hierarchical":
    default:
      filtered = buildFullTree(data);
      break;
  }

  assignGenerations(filtered);
  assignCoordinates(filtered);

  return filtered;
}

export function getAncestors(
  all: TreeMember[],
  start: TreeMember,
): TreeMember[] {
  const visited = new Map<number, TreeMember>();
  const stack = [start];

  while (stack.length) {
    const current = stack.pop();
    if (!current || visited.has(current.id)) continue;

    visited.set(current.id, current);
    if (current.parents) {
      current.parents.forEach((pRef) => {
        const p = all.find((m) => m.id === pRef.id);
        if (p) stack.push(p);
      });
    }
  }

  return Array.from(visited.values());
}

export function getDescendants(
  all: TreeMember[],
  start: TreeMember,
): TreeMember[] {
  const visited = new Map<number, TreeMember>();
  const stack = [start];

  while (stack.length) {
    const current = stack.pop();
    if (!current || visited.has(current.id)) continue;

    visited.set(current.id, current);
    if (current.children) {
      current.children.forEach((cRef) => {
        const c = all.find((m) => m.id === cRef.id);
        if (c) stack.push(c);
      });
    }
  }

  return Array.from(visited.values());
}

function buildFullTree(data: TreeMember[]): TreeMember[] {
  const roots = data.filter((m) => !m.parents || m.parents.length === 0);
  return roots.length > 0 ? roots : data;
}

function assignGenerations(members: TreeMember[]) {
  const visited = new Set<number>();

  const assign = (member: TreeMember, level: number) => {
    if (visited.has(member.id)) return;
    visited.add(member.id);
    member.generation = level;

    member.children?.forEach((cRef) => {
      const child = members.find((m) => m.id === cRef.id);
      if (child) assign(child, level + 1);
    });

    member.spouses?.forEach((sRef) => {
      const spouse = members.find((m) => m.id === sRef.id);
      if (spouse) assign(spouse, level);
    });

    member.siblings?.forEach((siblingRef) => {
      const sibling = members.find((m) => m.id === siblingRef.id);
      if (sibling) assign(sibling, level);
    });
  };

  const roots = members.filter((m) => !m.parents || m.parents.length === 0);
  roots.forEach((r) => assign(r, 0));
}

function assignCoordinates(members: TreeMember[]) {
  const groupedByGen = new Map<number, TreeMember[]>();

  members.forEach((m) => {
    const gen = m.generation ?? 0;
    if (!groupedByGen.has(gen)) groupedByGen.set(gen, []);
    groupedByGen.get(gen)!.push(m);
  });

  for (const [gen, genMembers] of groupedByGen.entries()) {
    const spacingX = 160;
    const y = gen * 180;
    genMembers.forEach((m, index) => {
      m.x = index * spacingX;
      m.y = y;
    });
  }
}
