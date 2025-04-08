import { db } from '../server/db';
import { familyMembers, relationships } from '../shared/schema';
import * as fs from 'fs';
import csvParser from 'csv-parser';
import { eq } from 'drizzle-orm';

/**
 * Import corrected family data from CSV files
 * 
 * This script:
 * 1. Clears existing data from the tables
 * 2. Imports corrected family members
 * 3. Imports corrected relationships
 * 4. Validates the imported data
 */
async function importCorrectedData() {
  console.log('Starting import of corrected family data...');
  
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await db.delete(relationships);
    await db.delete(familyMembers);
    console.log('Data cleared successfully.');
    
    // Import family members
    console.log('Importing family members...');
    const familyMembersData = await parseCsv('./data/corrected_family_members.csv');
    
    for (const member of familyMembersData) {
      // Convert string representations of arrays to actual arrays
      const personalityTraits = member.personality_traits 
        ? member.personality_traits.split(',') 
        : [];
      
      const interests = member.interests 
        ? member.interests.split(',') 
        : [];
      
      // Prepare member data
      const memberData = {
        id: parseInt(member.id),
        name: member.name,
        role: member.role,
        relationship: member.relationship,
        birth_date: member.birth_date ? new Date(member.birth_date) : null,
        location: member.location || null,
        bio: member.bio || null,
        personality_traits: personalityTraits,
        interests: interests,
        occupation: member.occupation || null,
        user_id: member.user_id ? parseInt(member.user_id) : null,
        avatarUrl: member.avatar_url || null,
        metadata: member.metadata ? JSON.parse(member.metadata) : {},
      };
      
      // Insert the family member
      await db.insert(familyMembers).values(memberData);
      console.log(`Imported family member: ${member.name} (ID: ${member.id})`);
    }
    
    // Import relationships
    console.log('Importing relationships...');
    const relationshipsData = await parseCsv('./data/corrected_relationships.csv');
    
    for (const relation of relationshipsData) {
      const relationData = {
        id: parseInt(relation.id),
        source_id: parseInt(relation.source_id),
        target_id: parseInt(relation.target_id),
        relationship_type: relation.relationship_type,
        relation_category: relation.relation_category || 'immediate',
        notes: relation.notes || null,
      };
      
      await db.insert(relationships).values(relationData);
      console.log(`Imported relationship: ${relation.id} (${relation.relationship_type})`);
    }
    
    // Validate data
    console.log('Validating imported data...');
    const memberCount = await db.select().from(familyMembers);
    const relationshipCount = await db.select().from(relationships);
    
    console.log(`Validation complete: Imported ${memberCount.length} family members and ${relationshipCount.length} relationships.`);
    console.log('Import completed successfully!');
    
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

/**
 * Parse a CSV file into an array of objects
 */
function parseCsv(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Run the import
importCorrectedData();