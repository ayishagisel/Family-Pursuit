import { users, type User, type InsertUser, familyMembers, type FamilyMember, type InsertFamilyMember,
  relationships, type Relationship, type InsertRelationship, events, type Event, type InsertEvent,
  documents, type Document, type InsertDocument, helpRequests, type HelpRequest, type InsertHelpRequest,
  messages, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, gte, and, or } from "drizzle-orm";
import { IStorage } from "./storage";

// Logging function
function logOperation(operation: string, entity: string, data?: any): void {
  console.log(`✅ PostgreSQL ${operation} operation successful on ${entity}${data ? `: ${JSON.stringify(data)}` : ''}`);
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user) {
      logOperation('READ', 'user', { id });
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (user) {
      logOperation('READ', 'user', { username });
    }
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Add created_at and set defaults for new fields
    const userData = {
      ...insertUser,
      last_login_date: new Date(),
      is_active: true
    };
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
      
    logOperation('CREATE', 'user', { id: user.id, username: user.username });
    return user;
  }
  
  // Family Member methods
  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    const [member] = await db.select().from(familyMembers).where(eq(familyMembers.id, id));
    if (member) {
      logOperation('READ', 'family_member', { id });
    }
    return member;
  }
  
  async getAllFamilyMembers(): Promise<FamilyMember[]> {
    const members = await db.select().from(familyMembers);
    logOperation('READ', 'family_members', { count: members.length });
    return members;
  }
  
  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    // Set default metadata if not provided
    const memberData = {
      ...member,
      metadata: member.metadata || {}
    };
    
    const [newMember] = await db
      .insert(familyMembers)
      .values(memberData)
      .returning();
      
    logOperation('CREATE', 'family_member', { id: newMember.id, name: newMember.name });
    return newMember;
  }
  
  async updateFamilyMember(id: number, member: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined> {
    const [updatedMember] = await db
      .update(familyMembers)
      .set(member)
      .where(eq(familyMembers.id, id))
      .returning();
      
    if (updatedMember) {
      logOperation('UPDATE', 'family_member', { id, fields: Object.keys(member) });
    }
    return updatedMember;
  }
  
  async deleteFamilyMember(id: number): Promise<boolean> {
    const [deletedMember] = await db
      .delete(familyMembers)
      .where(eq(familyMembers.id, id))
      .returning();
      
    if (deletedMember) {
      logOperation('DELETE', 'family_member', { id });
    }
    return !!deletedMember;
  }
  
  // Relationship methods
  async getRelationship(id: number): Promise<Relationship | undefined> {
    const [relationship] = await db.select().from(relationships).where(eq(relationships.id, id));
    if (relationship) {
      logOperation('READ', 'relationship', { id });
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
          eq(relationships.target_id, memberId)
        )
      );
    
    logOperation('READ', 'relationships', { memberId, count: relatedRelationships.length });
    return relatedRelationships;
  }
  
  async getAllRelationships(): Promise<Relationship[]> {
    const allRelationships = await db.select().from(relationships);
    logOperation('READ', 'relationships', { count: allRelationships.length });
    return allRelationships;
  }
  
  /**
   * Get hierarchical family structure with nested relationships
   */
  async getHierarchicalFamilyStructure(): Promise<any[]> {
    try {
      // 1. Get all family members and relationships
      const allMembers = await db.select().from(familyMembers);
      const allRelationships = await db.select().from(relationships);
      
      logOperation('READ', 'hierarchical_family', { 
        memberCount: allMembers.length, 
        relationshipCount: allRelationships.length 
      });
      
      // 2. Create a map of members by ID for easy access
      const membersMap = new Map();
      allMembers.forEach(member => {
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
          // Relationship placeholders
          spouse: null,
          children: [],
          parents: [],
          siblings: [],
          extended: [] // For other relationships (aunt, uncle, cousin, etc.)
        });
      });
      
      // 3. Process relationships to build the hierarchical structure
      allRelationships.forEach(rel => {
        const sourceMember = membersMap.get(rel.source_id);
        const targetMember = membersMap.get(rel.target_id);
        
        if (!sourceMember || !targetMember) {
          console.warn(`Invalid relationship: source_id=${rel.source_id}, target_id=${rel.target_id}`);
          return;
        }
        
        // Process based on relationship type
        switch (rel.relationship_type.toLowerCase()) {
          case 'spouse':
            sourceMember.spouse = {
              id: targetMember.id,
              name: targetMember.name,
              relationship_type: rel.relationship_type,
              relation_category: rel.relation_category
            };
            break;
            
          case 'parent':
            targetMember.parents.push({
              id: sourceMember.id,
              name: sourceMember.name,
              relationship_type: rel.relationship_type,
              relation_category: rel.relation_category
            });
            sourceMember.children.push({
              id: targetMember.id,
              name: targetMember.name,
              relationship_type: 'child',
              relation_category: rel.relation_category
            });
            break;
            
          case 'child':
            sourceMember.parents.push({
              id: targetMember.id,
              name: targetMember.name,
              relationship_type: 'parent',
              relation_category: rel.relation_category
            });
            targetMember.children.push({
              id: sourceMember.id,
              name: sourceMember.name,
              relationship_type: rel.relationship_type,
              relation_category: rel.relation_category
            });
            break;
            
          case 'sibling':
          case 'step-sibling':
          case 'half-sibling':
            sourceMember.siblings.push({
              id: targetMember.id,
              name: targetMember.name,
              relationship_type: rel.relationship_type,
              relation_category: rel.relation_category
            });
            break;
            
          case 'adoptive-parent':
            targetMember.parents.push({
              id: sourceMember.id,
              name: sourceMember.name,
              relationship_type: rel.relationship_type,
              relation_category: 'adoptive'
            });
            sourceMember.children.push({
              id: targetMember.id,
              name: targetMember.name,
              relationship_type: 'adoptive-child',
              relation_category: 'adoptive'
            });
            break;
            
          case 'adoptive-child':
            sourceMember.parents.push({
              id: targetMember.id,
              name: targetMember.name,
              relationship_type: 'adoptive-parent',
              relation_category: 'adoptive'
            });
            targetMember.children.push({
              id: sourceMember.id,
              name: sourceMember.name,
              relationship_type: rel.relationship_type,
              relation_category: 'adoptive'
            });
            break;
            
          case 'step-parent':
            targetMember.parents.push({
              id: sourceMember.id,
              name: sourceMember.name,
              relationship_type: rel.relationship_type,
              relation_category: 'step'
            });
            sourceMember.children.push({
              id: targetMember.id,
              name: targetMember.name,
              relationship_type: 'step-child',
              relation_category: 'step'
            });
            break;
            
          case 'step-child':
            sourceMember.parents.push({
              id: targetMember.id,
              name: targetMember.name,
              relationship_type: 'step-parent',
              relation_category: 'step'
            });
            targetMember.children.push({
              id: sourceMember.id,
              name: sourceMember.name,
              relationship_type: rel.relationship_type,
              relation_category: 'step'
            });
            break;
            
          default:
            // Handle extended family and other relationship types
            sourceMember.extended.push({
              id: targetMember.id,
              name: targetMember.name,
              relationship_type: rel.relationship_type,
              relation_category: rel.relation_category
            });
            break;
        }
      });
      
      // 4. Convert the map to an array
      return Array.from(membersMap.values());
      
    } catch (error) {
      console.error("Error building hierarchical family structure:", error);
      throw error;
    }
  }
  
  async createRelationship(relationship: InsertRelationship): Promise<Relationship> {
    const [newRelationship] = await db
      .insert(relationships)
      .values(relationship)
      .returning();
    
    logOperation('CREATE', 'relationship', { 
      id: newRelationship.id, 
      source_id: newRelationship.source_id, 
      target_id: newRelationship.target_id,
      relationship_type: newRelationship.relationship_type
    });
    return newRelationship;
  }
  
  async updateRelationship(id: number, relationship: Partial<InsertRelationship>): Promise<Relationship | undefined> {
    const [updatedRelationship] = await db
      .update(relationships)
      .set(relationship)
      .where(eq(relationships.id, id))
      .returning();
    
    if (updatedRelationship) {
      logOperation('UPDATE', 'relationship', { id, fields: Object.keys(relationship) });
    }
    return updatedRelationship;
  }
  
  async deleteRelationship(id: number): Promise<boolean> {
    const [deletedRelationship] = await db
      .delete(relationships)
      .where(eq(relationships.id, id))
      .returning();
    
    if (deletedRelationship) {
      logOperation('DELETE', 'relationship', { id });
    }
    return !!deletedRelationship;
  }
  
  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (event) {
      logOperation('READ', 'event', { id });
    }
    return event;
  }
  
  async getAllEvents(): Promise<Event[]> {
    const allEvents = await db.select().from(events);
    logOperation('READ', 'events', { count: allEvents.length });
    return allEvents;
  }
  
  async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    const upcomingEvents = await db
      .select()
      .from(events)
      .where(gte(events.date, now))
      .orderBy(events.date);
      
    logOperation('READ', 'upcoming_events', { count: upcomingEvents.length });
    return upcomingEvents;
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    // Map createdBy to user_id if it exists
    const eventData = {
      ...event,
      attendees: []
    };
    
    const [newEvent] = await db
      .insert(events)
      .values(eventData)
      .returning();
      
    logOperation('CREATE', 'event', { id: newEvent.id, title: newEvent.title });
    return newEvent;
  }
  
  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
      
    if (updatedEvent) {
      logOperation('UPDATE', 'event', { id, fields: Object.keys(event) });
    }
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning();
      
    if (deletedEvent) {
      logOperation('DELETE', 'event', { id });
    }
    return !!deletedEvent;
  }
  
  async addAttendee(eventId: number, userId: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
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
      
    logOperation('UPDATE', 'event', { id: eventId, action: 'add_attendee', userId });
    return updatedEvent;
  }
  
  async removeAttendee(eventId: number, userId: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return undefined;
    
    const attendees = (event.attendees as number[]).filter((id: number) => id !== userId);
    
    const [updatedEvent] = await db
      .update(events)
      .set({ attendees })
      .where(eq(events.id, eventId))
      .returning();
      
    logOperation('UPDATE', 'event', { id: eventId, action: 'remove_attendee', userId });
    return updatedEvent;
  }
  
  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    if (document) {
      logOperation('READ', 'document', { id });
    }
    return document;
  }
  
  async getAllDocuments(): Promise<Document[]> {
    // Get documents that don't have specific permissions restrictions
    const allDocs = await db.select().from(documents).where(
      eq(documents.documentType, 'generic')
    );
    logOperation('READ', 'documents', { count: allDocs.length });
    return allDocs;
  }
  
  async getSecureDocuments(): Promise<Document[]> {
    // Get only documents with permissions for secure viewing
    const secureDocs = await db.select().from(documents).where(
      eq(documents.documentType, 'secure')
    );
    logOperation('READ', 'secure_documents', { count: secureDocs.length });
    return secureDocs;
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values(document)
      .returning();
      
    logOperation('CREATE', 'document', { id: newDocument.id, title: newDocument.title });
    return newDocument;
  }
  
  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();
      
    if (updatedDocument) {
      logOperation('UPDATE', 'document', { id, fields: Object.keys(document) });
    }
    return updatedDocument;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    const [deletedDocument] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();
      
    if (deletedDocument) {
      logOperation('DELETE', 'document', { id });
    }
    return !!deletedDocument;
  }
  
  // Help Request methods
  async getHelpRequest(id: number): Promise<HelpRequest | undefined> {
    const [helpRequest] = await db.select().from(helpRequests).where(eq(helpRequests.id, id));
    if (helpRequest) {
      logOperation('READ', 'help_request', { id });
    }
    return helpRequest;
  }
  
  async getAllHelpRequests(): Promise<HelpRequest[]> {
    const requests = await db.select().from(helpRequests);
    logOperation('READ', 'help_requests', { count: requests.length });
    return requests;
  }
  
  async createHelpRequest(helpRequest: InsertHelpRequest): Promise<HelpRequest> {
    const [newHelpRequest] = await db
      .insert(helpRequests)
      .values({ 
        ...helpRequest, 
        status: "needs_volunteer",
        volunteers: [] 
      })
      .returning();
      
    logOperation('CREATE', 'help_request', { id: newHelpRequest.id, title: newHelpRequest.title });
    return newHelpRequest;
  }
  
  async updateHelpRequest(id: number, helpRequest: Partial<InsertHelpRequest>): Promise<HelpRequest | undefined> {
    const [updatedHelpRequest] = await db
      .update(helpRequests)
      .set(helpRequest)
      .where(eq(helpRequests.id, id))
      .returning();
      
    if (updatedHelpRequest) {
      logOperation('UPDATE', 'help_request', { id, fields: Object.keys(helpRequest) });
    }
    return updatedHelpRequest;
  }
  
  async deleteHelpRequest(id: number): Promise<boolean> {
    const [deletedHelpRequest] = await db
      .delete(helpRequests)
      .where(eq(helpRequests.id, id))
      .returning();
      
    if (deletedHelpRequest) {
      logOperation('DELETE', 'help_request', { id });
    }
    return !!deletedHelpRequest;
  }
  
  async addVolunteer(requestId: number, userId: number): Promise<HelpRequest | undefined> {
    const [helpRequest] = await db.select().from(helpRequests).where(eq(helpRequests.id, requestId));
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
        status 
      })
      .where(eq(helpRequests.id, requestId))
      .returning();
      
    logOperation('UPDATE', 'help_request', { id: requestId, action: 'add_volunteer', userId });
    return updatedHelpRequest;
  }
  
  async removeVolunteer(requestId: number, userId: number): Promise<HelpRequest | undefined> {
    const [helpRequest] = await db.select().from(helpRequests).where(eq(helpRequests.id, requestId));
    if (!helpRequest) return undefined;
    
    const volunteers = (helpRequest.volunteers as number[]).filter((id: number) => id !== userId);
    const status = volunteers.length > 0 ? "has_volunteers" : "needs_volunteer";
    
    const [updatedHelpRequest] = await db
      .update(helpRequests)
      .set({ 
        volunteers, 
        status 
      })
      .where(eq(helpRequests.id, requestId))
      .returning();
      
    logOperation('UPDATE', 'help_request', { id: requestId, action: 'remove_volunteer', userId });
    return updatedHelpRequest;
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    if (message) {
      logOperation('READ', 'message', { id });
    }
    return message;
  }
  
  async getMessagesBySender(senderId: number): Promise<Message[]> {
    const sentMessages = await db.select().from(messages).where(eq(messages.senderId, senderId));
    logOperation('READ', 'messages_by_sender', { senderId, count: sentMessages.length });
    return sentMessages;
  }
  
  async getMessagesByReceiver(receiverId: number): Promise<Message[]> {
    const receivedMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, receiverId),
          eq(messages.isGroupMessage, false)
        )
      );
    
    logOperation('READ', 'messages_by_receiver', { receiverId, count: receivedMessages.length });
    return receivedMessages;
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        sentAt: new Date(),
        isRead: false
      })
      .returning();
      
    logOperation('CREATE', 'message', { 
      id: newMessage.id, 
      senderId: newMessage.senderId, 
      receiverId: newMessage.receiverId
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
      logOperation('UPDATE', 'message', { id, action: 'mark_as_read' });
    }
    return updatedMessage;
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    const [deletedMessage] = await db
      .delete(messages)
      .where(eq(messages.id, id))
      .returning();
      
    if (deletedMessage) {
      logOperation('DELETE', 'message', { id });
    }
    return !!deletedMessage;
  }
}