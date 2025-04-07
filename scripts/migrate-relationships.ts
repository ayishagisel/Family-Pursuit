import { db } from "../server/db";
import { relationships } from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Migration script to update relationships table with new relation_category column
 * and populate it with appropriate values.
 * 
 * Usage: npx tsx scripts/migrate-relationships.ts
 */
async function migrateRelationships() {
  try {
    console.log("Starting relationships table migration...");
    
    // 1. Check if relation_category column exists
    const checkColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'relationships' 
      AND column_name = 'relation_category'
    `);
    
    // 2. Add relation_category column if it doesn't exist
    if (checkColumnExists.rows.length === 0) {
      console.log("Adding relation_category column to relationships table...");
      await db.execute(sql`
        ALTER TABLE relationships 
        ADD COLUMN relation_category TEXT DEFAULT 'biological'
      `);
      console.log("✅ relation_category column added successfully");
    } else {
      console.log("📝 relation_category column already exists");
    }
    
    // 3. Get all existing relationships
    const allRelationships = await db.select().from(relationships);
    console.log(`Found ${allRelationships.length} relationships to process`);
    
    // 4. Map relationship_type values to more specific types if needed
    let updatedCount = 0;
    
    for (const rel of allRelationships) {
      let newRelType = rel.relationship_type;
      let relationCategory = rel.relation_category || "biological";
      
      // If relationship_type is one of the older generic types, update it to a more specific type
      // while preserving the original value in relation_category
      if (rel.relationship_type === "biological" || rel.relationship_type === "adoptive" || rel.relationship_type === "step") {
        relationCategory = rel.relationship_type;
        
        // Determine a more specific relationship_type based on existing data
        // This is a simplified example - you may need more complex logic based on your data
        newRelType = "parent"; // Default to parent for simplicity
      }
      
      // Only update if something changed
      if (newRelType !== rel.relationship_type || relationCategory !== rel.relation_category) {
        await db
          .update(relationships)
          .set({ 
            relationship_type: newRelType,
            relation_category: relationCategory 
          })
          .where(sql`id = ${rel.id}`);
        
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} relationships with new types and categories`);
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run migration
migrateRelationships();