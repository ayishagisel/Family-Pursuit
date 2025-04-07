import { db } from './db';
import { 
  users, familyMembers, relationships, events, 
  documents, helpRequests, messages 
} from '@shared/schema';

/**
 * Migrates database schema by creating tables if they don't exist
 */
async function migrate() {
  console.log('🔄 Starting database migration...');
  
  try {
    // Create tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'member',
        avatar_url TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login_date TIMESTAMP,
        invitation_status TEXT DEFAULT 'claimed'
      );
    `);
    console.log('✅ Users table created or already exists');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS family_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        relationship TEXT NOT NULL,
        avatar_url TEXT,
        birth_date TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      );
    `);
    console.log('✅ Family members table created or already exists');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS relationships (
        id SERIAL PRIMARY KEY,
        source_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        relationship_type TEXT NOT NULL
      );
    `);
    console.log('✅ Relationships table created or already exists');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        location TEXT,
        user_id INTEGER NOT NULL,
        attendees JSONB NOT NULL DEFAULT '[]',
        event_type TEXT NOT NULL
      );
    `);
    console.log('✅ Events table created or already exists');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        permissions JSONB DEFAULT '{}',
        document_type TEXT NOT NULL DEFAULT 'generic'
      );
    `);
    console.log('✅ Documents table created or already exists');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS help_requests (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        requested_by INTEGER NOT NULL,
        date_needed TIMESTAMP NOT NULL,
        status TEXT NOT NULL DEFAULT 'needs_volunteer',
        volunteers JSONB NOT NULL DEFAULT '[]'
      );
    `);
    console.log('✅ Help requests table created or already exists');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER,
        is_group_message BOOLEAN NOT NULL DEFAULT false,
        group_id INTEGER,
        sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_read BOOLEAN NOT NULL DEFAULT false
      );
    `);
    console.log('✅ Messages table created or already exists');

    // Seed admin user if no users exist
    const usersExist = await db.select().from(users).limit(1);
    if (usersExist.length === 0) {
      // Import the hashing function from authService
      const { hashPassword } = await import('./services/authService');
      
      // Hash the password for secure storage
      const hashedPassword = await hashPassword('password123');
      
      const adminUser = {
        username: "admin",
        password: hashedPassword,
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        status: "active",
        is_active: true,
        avatarUrl: null,
        invitation_status: "claimed"
      };
      
      await db.insert(users).values(adminUser);
      console.log('✅ Admin user created with hashed password');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

// In ES modules, run migration if this file is executed directly
// We can check this by comparing import.meta.url against process.argv[1]
if (import.meta.url.startsWith('file:') && import.meta.url === `file://${process.argv[1]}`) {
  migrate().then(() => {
    console.log('Migration complete, exiting');
    process.exit(0);
  });
}

export { migrate };