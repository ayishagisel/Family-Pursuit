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

// Logging function
function logOperation(operation: string, entity: string, data?: any): void {
  console.log(
    `✅ PostgreSQL ${operation} operation successful on ${entity}${data ? `: ${JSON.stringify(data)}` : ""}`,
  );
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user) {
      logOperation("READ", "user", { id });
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (user) {
      logOperation("READ", "user", { username });
    }
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Add created_at and set defaults for new fields
    const userData = {
      ...insertUser,
      last_login_date: new Date(),
      is_active: true,
    };

    const [user] = await db.insert(users).values(userData).returning();

    logOperation("CREATE", "user", { id: user.id, username: user.username });
    return user;
  }

  // Family Member methods
  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    const [member] = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.id, id));
    if (member) {
      logOperation("READ", "family_member", { id });
    }
    return member;
  }

  async getAllFamilyMembers(): Promise<FamilyMember[]> {
    const members = await db.select().from(familyMembers);
    logOperation("READ", "family_members", { count: members.length });
    return members;
  }

  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    // Set default metadata if not provided
    const memberData = {
      ...member,
      metadata: member.metadata || {},
    };

    const [newMember] = await db
      .insert(familyMembers)
      .values(memberData)
      .returning();

    logOperation("CREATE", "family_member", {
      id: newMember.id,
      name: newMember.name,
    });
    return newMember;
  }

  async updateFamilyMember(
    id: number,
    member: Partial<InsertFamilyMember>,
  ): Promise<FamilyMember | undefined> {
    const [updatedMember] = await db
      .update(familyMembers)
      .set(member)
      .where(eq(familyMembers.id, id))
      .returning();

    if (updatedMember) {
      logOperation("UPDATE", "family_member", {
        id,
        fields: Object.keys(member),
      });
    }
    return updatedMember;
  }

  async deleteFamilyMember(id: number): Promise<boolean> {
    const [deletedMember] = await db
      .delete(familyMembers)
      .where(eq(familyMembers.id, id))
      .returning();

    if (deletedMember) {
      logOperation("DELETE", "family_member", { id });
    }
    return !!deletedMember;
  }

  // Relationship methods
  async getRelationship(id: number): Promise<Relationship | undefined> {
    const [relationship] = await db
      .select()
      .from(relationships)
      .where(eq(relationships.id, id));
    if (relationship) {
      logOperation("READ", "relationship", { id });
    }
    return relationship;
  }

  async getRelationshipsByMember(memberId: number): Promise<Relationship[]> {
    const relatedRelationships = await db
      .select()
      .from(relationships)
      .where(
        or(
          eq(relationships.source_id, memberId),
          eq(relationships.target_id, memberId),
        ),
      );

    logOperation("READ", "relationships", {
      memberId,
      count: relatedRelationships.length,
    });
    return relatedRelationships;
  }

  async getAllRelationships(): Promise<Relationship[]> {
    const allRelationships = await db.select().from(relationships);
    logOperation("READ", "relationships", { count: allRelationships.length });
    return allRelationships;
  }

  /**
   * Get hierarchical family structure with nested relationships
   * Improved version with better organization and more complete relationship handling
   */
  async getHierarchicalFamilyStructure(): Promise<any[]> {
    try {
      // 1. Get all family members and relationships
      const allMembers = await db.select().from(familyMembers);
      const allRelationships = await db.select().from(relationships);

      logOperation("READ", "hierarchical_family", {
        memberCount: allMembers.length,
        relationshipCount: allRelationships.length,
      });

      // 2. Create a map of members by ID for easy access
      const membersMap = new Map();
      allMembers.forEach((member) => {
        membersMap.set(member.id, {
          // Basic information
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

          // Relationship collections
          spouses: [], // All spouses (can have multiple in complex families)
          children: [], // All children (biological, adoptive, step)
          parents: [], // All parents (biological, adoptive, step)
          siblings: [], // All siblings (full, half, step)
          extended: [], // Extended family (aunts, uncles, cousins, etc.)

          // Relationship counts for visualization
          childrenCount: 0,
          siblingsCount: 0,
          extendedCount: 0,

          // Relationship types organized by category
          relationships: {
            immediate: [], // parent, child, spouse, sibling
            extended: [], // grandparent, aunt, uncle, cousin, etc.
            adoptive: [], // adoptive-parent, adoptive-child
            step: [], // step-parent, step-child, step-sibling
            half: [], // half-sibling
            other: [], // godparent, family-friend, etc.
          },
        });
      });

      // 3. Process relationships to build the hierarchical structure
      allRelationships.forEach((rel) => {
        const sourceMember = membersMap.get(rel.source_id);
        const targetMember = membersMap.get(rel.target_id);

        if (!sourceMember || !targetMember) {
          console.warn(
            `Invalid relationship: source_id=${rel.source_id}, target_id=${rel.target_id}`,
          );
          return;
        }

        // Create relationship objects with full information
        const sourceToTargetRel = {
          id: targetMember.id,
          name: targetMember.name,
          role: targetMember.role,
          relationship_type: rel.relationship_type,
          relation_category: rel.relation_category || "immediate",
          relationship_id: rel.id,
          notes: rel.notes || null,
          birth_date: targetMember.birth_date,
          avatarUrl: targetMember.avatarUrl,
        };

        const targetToSourceRel = {
          id: sourceMember.id,
          name: sourceMember.name,
          role: sourceMember.role,
          relationship_type: this.getInverseRelationshipType(
            rel.relationship_type,
          ),
          relation_category: rel.relation_category || "immediate",
          relationship_id: rel.id,
          notes: rel.notes || null,
          birth_date: sourceMember.birth_date,
          avatarUrl: sourceMember.avatarUrl,
        };

        // Add to category-based collections
        const category =
          rel.relation_category ||
          this.determineRelationCategory(rel.relationship_type);
        if (sourceMember.relationships[category]) {
          sourceMember.relationships[category].push(sourceToTargetRel);
        }

        if (targetMember.relationships[category]) {
          targetMember.relationships[category].push(targetToSourceRel);
        }

        // Process based on relationship type for specific collections
        const relType = rel.relationship_type.toLowerCase();

        // Handle spouse relationships
        if (relType === "spouse") {
          sourceMember.spouses.push(sourceToTargetRel);
          targetMember.spouses.push(targetToSourceRel);

          // Set primary spouse if not already set (for visualization)
          if (!sourceMember.spouse) {
            sourceMember.spouse = sourceToTargetRel;
          }
          if (!targetMember.spouse) {
            targetMember.spouse = targetToSourceRel;
          }
        }
        // Handle parent/child relationships
        else if (
          relType === "parent" ||
          relType === "adoptive-parent" ||
          relType === "step-parent"
        ) {
          // Add child to parent's children collection
          sourceMember.children.push(sourceToTargetRel);
          sourceMember.childrenCount++;

          // Add parent to child's parents collection
          targetMember.parents.push(targetToSourceRel);
        } else if (
          relType === "child" ||
          relType === "adoptive-child" ||
          relType === "step-child"
        ) {
          // Add parent to child's parents collection
          sourceMember.parents.push(sourceToTargetRel);

          // Add child to parent's children collection
          targetMember.children.push(targetToSourceRel);
          targetMember.childrenCount++;
        }
        // Handle sibling relationships
        else if (
          relType === "sibling" ||
          relType === "step-sibling" ||
          relType === "half-sibling"
        ) {
          sourceMember.siblings.push(sourceToTargetRel);
          sourceMember.siblingsCount++;

          targetMember.siblings.push(targetToSourceRel);
          targetMember.siblingsCount++;
        }
        // Handle extended family relationships
        else if (
          [
            "aunt",
            "uncle",
            "cousin",
            "niece",
            "nephew",
            "grandparent",
            "grandchild",
          ].includes(relType)
        ) {
          sourceMember.extended.push(sourceToTargetRel);
          sourceMember.extendedCount++;

          targetMember.extended.push(targetToSourceRel);
          targetMember.extendedCount++;
        } else {
          // Handle all other relationship types
          sourceMember.extended.push(sourceToTargetRel);
          sourceMember.extendedCount++;

          targetMember.extended.push(targetToSourceRel);
          targetMember.extendedCount++;
        }
      });

      // 4. Add generation and position information for better visualization
      this.calculateGenerations(membersMap);

      // 5. Convert the map to an array
      const hierarchicalStructure = Array.from(membersMap.values());
      console.log(
        `Generated hierarchical structure with ${hierarchicalStructure.length} family members`,
      );

      return hierarchicalStructure;
    } catch (error) {
      console.error("Error building hierarchical family structure:", error);
      throw error;
    }
  }

  /**
   * Calculate generation levels for family members
   * Improved algorithm that properly assigns generations based on relationship types
   * and ensures proper hierarchy for visualization
   */
  private calculateGenerations(membersMap: Map<number, any>): void {
    // Initialize generation counter for tracking assigned generations
    const generations = new Map<number, number>();
    
    // Step 1: Identify the oldest ancestors (those with no parents)
    const oldestAncestors = Array.from(membersMap.values()).filter(
      (member) => member.parents.length === 0,
    );
    
    console.log(`Found ${oldestAncestors.length} potential root members without parents`);

    // Step 2: If we have too many root members, try to consolidate
    // by looking for the oldest members by birth date if available
    let rootMembers = oldestAncestors;
    
    if (rootMembers.length > 3) {
      const membersWithBirthDate = rootMembers.filter(member => member.birth_date);
      
      if (membersWithBirthDate.length > 0) {
        // Sort by birth date to find oldest members
        membersWithBirthDate.sort((a, b) => {
          const dateA = new Date(a.birth_date);
          const dateB = new Date(b.birth_date);
          return dateA.getTime() - dateB.getTime();
        });
        
        // Select the oldest 1-2 members as our true roots
        rootMembers = membersWithBirthDate.slice(0, 2);
        console.log(`Selected ${rootMembers.length} oldest members as true roots based on birth dates`);
      }
    }

    // If we still don't have a good root set, find members with the most children
    if (rootMembers.length === 0 || (rootMembers.length > 4 && oldestAncestors.length > 4)) {
      const membersByChildCount = Array.from(membersMap.values())
        .sort((a, b) => (b.childrenCount || 0) - (a.childrenCount || 0));
      
      // Use the member with most children as root if they have 2+ children
      if (membersByChildCount.length > 0 && membersByChildCount[0].childrenCount >= 2) {
        rootMembers = [membersByChildCount[0]];
        console.log(`Selected member with most children (${membersByChildCount[0].name}) as root`);
      }
    }

    // If we still don't have any root members, just pick the first member
    if (rootMembers.length === 0) {
      rootMembers = [Array.from(membersMap.values())[0]];
      console.log(`No clear root found, using first member (${rootMembers[0].name}) as root`);
    }

    // Step 3: Assign generation 0 to root members
    rootMembers.forEach((root) => {
      assignGeneration(root.id, 0);
    });

    // Step 4: Recursively assign generations to all family members
    function assignGeneration(memberId: number, generation: number) {
      // Skip if already processed with a lower (more ancestral) generation number
      if (generations.has(memberId) && generations.get(memberId)! <= generation) {
        return;
      }

      // Set generation on both maps
      generations.set(memberId, generation);
      const member = membersMap.get(memberId);
      if (!member) return;

      // Update member object with generation info
      member.generation = generation;
      
      // Mark this as processed to avoid circular references
      const processed = new Set<number>();
      processed.add(memberId);

      // Process children with incremented generation (parent → child relationship)
      member.children.forEach((child: any) => {
        if (!processed.has(child.id)) {
          assignGeneration(child.id, generation + 1);
          processed.add(child.id);
        }
      });

      // Process spouses with same generation (lateral relationship)
      member.spouses.forEach((spouse: any) => {
        if (!processed.has(spouse.id)) {
          assignGeneration(spouse.id, generation);
          processed.add(spouse.id);
        }
      });

      // Process siblings with same generation (lateral relationship)
      member.siblings.forEach((sibling: any) => {
        if (!processed.has(sibling.id)) {
          assignGeneration(sibling.id, generation);
          processed.add(sibling.id);
        }
      });
      
      // Process parents with decremented generation (child → parent relationship)
      member.parents.forEach((parent: any) => {
        if (!processed.has(parent.id)) {
          assignGeneration(parent.id, generation - 1);
          processed.add(parent.id);
        }
      });
    }

    // Step 5: Special handling for specific relationship types 
    // (father, mother, child) to ensure consistent hierarchy
    const allRelationships = Array.from(membersMap.values()).flatMap(
      (member) => [
        ...member.relationships.immediate,
        ...member.relationships.step,
        ...member.relationships.adoptive,
      ],
    );

    allRelationships.forEach((rel: any) => {
      const relType = rel.relationship_type?.toLowerCase();
      
      // Handle directional parent-child relationships
      if (relType === "father" || relType === "mother") {
        // Parent is one generation above child
        const parentId = rel.id;
        const childId = rel.relationship_id; 

        if (generations.has(parentId) && generations.has(childId)) {
          const parentGeneration = generations.get(parentId)!;
          const childGeneration = generations.get(childId)!;
          
          // Ensure parent is at least one generation above child
          if (parentGeneration >= childGeneration) {
            // Reset child generation to be one below parent
            assignGeneration(childId, parentGeneration + 1);
          }
        } else if (generations.has(parentId)) {
          const parentGeneration = generations.get(parentId)!;
          assignGeneration(childId, parentGeneration + 1);
        } else if (generations.has(childId)) {
          const childGeneration = generations.get(childId)!;
          assignGeneration(parentId, childGeneration - 1);
        }
      } else if (relType === "child") {
        // Child is one generation below parent
        const childId = rel.id;
        const parentId = rel.relationship_id;
        
        if (generations.has(parentId) && generations.has(childId)) {
          const parentGeneration = generations.get(parentId)!;
          const childGeneration = generations.get(childId)!;
          
          // Ensure child is at least one generation below parent
          if (childGeneration <= parentGeneration) {
            // Reset child generation to be one below parent
            assignGeneration(childId, parentGeneration + 1);
          }
        } else if (generations.has(parentId)) {
          const parentGeneration = generations.get(parentId)!;
          assignGeneration(childId, parentGeneration + 1);
        } else if (generations.has(childId)) {
          const childGeneration = generations.get(childId)!;
          assignGeneration(parentId, childGeneration - 1);
        }
      }
    });

    // Step 6: Final validation pass - ensure spouses are on same level
    // and adjust any inconsistencies
    Array.from(membersMap.values()).forEach(member => {
      if (member.spouses.length > 0) {
        const memberGeneration = generations.get(member.id)!;
        
        member.spouses.forEach((spouse: any) => {
          const spouseGeneration = generations.get(spouse.id);
          if (spouseGeneration !== undefined && spouseGeneration !== memberGeneration) {
            // Make sure spouses are on the same level
            assignGeneration(spouse.id, memberGeneration);
            
            // After adjusting the spouse, we need to check their children
            const spouseMember = membersMap.get(spouse.id);
            if (spouseMember && spouseMember.children.length > 0) {
              spouseMember.children.forEach((child: any) => {
                // Make sure children are one generation below
                if (generations.has(child.id)) {
                  const childGeneration = generations.get(child.id)!;
                  if (childGeneration <= memberGeneration) {
                    assignGeneration(child.id, memberGeneration + 1);
                  }
                }
              });
            }
          }
        });
      }
    });

    // Add parent attribute for hierarchy tree building in the frontend
    Array.from(membersMap.values()).forEach(member => {
      // Set parent property for use in d3 hierarchy generation
      if (member.parents.length > 0) {
        // Use the first parent as the primary parent for hierarchy
        const primaryParent = member.parents[0];
        member.parent = primaryParent.id;
      } else {
        member.parent = null;
      }
    });

    // Log generations for debugging
    console.log(`Assigned generations to ${generations.size} family members`);
  }

  /**
   * Determine the appropriate relationship category based on relationship type
   */
  private determineRelationCategory(relationType: string): string {
    const type = relationType.toLowerCase();

    // Handle specific categories with keywords
    if (
      type.includes("adoptive") ||
      type === "adopted-son" ||
      type === "adopted-daughter"
    ) {
      return "adoptive";
    }

    if (type.includes("step")) {
      return "step";
    }

    if (type.includes("half")) {
      return "half";
    }

    // Handle specific parent-child relationships
    if (
      ["parent", "child", "father", "mother", "son", "daughter"].includes(type)
    ) {
      return "immediate";
    }

    // Handle spouse relationships
    if (["spouse", "husband", "wife", "partner"].includes(type)) {
      return "immediate";
    }

    // Handle sibling relationships
    if (["sibling", "brother", "sister"].includes(type)) {
      return "immediate";
    }

    // Handle guardian relationships
    if (["guardian", "ward"].includes(type)) {
      return "immediate";
    }

    // Handle extended family relationships
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
        "great-aunt",
        "great-uncle",
        "great-grandparent",
        "great-grandchild",
      ].includes(type)
    ) {
      return "extended";
    }

    // Handle in-laws and other extended relationships
    if (
      type.includes("in-law") ||
      type === "godparent" ||
      type === "godchild"
    ) {
      return "extended";
    }

    // Default category for unrecognized relationships
    return "other";
  }

  /**
   * Get the inverse relationship type
   */
  private getInverseRelationshipType(relationType: string): string {
    const type = relationType.toLowerCase();

    switch (type) {
      // Basic relationships
      case "parent":
        return "child";
      case "child":
        return "parent";

      // Specific parent roles
      case "father":
        return "child";
      case "mother":
        return "child";
      case "son":
        return "parent";
      case "daughter":
        return "parent";

      // Extended family
      case "grandparent":
        return "grandchild";
      case "grandfather":
        return "grandchild";
      case "grandmother":
        return "grandchild";
      case "grandchild":
        return "grandparent";
      case "grandson":
        return "grandparent";
      case "granddaughter":
        return "grandparent";
      case "aunt":
        return "niece/nephew";
      case "uncle":
        return "niece/nephew";
      case "niece":
        return "aunt/uncle";
      case "nephew":
        return "aunt/uncle";

      // Adoptive relationships
      case "adoptive-parent":
        return "adoptive-child";
      case "adoptive-father":
        return "adoptive-child";
      case "adoptive-mother":
        return "adoptive-child";
      case "adoptive-child":
        return "adoptive-parent";
      case "adoptive-son":
        return "adoptive-parent";
      case "adoptive-daughter":
        return "adoptive-parent";

      // Step relationships
      case "step-parent":
        return "step-child";
      case "step-father":
        return "step-child";
      case "step-mother":
        return "step-child";
      case "step-child":
        return "step-parent";
      case "step-son":
        return "step-parent";
      case "step-daughter":
        return "step-parent";

      // Other relationships
      case "godparent":
        return "godchild";
      case "godfather":
        return "godchild";
      case "godmother":
        return "godchild";
      case "godchild":
        return "godparent";

      // These relationships are symmetric
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
        return "sibling";
      case "sister":
        return "sibling";
      case "cousin":
        return "cousin";
      case "half-sibling":
        return "half-sibling";
      case "half-brother":
        return "half-sibling";
      case "half-sister":
        return "half-sibling";
      case "step-sibling":
        return "step-sibling";
      case "step-brother":
        return "step-sibling";
      case "step-sister":
        return "step-sibling";
      case "in-law":
        return "in-law";

      // Default fallback
      default:
        return `related-to`;
    }
  }

  async createRelationship(
    relationship: InsertRelationship,
  ): Promise<Relationship> {
    const [newRelationship] = await db
      .insert(relationships)
      .values(relationship)
      .returning();

    logOperation("CREATE", "relationship", {
      id: newRelationship.id,
      source_id: newRelationship.source_id,
      target_id: newRelationship.target_id,
      relationship_type: newRelationship.relationship_type,
    });
    return newRelationship;
  }

  async updateRelationship(
    id: number,
    relationship: Partial<InsertRelationship>,
  ): Promise<Relationship | undefined> {
    const [updatedRelationship] = await db
      .update(relationships)
      .set(relationship)
      .where(eq(relationships.id, id))
      .returning();

    if (updatedRelationship) {
      logOperation("UPDATE", "relationship", {
        id,
        fields: Object.keys(relationship),
      });
    }
    return updatedRelationship;
  }

  async deleteRelationship(id: number): Promise<boolean> {
    const [deletedRelationship] = await db
      .delete(relationships)
      .where(eq(relationships.id, id))
      .returning();

    if (deletedRelationship) {
      logOperation("DELETE", "relationship", { id });
    }
    return !!deletedRelationship;
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (event) {
      logOperation("READ", "event", { id });
    }
    return event;
  }

  async getAllEvents(): Promise<Event[]> {
    const allEvents = await db.select().from(events);
    logOperation("READ", "events", { count: allEvents.length });
    return allEvents;
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    const upcomingEvents = await db
      .select()
      .from(events)
      .where(gte(events.date, now))
      .orderBy(events.date);

    logOperation("READ", "upcoming_events", { count: upcomingEvents.length });
    return upcomingEvents;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    // Map createdBy to user_id if it exists
    const eventData = {
      ...event,
      attendees: [],
    };

    const [newEvent] = await db.insert(events).values(eventData).returning();

    logOperation("CREATE", "event", { id: newEvent.id, title: newEvent.title });
    return newEvent;
  }

  async updateEvent(
    id: number,
    event: Partial<InsertEvent>,
  ): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();

    if (updatedEvent) {
      logOperation("UPDATE", "event", { id, fields: Object.keys(event) });
    }
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning();

    if (deletedEvent) {
      logOperation("DELETE", "event", { id });
    }
    return !!deletedEvent;
  }

  async addAttendee(
    eventId: number,
    userId: number,
  ): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    if (!event) return undefined;

    const attendees = [...(event.attendees as number[])];
    if (!attendees.includes(userId)) {
      attendees.push(userId);
    }

    const [updatedEvent] = await db
      .update(events)
      .set({ attendees })
      .where(eq(events.id, eventId))
      .returning();

    logOperation("UPDATE", "event", {
      id: eventId,
      action: "add_attendee",
      userId,
    });
    return updatedEvent;
  }

  async removeAttendee(
    eventId: number,
    userId: number,
  ): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    if (!event) return undefined;

    const attendees = (event.attendees as number[]).filter(
      (id: number) => id !== userId,
    );

    const [updatedEvent] = await db
      .update(events)
      .set({ attendees })
      .where(eq(events.id, eventId))
      .returning();

    logOperation("UPDATE", "event", {
      id: eventId,
      action: "remove_attendee",
      userId,
    });
    return updatedEvent;
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    if (document) {
      logOperation("READ", "document", { id });
    }
    return document;
  }

  async getAllDocuments(): Promise<Document[]> {
    // Get documents that don't have specific permissions restrictions
    const allDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.documentType, "generic"));
    logOperation("READ", "documents", { count: allDocs.length });
    return allDocs;
  }

  async getSecureDocuments(): Promise<Document[]> {
    // Get only documents with permissions for secure viewing
    const secureDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.documentType, "secure"));
    logOperation("READ", "secure_documents", { count: secureDocs.length });
    return secureDocs;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values(document)
      .returning();

    logOperation("CREATE", "document", {
      id: newDocument.id,
      title: newDocument.title,
    });
    return newDocument;
  }

  async updateDocument(
    id: number,
    document: Partial<InsertDocument>,
  ): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();

    if (updatedDocument) {
      logOperation("UPDATE", "document", { id, fields: Object.keys(document) });
    }
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const [deletedDocument] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();

    if (deletedDocument) {
      logOperation("DELETE", "document", { id });
    }
    return !!deletedDocument;
  }

  // Help Request methods
  async getHelpRequest(id: number): Promise<HelpRequest | undefined> {
    const [helpRequest] = await db
      .select()
      .from(helpRequests)
      .where(eq(helpRequests.id, id));
    if (helpRequest) {
      logOperation("READ", "help_request", { id });
    }
    return helpRequest;
  }

  async getAllHelpRequests(): Promise<HelpRequest[]> {
    const requests = await db.select().from(helpRequests);
    logOperation("READ", "help_requests", { count: requests.length });
    return requests;
  }

  async createHelpRequest(
    helpRequest: InsertHelpRequest,
  ): Promise<HelpRequest> {
    const [newHelpRequest] = await db
      .insert(helpRequests)
      .values({
        ...helpRequest,
        status: "needs_volunteer",
        volunteers: [],
      })
      .returning();

    logOperation("CREATE", "help_request", {
      id: newHelpRequest.id,
      title: newHelpRequest.title,
    });
    return newHelpRequest;
  }

  async updateHelpRequest(
    id: number,
    helpRequest: Partial<InsertHelpRequest>,
  ): Promise<HelpRequest | undefined> {
    const [updatedHelpRequest] = await db
      .update(helpRequests)
      .set(helpRequest)
      .where(eq(helpRequests.id, id))
      .returning();

    if (updatedHelpRequest) {
      logOperation("UPDATE", "help_request", {
        id,
        fields: Object.keys(helpRequest),
      });
    }
    return updatedHelpRequest;
  }

  async deleteHelpRequest(id: number): Promise<boolean> {
    const [deletedHelpRequest] = await db
      .delete(helpRequests)
      .where(eq(helpRequests.id, id))
      .returning();

    if (deletedHelpRequest) {
      logOperation("DELETE", "help_request", { id });
    }
    return !!deletedHelpRequest;
  }

  async addVolunteer(
    requestId: number,
    userId: number,
  ): Promise<HelpRequest | undefined> {
    const [helpRequest] = await db
      .select()
      .from(helpRequests)
      .where(eq(helpRequests.id, requestId));
    if (!helpRequest) return undefined;

    const volunteers = [...(helpRequest.volunteers as number[])];
    if (!volunteers.includes(userId)) {
      volunteers.push(userId);
    }

    const status = volunteers.length > 0 ? "has_volunteers" : "needs_volunteer";

    const [updatedHelpRequest] = await db
      .update(helpRequests)
      .set({
        volunteers,
        status,
      })
      .where(eq(helpRequests.id, requestId))
      .returning();

    logOperation("UPDATE", "help_request", {
      id: requestId,
      action: "add_volunteer",
      userId,
    });
    return updatedHelpRequest;
  }

  async removeVolunteer(
    requestId: number,
    userId: number,
  ): Promise<HelpRequest | undefined> {
    const [helpRequest] = await db
      .select()
      .from(helpRequests)
      .where(eq(helpRequests.id, requestId));
    if (!helpRequest) return undefined;

    const volunteers = (helpRequest.volunteers as number[]).filter(
      (id: number) => id !== userId,
    );
    const status = volunteers.length > 0 ? "has_volunteers" : "needs_volunteer";

    const [updatedHelpRequest] = await db
      .update(helpRequests)
      .set({
        volunteers,
        status,
      })
      .where(eq(helpRequests.id, requestId))
      .returning();

    logOperation("UPDATE", "help_request", {
      id: requestId,
      action: "remove_volunteer",
      userId,
    });
    return updatedHelpRequest;
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    if (message) {
      logOperation("READ", "message", { id });
    }
    return message;
  }

  async getMessagesBySender(senderId: number): Promise<Message[]> {
    const sentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.senderId, senderId));
    logOperation("READ", "messages_by_sender", {
      senderId,
      count: sentMessages.length,
    });
    return sentMessages;
  }

  async getMessagesByReceiver(receiverId: number): Promise<Message[]> {
    const receivedMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, receiverId),
          eq(messages.isGroupMessage, false),
        ),
      );

    logOperation("READ", "messages_by_receiver", {
      receiverId,
      count: receivedMessages.length,
    });
    return receivedMessages;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        sentAt: new Date(),
        isRead: false,
      })
      .returning();

    logOperation("CREATE", "message", {
      id: newMessage.id,
      senderId: newMessage.senderId,
      receiverId: newMessage.receiverId,
    });
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();

    if (updatedMessage) {
      logOperation("UPDATE", "message", { id, action: "mark_as_read" });
    }
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<boolean> {
    const [deletedMessage] = await db
      .delete(messages)
      .where(eq(messages.id, id))
      .returning();

    if (deletedMessage) {
      logOperation("DELETE", "message", { id });
    }
    return !!deletedMessage;
  }
}

// SQL functions already imported at the top of the file

export async function getFamilyTree() {
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

  // ✅ Return the data properly
  return result.rows;
}
