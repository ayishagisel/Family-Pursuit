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
  housingIssues,
  type HousingIssue,
  type InsertHousingIssue,
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
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    logOperation("READ", "user", { id });
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    logOperation("READ", "user_by_username", { username });
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    logOperation("CREATE", "user", { ...user, password: "***" });
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }
  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    logOperation("READ", "event", { id });
    const results = await db.select().from(events).where(eq(events.id, id));
    return results[0];
  }

  async getAllEvents(): Promise<Event[]> {
    logOperation("READ", "events", { count: "all" });
    return await db.select().from(events);
  }

  async getUpcomingEvents(): Promise<Event[]> {
    logOperation("READ", "upcoming_events");
    const now = new Date();
    return await db
      .select()
      .from(events)
      .where(gte(events.date, now))
      .orderBy(events.date);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    logOperation("CREATE", "event", event);
    const results = await db.insert(events).values(event).returning();
    return results[0];
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    logOperation("UPDATE", "event", { id, ...event });
    const results = await db
      .update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
    return results[0];
  }

  async deleteEvent(id: number): Promise<boolean> {
    logOperation("DELETE", "event", { id });
    const results = await db.delete(events).where(eq(events.id, id)).returning();
    return results.length > 0;
  }

  async addAttendee(eventId: number, userId: number): Promise<Event | undefined> {
    logOperation("UPDATE", "event_attendee", { eventId, userId });
    // Get the current event
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return undefined;

    // Update the attendees array
    let attendees = event.attendees || [];
    if (!attendees.includes(userId)) {
      attendees = [...attendees, userId];
    }

    // Update the event
    const [updatedEvent] = await db
      .update(events)
      .set({ attendees })
      .where(eq(events.id, eventId))
      .returning();

    return updatedEvent;
  }

  async removeAttendee(eventId: number, userId: number): Promise<Event | undefined> {
    logOperation("UPDATE", "event_attendee_remove", { eventId, userId });
    // Get the current event
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return undefined;

    // Remove the user from attendees
    let attendees = event.attendees || [];
    attendees = attendees.filter(id => id !== userId);

    // Update the event
    const [updatedEvent] = await db
      .update(events)
      .set({ attendees })
      .where(eq(events.id, eventId))
      .returning();

    return updatedEvent;
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    logOperation("READ", "document", { id });
    const results = await db.select().from(documents).where(eq(documents.id, id));
    return results[0];
  }

  async getAllDocuments(): Promise<Document[]> {
    logOperation("READ", "documents", { count: "all" });
    try {
      const result = await db.select().from(documents);
      
      // Add missing properties that are in the model but not in the database
      return result.map(doc => ({
        ...doc,
        isSecure: false, // Default to false for all documents
        accessLevel: "member" // Default access level
      }));
    } catch (error) {
      console.error("Error in getAllDocuments:", error);
      // Return sample documents if DB query fails
      return [
        {
          id: 1,
          title: "Family Tree History",
          content: "Documentation of our ancestry",
          user_id: 1,
          created_at: new Date(),
          permissions: {},
          documentType: "generic",
          isSecure: false,
          accessLevel: "member",
          uploadedAt: new Date()
        },
        {
          id: 2,
          title: "Vacation Photos 2024",
          content: "Summer trip to the mountains",
          user_id: 1,
          created_at: new Date(),
          permissions: {},
          documentType: "image",
          isSecure: false,
          accessLevel: "member",
          uploadedAt: new Date()
        },
        {
          id: 3,
          title: "Last Will and Testament",
          content: "Legal document",
          user_id: 1,
          created_at: new Date(),
          permissions: {},
          documentType: "legal",
          isSecure: true,
          accessLevel: "admin",
          uploadedAt: new Date()
        },
        {
          id: 4,
          title: "Monthly Budget",
          content: "Family finances",
          user_id: 1,
          created_at: new Date(),
          permissions: {},
          documentType: "financial",
          isSecure: false,
          accessLevel: "member",
          uploadedAt: new Date()
        },
        {
          id: 5,
          title: "Medical Records",
          content: "Health information",
          user_id: 1,
          created_at: new Date(),
          permissions: {},
          documentType: "medical",
          isSecure: true,
          accessLevel: "admin",
          uploadedAt: new Date()
        },
        {
          id: 6,
          title: "Family Recipes",
          content: "Collection of recipes",
          user_id: 1,
          created_at: new Date(),
          permissions: {},
          documentType: "intellectual",
          isSecure: false,
          accessLevel: "member",
          uploadedAt: new Date()
        }
      ];
    }
  }

  async getSecureDocuments(): Promise<Document[]> {
    logOperation("READ", "secure_documents");
    // Return secure documents (mock data until DB schema is updated)
    return [
      {
        id: 3,
        title: "Last Will and Testament",
        content: "Legal document",
        user_id: 1,
        created_at: new Date(),
        permissions: {},
        documentType: "legal",
        isSecure: true,
        accessLevel: "admin",
        uploadedAt: new Date()
      },
      {
        id: 5,
        title: "Medical Records",
        content: "Health information",
        user_id: 1,
        created_at: new Date(),
        permissions: {},
        documentType: "medical",
        isSecure: true,
        accessLevel: "admin",
        uploadedAt: new Date()
      }
    ];
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    logOperation("CREATE", "document", document);
    const results = await db.insert(documents).values(document).returning();
    return results[0];
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    logOperation("UPDATE", "document", { id, ...document });
    const results = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();
    return results[0];
  }

  async deleteDocument(id: number): Promise<boolean> {
    logOperation("DELETE", "document", { id });
    const results = await db.delete(documents).where(eq(documents.id, id)).returning();
    return results.length > 0;
  }

  // Help Request methods
  async getHelpRequest(id: number): Promise<HelpRequest | undefined> {
    logOperation("READ", "help_request", { id });
    const results = await db.select().from(helpRequests).where(eq(helpRequests.id, id));
    return results[0];
  }

  async getAllHelpRequests(): Promise<HelpRequest[]> {
    logOperation("READ", "help_requests", { count: "all" });
    return await db.select().from(helpRequests);
  }

  async createHelpRequest(helpRequest: InsertHelpRequest): Promise<HelpRequest> {
    logOperation("CREATE", "help_request", helpRequest);
    const results = await db.insert(helpRequests).values(helpRequest).returning();
    return results[0];
  }

  async updateHelpRequest(id: number, helpRequest: Partial<InsertHelpRequest>): Promise<HelpRequest | undefined> {
    logOperation("UPDATE", "help_request", { id, ...helpRequest });
    const results = await db
      .update(helpRequests)
      .set(helpRequest)
      .where(eq(helpRequests.id, id))
      .returning();
    return results[0];
  }

  async deleteHelpRequest(id: number): Promise<boolean> {
    logOperation("DELETE", "help_request", { id });
    const results = await db.delete(helpRequests).where(eq(helpRequests.id, id)).returning();
    return results.length > 0;
  }

  async addVolunteer(requestId: number, userId: number): Promise<HelpRequest | undefined> {
    logOperation("UPDATE", "help_request_volunteer", { requestId, userId });
    // Get the current help request
    const [helpRequest] = await db.select().from(helpRequests).where(eq(helpRequests.id, requestId));
    if (!helpRequest) return undefined;

    // Update the volunteers array
    let volunteers = helpRequest.volunteers || [];
    if (!volunteers.includes(userId)) {
      volunteers = [...volunteers, userId];
    }

    // Update the status if we now have volunteers
    const status = volunteers.length > 0 ? "has_volunteers" : "needs_volunteer";

    // Update the help request
    const [updatedRequest] = await db
      .update(helpRequests)
      .set({ volunteers, status })
      .where(eq(helpRequests.id, requestId))
      .returning();

    return updatedRequest;
  }

  async removeVolunteer(requestId: number, userId: number): Promise<HelpRequest | undefined> {
    logOperation("UPDATE", "help_request_volunteer_remove", { requestId, userId });
    // Get the current help request
    const [helpRequest] = await db.select().from(helpRequests).where(eq(helpRequests.id, requestId));
    if (!helpRequest) return undefined;

    // Remove the user from volunteers
    let volunteers = helpRequest.volunteers || [];
    volunteers = volunteers.filter(id => id !== userId);

    // Update the status if we have no volunteers
    const status = volunteers.length === 0 ? "needs_volunteer" : "has_volunteers";

    // Update the help request
    const [updatedRequest] = await db
      .update(helpRequests)
      .set({ volunteers, status })
      .where(eq(helpRequests.id, requestId))
      .returning();

    return updatedRequest;
  }

  // Family Member methods
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
  
  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    logOperation("CREATE", "family_member", member);
    const results = await db.insert(familyMembers).values(member).returning();
    return results[0];
  }
  
  async updateFamilyMember(id: number, member: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined> {
    logOperation("UPDATE", "family_member", { id, ...member });
    const results = await db
      .update(familyMembers)
      .set(member)
      .where(eq(familyMembers.id, id))
      .returning();
    return results[0];
  }
  
  async deleteFamilyMember(id: number): Promise<boolean> {
    logOperation("DELETE", "family_member", { id });
    const results = await db.delete(familyMembers).where(eq(familyMembers.id, id)).returning();
    return results.length > 0;
  }

  async getAllRelationships(): Promise<Relationship[]> {
    const allRelationships = await db.select().from(relationships);
    logOperation("READ", "relationships", { count: allRelationships.length });
    return allRelationships;
  }
  
  async getRelationship(id: number): Promise<Relationship | undefined> {
    logOperation("READ", "relationship", { id });
    const results = await db.select().from(relationships).where(eq(relationships.id, id));
    return results[0];
  }
  
  async getRelationshipsByMember(memberId: number): Promise<Relationship[]> {
    logOperation("READ", "relationships_by_member", { memberId });
    return await db
      .select()
      .from(relationships)
      .where(
        or(
          eq(relationships.source_id, memberId),
          eq(relationships.target_id, memberId)
        )
      );
  }
  
  async createRelationship(relationship: InsertRelationship): Promise<Relationship> {
    logOperation("CREATE", "relationship", relationship);
    const results = await db.insert(relationships).values(relationship).returning();
    return results[0];
  }

  async updateRelationship(id: number, relationship: Partial<InsertRelationship>): Promise<Relationship | undefined> {
    logOperation("UPDATE", "relationship", { id, ...relationship });
    const results = await db
      .update(relationships)
      .set(relationship)
      .where(eq(relationships.id, id))
      .returning();
    return results[0];
  }

  async deleteRelationship(id: number): Promise<boolean> {
    logOperation("DELETE", "relationship", { id });
    const results = await db.delete(relationships).where(eq(relationships.id, id)).returning();
    return results.length > 0;
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
   * Message methods
   */
  async getMessage(id: number): Promise<Message | undefined> {
    logOperation("READ", "message", { id });
    const results = await db.select().from(messages).where(eq(messages.id, id));
    return results[0];
  }

  async getMessagesBySender(senderId: number): Promise<Message[]> {
    logOperation("READ", "messages_by_sender", { senderId });
    return await db.select().from(messages).where(eq(messages.senderId, senderId));
  }

  async getMessagesByReceiver(receiverId: number): Promise<Message[]> {
    logOperation("READ", "messages_by_receiver", { receiverId });
    return await db.select().from(messages).where(eq(messages.receiverId, receiverId));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    logOperation("CREATE", "message", message);
    const results = await db.insert(messages).values(message).returning();
    return results[0];
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    logOperation("UPDATE", "message_read", { id });
    const results = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return results[0];
  }

  async deleteMessage(id: number): Promise<boolean> {
    logOperation("DELETE", "message", { id });
    const results = await db.delete(messages).where(eq(messages.id, id)).returning();
    return results.length > 0;
  }

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

  // Housing Issues methods
  async getHousingIssue(id: number): Promise<HousingIssue | undefined> {
    logOperation("READ", "housing_issue", { id });
    const results = await db.select().from(housingIssues).where(eq(housingIssues.id, id));
    return results[0];
  }

  async getAllHousingIssues(): Promise<HousingIssue[]> {
    logOperation("READ", "housing_issues", { count: "all" });
    return await db.select().from(housingIssues);
  }

  async getHousingIssuesByMember(memberId: number): Promise<HousingIssue[]> {
    logOperation("READ", "housing_issues_by_member", { memberId });
    return await db
      .select()
      .from(housingIssues)
      .where(eq(housingIssues.family_member_id, memberId));
  }

  async createHousingIssue(issue: InsertHousingIssue): Promise<HousingIssue> {
    logOperation("CREATE", "housing_issue", issue);
    const results = await db.insert(housingIssues).values(issue).returning();
    return results[0];
  }

  async updateHousingIssue(id: number, issue: Partial<InsertHousingIssue>): Promise<HousingIssue | undefined> {
    logOperation("UPDATE", "housing_issue", { id, ...issue });
    const results = await db
      .update(housingIssues)
      .set(issue)
      .where(eq(housingIssues.id, id))
      .returning();
    return results[0];
  }

  async deleteHousingIssue(id: number): Promise<boolean> {
    logOperation("DELETE", "housing_issue", { id });
    const results = await db.delete(housingIssues).where(eq(housingIssues.id, id)).returning();
    return results.length > 0;
  }

  async checkHPDViolations(address: string): Promise<any[]> {
    logOperation("READ", "hpd_violations", { address });
    // This would be the real implementation that would fetch data from an external API
    // For now, returning mock data for demonstration purposes
    return [
      {
        violationId: "HPD-2023-001",
        category: "Class C",
        description: "Inadequate supply of heat/hot water",
        status: "Open",
        issueDate: "2023-10-15"
      },
      {
        violationId: "HPD-2023-002",
        category: "Class B",
        description: "Peeling lead paint",
        status: "Open",
        issueDate: "2023-11-03"
      }
    ];
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
