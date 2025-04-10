import {
  users,
  type User,
  type InsertUser,
  familyMembers,
  type FamilyMember,
  type InsertFamilyMember,
  relationships,
  type Relationship,
  type InsertRelationship,
  events,
  type Event,
  type InsertEvent,
  documents,
  type Document,
  type InsertDocument,
  helpRequests,
  type HelpRequest,
  type InsertHelpRequest,
  messages,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, gte, and, or, sql } from "drizzle-orm";
import { IStorage } from "./storage";

// Logging helper
function logOperation(operation: string, entity: string, data?: any): void {
  console.log(
    `✅ PostgreSQL ${operation} operation successful on ${entity}${data ? `: ${JSON.stringify(data)}` : ""}`,
  );
}

export class DatabaseStorage implements IStorage {
  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    const [member] = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.id, id));
    if (member) logOperation("READ", "family_member", { id });
    return member;
  }

  async getAllFamilyMembers(): Promise<FamilyMember[]> {
    const members = await db.select().from(familyMembers);
    logOperation("READ", "family_members", { count: members.length });
    return members;
  }

  async getAllRelationships(): Promise<Relationship[]> {
    const allRelationships = await db.select().from(relationships);
    logOperation("READ", "relationships", { count: allRelationships.length });
    return allRelationships;
  }

  /**
   * 🌳 Main method to get nested family tree structure
   */
  async getHierarchicalFamilyStructure(): Promise<any[]> {
    try {
      const allMembers = await this.getAllFamilyMembers();
      const allRelationships = await this.getAllRelationships();

      const membersMap = new Map<number, any>();
      allMembers.forEach((member) => {
        membersMap.set(member.id, {
          id: member.id,
          name: member.name,
          role: member.role,
          relationship: member.relationship,
          birth_date: member.birth_date,
          location: member.location,
          bio: member.bio,
          personality_traits: member.personality_traits,
          interests: member.interests,
          occupation: member.occupation,
          avatarUrl: member.avatarUrl,
          spouses: [],
          children: [],
          parents: [],
          siblings: [],
          extended: [],
          childrenCount: 0,
          siblingsCount: 0,
          extendedCount: 0,
          relationships: {
            immediate: [],
            extended: [],
            adoptive: [],
            step: [],
            half: [],
            other: [],
          },
        });
      });

      allRelationships.forEach((rel) => {
        const source = membersMap.get(rel.source_id);
        const target = membersMap.get(rel.target_id);

        if (!source || !target) return;

        const forward = {
          id: target.id,
          name: target.name,
          role: target.role,
          relationship_type: rel.relationship_type,
          relation_category: rel.relation_category || "immediate",
          relationship_id: rel.id,
          notes: rel.notes || null,
          birth_date: target.birth_date,
          avatarUrl: target.avatarUrl,
        };

        const backward = {
          id: source.id,
          name: source.name,
          role: source.role,
          relationship_type: this.getInverseRelationshipType(
            rel.relationship_type,
          ),
          relation_category: rel.relation_category || "immediate",
          relationship_id: rel.id,
          notes: rel.notes || null,
          birth_date: source.birth_date,
          avatarUrl: source.avatarUrl,
        };

        const category =
          rel.relation_category ||
          this.determineRelationCategory(rel.relationship_type);
        if (source.relationships[category])
          source.relationships[category].push(forward);
        if (target.relationships[category])
          target.relationships[category].push(backward);

        const type = rel.relationship_type.toLowerCase();

        if (type === "spouse") {
          source.spouses.push(forward);
          target.spouses.push(backward);
        } else if (
          [
            "parent",
            "step-parent",
            "adoptive-parent",
            "father",
            "mother",
          ].includes(type)
        ) {
          source.children.push(forward);
          source.childrenCount++;
          target.parents.push(backward);
        } else if (
          ["child", "step-child", "adoptive-child", "son", "daughter"].includes(
            type,
          )
        ) {
          source.parents.push(forward);
          target.children.push(backward);
          target.childrenCount++;
        } else if (["sibling", "half-sibling", "step-sibling"].includes(type)) {
          source.siblings.push(forward);
          source.siblingsCount++;
          target.siblings.push(backward);
          target.siblingsCount++;
        } else {
          source.extended.push(forward);
          source.extendedCount++;
          target.extended.push(backward);
          target.extendedCount++;
        }
      });

      this.calculateGenerations(membersMap);

      const result = Array.from(membersMap.values());
      console.log(`🌳 Final nested tree roots:`, result);
      return result;
    } catch (err) {
      console.error("❌ Error building hierarchical family structure:", err);
      throw err;
    }
  }

  /**
   * 👨‍👩‍👧 Assign generation levels to members (for tree layout)
   */
  private calculateGenerations(membersMap: Map<number, any>): void {
    const visited = new Set<number>();

    const assignGeneration = (member: any, generation: number) => {
      if (visited.has(member.id)) return;
      visited.add(member.id);

      member.generation = generation;

      for (const child of member.children || []) {
        const childObj = membersMap.get(child.id);
        if (childObj) assignGeneration(childObj, generation + 1);
      }

      for (const spouse of member.spouses || []) {
        const spouseObj = membersMap.get(spouse.id);
        if (spouseObj) assignGeneration(spouseObj, generation);
      }

      for (const sibling of member.siblings || []) {
        const siblingObj = membersMap.get(sibling.id);
        if (siblingObj) assignGeneration(siblingObj, generation);
      }
    };

    const rootMembers = Array.from(membersMap.values()).filter(
      (m) => m.parents.length === 0,
    );

    for (const root of rootMembers) {
      assignGeneration(root, 0);
    }

    console.log(
      `📏 Assigned generation levels to ${visited.size} family members`,
    );
  }

  /**
   * 🎯 Determine relationship category
   */
  private determineRelationCategory(relationType: string): string {
    const type = relationType.toLowerCase();
    if (type.includes("adoptive") || type.startsWith("adopted"))
      return "adoptive";
    if (type.includes("step")) return "step";
    if (type.includes("half")) return "half";
    if (
      ["parent", "child", "father", "mother", "son", "daughter"].includes(type)
    )
      return "immediate";
    if (
      [
        "spouse",
        "husband",
        "wife",
        "partner",
        "sibling",
        "brother",
        "sister",
      ].includes(type)
    )
      return "immediate";
    if (["guardian", "ward"].includes(type)) return "immediate";
    if (
      [
        "grandparent",
        "grandfather",
        "grandmother",
        "grandchild",
        "grandson",
        "granddaughter",
        "aunt",
        "uncle",
        "cousin",
        "niece",
        "nephew",
      ].includes(type)
    )
      return "extended";
    if (type.includes("in-law") || type === "godparent" || type === "godchild")
      return "extended";
    return "other";
  }

  /**
   * 🔁 Get inverse relationship
   */
  private getInverseRelationshipType(relationType: string): string {
    const t = relationType.toLowerCase();
    switch (t) {
      case "parent":
        return "child";
      case "child":
        return "parent";
      case "father":
        return "child";
      case "mother":
        return "child";
      case "son":
        return "parent";
      case "daughter":
        return "parent";
      case "grandparent":
      case "grandfather":
      case "grandmother":
        return "grandchild";
      case "grandchild":
      case "grandson":
      case "granddaughter":
        return "grandparent";
      case "aunt":
      case "uncle":
        return "niece/nephew";
      case "niece":
      case "nephew":
        return "aunt/uncle";
      case "adoptive-parent":
        return "adoptive-child";
      case "adoptive-child":
        return "adoptive-parent";
      case "step-parent":
        return "step-child";
      case "step-child":
        return "step-parent";
      case "spouse":
        return "spouse";
      case "husband":
        return "wife";
      case "wife":
        return "husband";
      case "partner":
        return "partner";
      case "sibling":
        return "sibling";
      case "brother":
      case "sister":
        return "sibling";
      case "half-sibling":
      case "half-brother":
      case "half-sister":
        return "half-sibling";
      case "step-sibling":
      case "step-brother":
      case "step-sister":
        return "step-sibling";
      default:
        return "related-to";
    }
  }
}

export const getFamilyTree = async () => {
  const result = await db.execute(sql`
    WITH RECURSIVE family_tree AS (
      SELECT
        fm.id,
        fm.name,
        NULL::INT AS parent_id,
        0 AS generation
      FROM family_members fm
      WHERE NOT EXISTS (
        SELECT 1 FROM relationships r
        WHERE r.target_id = fm.id
          AND r.relationship_type IN ('mother', 'father')
      )

      UNION ALL

      SELECT
        fm.id,
        fm.name,
        r.source_id AS parent_id,
        ft.generation + 1
      FROM family_tree ft
      JOIN relationships r ON r.source_id = ft.id
      JOIN family_members fm ON fm.id = r.target_id
      WHERE r.relationship_type IN ('mother', 'father')
    )

    SELECT DISTINCT ON (id) * FROM family_tree ORDER BY id, generation;
  `);

  return result.rows;
};
