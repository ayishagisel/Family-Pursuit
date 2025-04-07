import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Seed script to populate the database with sample extended family data
 * 
 * Usage: 
 * 1. Make sure database is created
 * 2. Run with: npx tsx scripts/seed-demo-family.ts
 */
async function seedDemoFamily() {
  console.log('🌱 Starting demo family data seeding...');
  
  try {
    // Start transaction
    await pool.query('BEGIN');

    // Create grandparents' generation (1st generation)
    const grandparents = [
      { name: "Robert Johnson", role: "Grandfather", relationship: "biological", birth_date: "1945-04-15", location: "Boston", bio: "Family patriarch who loves telling stories about his engineering days as a retired engineer." },
      { name: "Margaret Johnson", role: "Grandmother", relationship: "biological", birth_date: "1948-08-23", location: "Boston", bio: "Former elementary school teacher who makes the best apple pie." },
      { name: "Carlos Garcia", role: "Grandfather", relationship: "biological", birth_date: "1943-06-10", location: "Miami", bio: "Born in Puerto Rico, moved to the US in his 20s. Known for his incredible paella recipe from his chef days." },
      { name: "Elena Garcia", role: "Grandmother", relationship: "biological", birth_date: "1946-11-05", location: "Miami", bio: "Still creates beautiful paintings inspired by her Caribbean heritage as a lifelong artist." }
    ];

    for (const grandparent of grandparents) {
      // Check if member exists first
      const { rows } = await pool.query(
        `SELECT id FROM family_members WHERE name = $1`,
        [grandparent.name]
      );
      
      if (rows.length === 0) {
        await pool.query(
          `INSERT INTO family_members (name, role, relationship, birth_date, location, bio)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [grandparent.name, grandparent.role, grandparent.relationship, grandparent.birth_date, 
           grandparent.location, grandparent.bio]
        );
      }
    }
    
    console.log('✅ Created grandparents generation');

    // Create parents' generation (2nd generation)
    const parents = [
      { name: "Michael Johnson", role: "Father", relationship: "biological", birth_date: "1972-02-18", location: "New York", bio: "Works as a software engineer for a major tech company. Loves hiking and photography." },
      { name: "Sofia Johnson", role: "Mother", relationship: "biological", birth_date: "1975-07-12", location: "New York", bio: "Dedicated pediatrician who still finds time to coach her daughter's soccer team." },
      { name: "David Johnson", role: "Uncle", relationship: "biological", birth_date: "1970-09-05", location: "Chicago", bio: "High school history teacher who also coaches the debate team." },
      { name: "Emily Wilson", role: "Aunt", relationship: "step", birth_date: "1974-12-08", location: "Chicago", bio: "David's second wife and marketing director. Loves organizing family reunions." },
      { name: "Maria Garcia", role: "Aunt", relationship: "biological", birth_date: "1973-05-21", location: "San Francisco", bio: "Award-winning architect who designed the family's vacation home." },
      { name: "James Chen", role: "Uncle", relationship: "step", birth_date: "1970-11-15", location: "San Francisco", bio: "Maria's husband who runs a popular fusion restaurant." }
    ];

    for (const parent of parents) {
      // Check if member exists first
      const { rows } = await pool.query(
        `SELECT id FROM family_members WHERE name = $1`,
        [parent.name]
      );
      
      if (rows.length === 0) {
        await pool.query(
          `INSERT INTO family_members (name, role, relationship, birth_date, location, bio)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [parent.name, parent.role, parent.relationship, parent.birth_date, 
           parent.location, parent.bio]
        );
      }
    }
    
    console.log('✅ Created parents generation');

    // Create Ayisha's generation (3rd generation)
    const cousins = [
      // Keep existing Ayisha record if it exists
      { name: "Ayisha Oglivie", role: "Self", relationship: "biological", birth_date: "1995-03-25", location: "New York", bio: "Passionate about technology and building meaningful family connections. Works as a Product Manager." },
      { name: "Lucas Johnson", role: "Brother", relationship: "biological", birth_date: "1997-08-16", location: "Boston", bio: "Studying computer science and working on AI research as a graduate student." },
      { name: "Jessica Johnson", role: "Sister", relationship: "biological", birth_date: "2000-05-14", location: "New York", bio: "Studying psychology and playing on the university soccer team." },
      { name: "Daniel Johnson", role: "Cousin", relationship: "biological", birth_date: "1996-11-27", location: "Chicago", bio: "Professional musician touring with his band and working on their second album." },
      { name: "Sophia Wilson", role: "Step-Cousin", relationship: "step", birth_date: "2002-04-10", location: "Chicago", bio: "Emily's daughter from a previous relationship. Studies journalism in college." },
      { name: "Miguel Garcia", role: "Cousin", relationship: "biological", birth_date: "1994-09-02", location: "San Francisco", bio: "Doctor who recently completed medical residency, following in Sofia's footsteps." },
      { name: "Lily Chen", role: "Cousin", relationship: "adoptive", birth_date: "1998-01-30", location: "San Francisco", bio: "Adopted by Maria and James as a toddler. Currently a culinary student learning to run the family restaurant." }
    ];

    for (const cousin of cousins) {
      // Check if member exists first
      const { rows } = await pool.query(
        `SELECT id FROM family_members WHERE name = $1`,
        [cousin.name]
      );
      
      if (rows.length === 0) {
        await pool.query(
          `INSERT INTO family_members (name, role, relationship, birth_date, location, bio)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [cousin.name, cousin.role, cousin.relationship, cousin.birth_date, 
           cousin.location, cousin.bio]
        );
      }
    }
    
    console.log('✅ Created Ayisha\'s generation');

    // Create 4th generation (children/nieces/nephews)
    const children = [
      { name: "Emma Garcia", role: "Niece", relationship: "biological", birth_date: "2018-07-05", location: "San Francisco", bio: "Miguel's daughter who attends elementary school. Loves drawing and playing soccer." },
      { name: "Noah Johnson", role: "Nephew", relationship: "biological", birth_date: "2020-02-15", location: "Chicago", bio: "Daniel's son who attends preschool. Curious about everything and loves dinosaurs." },
      { name: "Olivia Wilson", role: "Step-Niece", relationship: "step", birth_date: "2016-10-12", location: "Chicago", bio: "Sophia's half-sister from Emily's current marriage. In elementary school and loves ballet." }
    ];

    for (const child of children) {
      // Check if member exists first
      const { rows } = await pool.query(
        `SELECT id FROM family_members WHERE name = $1`,
        [child.name]
      );
      
      if (rows.length === 0) {
        await pool.query(
          `INSERT INTO family_members (name, role, relationship, birth_date, location, bio)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [child.name, child.role, child.relationship, child.birth_date, 
           child.location, child.bio]
        );
      }
    }
    
    console.log('✅ Created 4th generation');

    // Retrieve all family members from DB to create relationships
    const { rows: familyMembers } = await pool.query('SELECT id, name, role FROM family_members');
    
    // Create a map for easier reference
    const memberMap = {};
    familyMembers.forEach(member => {
      memberMap[member.name] = member.id;
    });

    // Define relationships with actual member IDs
    const relationships = [
      // Grandparents marriages
      { source: "Robert Johnson", target: "Margaret Johnson", type: "spouse" },
      { source: "Carlos Garcia", target: "Elena Garcia", type: "spouse" },
      
      // Parent generation marriages
      { source: "Michael Johnson", target: "Sofia Johnson", type: "spouse" },
      { source: "David Johnson", target: "Emily Wilson", type: "spouse" },
      { source: "Maria Garcia", target: "James Chen", type: "spouse" },
      
      // Grandparents to parents
      { source: "Robert Johnson", target: "Michael Johnson", type: "parent" },
      { source: "Margaret Johnson", target: "Michael Johnson", type: "parent" },
      { source: "Robert Johnson", target: "David Johnson", type: "parent" },
      { source: "Margaret Johnson", target: "David Johnson", type: "parent" },
      { source: "Carlos Garcia", target: "Maria Garcia", type: "parent" },
      { source: "Elena Garcia", target: "Maria Garcia", type: "parent" },
      { source: "Carlos Garcia", target: "Sofia Johnson", type: "parent" },
      { source: "Elena Garcia", target: "Sofia Johnson", type: "parent" },
      
      // Parents to Ayisha's generation
      { source: "Michael Johnson", target: "Ayisha Oglivie", type: "parent" },
      { source: "Sofia Johnson", target: "Ayisha Oglivie", type: "parent" },
      { source: "Michael Johnson", target: "Lucas Johnson", type: "parent" },
      { source: "Sofia Johnson", target: "Lucas Johnson", type: "parent" },
      { source: "Michael Johnson", target: "Jessica Johnson", type: "parent" },
      { source: "Sofia Johnson", target: "Jessica Johnson", type: "parent" },
      { source: "David Johnson", target: "Daniel Johnson", type: "parent" },
      { source: "Emily Wilson", target: "Sophia Wilson", type: "parent" },
      { source: "Maria Garcia", target: "Miguel Garcia", type: "parent" },
      { source: "James Chen", target: "Miguel Garcia", type: "step-parent" },
      { source: "Maria Garcia", target: "Lily Chen", type: "adoptive-parent" },
      { source: "James Chen", target: "Lily Chen", type: "adoptive-parent" },
      
      // Ayisha's generation to 4th generation
      { source: "Miguel Garcia", target: "Emma Garcia", type: "parent" },
      { source: "Daniel Johnson", target: "Noah Johnson", type: "parent" },
      { source: "Emily Wilson", target: "Olivia Wilson", type: "parent" },
      
      // Sibling relationships
      { source: "Ayisha Oglivie", target: "Lucas Johnson", type: "sibling" },
      { source: "Ayisha Oglivie", target: "Jessica Johnson", type: "sibling" },
      { source: "Lucas Johnson", target: "Jessica Johnson", type: "sibling" },
      { source: "Michael Johnson", target: "David Johnson", type: "sibling" },
      { source: "Sofia Johnson", target: "Maria Garcia", type: "sibling" },
      
      // Cousin relationships
      { source: "Ayisha Oglivie", target: "Daniel Johnson", type: "cousin" },
      { source: "Ayisha Oglivie", target: "Sophia Wilson", type: "step-cousin" },
      { source: "Ayisha Oglivie", target: "Miguel Garcia", type: "cousin" },
      { source: "Ayisha Oglivie", target: "Lily Chen", type: "cousin" },
      { source: "Lucas Johnson", target: "Daniel Johnson", type: "cousin" },
      { source: "Lucas Johnson", target: "Miguel Garcia", type: "cousin" },
      { source: "Jessica Johnson", target: "Daniel Johnson", type: "cousin" },
      { source: "Jessica Johnson", target: "Miguel Garcia", type: "cousin" },
      
      // Uncle/Aunt relationships
      { source: "David Johnson", target: "Ayisha Oglivie", type: "uncle" },
      { source: "Emily Wilson", target: "Ayisha Oglivie", type: "aunt" },
      { source: "Maria Garcia", target: "Ayisha Oglivie", type: "aunt" },
      { source: "James Chen", target: "Ayisha Oglivie", type: "uncle" },
      
      // Niece/Nephew relationships
      { source: "Ayisha Oglivie", target: "Emma Garcia", type: "aunt" },
      { source: "Ayisha Oglivie", target: "Noah Johnson", type: "aunt" },
      { source: "Ayisha Oglivie", target: "Olivia Wilson", type: "aunt" },
      { source: "Lucas Johnson", target: "Emma Garcia", type: "uncle" },
      { source: "Lucas Johnson", target: "Noah Johnson", type: "uncle" },
      { source: "Jessica Johnson", target: "Emma Garcia", type: "aunt" },
      { source: "Jessica Johnson", target: "Noah Johnson", type: "aunt" },
    ];

    // Create relationships in the database
    for (const rel of relationships) {
      const sourceId = memberMap[rel.source];
      const targetId = memberMap[rel.target];
      
      if (!sourceId || !targetId) {
        console.warn(`Skipping relationship between ${rel.source} and ${rel.target} - member not found`);
        continue;
      }
      
      // Check if relationship exists first
      const { rows: existingRelationship } = await pool.query(
        `SELECT id FROM relationships WHERE source_id = $1 AND target_id = $2`,
        [sourceId, targetId]
      );
      
      if (existingRelationship.length === 0) {
        await pool.query(
          `INSERT INTO relationships (source_id, target_id, relationship_type, relation_category)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [sourceId, targetId, rel.type, determineRelationCategory(rel.type)]
        );
      } else {
        await pool.query(
          `UPDATE relationships
           SET relationship_type = $3, relation_category = $4
           WHERE source_id = $1 AND target_id = $2`,
          [sourceId, targetId, rel.type, determineRelationCategory(rel.type)]
        );
      }
    }
    
    console.log('✅ Created family relationships');

    // Commit transaction
    await pool.query('COMMIT');
    console.log('✅ Demo family data seeded successfully!');
    
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    console.error('❌ Error seeding demo family data:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Helper function to determine relationship category based on type
function determineRelationCategory(relationType: string): string {
  const immediate = ['parent', 'child', 'sibling', 'spouse'];
  const extended = ['uncle', 'aunt', 'cousin', 'nephew', 'niece', 'grandparent', 'grandchild'];
  const inLaw = ['father-in-law', 'mother-in-law', 'brother-in-law', 'sister-in-law'];
  const step = ['step-parent', 'step-child', 'step-sibling', 'step-cousin'];
  const adoptive = ['adoptive-parent', 'adoptive-child'];

  if (immediate.includes(relationType)) return 'immediate';
  if (extended.includes(relationType)) return 'extended';
  if (inLaw.includes(relationType)) return 'in-law';
  if (step.includes(relationType)) return 'step';
  if (adoptive.includes(relationType)) return 'adoptive';
  
  return 'other';
}

// Execute the seed function
seedDemoFamily().catch(err => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});