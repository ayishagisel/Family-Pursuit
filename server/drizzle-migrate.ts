import { db } from './db';
import { 
  users, familyMembers, relationships, events, 
  documents, helpRequests, messages 
} from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { migrate as runMigration } from 'drizzle-orm/node-postgres/migrator';

/**
 * Migrates database schema using Drizzle ORM directly
 */
async function migrate() {
  console.log('🔄 Starting database migration with Drizzle ORM...');
  
  try {
    // Test the connection
    await db.execute(sql`SELECT NOW()`);
    console.log('✅ PostgreSQL connection successful');
    
    // Only drop tables if explicitly told to do so with an environment variable
    const shouldDropTables = process.env.DROP_TABLES === 'true';
    
    if (shouldDropTables) {
      try {
        await db.execute(`
          DROP TABLE IF EXISTS messages CASCADE;
          DROP TABLE IF EXISTS help_requests CASCADE;
          DROP TABLE IF EXISTS documents CASCADE;
          DROP TABLE IF EXISTS events CASCADE;
          DROP TABLE IF EXISTS relationships CASCADE;
          DROP TABLE IF EXISTS family_members CASCADE;
          DROP TABLE IF EXISTS users CASCADE;
        `);
        console.log('✅ Old tables dropped successfully');
      } catch (error) {
        console.error('❌ Error dropping tables:', error);
        // Continue anyway as we'll try to create them
      }
    } else {
      console.log('ℹ️ Skipping table drop (set DROP_TABLES=true to drop tables)');
    }
    
    // Create tables based on schema definitions
    try {
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
      console.log('✅ Users table created successfully');
      
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
      console.log('✅ Family members table created successfully');
      
      await db.execute(`
        CREATE TABLE IF NOT EXISTS relationships (
          id SERIAL PRIMARY KEY,
          source_id INTEGER NOT NULL,
          target_id INTEGER NOT NULL,
          relationship_type TEXT NOT NULL
        );
      `);
      console.log('✅ Relationships table created successfully');
      
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
      console.log('✅ Events table created successfully');
      
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
      console.log('✅ Documents table created successfully');
      
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
      console.log('✅ Help requests table created successfully');
      
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
      console.log('✅ Messages table created successfully');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
    
    // Seed admin user if no users exist
    try {
      const usersExist = await db.select().from(users).limit(1);
      
      if (usersExist.length === 0) {
        // Import bcrypt for password hashing
        const bcrypt = await import('bcryptjs');
        
        // Hash the password
        const salt = await bcrypt.default.genSalt(10);
        const hashedPassword = await bcrypt.default.hash('admin123', salt);
        
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
    } catch (error) {
      console.error('❌ Failed to create admin user:', error);
      // Continue anyway as we can create the user later
    }

    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

// In ES modules, run migration if this file is executed directly
if (import.meta.url.startsWith('file:') && import.meta.url === `file://${process.argv[1]}`) {
  migrate().then(() => {
    console.log('Migration complete, exiting');
    process.exit(0);
  });
}

export { migrate };