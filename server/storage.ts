import {
  User,
  InsertUser,
  users,
  FamilyMember,
  InsertFamilyMember,
  familyMembers,
  Relationship,
  InsertRelationship,
  relationships,
  Event,
  InsertEvent,
  events,
  Document,
  InsertDocument,
  documents,
  HelpRequest,
  InsertHelpRequest,
  helpRequests,
  Message,
  InsertMessage,
  messages,
  HousingIssue,
  InsertHousingIssue,
  housingIssues,
} from "@shared/schema";

import { DatabaseStorage } from "./storage.db";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Family Member methods
  getFamilyMember(id: number): Promise<FamilyMember | undefined>;
  getFamilyMemberByUserId(userId: number): Promise<FamilyMember | undefined>;
  getAllFamilyMembers(): Promise<FamilyMember[]>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(
    id: number,
    member: Partial<InsertFamilyMember>,
  ): Promise<FamilyMember | undefined>;
  deleteFamilyMember(id: number): Promise<boolean>;

  // Relationship methods
  getRelationship(id: number): Promise<Relationship | undefined>;
  getRelationshipsByMember(memberId: number): Promise<Relationship[]>;
  getAllRelationships(): Promise<Relationship[]>;
  getHierarchicalFamilyStructure(): Promise<any[]>;
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  updateRelationship(
    id: number,
    relationship: Partial<InsertRelationship>,
  ): Promise<Relationship | undefined>;
  deleteRelationship(id: number): Promise<boolean>;

  // Event methods
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  getUpcomingEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(
    id: number,
    event: Partial<InsertEvent>,
  ): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  addAttendee(eventId: number, userId: number): Promise<Event | undefined>;
  removeAttendee(eventId: number, userId: number): Promise<Event | undefined>;

  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  getSecureDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(
    id: number,
    document: Partial<InsertDocument>,
  ): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Help Request methods
  getHelpRequest(id: number): Promise<HelpRequest | undefined>;
  getAllHelpRequests(): Promise<HelpRequest[]>;
  createHelpRequest(helpRequest: InsertHelpRequest): Promise<HelpRequest>;
  updateHelpRequest(
    id: number,
    helpRequest: Partial<InsertHelpRequest>,
  ): Promise<HelpRequest | undefined>;
  deleteHelpRequest(id: number): Promise<boolean>;
  addVolunteer(
    requestId: number,
    userId: number,
  ): Promise<HelpRequest | undefined>;
  removeVolunteer(
    requestId: number,
    userId: number,
  ): Promise<HelpRequest | undefined>;

  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesBySender(senderId: number): Promise<Message[]>;
  getMessagesByReceiver(receiverId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;

  // Housing Issue methods
  getHousingIssue(id: number): Promise<HousingIssue | undefined>;
  getHousingIssuesByMember(memberId: number): Promise<HousingIssue[]>;
  getAllHousingIssues(): Promise<HousingIssue[]>;
  createHousingIssue(issue: InsertHousingIssue): Promise<HousingIssue>;
  updateHousingIssue(
    id: number,
    issue: Partial<InsertHousingIssue>,
  ): Promise<HousingIssue | undefined>;
  deleteHousingIssue(id: number): Promise<boolean>;
  checkHPDViolations(address: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private familyMembers = new Map<number, FamilyMember>();
  private users = new Map<number, User>();
  private relationships = new Map<number, Relationship>();
  private events = new Map<number, Event>();
  private documents = new Map<number, Document>();
  private helpRequests = new Map<number, HelpRequest>();
  private messages = new Map<number, Message>();
  private housingIssues = new Map<number, HousingIssue>();

  private currentUserId = 1;
  private currentFamilyMemberId = 1;
  private currentRelationshipId = 1;
  private currentEventId = 1;
  private currentDocumentId = 1;
  private currentHelpRequestId = 1;
  private currentMessageId = 1;
  private currentHousingIssueId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin123",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "admin",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    };
    this.users.set(adminUser.id, adminUser);

    const exampleMember: FamilyMember = {
      id: this.currentFamilyMemberId++,
      user_id: adminUser.id,
      name: "Sarah Johnson",
      role: "You",
      relationship: "biological",
      avatarUrl: adminUser.avatarUrl,
      birth_date: new Date("1985-01-01"),
      location: "Brooklyn, NY",
      bio: "Family historian and organizer",
      personality_traits: ["organized", "caring"],
      interests: ["genealogy", "cooking"],
      occupation: "Librarian",
      metadata: {},
    };
    this.familyMembers.set(exampleMember.id, exampleMember);
  }

  // User methods
  async getUser(id: number) {
    return this.users.get(id);
  }

  async getUserByUsername(username: string) {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async createUser(user: InsertUser) {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Family Member methods
  async getFamilyMember(id: number) {
    return this.familyMembers.get(id);
  }

  async getFamilyMemberByUserId(
    userId: number,
  ): Promise<FamilyMember | undefined> {
    return Array.from(this.familyMembers.values()).find(
      (member) => member.user_id === userId,
    );
  }

  async getAllFamilyMembers() {
    return Array.from(this.familyMembers.values());
  }

  async createFamilyMember(member: InsertFamilyMember) {
    const id = this.currentFamilyMemberId++;
    const newMember: FamilyMember = { ...member, id };
    this.familyMembers.set(id, newMember);
    return newMember;
  }

  async updateFamilyMember(id: number, member: Partial<InsertFamilyMember>) {
    const existing = this.familyMembers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...member };
    this.familyMembers.set(id, updated);
    return updated;
  }

  async deleteFamilyMember(id: number) {
    return this.familyMembers.delete(id);
  }

  // [ ... other methods remain unchanged ... ]
  // You can copy-paste the rest of your unchanged logic here
}

export const storage = new DatabaseStorage(); // Or use: new MemStorage() for in-memory
