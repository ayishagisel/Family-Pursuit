import { db } from "../server/db";
import { 
  users, 
  familyMembers, 
  relationships, 
  events, 
  documents, 
  helpRequests, 
  messages 
} from "../shared/schema";
import bcrypt from "bcryptjs";

/**
 * Seed script to populate the database with sample family data
 * 
 * Usage: 
 * 1. Make sure database is created
 * 2. Run with: npx tsx scripts/seed-family-data.ts
 */

async function seed() {
  // Clear existing data first
  console.log("Clearing existing data...");
  try {
    await db.delete(messages);
    await db.delete(helpRequests);
    await db.delete(documents);
    await db.delete(events);
    await db.delete(relationships);
    await db.delete(familyMembers);
    await db.delete(users);
    console.log("Data cleared successfully!");
  } catch (error) {
    console.error("Error clearing data:", error);
    return;
  }

  // Create users
  console.log("Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  try {
    // Create admin user
    await db.insert(users).values({
      id: 1,
      username: "admin",
      passwordHash: hashedPassword,
      email: "admin@familyapp.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin"
    });

    // Create regular user
    await db.insert(users).values({
      id: 2,
      username: "user",
      passwordHash: hashedPassword,
      email: "user@familyapp.com",
      firstName: "Regular",
      lastName: "User",
      role: "user"
    });

    console.log("Users created successfully!");
  } catch (error) {
    console.error("Error creating users:", error);
    return;
  }

  // Create family members
  console.log("Creating family members...");
  try {
    const members = [
      {
        id: 1,
        name: "John Smith",
        birthDate: "1980-05-15",
        gender: "male",
        bio: "Father of two, loves hiking and fishing.",
        location: "Seattle, WA",
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "Jane Smith",
        birthDate: "1982-09-23",
        gender: "female",
        bio: "Mother of two, works as a healthcare professional.",
        location: "Seattle, WA",
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: 3,
        name: "Emma Smith",
        birthDate: "2010-03-12",
        gender: "female",
        bio: "Loves drawing and dancing.",
        location: "Seattle, WA",
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: 4,
        name: "Liam Smith",
        birthDate: "2012-11-08",
        gender: "male",
        bio: "Enjoys soccer and video games.",
        location: "Seattle, WA",
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: 5,
        name: "Margaret Wilson",
        birthDate: "1955-04-30",
        gender: "female",
        bio: "Grandmother, retired teacher who loves gardening.",
        location: "Portland, OR",
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: 6,
        name: "Robert Wilson",
        birthDate: "1953-08-17",
        gender: "male",
        bio: "Grandfather, retired engineer with a passion for woodworking.",
        location: "Portland, OR",
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: 7,
        name: "Michael Johnson",
        birthDate: "1978-12-01",
        gender: "male",
        bio: "Uncle, works in technology and enjoys photography.",
        location: "San Francisco, CA",
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: 8,
        name: "Sophia Johnson",
        birthDate: "1979-03-22",
        gender: "female",
        bio: "Aunt, passionate about cooking and traveling.",
        location: "San Francisco, CA",
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: 9,
        name: "Olivia Johnson",
        birthDate: "2011-07-19",
        gender: "female",
        bio: "Cousin who loves swimming and reading.",
        location: "San Francisco, CA",
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: 10,
        name: "James Taylor",
        birthDate: "1975-10-09",
        gender: "male",
        bio: "Step-father who maintains a good relationship with the family.",
        location: "Los Angeles, CA",
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: 11,
        name: "Ella Williams",
        birthDate: "1985-06-25",
        gender: "female",
        bio: "Family friend considered part of the extended family.",
        location: "Seattle, WA",
        imageUrl: null,
        createdAt: new Date(),
      }
    ];

    for (const member of members) {
      await db.insert(familyMembers).values(member);
    }
    console.log("Family members created successfully!");
  } catch (error) {
    console.error("Error creating family members:", error);
    return;
  }

  // Create relationships
  console.log("Creating relationships...");
  try {
    const relationshipData = [
      // Marriage relationships
      {
        sourceId: 1, 
        targetId: 2, 
        relationshipType: "marriage", 
        notes: "Married for 15 years, met in college"
      },
      {
        sourceId: 5, 
        targetId: 6, 
        relationshipType: "marriage", 
        notes: "Married for 45 years"
      },
      {
        sourceId: 7, 
        targetId: 8, 
        relationshipType: "marriage", 
        notes: "Married for 12 years"
      },
      // Parent-child relationships
      {
        sourceId: 1, 
        targetId: 3, 
        relationshipType: "parent-child", 
        notes: "Supportive father, teaches Emma about nature"
      },
      {
        sourceId: 1, 
        targetId: 4, 
        relationshipType: "parent-child", 
        notes: "Coaches Liam's soccer team"
      },
      {
        sourceId: 2, 
        targetId: 3, 
        relationshipType: "parent-child", 
        notes: "Close mother-daughter relationship"
      },
      {
        sourceId: 2, 
        targetId: 4, 
        relationshipType: "parent-child", 
        notes: "Helps Liam with homework"
      },
      {
        sourceId: 6, 
        targetId: 2, 
        relationshipType: "parent-child", 
        notes: "Supportive father who taught Jane many life skills"
      },
      {
        sourceId: 5, 
        targetId: 2, 
        relationshipType: "parent-child", 
        notes: "Close relationship, calls weekly"
      },
      {
        sourceId: 5, 
        targetId: 7, 
        relationshipType: "parent-child", 
        notes: "Mother-son relationship"
      },
      {
        sourceId: 6, 
        targetId: 7, 
        relationshipType: "parent-child", 
        notes: "Father-son relationship"
      },
      {
        sourceId: 7, 
        targetId: 9, 
        relationshipType: "parent-child", 
        notes: "Doting father"
      },
      {
        sourceId: 8, 
        targetId: 9, 
        relationshipType: "parent-child", 
        notes: "Caring mother"
      },
      // Grandparent relationships
      {
        sourceId: 5, 
        targetId: 3, 
        relationshipType: "grandparent-grandchild", 
        notes: "Teaches Emma baking"
      },
      {
        sourceId: 5, 
        targetId: 4, 
        relationshipType: "grandparent-grandchild", 
        notes: "Sends care packages"
      },
      {
        sourceId: 6, 
        targetId: 3, 
        relationshipType: "grandparent-grandchild", 
        notes: "Paternal grandfather, enjoys teaching Emma about history"
      },
      {
        sourceId: 6, 
        targetId: 4, 
        relationshipType: "grandparent-grandchild", 
        notes: "Paternal grandfather, takes Liam fishing regularly"
      },
      // Sibling relationships
      {
        sourceId: 3, 
        targetId: 4, 
        relationshipType: "sibling", 
        notes: "Close siblings despite occasional arguments"
      },
      {
        sourceId: 2, 
        targetId: 7, 
        relationshipType: "sibling", 
        notes: "Sister and brother with strong bond"
      },
      // Cousin relationships
      {
        sourceId: 3, 
        targetId: 9, 
        relationshipType: "cousin", 
        notes: "Close cousins who enjoy spending summers together"
      },
      {
        sourceId: 4, 
        targetId: 9, 
        relationshipType: "cousin", 
        notes: "Cousins who like to play video games together"
      },
      // In-law relationships
      {
        sourceId: 1, 
        targetId: 5, 
        relationshipType: "in-law", 
        notes: "Good relationship with mother-in-law"
      },
      {
        sourceId: 1, 
        targetId: 6, 
        relationshipType: "in-law", 
        notes: "Shares interest in fishing with father-in-law"
      },
      {
        sourceId: 1, 
        targetId: 7, 
        relationshipType: "in-law", 
        notes: "Brothers-in-law who get along well"
      },
      {
        sourceId: 1, 
        targetId: 8, 
        relationshipType: "in-law", 
        notes: "In-laws with respectful relationship"
      },
      {
        sourceId: 10, 
        targetId: 6, 
        relationshipType: "in-law", 
        notes: "Former son-in-law, maintains respectful relationship"
      },
      {
        sourceId: 10, 
        targetId: 5, 
        relationshipType: "in-law", 
        notes: "Former daughter-in-law, limited contact"
      },
      // Step-parent relationships
      {
        sourceId: 10, 
        targetId: 3, 
        relationshipType: "step-parent", 
        notes: "Positive step-father relationship"
      },
      {
        sourceId: 10, 
        targetId: 4, 
        relationshipType: "step-parent", 
        notes: "Supportive step-father who attends soccer games"
      },
      // Ex-spouse relationship
      {
        sourceId: 2, 
        targetId: 10, 
        relationshipType: "ex-spouse", 
        notes: "Divorced 5 years ago, maintain civil co-parenting relationship"
      },
      // Friend relationships
      {
        sourceId: 1, 
        targetId: 11, 
        relationshipType: "friend", 
        notes: "Close friends for over a decade"
      },
      {
        sourceId: 2, 
        targetId: 11, 
        relationshipType: "friend", 
        notes: "Best friends since high school"
      }
    ];

    for (const relation of relationshipData) {
      await db.insert(relationships).values(relation);
    }
    console.log("Relationships created successfully!");
  } catch (error) {
    console.error("Error creating relationships:", error);
    return;
  }

  // Create events
  console.log("Creating events...");
  try {
    const eventData = [
      {
        id: 1,
        title: "Smith Family Reunion",
        description: "Annual family reunion at the lake house",
        startDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 17),
        location: "Lake Tahoe, CA",
        createdBy: 1,
        attendees: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        createdAt: new Date()
      },
      {
        id: 2,
        title: "Emma's Dance Recital",
        description: "Emma's end of year dance performance",
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 25),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 25),
        location: "Seattle Community Center",
        createdBy: 2,
        attendees: [1, 2, 3, 5, 10],
        createdAt: new Date()
      },
      {
        id: 3,
        title: "Thanksgiving Dinner",
        description: "Annual Thanksgiving celebration",
        startDate: new Date(new Date().getFullYear(), 10, 25),
        endDate: new Date(new Date().getFullYear(), 10, 25),
        location: "John and Jane's House",
        createdBy: 1,
        attendees: [1, 2, 3, 4, 5, 6, 11],
        createdAt: new Date()
      },
      {
        id: 4,
        title: "Liam's Soccer Tournament",
        description: "Regional youth soccer championship",
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 18),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 19),
        location: "Memorial Park",
        createdBy: 1,
        attendees: [1, 2, 4, 10],
        createdAt: new Date()
      },
      {
        id: 5,
        title: "Anniversary Celebration",
        description: "Robert and Margaret's 45th anniversary",
        startDate: new Date(new Date().getFullYear(), 5, 10),
        endDate: new Date(new Date().getFullYear(), 5, 10),
        location: "Portland Golf Club",
        createdBy: 7,
        attendees: [1, 2, 5, 6, 7, 8],
        createdAt: new Date()
      }
    ];

    for (const event of eventData) {
      await db.insert(events).values({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        createdBy: event.createdBy,
        createdAt: event.createdAt,
        attendees: event.attendees
      });
    }
    console.log("Events created successfully!");
  } catch (error) {
    console.error("Error creating events:", error);
    return;
  }

  // Create documents
  console.log("Creating documents...");
  try {
    const documentData = [
      {
        id: 1,
        title: "Family Emergency Contacts",
        description: "List of emergency contacts for all family members",
        fileUrl: "https://example.com/documents/emergency-contacts.pdf",
        fileType: "pdf",
        isSecure: false,
        uploadedBy: 1,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 30)),
        tags: ["important", "contacts"]
      },
      {
        id: 2,
        title: "Wilson Family History",
        description: "Documentation of the Wilson family ancestry",
        fileUrl: "https://example.com/documents/wilson-history.docx",
        fileType: "docx",
        isSecure: false,
        uploadedBy: 6,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 60)),
        tags: ["history", "genealogy"]
      },
      {
        id: 3,
        title: "Medical Information",
        description: "Family medical history and important health information",
        fileUrl: "https://example.com/documents/medical-info.pdf",
        fileType: "pdf",
        isSecure: true,
        uploadedBy: 2,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 45)),
        tags: ["medical", "secure", "important"]
      },
      {
        id: 4,
        title: "Family Recipes",
        description: "Collection of treasured family recipes",
        fileUrl: "https://example.com/documents/family-recipes.pdf",
        fileType: "pdf",
        isSecure: false,
        uploadedBy: 5,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 15)),
        tags: ["recipes", "traditions"]
      },
      {
        id: 5,
        title: "Estate Planning Documents",
        description: "Legal documents related to estate planning",
        fileUrl: "https://example.com/documents/estate-planning.pdf",
        fileType: "pdf",
        isSecure: true,
        uploadedBy: 1,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 90)),
        tags: ["legal", "secure", "important"]
      }
    ];

    for (const doc of documentData) {
      await db.insert(documents).values(doc);
    }
    console.log("Documents created successfully!");
  } catch (error) {
    console.error("Error creating documents:", error);
    return;
  }

  // Create help requests
  console.log("Creating help requests...");
  try {
    const helpRequestData = [
      {
        id: 1,
        title: "Ride to Doctor Appointment",
        description: "Need a ride to doctor's appointment next Tuesday at 2pm",
        requestDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        location: "Seattle Medical Center",
        status: "open",
        requestedBy: 5,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
        volunteers: []
      },
      {
        id: 2,
        title: "Help with Moving Furniture",
        description: "Need help moving a couch and bookshelf this weekend",
        requestDate: new Date(new Date().setDate(new Date().getDate() + 3)),
        location: "John and Jane's House",
        status: "open",
        requestedBy: 1,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        volunteers: [7]
      },
      {
        id: 3,
        title: "Childcare Needed",
        description: "Looking for someone to watch Emma and Liam for a few hours",
        requestDate: new Date(new Date().setDate(new Date().getDate() + 5)),
        location: "John and Jane's House",
        status: "open",
        requestedBy: 2,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
        volunteers: [11, 5]
      },
      {
        id: 4,
        title: "Grocery Shopping Assistance",
        description: "Need help with grocery shopping due to recent surgery",
        requestDate: new Date(new Date().setDate(new Date().getDate() + 2)),
        location: "Portland, OR",
        status: "open",
        requestedBy: 6,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 4)),
        volunteers: [2]
      },
      {
        id: 5,
        title: "Computer Setup Help",
        description: "Need assistance setting up new laptop and transferring files",
        requestDate: new Date(new Date().setDate(new Date().getDate() + 6)),
        location: "San Francisco, CA",
        status: "completed",
        requestedBy: 8,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 10)),
        volunteers: [7]
      }
    ];

    for (const request of helpRequestData) {
      await db.insert(helpRequests).values(request);
    }
    console.log("Help requests created successfully!");
  } catch (error) {
    console.error("Error creating help requests:", error);
    return;
  }

  // Create messages
  console.log("Creating messages...");
  try {
    const messageData = [
      {
        id: 1,
        senderId: 1,
        receiverId: 2,
        content: "Can you pick up the kids from school today?",
        sentAt: new Date(new Date().setHours(new Date().getHours() - 3)),
        isRead: true
      },
      {
        id: 2,
        senderId: 2,
        receiverId: 1,
        content: "Yes, I'll be there at 3pm.",
        sentAt: new Date(new Date().setHours(new Date().getHours() - 2)),
        isRead: true
      },
      {
        id: 3,
        senderId: 5,
        receiverId: 2,
        content: "We're planning to visit next month. Is the guest room available?",
        sentAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        isRead: true
      },
      {
        id: 4,
        senderId: 2,
        receiverId: 5,
        content: "Yes, we'd love to have you! The guest room is all yours.",
        sentAt: new Date(new Date().setDate(new Date().getDate() - 1)),
        isRead: false
      },
      {
        id: 5,
        senderId: 7,
        receiverId: 1,
        content: "Are we still on for fishing this weekend?",
        sentAt: new Date(new Date().setHours(new Date().getHours() - 5)),
        isRead: false
      },
      {
        id: 6,
        senderId: 2,
        receiverId: 11,
        content: "Thank you for offering to help with the kids next week!",
        sentAt: new Date(new Date().setDate(new Date().getDate() - 1)),
        isRead: true
      },
      {
        id: 7,
        senderId: 3,
        receiverId: 9,
        content: "Do you want to have a virtual movie night this Saturday?",
        sentAt: new Date(new Date().setHours(new Date().getHours() - 12)),
        isRead: false
      },
      {
        id: 8,
        senderId: 1,
        receiverId: 6,
        content: "I found that woodworking book we were talking about.",
        sentAt: new Date(new Date().setDate(new Date().getDate() - 3)),
        isRead: true
      },
      {
        id: 9,
        senderId: 10,
        receiverId: 2,
        content: "I can take Liam to soccer practice on Thursday if needed.",
        sentAt: new Date(new Date().setDate(new Date().getDate() - 1)),
        isRead: false
      },
      {
        id: 10,
        senderId: 2,
        receiverId: 8,
        content: "Could you share that recipe from dinner last month?",
        sentAt: new Date(new Date().setHours(new Date().getHours() - 4)),
        isRead: true
      }
    ];

    for (const message of messageData) {
      await db.insert(messages).values(message);
    }
    console.log("Messages created successfully!");
  } catch (error) {
    console.error("Error creating messages:", error);
    return;
  }

  console.log("All data seeded successfully!");
}

// Execute the seed function
seed()
  .then(() => console.log("Seeding completed successfully!"))
  .catch((error) => console.error("Error during seeding:", error))
  .finally(() => process.exit(0));