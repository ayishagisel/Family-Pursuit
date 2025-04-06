import { db } from '../server/db';
import { 
  users, familyMembers, relationships, events, 
  documents, helpRequests, messages 
} from '../shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Seeds the database with sample data
 */
async function seedDatabase() {
  console.log('🔄 Starting database seeding...');
  
  try {
    // Test the connection
    await db.execute(sql`SELECT NOW()`);
    console.log('✅ PostgreSQL connection successful');
    
    // Add family members
    console.log('Adding family members...');
    const familyMembersData = [
      {
        name: "John Smith",
        role: "Grandfather",
        relationship: "biological",
        avatar_url: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=100&h=100&fit=crop&crop=faces"
      },
      {
        name: "Robert Smith",
        role: "Father",
        relationship: "biological",
        avatar_url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=faces"
      },
      {
        name: "Linda Smith",
        role: "Aunt",
        relationship: "biological",
        avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces"
      },
      {
        name: "Michael Johnson",
        role: "Adopted Son",
        relationship: "adoptive",
        avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces"
      },
      {
        name: "Emily Smith",
        role: "Sister",
        relationship: "biological",
        avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces"
      },
      {
        name: "James Wilson",
        role: "Step-Brother",
        relationship: "step",
        avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=faces"
      },
      {
        name: "Sarah Johnson",
        role: "You",
        relationship: "biological",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
      },
      {
        name: "David Lee",
        role: "Cousin",
        relationship: "adoptive",
        avatar_url: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=100&h=100&fit=crop&crop=faces"
      },
      {
        name: "Jessica Lee",
        role: "Cousin",
        relationship: "adoptive",
        avatar_url: "https://images.unsplash.com/photo-1491349174775-aaafddd81942?w=100&h=100&fit=crop&crop=faces"
      }
    ];

    const insertedMembers = await db.insert(familyMembers).values(familyMembersData).returning();
    console.log(`✅ Added ${insertedMembers.length} family members`);
    
    // Add relationships between family members
    console.log('Adding relationships...');
    const relationshipsData = [
      { source_id: 1, target_id: 2, relationship_type: "biological" },
      { source_id: 1, target_id: 3, relationship_type: "biological" },
      { source_id: 1, target_id: 4, relationship_type: "adoptive" },
      { source_id: 2, target_id: 5, relationship_type: "biological" },
      { source_id: 2, target_id: 6, relationship_type: "step" },
      { source_id: 3, target_id: 7, relationship_type: "biological" },
      { source_id: 4, target_id: 8, relationship_type: "adoptive" },
      { source_id: 4, target_id: 9, relationship_type: "adoptive" }
    ];
    
    const insertedRelationships = await db.insert(relationships).values(relationshipsData).returning();
    console.log(`✅ Added ${insertedRelationships.length} relationships`);
    
    // Add events
    console.log('Adding events...');
    const now = new Date();
    const eventsData = [
      {
        title: "Mom's Birthday",
        description: "Birthday celebration for mom",
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 13),
        location: "Home",
        user_id: 1,
        attendees: JSON.stringify([1, 2, 3, 7]),
        eventType: "birthday"
      },
      {
        title: "Family Reunion",
        description: "Annual family gathering",
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 16),
        location: "Community Center",
        user_id: 1,
        attendees: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9]),
        eventType: "reunion"
      },
      {
        title: "James' Graduation",
        description: "High school graduation ceremony",
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21),
        location: "High School Auditorium",
        user_id: 6,
        attendees: JSON.stringify([1, 2, 6, 7, 8]),
        eventType: "graduation"
      }
    ];
    
    const insertedEvents = await db.insert(events).values(eventsData).returning();
    console.log(`✅ Added ${insertedEvents.length} events`);
    
    // Add documents
    console.log('Adding documents...');
    const documentsData = [
      {
        title: "Family Reunion Plans",
        content: "Details about the upcoming family reunion",
        user_id: 1,
        permissions: JSON.stringify({ access: "all" }),
        documentType: "pdf"
      },
      {
        title: "Vacation Photos",
        content: "Links to the shared vacation photo album",
        user_id: 3,
        permissions: JSON.stringify({ access: "all" }),
        documentType: "zip"
      },
      {
        title: "Trust Fund Details",
        content: "Legal information about the family trust",
        user_id: 1,
        permissions: JSON.stringify({ access: "limited", members: [1, 2, 3] }),
        documentType: "contract"
      },
      {
        title: "Will and Testament",
        content: "Legal document outlining inheritance",
        user_id: 1,
        permissions: JSON.stringify({ access: "admin" }),
        documentType: "legal"
      },
      {
        title: "Health Proxy Documents",
        content: "Medical proxy paperwork for Grandpa",
        user_id: 1,
        permissions: JSON.stringify({ access: "limited", members: [1, 2] }),
        documentType: "medical"
      }
    ];
    
    const insertedDocuments = await db.insert(documents).values(documentsData).returning();
    console.log(`✅ Added ${insertedDocuments.length} documents`);
    
    // Add help requests
    console.log('Adding help requests...');
    const helpRequestsData = [
      {
        title: "School Pickup - Tuesday",
        description: "Need someone to pick up Emily from school on Tuesday at 3:30 PM.",
        requestedBy: 5,
        dateNeeded: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
        status: "needs_volunteer",
        volunteers: JSON.stringify([])
      },
      {
        title: "Help with Meal Prep",
        description: "Looking for help preparing meals for Grandpa this weekend. Need about 2 hours on Saturday.",
        requestedBy: 4,
        dateNeeded: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4),
        status: "has_volunteers",
        volunteers: JSON.stringify([9])
      },
      {
        title: "Dog Sitting",
        description: "Need someone to watch Max while we're away for the weekend (Sep 9-10).",
        requestedBy: 3,
        dateNeeded: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
        status: "completed",
        volunteers: JSON.stringify([7])
      }
    ];
    
    const insertedHelpRequests = await db.insert(helpRequests).values(helpRequestsData).returning();
    console.log(`✅ Added ${insertedHelpRequests.length} help requests`);
    
    // Add messages
    console.log('Adding messages...');
    const messagesData = [
      {
        content: "Hi Mom, just checking in. How are you doing?",
        senderId: 7,
        receiverId: 3,
        isGroupMessage: false,
        sentAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
        isRead: true
      },
      {
        content: "I'm doing well, thanks for asking! Looking forward to seeing you at the reunion.",
        senderId: 3,
        receiverId: 7,
        isGroupMessage: false,
        sentAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 2),
        isRead: true
      },
      {
        content: "Can everyone please submit their food preferences for the reunion?",
        senderId: 1,
        isGroupMessage: true,
        groupId: 1,
        sentAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        isRead: false
      },
      {
        content: "Dad, do you need help preparing for the reunion?",
        senderId: 2,
        receiverId: 1,
        isGroupMessage: false,
        sentAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 4),
        isRead: false
      }
    ];
    
    const insertedMessages = await db.insert(messages).values(messagesData).returning();
    console.log(`✅ Added ${insertedMessages.length} messages`);

    console.log('✅ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();