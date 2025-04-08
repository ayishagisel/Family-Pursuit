import { db } from "../server/db";
import { relationships } from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Migration script to ensure all required relationship types are supported
 * and to document the supported relationship types in the database.
 * 
 * Usage: npx tsx scripts/update-relationship-types.ts
 */
async function updateRelationshipTypes() {
  try {
    console.log("Starting relationship types update...");
    
    // 1. Get existing relationship types
    const existingTypes = await db.execute(sql`
      SELECT DISTINCT relationship_type, relation_category FROM relationships
    `);
    
    console.log("Current relationship types in the database:");
    existingTypes.rows.forEach((row: any) => {
      console.log(`- ${row.relationship_type} (${row.relation_category})`);
    });
    
    // 2. Define all supported relationship types
    const supportedTypes = [
      // Main types
      { type: "parent", category: "immediate" },
      { type: "child", category: "immediate" },
      { type: "spouse", category: "immediate" },
      { type: "sibling", category: "immediate" },
      { type: "guardian", category: "immediate" },
      
      // Extended family
      { type: "grandparent", category: "extended" },
      { type: "grandchild", category: "extended" },
      { type: "aunt", category: "extended" },
      { type: "uncle", category: "extended" },
      { type: "cousin", category: "extended" },
      { type: "niece", category: "extended" },
      { type: "nephew", category: "extended" },
      
      // Non-traditional types
      { type: "adoptive-parent", category: "adoptive" },
      { type: "adoptive-child", category: "adoptive" },
      { type: "step-parent", category: "step" },
      { type: "step-child", category: "step" },
      { type: "step-sibling", category: "step" },
      { type: "half-sibling", category: "half" },
      { type: "step-cousin", category: "step" },
      
      // Other relationships
      { type: "godparent", category: "other" },
      { type: "godchild", category: "other" },
      { type: "in-law", category: "other" },
      { type: "family-friend", category: "other" },
    ];
    
    // 3. Create a table to document supported relationship types (if it doesn't exist)
    const checkTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'relationship_type_metadata'
      );
    `);
    
    if (!checkTableExists.rows[0].exists) {
      console.log("Creating relationship_type_metadata table...");
      
      await db.execute(sql`
        CREATE TABLE relationship_type_metadata (
          relationship_type TEXT PRIMARY KEY,
          relation_category TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log("✅ relationship_type_metadata table created");
      
      // Insert supported types
      for (const { type, category } of supportedTypes) {
        await db.execute(sql`
          INSERT INTO relationship_type_metadata (relationship_type, relation_category)
          VALUES (${type}, ${category})
          ON CONFLICT (relationship_type) DO NOTHING
        `);
      }
      
      console.log(`✅ ${supportedTypes.length} relationship types documented in metadata table`);
    } else {
      console.log("relationship_type_metadata table already exists");
      
      // Update metadata table with any missing types
      for (const { type, category } of supportedTypes) {
        await db.execute(sql`
          INSERT INTO relationship_type_metadata (relationship_type, relation_category)
          VALUES (${type}, ${category})
          ON CONFLICT (relationship_type) DO NOTHING
        `);
      }
      
      console.log("✅ relationship_type_metadata table updated with supported types");
    }

    // 4. Generate inverse relationships if they don't exist
    const allRelationships = await db.select().from(relationships);
    console.log(`Found ${allRelationships.length} relationships to process`);
    
    let addedInverseCount = 0;
    for (const rel of allRelationships) {
      // Check if inverse relationship exists
      const inverseRel = allRelationships.find(
        r => r.source_id === rel.target_id && r.target_id === rel.source_id
      );

      // Skip if inverse already exists
      if (inverseRel) {
        continue;
      }

      // Determine the inverse relationship type
      let inverseType = '';
      
      switch (rel.relationship_type) {
        case 'parent':
          inverseType = 'child';
          break;
        case 'child':
          inverseType = 'parent';
          break;
        case 'grandparent':
          inverseType = 'grandchild';
          break;
        case 'grandchild':
          inverseType = 'grandparent';
          break;
        case 'aunt':
          inverseType = 'niece';
          break;
        case 'uncle':
          inverseType = 'nephew';
          break;
        case 'niece':
        case 'nephew':
          inverseType = rel.source_id % 2 === 0 ? 'aunt' : 'uncle'; // Simplistic logic
          break;
        case 'adoptive-parent':
          inverseType = 'adoptive-child';
          break;
        case 'adoptive-child':
          inverseType = 'adoptive-parent';
          break;
        case 'step-parent':
          inverseType = 'step-child';
          break;
        case 'step-child':
          inverseType = 'step-parent';
          break;
        case 'guardian':
          inverseType = 'ward';
          break;
        case 'ward':
          inverseType = 'guardian';
          break;
        case 'godparent':
          inverseType = 'godchild';
          break;
        case 'godchild':
          inverseType = 'godparent';
          break;
        // These relationships are reciprocal (same in both directions)
        case 'spouse':
        case 'sibling':
        case 'cousin':
        case 'step-sibling':
        case 'half-sibling':
        case 'step-cousin':
        case 'in-law':
        case 'family-friend':
          inverseType = rel.relationship_type;
          break;
        default:
          continue; // Skip if we can't determine the inverse
      }

      // Only add inverse if we have determined a valid inverse type
      if (inverseType) {
        // Add the inverse relationship
        await db.insert(relationships).values({
          source_id: rel.target_id,
          target_id: rel.source_id,
          relationship_type: inverseType,
          relation_category: rel.relation_category
        });
        
        addedInverseCount++;
      }
    }
    
    console.log(`✅ Added ${addedInverseCount} inverse relationships`);
    console.log("Update completed successfully!");
    
  } catch (error) {
    console.error("❌ Update failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run update
updateRelationshipTypes();