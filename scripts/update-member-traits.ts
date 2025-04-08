import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Script to update existing family members with personality traits and interests
 * 
 * Usage: 
 * Run with: npx tsx scripts/update-member-traits.ts
 */
async function updateMemberTraits() {
  console.log('🔄 Updating family members with personality traits and interests...');
  
  try {
    // Start transaction
    await pool.query('BEGIN');

    // Fetch all existing family members
    const { rows: members } = await pool.query('SELECT id, name, role FROM family_members');
    
    // Define personality traits and interests based on roles
    const traitsAndInterestsByRole = {
      // Grandparents generation
      "Grandfather": {
        traits: ["wise", "patient", "traditional", "humorous", "nurturing"],
        interests: ["gardening", "reading", "storytelling", "woodworking", "history"],
        occupation: "Retired"
      },
      "Grandmother": {
        traits: ["caring", "organized", "thoughtful", "creative", "sociable"],
        interests: ["cooking", "knitting", "reading", "gardening", "family history"],
        occupation: "Retired"
      },
      // Parents generation
      "Father": {
        traits: ["responsible", "analytical", "supportive", "practical", "hard-working"],
        interests: ["technology", "photography", "hiking", "cooking", "travel"],
        occupation: "Software Engineer"
      },
      "Mother": {
        traits: ["compassionate", "determined", "balanced", "nurturing", "insightful"],
        interests: ["medicine", "sports", "volunteering", "reading", "coaching"],
        occupation: "Pediatrician"
      },
      "Uncle": {
        traits: ["friendly", "knowledgeable", "engaged", "passionate", "motivating"],
        interests: ["history", "teaching", "debate", "cooking", "travel"],
        occupation: "History Teacher"
      },
      "Aunt": {
        traits: ["creative", "organized", "detail-oriented", "outgoing", "ambitious"],
        interests: ["architecture", "design", "event planning", "arts", "community service"],
        occupation: "Marketing Director"
      },
      // Cousins generation
      "Self": {
        traits: ["innovative", "empathetic", "tech-savvy", "collaborative", "determined"],
        interests: ["technology", "family connections", "product design", "hiking", "reading"],
        occupation: "Product Manager"
      },
      "Brother": {
        traits: ["analytical", "intelligent", "curious", "ambitious", "methodical"],
        interests: ["computer science", "AI", "research", "video games", "reading"],
        occupation: "Graduate Student"
      },
      "Sister": {
        traits: ["athletic", "compassionate", "social", "determined", "thoughtful"],
        interests: ["psychology", "soccer", "hiking", "volunteering", "music"],
        occupation: "Student"
      },
      "Cousin": {
        traits: ["creative", "passionate", "adventurous", "friendly", "independent"],
        interests: ["music", "travel", "photography", "cooking", "sports"],
        occupation: "Musician"
      },
      "Step-Cousin": {
        traits: ["inquisitive", "thoughtful", "articulate", "social", "observant"],
        interests: ["journalism", "politics", "writing", "debate", "photography"],
        occupation: "Student"
      },
      // Children's generation
      "Niece": {
        traits: ["curious", "creative", "energetic", "kind", "playful"],
        interests: ["drawing", "soccer", "reading", "animals", "music"],
        occupation: "Student"
      },
      "Nephew": {
        traits: ["curious", "adventurous", "imaginative", "energetic", "affectionate"],
        interests: ["dinosaurs", "nature", "building blocks", "animals", "storytelling"],
        occupation: "Student"
      },
      "Step-Niece": {
        traits: ["graceful", "artistic", "focused", "friendly", "expressive"],
        interests: ["ballet", "drawing", "reading", "swimming", "music"],
        occupation: "Student"
      }
    };

    // Default traits and interests for unknown roles
    const defaultTraitsAndInterests = {
      traits: ["friendly", "thoughtful", "caring", "reliable", "adaptable"],
      interests: ["reading", "cooking", "music", "travel", "family gatherings"],
      occupation: "Professional"
    };

    // Update each family member with appropriate traits and interests
    for (const member of members) {
      const roleTraits = traitsAndInterestsByRole[member.role] || defaultTraitsAndInterests;
      
      // Get a selection of traits and interests (potentially customizing for each person)
      const traits = roleTraits.traits;
      const interests = roleTraits.interests;
      const occupation = roleTraits.occupation;
      
      // Update the family member with traits and interests
      await pool.query(
        `UPDATE family_members 
         SET personality_traits = $1, interests = $2, occupation = $3
         WHERE id = $4`,
        [traits, interests, occupation, member.id]
      );
      
      console.log(`Updated traits and interests for ${member.name} (${member.role})`);
    }

    // Commit the transaction
    await pool.query('COMMIT');
    console.log('✅ Successfully updated all family members with personality traits and interests!');
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    console.error('❌ Error updating family members:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Execute the function if this script is run directly
// For ES modules, check if this is the main file executed
if (import.meta.url.startsWith('file:') && import.meta.url === `file://${process.argv[1]}`) {
  updateMemberTraits();
}

export default updateMemberTraits;