/**
 * Build a hierarchical family tree from the API data
 * This function organizes the data from the relationships API into a hierarchical tree structure
 * The API gives us members with children, parents, spouses, etc. arrays, but we need to
 * organize it into a proper tree for visualization
 */
export function buildFamilyTree(hierarchicalData) {
  if (!hierarchicalData || !Array.isArray(hierarchicalData)) {
    console.error("Invalid hierarchical data provided", hierarchicalData);
    return [];
  }

  // First, create a map of all nodes for quick access
  const nodesMap = new Map();
  
  // Initialize all nodes and store them in the map
  hierarchicalData.forEach(member => {
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
  hierarchicalData.forEach(member => {
    const node = nodesMap.get(member.id);
    
    // Add all children references
    if (member.children && member.children.length > 0) {
      member.children.forEach(child => {
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
  const rootNodes = [];
  nodesMap.forEach(node => {
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
