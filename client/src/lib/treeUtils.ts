import { FamilyMember } from "@shared/schema";

interface TreeNode extends FamilyMember {
  children?: TreeNode[];
  _children?: TreeNode[];
  parent?: number | null;
  x?: number;
  y?: number;
  generation?: number;
}

/**
 * Create a tree structure from flat data with parent-child relationships
 * This version uses explicit parent references from the backend
 */
export function buildFamilyTree(flatData: TreeNode[]): TreeNode[] {
  if (!flatData || !Array.isArray(flatData) || flatData.length === 0) {
    console.warn("No data provided to buildFamilyTree");
    return [];
  }
  
  console.log("Starting family tree building with", flatData.length, "members");
  
  // Create a map for O(1) lookups
  const nodesMap = new Map<number, TreeNode>();
  
  // First pass: Initialize nodes with empty children arrays
  flatData.forEach((node) => {
    nodesMap.set(node.id, {
      ...node,
      children: []
    });
  });
  
  // Track processed nodes to avoid duplicates
  const processed = new Set<number>();
  const rootNodes: TreeNode[] = [];
  
  // Second pass: Establish parent-child relationships
  flatData.forEach((node) => {
    const processedNode = nodesMap.get(node.id);
    if (!processedNode) return;
    
    const parentId = node.parent;
    
    if (parentId && nodesMap.has(parentId)) {
      // This node has a parent, add it to parent's children
      const parent = nodesMap.get(parentId);
      if (parent && !processed.has(node.id)) {
        parent.children?.push(processedNode);
        processed.add(node.id);
      }
    } else {
      // This is a root node (no parent)
      if (!processed.has(node.id)) {
        rootNodes.push(processedNode);
        processed.add(node.id);
      }
    }
    
    console.log(
      `ID: ${node.id} | Name: ${node.name} | Parent ID: ${node.parent} | Generation: ${node.generation || "unknown"}`,
    );
  });
  
  console.log("Found", rootNodes.length, "root nodes in family tree");
  
  // If we have more than 5 root nodes, we likely have an issue with the parent-child assignation
  // In that case, try to restructure based on generations
  if (rootNodes.length > 5) {
    console.warn("Too many root nodes detected, restructuring by generation");
    return restructureByGeneration(flatData);
  }
  
  return rootNodes;
}

/**
 * Alternative tree building strategy using generation information
 * Used as a fallback when direct parent-child links are not working well
 */
function restructureByGeneration(flatData: TreeNode[]): TreeNode[] {
  // Group nodes by generation
  const nodesByGeneration = new Map<number, TreeNode[]>();
  
  // First, group all nodes by their generation
  flatData.forEach(node => {
    const generation = node.generation || 0;
    
    if (!nodesByGeneration.has(generation)) {
      nodesByGeneration.set(generation, []);
    }
    
    nodesByGeneration.get(generation)?.push({
      ...node,
      children: []
    });
  });
  
  // Get the generations in order
  const generations = Array.from(nodesByGeneration.keys()).sort((a, b) => a - b);
  
  // Start with oldest generation (lowest number) as roots
  const rootGeneration = generations[0];
  const rootNodes = nodesByGeneration.get(rootGeneration) || [];
  
  // Create a map for tracking processed nodes
  const processedNodeMap = new Map<number, TreeNode>();
  rootNodes.forEach(node => {
    processedNodeMap.set(node.id, node);
  });
  
  // Process each generation and link to parents where possible
  for (let i = 1; i < generations.length; i++) {
    const currentGen = generations[i];
    const currentNodes = nodesByGeneration.get(currentGen) || [];
    
    currentNodes.forEach(node => {
      // See if we can find a parent in the previous generation
      const potentialParents = flatData.filter(parent => {
        // Look for nodes in previous generation where this node appears in their children
        return parent.generation === currentGen - 1 && 
               parent.children.some(child => child.id === node.id);
      });
      
      if (potentialParents.length > 0) {
        // We found at least one parent, use the first one
        const parentNode = processedNodeMap.get(potentialParents[0].id);
        if (parentNode) {
          parentNode.children?.push(node);
        } else {
          // Parent wasn't found in our map, add this as a root
          rootNodes.push(node);
        }
      } else {
        // No parent found, add as a root node
        rootNodes.push(node);
      }
      
      // Add to processed map for children in next generation
      processedNodeMap.set(node.id, node);
    });
  }
  
  console.log("Restructured tree with", rootNodes.length, "root nodes");
  return rootNodes;
}

/**
 * Build a hierarchical tree using d3-hierarchy compatible structure
 */
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