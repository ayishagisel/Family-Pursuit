import { 
  User, InsertUser, users,
  FamilyMember, InsertFamilyMember, familyMembers,
  Relationship, InsertRelationship, relationships,
  Event, InsertEvent, events,
  Document, InsertDocument, documents,
  HelpRequest, InsertHelpRequest, helpRequests,
  Message, InsertMessage, messages
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Family Member methods
  getFamilyMember(id: number): Promise<FamilyMember | undefined>;
  getAllFamilyMembers(): Promise<FamilyMember[]>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: number, member: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined>;
  deleteFamilyMember(id: number): Promise<boolean>;
  
  // Relationship methods
  getRelationship(id: number): Promise<Relationship | undefined>;
  getRelationshipsByMember(memberId: number): Promise<Relationship[]>;
  getAllRelationships(): Promise<Relationship[]>;
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  updateRelationship(id: number, relationship: Partial<InsertRelationship>): Promise<Relationship | undefined>;
  deleteRelationship(id: number): Promise<boolean>;
  
  // Event methods
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  getUpcomingEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  addAttendee(eventId: number, userId: number): Promise<Event | undefined>;
  removeAttendee(eventId: number, userId: number): Promise<Event | undefined>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  getSecureDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Help Request methods
  getHelpRequest(id: number): Promise<HelpRequest | undefined>;
  getAllHelpRequests(): Promise<HelpRequest[]>;
  createHelpRequest(helpRequest: InsertHelpRequest): Promise<HelpRequest>;
  updateHelpRequest(id: number, helpRequest: Partial<InsertHelpRequest>): Promise<HelpRequest | undefined>;
  deleteHelpRequest(id: number): Promise<boolean>;
  addVolunteer(requestId: number, userId: number): Promise<HelpRequest | undefined>;
  removeVolunteer(requestId: number, userId: number): Promise<HelpRequest | undefined>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesBySender(senderId: number): Promise<Message[]>;
  getMessagesByReceiver(receiverId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private familyMembers: Map<number, FamilyMember>;
  private relationships: Map<number, Relationship>;
  private events: Map<number, Event>;
  private documents: Map<number, Document>;
  private helpRequests: Map<number, HelpRequest>;
  private messages: Map<number, Message>;
  
  currentUserId: number;
  currentFamilyMemberId: number;
  currentRelationshipId: number;
  currentEventId: number;
  currentDocumentId: number;
  currentHelpRequestId: number;
  currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.familyMembers = new Map();
    this.relationships = new Map();
    this.events = new Map();
    this.documents = new Map();
    this.helpRequests = new Map();
    this.messages = new Map();
    
    this.currentUserId = 1;
    this.currentFamilyMemberId = 1;
    this.currentRelationshipId = 1;
    this.currentEventId = 1;
    this.currentDocumentId = 1;
    this.currentHelpRequestId = 1;
    this.currentMessageId = 1;
    
    // Initialize with some default data
    this.initializeData();
  }
  
  private initializeData() {
    // Adding a default admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "admin",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
    };
    this.users.set(adminUser.id, adminUser);
    
    // Add sample family members
    const familyMembersData = [
      {
        id: this.currentFamilyMemberId++,
        name: "John Smith",
        role: "Grandfather",
        relationship: "biological",
        avatarUrl: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=100&h=100&fit=crop&crop=faces"
      },
      {
        id: this.currentFamilyMemberId++,
        name: "Robert Smith",
        role: "Father",
        relationship: "biological",
        avatarUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=faces"
      },
      {
        id: this.currentFamilyMemberId++,
        name: "Linda Smith",
        role: "Aunt",
        relationship: "biological",
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces"
      },
      {
        id: this.currentFamilyMemberId++,
        name: "Michael Johnson",
        role: "Adopted Son",
        relationship: "adoptive",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces"
      },
      {
        id: this.currentFamilyMemberId++,
        name: "Emily Smith",
        role: "Sister",
        relationship: "biological",
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces"
      },
      {
        id: this.currentFamilyMemberId++,
        name: "James Wilson",
        role: "Step-Brother",
        relationship: "step",
        avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=faces"
      },
      {
        id: this.currentFamilyMemberId++,
        name: "Sarah Johnson",
        role: "You",
        relationship: "biological",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
      },
      {
        id: this.currentFamilyMemberId++,
        name: "David Lee",
        role: "Cousin",
        relationship: "adoptive",
        avatarUrl: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=100&h=100&fit=crop&crop=faces"
      },
      {
        id: this.currentFamilyMemberId++,
        name: "Jessica Lee",
        role: "Cousin",
        relationship: "adoptive",
        avatarUrl: "https://images.unsplash.com/photo-1491349174775-aaafddd81942?w=100&h=100&fit=crop&crop=faces"
      }
    ];
    
    familyMembersData.forEach(member => {
      this.familyMembers.set(member.id, member as FamilyMember);
    });
    
    // Add sample relationships
    const relationshipsData = [
      { id: this.currentRelationshipId++, sourceMemberId: 1, targetMemberId: 2, relationshipType: "biological" },
      { id: this.currentRelationshipId++, sourceMemberId: 1, targetMemberId: 3, relationshipType: "biological" },
      { id: this.currentRelationshipId++, sourceMemberId: 1, targetMemberId: 4, relationshipType: "adoptive" },
      { id: this.currentRelationshipId++, sourceMemberId: 2, targetMemberId: 5, relationshipType: "biological" },
      { id: this.currentRelationshipId++, sourceMemberId: 2, targetMemberId: 6, relationshipType: "step" },
      { id: this.currentRelationshipId++, sourceMemberId: 3, targetMemberId: 7, relationshipType: "biological" },
      { id: this.currentRelationshipId++, sourceMemberId: 4, targetMemberId: 8, relationshipType: "adoptive" },
      { id: this.currentRelationshipId++, sourceMemberId: 4, targetMemberId: 9, relationshipType: "adoptive" }
    ];
    
    relationshipsData.forEach(relationship => {
      this.relationships.set(relationship.id, relationship as Relationship);
    });
    
    // Add sample events
    const now = new Date();
    const eventsData = [
      {
        id: this.currentEventId++,
        title: "Mom's Birthday",
        description: "Birthday celebration for mom",
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 13),
        createdBy: 1,
        attendees: [1, 2, 3, 7],
        eventType: "birthday"
      },
      {
        id: this.currentEventId++,
        title: "Family Reunion",
        description: "Annual family gathering",
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 16),
        createdBy: 1,
        attendees: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        eventType: "reunion"
      },
      {
        id: this.currentEventId++,
        title: "James' Graduation",
        description: "High school graduation ceremony",
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21),
        createdBy: 6,
        attendees: [1, 2, 6, 7, 8],
        eventType: "graduation"
      }
    ];
    
    eventsData.forEach(event => {
      this.events.set(event.id, event as Event);
    });
    
    // Add sample documents
    const documentsData = [
      {
        id: this.currentDocumentId++,
        title: "Family Reunion Plans.pdf",
        filename: "family_reunion_plans.pdf",
        uploadedBy: 1,
        uploadedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
        isSecure: false,
        accessLevel: "all",
        documentType: "pdf"
      },
      {
        id: this.currentDocumentId++,
        title: "Vacation Photos.zip",
        filename: "vacation_photos.zip",
        uploadedBy: 3,
        uploadedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
        isSecure: false,
        accessLevel: "all",
        documentType: "zip"
      },
      {
        id: this.currentDocumentId++,
        title: "Trust Fund Details",
        filename: "trust_fund_details.pdf",
        uploadedBy: 1,
        uploadedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
        isSecure: true,
        accessLevel: "limited",
        documentType: "contract"
      },
      {
        id: this.currentDocumentId++,
        title: "Will and Testament",
        filename: "will_and_testament.pdf",
        uploadedBy: 1,
        uploadedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15),
        isSecure: true,
        accessLevel: "admin",
        documentType: "legal"
      },
      {
        id: this.currentDocumentId++,
        title: "Health Proxy Documents",
        filename: "health_proxy.pdf",
        uploadedBy: 1,
        uploadedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 20),
        isSecure: true,
        accessLevel: "limited",
        documentType: "medical"
      }
    ];
    
    documentsData.forEach(document => {
      this.documents.set(document.id, document as Document);
    });
    
    // Add sample help requests
    const helpRequestsData = [
      {
        id: this.currentHelpRequestId++,
        title: "School Pickup - Tuesday",
        description: "Need someone to pick up Emily from school on Tuesday at 3:30 PM.",
        requestedBy: 5,
        dateNeeded: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
        status: "needs_volunteer",
        volunteers: []
      },
      {
        id: this.currentHelpRequestId++,
        title: "Help with Meal Prep",
        description: "Looking for help preparing meals for Grandpa this weekend. Need about 2 hours on Saturday.",
        requestedBy: 4,
        dateNeeded: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4),
        status: "has_volunteers",
        volunteers: [9]
      },
      {
        id: this.currentHelpRequestId++,
        title: "Dog Sitting",
        description: "Need someone to watch Max while we're away for the weekend (Sep 9-10).",
        requestedBy: 3,
        dateNeeded: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
        status: "completed",
        volunteers: [7]
      }
    ];
    
    helpRequestsData.forEach(helpRequest => {
      this.helpRequests.set(helpRequest.id, helpRequest as HelpRequest);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Family Member methods
  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    return this.familyMembers.get(id);
  }
  
  async getAllFamilyMembers(): Promise<FamilyMember[]> {
    return Array.from(this.familyMembers.values());
  }
  
  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const id = this.currentFamilyMemberId++;
    const familyMember: FamilyMember = { ...member, id };
    this.familyMembers.set(id, familyMember);
    return familyMember;
  }
  
  async updateFamilyMember(id: number, member: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined> {
    const existingMember = this.familyMembers.get(id);
    if (!existingMember) return undefined;
    
    const updatedMember = { ...existingMember, ...member };
    this.familyMembers.set(id, updatedMember);
    return updatedMember;
  }
  
  async deleteFamilyMember(id: number): Promise<boolean> {
    return this.familyMembers.delete(id);
  }
  
  // Relationship methods
  async getRelationship(id: number): Promise<Relationship | undefined> {
    return this.relationships.get(id);
  }
  
  async getRelationshipsByMember(memberId: number): Promise<Relationship[]> {
    return Array.from(this.relationships.values()).filter(
      rel => rel.sourceMemberId === memberId || rel.targetMemberId === memberId
    );
  }
  
  async getAllRelationships(): Promise<Relationship[]> {
    return Array.from(this.relationships.values());
  }
  
  async createRelationship(relationship: InsertRelationship): Promise<Relationship> {
    const id = this.currentRelationshipId++;
    const newRelationship: Relationship = { ...relationship, id };
    this.relationships.set(id, newRelationship);
    return newRelationship;
  }
  
  async updateRelationship(id: number, relationship: Partial<InsertRelationship>): Promise<Relationship | undefined> {
    const existingRelationship = this.relationships.get(id);
    if (!existingRelationship) return undefined;
    
    const updatedRelationship = { ...existingRelationship, ...relationship };
    this.relationships.set(id, updatedRelationship);
    return updatedRelationship;
  }
  
  async deleteRelationship(id: number): Promise<boolean> {
    return this.relationships.delete(id);
  }
  
  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    return Array.from(this.events.values())
      .filter(event => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const newEvent: Event = { ...event, id, attendees: [] };
    this.events.set(id, newEvent);
    return newEvent;
  }
  
  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent = { ...existingEvent, ...event };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }
  
  async addAttendee(eventId: number, userId: number): Promise<Event | undefined> {
    const event = this.events.get(eventId);
    if (!event) return undefined;
    
    const attendees = Array.isArray(event.attendees) ? event.attendees : [];
    if (!attendees.includes(userId)) {
      attendees.push(userId);
    }
    
    const updatedEvent = { ...event, attendees };
    this.events.set(eventId, updatedEvent);
    return updatedEvent;
  }
  
  async removeAttendee(eventId: number, userId: number): Promise<Event | undefined> {
    const event = this.events.get(eventId);
    if (!event) return undefined;
    
    const attendees = Array.isArray(event.attendees) ? event.attendees : [];
    const updatedAttendees = attendees.filter(id => id !== userId);
    
    const updatedEvent = { ...event, attendees: updatedAttendees };
    this.events.set(eventId, updatedEvent);
    return updatedEvent;
  }
  
  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
  
  async getSecureDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.isSecure);
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const now = new Date();
    const newDocument: Document = { ...document, id, uploadedAt: now };
    this.documents.set(id, newDocument);
    return newDocument;
  }
  
  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const existingDocument = this.documents.get(id);
    if (!existingDocument) return undefined;
    
    const updatedDocument = { ...existingDocument, ...document };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }
  
  // Help Request methods
  async getHelpRequest(id: number): Promise<HelpRequest | undefined> {
    return this.helpRequests.get(id);
  }
  
  async getAllHelpRequests(): Promise<HelpRequest[]> {
    return Array.from(this.helpRequests.values());
  }
  
  async createHelpRequest(helpRequest: InsertHelpRequest): Promise<HelpRequest> {
    const id = this.currentHelpRequestId++;
    const newHelpRequest: HelpRequest = { 
      ...helpRequest, 
      id, 
      status: "needs_volunteer", 
      volunteers: [] 
    };
    this.helpRequests.set(id, newHelpRequest);
    return newHelpRequest;
  }
  
  async updateHelpRequest(id: number, helpRequest: Partial<InsertHelpRequest>): Promise<HelpRequest | undefined> {
    const existingRequest = this.helpRequests.get(id);
    if (!existingRequest) return undefined;
    
    const updatedRequest = { ...existingRequest, ...helpRequest };
    this.helpRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  async deleteHelpRequest(id: number): Promise<boolean> {
    return this.helpRequests.delete(id);
  }
  
  async addVolunteer(requestId: number, userId: number): Promise<HelpRequest | undefined> {
    const request = this.helpRequests.get(requestId);
    if (!request) return undefined;
    
    const volunteers = Array.isArray(request.volunteers) ? request.volunteers : [];
    if (!volunteers.includes(userId)) {
      volunteers.push(userId);
    }
    
    const status = volunteers.length > 0 ? "has_volunteers" : "needs_volunteer";
    const updatedRequest = { ...request, volunteers, status };
    this.helpRequests.set(requestId, updatedRequest);
    return updatedRequest;
  }
  
  async removeVolunteer(requestId: number, userId: number): Promise<HelpRequest | undefined> {
    const request = this.helpRequests.get(requestId);
    if (!request) return undefined;
    
    const volunteers = Array.isArray(request.volunteers) ? request.volunteers : [];
    const updatedVolunteers = volunteers.filter(id => id !== userId);
    
    const status = updatedVolunteers.length > 0 ? "has_volunteers" : "needs_volunteer";
    const updatedRequest = { ...request, volunteers: updatedVolunteers, status };
    this.helpRequests.set(requestId, updatedRequest);
    return updatedRequest;
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesBySender(senderId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      message => message.senderId === senderId
    );
  }
  
  async getMessagesByReceiver(receiverId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      message => message.receiverId === receiverId || 
        (message.isGroupMessage && message.groupId === receiverId)
    );
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const newMessage: Message = { 
      ...message, 
      id, 
      sentAt: now, 
      isRead: false 
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    return this.messages.delete(id);
  }
}

export const storage = new MemStorage();
