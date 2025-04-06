import { users, type User, type InsertUser, familyMembers, type FamilyMember, type InsertFamilyMember,
  relationships, type Relationship, type InsertRelationship, events, type Event, type InsertEvent,
  documents, type Document, type InsertDocument, helpRequests, type HelpRequest, type InsertHelpRequest,
  messages, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, gte, and } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Family Member methods
  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    const [member] = await db.select().from(familyMembers).where(eq(familyMembers.id, id));
    return member;
  }
  
  async getAllFamilyMembers(): Promise<FamilyMember[]> {
    return await db.select().from(familyMembers);
  }
  
  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const [newMember] = await db
      .insert(familyMembers)
      .values(member)
      .returning();
    return newMember;
  }
  
  async updateFamilyMember(id: number, member: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined> {
    const [updatedMember] = await db
      .update(familyMembers)
      .set(member)
      .where(eq(familyMembers.id, id))
      .returning();
    return updatedMember;
  }
  
  async deleteFamilyMember(id: number): Promise<boolean> {
    const [deletedMember] = await db
      .delete(familyMembers)
      .where(eq(familyMembers.id, id))
      .returning();
    return !!deletedMember;
  }
  
  // Relationship methods
  async getRelationship(id: number): Promise<Relationship | undefined> {
    const [relationship] = await db.select().from(relationships).where(eq(relationships.id, id));
    return relationship;
  }
  
  async getRelationshipsByMember(memberId: number): Promise<Relationship[]> {
    return await db
      .select()
      .from(relationships)
      .where(
        eq(relationships.sourceMemberId, memberId) || 
        eq(relationships.targetMemberId, memberId)
      );
  }
  
  async getAllRelationships(): Promise<Relationship[]> {
    return await db.select().from(relationships);
  }
  
  async createRelationship(relationship: InsertRelationship): Promise<Relationship> {
    const [newRelationship] = await db
      .insert(relationships)
      .values(relationship)
      .returning();
    return newRelationship;
  }
  
  async updateRelationship(id: number, relationship: Partial<InsertRelationship>): Promise<Relationship | undefined> {
    const [updatedRelationship] = await db
      .update(relationships)
      .set(relationship)
      .where(eq(relationships.id, id))
      .returning();
    return updatedRelationship;
  }
  
  async deleteRelationship(id: number): Promise<boolean> {
    const [deletedRelationship] = await db
      .delete(relationships)
      .where(eq(relationships.id, id))
      .returning();
    return !!deletedRelationship;
  }
  
  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }
  
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }
  
  async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    return await db
      .select()
      .from(events)
      .where(gte(events.date, now))
      .orderBy(events.date);
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values({ ...event, attendees: [] })
      .returning();
    return newEvent;
  }
  
  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning();
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
    return updatedEvent;
  }
  
  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }
  
  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.isSecure, false));
  }
  
  async getSecureDocuments(): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.isSecure, true));
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values({ ...document, uploadedAt: new Date() })
      .returning();
    return newDocument;
  }
  
  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    const [deletedDocument] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();
    return !!deletedDocument;
  }
  
  // Help Request methods
  async getHelpRequest(id: number): Promise<HelpRequest | undefined> {
    const [helpRequest] = await db.select().from(helpRequests).where(eq(helpRequests.id, id));
    return helpRequest;
  }
  
  async getAllHelpRequests(): Promise<HelpRequest[]> {
    return await db.select().from(helpRequests);
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
    return newHelpRequest;
  }
  
  async updateHelpRequest(id: number, helpRequest: Partial<InsertHelpRequest>): Promise<HelpRequest | undefined> {
    const [updatedHelpRequest] = await db
      .update(helpRequests)
      .set(helpRequest)
      .where(eq(helpRequests.id, id))
      .returning();
    return updatedHelpRequest;
  }
  
  async deleteHelpRequest(id: number): Promise<boolean> {
    const [deletedHelpRequest] = await db
      .delete(helpRequests)
      .where(eq(helpRequests.id, id))
      .returning();
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
    return updatedHelpRequest;
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }
  
  async getMessagesBySender(senderId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.senderId, senderId));
  }
  
  async getMessagesByReceiver(receiverId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, receiverId),
          eq(messages.isGroupMessage, false)
        )
      );
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
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    const [deletedMessage] = await db
      .delete(messages)
      .where(eq(messages.id, id))
      .returning();
    return !!deletedMessage;
  }
}