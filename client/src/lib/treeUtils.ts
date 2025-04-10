import { FamilyMember } from "@shared/schema";

// Extended FamilyMember type for tree visualization
export interface TreeMember extends FamilyMember {
  // Relationship arrays from the hierarchical API
  spouses?: any[];
  children?: any[];
  parents?: any[];
  siblings?: any[];
  extended?: any[];
  
  // Stats
  childrenCount?: number;
  siblingsCount?: number;
  extendedCount?: number;
  
  // Position information
  generation?: number;
  x?: number;
  y?: number;
}

export function buildFamilyTree(hierarchicalData: any[]): any[] {
  // We don't need to convert the hierarchical data anymore
  // because the API is already returning a properly structured hierarchical tree
  // with spouses, children, parents, and siblings arrays
  
  // Just identify which nodes are roots (no parents or only have spouses)
  const roots: any[] = hierarchicalData.filter((member: any) => {
    return !member.parents || member.parents.length === 0;
  });
  
  console.log(`🌳 Identified ${roots.length} root members in the family tree`);
  
  // If we have no roots but have members, consider all members as roots
  if (roots.length === 0 && hierarchicalData.length > 0) {
    console.warn("⚠️ No root members found, using all members as roots");
    return hierarchicalData;
  }
  
  return roots;
}

export function buildHierarchicalTree(hierarchicalData: any[]): any[] {
  if (!hierarchicalData || !Array.isArray(hierarchicalData)) {
    console.error("Invalid hierarchical data provided", hierarchicalData);
    return [];
  }

  // First, create a map of all nodes for quick access
  const nodesMap = new Map();
  
  // Initialize all nodes and store them in the map
  hierarchicalData.forEach((member: any) => {
    // Create a node with basic info
    const node = {
      ...member,
      // Keep full references to children for hierarchy
      _children: [],
      // Generation is important for vertical positioning
      generation: member.generation || 0,
      // Visual attributes for the tree
      x: 0,
      y: 0,
      size: 30,
      parent: null
    };
    
    nodesMap.set(member.id, node);
  });
  
  // Process parent-child relationships
  hierarchicalData.forEach((member: any) => {
    const node = nodesMap.get(member.id);
    
    // Add all children references
    if (member.children && member.children.length > 0) {
      member.children.forEach((child: any) => {
        const childNode = nodesMap.get(child.id);
        if (childNode) {
          // Add to children list
          node._children.push(childNode);
          // Set parent reference
          childNode.parent = node;
        }
      });
    }
  });
  
  // Identify root nodes (those without parents)
  const rootNodes: any[] = [];
  nodesMap.forEach((node: any) => {
    if (!node.parent) {
      rootNodes.push(node);
    }
  });
  
  // If we have no roots but have nodes, use the first one as root
  if (rootNodes.length === 0 && nodesMap.size > 0) {
    const fallbackRoot = nodesMap.values().next().value;
    rootNodes.push(fallbackRoot);
  }
  
  // Convert the map to an array of nodes
  const allNodes = Array.from(nodesMap.values());
  
  console.log(`Built family tree with ${allNodes.length} nodes and ${rootNodes.length} roots`);
  return allNodes;
}