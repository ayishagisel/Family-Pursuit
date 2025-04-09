export function buildFamilyTree(flatData) {
  const map = new Map();
  const roots = [];

  flatData.forEach((member) => {
    member.children = [];
    map.set(member.id, member);
  });

  flatData.forEach((member) => {
    if (member.parent_id !== null) {
      const parent = map.get(member.parent_id);
      parent.children.push(member);
    } else {
      roots.push(member);
    }
  });

  return roots;
}
