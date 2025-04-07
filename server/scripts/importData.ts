import path from 'path';
import fs from 'fs';
import { 
  importUsers,
  importFamilyMembers,
  importRelationships,
  importEvents,
  importDocuments,
  importHelpRequests,
  importMessages
} from './csvImporter';

// Define the data directory
const DATA_DIR = path.resolve(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created data directory at ${DATA_DIR}`);
}

/**
 * Main function to import all CSV data
 */
async function importAllData(): Promise<void> {
  console.log('Starting CSV data import...');
  
  try {
    // Import users
    const usersPath = path.join(DATA_DIR, 'users.csv');
    if (fs.existsSync(usersPath)) {
      const userCount = await importUsers(usersPath);
      console.log(`✅ Imported ${userCount} users`);
    } else {
      console.log(`⚠️ Users CSV file not found at ${usersPath}`);
    }
    
    // Import family members
    const familyMembersPath = path.join(DATA_DIR, 'family_members.csv');
    if (fs.existsSync(familyMembersPath)) {
      const memberCount = await importFamilyMembers(familyMembersPath);
      console.log(`✅ Imported ${memberCount} family members`);
    } else {
      console.log(`⚠️ Family members CSV file not found at ${familyMembersPath}`);
    }
    
    // Import relationships
    const relationshipsPath = path.join(DATA_DIR, 'relationships.csv');
    if (fs.existsSync(relationshipsPath)) {
      const relationshipCount = await importRelationships(relationshipsPath);
      console.log(`✅ Imported ${relationshipCount} relationships`);
    } else {
      console.log(`⚠️ Relationships CSV file not found at ${relationshipsPath}`);
    }
    
    // Import events
    const eventsPath = path.join(DATA_DIR, 'events.csv');
    if (fs.existsSync(eventsPath)) {
      const eventCount = await importEvents(eventsPath);
      console.log(`✅ Imported ${eventCount} events`);
    } else {
      console.log(`⚠️ Events CSV file not found at ${eventsPath}`);
    }
    
    // Import documents
    const documentsPath = path.join(DATA_DIR, 'documents.csv');
    if (fs.existsSync(documentsPath)) {
      const documentCount = await importDocuments(documentsPath);
      console.log(`✅ Imported ${documentCount} documents`);
    } else {
      console.log(`⚠️ Documents CSV file not found at ${documentsPath}`);
    }
    
    // Import help requests
    const helpRequestsPath = path.join(DATA_DIR, 'help_requests.csv');
    if (fs.existsSync(helpRequestsPath)) {
      const helpRequestCount = await importHelpRequests(helpRequestsPath);
      console.log(`✅ Imported ${helpRequestCount} help requests`);
    } else {
      console.log(`⚠️ Help requests CSV file not found at ${helpRequestsPath}`);
    }
    
    // Import messages
    const messagesPath = path.join(DATA_DIR, 'messages.csv');
    if (fs.existsSync(messagesPath)) {
      const messageCount = await importMessages(messagesPath);
      console.log(`✅ Imported ${messageCount} messages`);
    } else {
      console.log(`⚠️ Messages CSV file not found at ${messagesPath}`);
    }
    
    console.log('✅ CSV data import completed successfully');
  } catch (error) {
    console.error('❌ Error importing CSV data:', error);
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importAllData()
    .then(() => {
      console.log('Import process finished.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Import process failed:', error);
      process.exit(1);
    });
} else {
  // Export for use in other files
  export { importAllData };
}