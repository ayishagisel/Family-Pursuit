/**
 * Seed script to populate the database with sample events, documents, help requests, and messages
 * 
 * Usage: 
 * Run with: npx tsx scripts/seed-additional-data.ts
 */
import { db } from "../server/db";
import { 
  events, documents, helpRequests, messages,
} from "../shared/schema";

async function seedAdditionalData() {
  console.log("🔄 Starting additional data seeding...");
  
  try {
    // First check if we already have data
    const existingEvents = await db.select().from(events);
    const existingDocuments = await db.select().from(documents);
    const existingHelpRequests = await db.select().from(helpRequests);
    const existingMessages = await db.select().from(messages);
    
    if (existingEvents.length > 0 && 
        existingDocuments.length > 0 && 
        existingHelpRequests.length > 0 && 
        existingMessages.length > 0) {
      console.log("⚠️ Additional data already exists. Skipping seeding.");
      return;
    }

    // Clear existing data if any exists
    if (existingEvents.length > 0) {
      await db.delete(events);
      console.log("Cleared existing events data");
    }
    
    if (existingDocuments.length > 0) {
      await db.delete(documents);
      console.log("Cleared existing documents data");
    }
    
    if (existingHelpRequests.length > 0) {
      await db.delete(helpRequests);
      console.log("Cleared existing help requests data");
    }
    
    if (existingMessages.length > 0) {
      await db.delete(messages);
      console.log("Cleared existing messages data");
    }
    
    // Seed sample events
    const sampleEvents = [
      {
        title: "Johnson Family Reunion",
        description: "Annual gathering of the extended Johnson family",
        date: new Date(new Date().getFullYear(), 6, 15),
        location: "Johnson Family Farm",
        user_id: 5,
        event_type: "Family Gathering",
        attendees: [1, 2, 5, 6, 11, 12, 13]
      },
      {
        title: "Olivia's High School Graduation",
        description: "Celebration of Olivia's graduation",
        date: new Date(new Date().getFullYear(), 5, 5),
        location: "City High School Auditorium",
        user_id: 7,
        event_type: "Milestone",
        attendees: [1, 2, 5, 6, 7, 8, 11, 12, 13, 19]
      },
      {
        title: "Thanksgiving Dinner",
        description: "Traditional Thanksgiving dinner",
        date: new Date(new Date().getFullYear(), 10, 25),
        location: "Michael and Sofia's Home",
        user_id: 6,
        event_type: "Holiday",
        attendees: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
      },
      {
        title: "Monthly Family Video Call",
        description: "Regular check-in with family members",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 28),
        location: "Virtual - Zoom",
        user_id: 11,
        event_type: "Regular Check-in",
        attendees: [5, 6, 11, 12, 13, 7, 8, 19]
      },
      {
        title: "Emma's Dance Recital",
        description: "Emma's spring dance performance",
        date: new Date(new Date().getFullYear(), 3, 18),
        location: "Community Arts Center",
        user_id: 9,
        event_type: "Performance",
        attendees: [3, 4, 9, 18, 5, 6, 11]
      }
    ];
    
    for (const event of sampleEvents) {
      await db.insert(events).values(event);
      console.log(`Added event: ${event.title}`);
    }
    
    // Seed sample documents
    const sampleDocuments = [
      {
        title: "Family Medical History",
        content: "Comprehensive medical history for the Johnson and Garcia families",
        user_id: 5,
        document_type: "Health",
        permissions: { is_secure: true, shared_with: [1, 2, 3, 4, 5, 6, 7, 9] }
      },
      {
        title: "Family Tree Documentation",
        content: "Detailed family tree with historical records",
        user_id: 2,
        document_type: "Genealogy",
        permissions: { is_secure: false, shared_with: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] }
      },
      {
        title: "Grandparents' Will and Estate Planning",
        content: "Legal documents regarding the Johnson grandparents' will",
        user_id: 1,
        document_type: "Legal",
        permissions: { is_secure: true, shared_with: [1, 2, 5, 7] }
      },
      {
        title: "Family Recipes Collection",
        content: "Traditional family recipes passed down through generations",
        user_id: 4,
        document_type: "Lifestyle",
        permissions: { is_secure: false, shared_with: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] }
      },
      {
        title: "College Savings Plan Documents",
        content: "Financial documents related to college savings",
        user_id: 5,
        document_type: "Financial",
        permissions: { is_secure: true, shared_with: [5, 6, 11, 12, 13] }
      }
    ];
    
    for (const document of sampleDocuments) {
      await db.insert(documents).values(document);
      console.log(`Added document: ${document.title}`);
    }
    
    // Seed sample help requests
    const sampleHelpRequests = [
      {
        title: "Help Moving Apartments",
        description: "Need help moving to a new apartment across town",
        requested_by: 12,
        date_needed: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15),
        status: "needs_volunteer",
        volunteers: []
      },
      {
        title: "Airport Pickup for Grandparents",
        description: "Need someone to pick up grandparents from airport",
        requested_by: 5,
        date_needed: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 10),
        status: "has_volunteers",
        volunteers: [11]
      },
      {
        title: "Babysitting for Noah and Emma",
        description: "Need someone to watch Noah and Emma",
        requested_by: 7,
        date_needed: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 5),
        status: "completed",
        volunteers: [13, 11]
      },
      {
        title: "Computer Setup Assistance",
        description: "Need help setting up new computer",
        requested_by: 2,
        date_needed: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 3),
        status: "has_volunteers",
        volunteers: [11, 12]
      },
      {
        title: "Garden Help for Spring Planting",
        description: "Looking for help preparing the garden",
        requested_by: 1,
        date_needed: new Date(new Date().getFullYear(), 3, 10),
        status: "has_volunteers",
        volunteers: [5, 16]
      }
    ];
    
    for (const helpRequest of sampleHelpRequests) {
      await db.insert(helpRequests).values(helpRequest);
      console.log(`Added help request: ${helpRequest.title}`);
    }
    
    // Seed sample messages
    const sampleMessages = [
      {
        sender_id: 5,
        receiver_id: 11,
        content: "Hi Ayisha, I wanted to coordinate with you about Grandma's surprise birthday party",
        is_read: true,
        sent_at: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        sender_id: 6,
        receiver_id: 11,
        content: "Ayisha, just a reminder that we're having family dinner this Sunday at 6pm",
        is_read: true,
        sent_at: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        sender_id: 11,
        receiver_id: 12,
        content: "Hey Lucas, would it be possible to borrow your DSLR camera for the hiking trip?",
        is_read: false,
        sent_at: new Date(new Date().getTime() - 36 * 60 * 60 * 1000) // 36 hours ago
      },
      {
        sender_id: 1,
        receiver_id: 11,
        content: "Ayisha, I found some old photos of your father when he was your age",
        is_read: false,
        sent_at: new Date(new Date().getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
      },
      {
        sender_id: 11,
        receiver_id: 7,
        content: "Hi Uncle David, I saw Lucas's request for help moving next month",
        is_read: true,
        sent_at: new Date(new Date().getTime() - 12 * 60 * 60 * 1000) // 12 hours ago
      },
      {
        sender_id: 9,
        receiver_id: 11,
        content: "Ayisha, Emma would be thrilled if you could come to her dance recital",
        is_read: false,
        sent_at: new Date(new Date().getTime() - 6 * 60 * 60 * 1000) // 6 hours ago
      },
      {
        sender_id: 11,
        receiver_id: 6,
        content: "Mom, could you send me your recipe for that amazing chicken soup?",
        is_read: true,
        sent_at: new Date(new Date().getTime() - 3 * 60 * 60 * 1000) // 3 hours ago
      },
      {
        sender_id: 6,
        receiver_id: 11,
        content: "Here's the recipe, honey. Feel better soon!",
        is_read: false,
        sent_at: new Date(new Date().getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
      }
    ];
    
    for (const message of sampleMessages) {
      await db.insert(messages).values(message);
      console.log(`Added message from ${message.sender_id} to ${message.receiver_id}`);
    }
    
    console.log("✅ Additional data seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding additional data:", error);
    console.error(error);
    process.exit(1);
  }
}

// Execute the seed function
seedAdditionalData().then(() => process.exit(0));