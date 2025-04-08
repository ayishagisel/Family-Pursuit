/**
 * Script to update existing family members with personality traits and interests
 * 
 * Usage: 
 * Run with: npx tsx scripts/update-member-traits.ts
 */
import { db } from "../server/db";
import { familyMembers } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateMemberTraits() {
  console.log("🔄 Starting family member traits update...");
  
  try {
    // Get all existing family members
    const members = await db.select().from(familyMembers);
    
    // Define traits and interests for each family member by ID
    const traitUpdates = {
      // Robert Johnson (Grandfather)
      1: {
        personalityTraits: ["patient", "wise", "traditional", "determined"],
        interests: ["gardening", "woodworking", "history", "fishing"],
        occupation: "Retired Engineer"
      },
      // Margaret Johnson (Grandmother)
      2: {
        personalityTraits: ["nurturing", "organized", "detail-oriented", "warm"],
        interests: ["knitting", "baking", "genealogy", "reading"],
        occupation: "Retired School Teacher"
      },
      // Carlos Garcia (Grandfather)
      3: {
        personalityTraits: ["humorous", "generous", "outgoing", "spontaneous"],
        interests: ["cooking", "soccer", "travel", "dancing"],
        occupation: "Retired Restaurant Owner"
      },
      // Elena Garcia (Grandmother)
      4: {
        personalityTraits: ["creative", "insightful", "loving", "spiritual"],
        interests: ["painting", "church activities", "cooking", "music"],
        occupation: "Retired Nurse"
      },
      // Michael Johnson (Father)
      5: {
        personalityTraits: ["responsible", "analytical", "practical", "reserved"],
        interests: ["hiking", "technology", "photography", "home improvement"],
        occupation: "Software Engineer"
      },
      // Sofia Johnson (Mother)
      6: {
        personalityTraits: ["empathetic", "ambitious", "adventurous", "sociable"],
        interests: ["yoga", "interior design", "environmental activism", "cooking"],
        occupation: "Marketing Director"
      },
      // David Johnson (Uncle)
      7: {
        personalityTraits: ["funny", "relaxed", "innovative", "curious"],
        interests: ["craft beer brewing", "camping", "sci-fi movies", "gaming"],
        occupation: "Graphic Designer"
      },
      // Sarah Johnson (Aunt)
      8: {
        personalityTraits: ["diligent", "compassionate", "thoughtful", "introverted"],
        interests: ["gardening", "book club", "volunteering", "birdwatching"],
        occupation: "Librarian"
      },
      // Maria Garcia (Aunt)
      9: {
        personalityTraits: ["vibrant", "artistic", "passionate", "expressive"],
        interests: ["dancing", "photography", "fashion", "travel"],
        occupation: "Dance Instructor"
      },
      // Javier Garcia (Uncle)
      10: {
        personalityTraits: ["driven", "competitive", "charismatic", "loyal"],
        interests: ["basketball", "fitness", "cars", "business podcasts"],
        occupation: "Financial Advisor"
      },
      // Ayisha Oglivie (Self)
      11: {
        personalityTraits: ["thoughtful", "creative", "independent", "observant"],
        interests: ["photography", "hiking", "web design", "psychology"],
        occupation: "College Student - Psychology Major"
      },
      // Lucas Johnson (Brother)
      12: {
        personalityTraits: ["athletic", "confident", "protective", "straightforward"],
        interests: ["basketball", "video games", "fitness", "cars"],
        occupation: "College Student - Sports Science"
      },
      // Jessica Johnson (Sister)
      13: {
        personalityTraits: ["caring", "organized", "reliable", "cheerful"],
        interests: ["dance", "fashion", "baking", "volunteering"],
        occupation: "High School Student"
      },
      // Isabella Garcia (Cousin)
      14: {
        personalityTraits: ["outgoing", "ambitious", "persuasive", "stylish"],
        interests: ["debate club", "social media", "politics", "shopping"],
        occupation: "College Student - Political Science"
      },
      // Miguel Garcia (Cousin)
      15: {
        personalityTraits: ["thoughtful", "gentle", "analytical", "methodical"],
        interests: ["chess", "robotics", "classical music", "mathematics"],
        occupation: "College Student - Engineering"
      },
      // Eva Garcia (Cousin)
      16: {
        personalityTraits: ["spontaneous", "adventurous", "humorous", "free-spirited"],
        interests: ["travel blogging", "rock climbing", "photography", "foreign languages"],
        occupation: "Travel Blogger"
      },
      // Noah Johnson (Cousin)
      17: {
        personalityTraits: ["curious", "energetic", "imaginative", "talkative"],
        interests: ["building Legos", "dinosaurs", "soccer", "drawing"],
        occupation: "Elementary School Student"
      },
      // Emma Johnson (Cousin)
      18: {
        personalityTraits: ["creative", "sensitive", "determined", "dreamy"],
        interests: ["ballet", "reading", "arts and crafts", "animals"],
        occupation: "Elementary School Student"
      },
      // Olivia Johnson (Cousin)
      19: {
        personalityTraits: ["studious", "organized", "ambitious", "responsible"],
        interests: ["reading", "debate club", "violin", "environmental science"],
        occupation: "High School Student"
      },
      // Ethan Garcia (Cousin)
      20: {
        personalityTraits: ["athletic", "competitive", "sociable", "easygoing"],
        interests: ["soccer", "video games", "hanging with friends", "music"],
        occupation: "Middle School Student"
      },
      // Sophia Garcia (Cousin)
      21: {
        personalityTraits: ["artistic", "quiet", "observant", "kind"],
        interests: ["drawing", "reading", "nature", "animals"],
        occupation: "Middle School Student"
      },
      // James Garcia (Cousin)
      22: {
        personalityTraits: ["active", "playful", "curious", "affectionate"],
        interests: ["playing outside", "toy cars", "cartoons", "bugs"],
        occupation: "Preschool Student"
      }
    };
    
    // Update each family member with their traits and interests
    let updatedCount = 0;
    
    for (const member of members) {
      const id = member.id;
      const update = traitUpdates[id];
      
      if (update) {
        await db.update(familyMembers)
          .set({
            personality_traits: update.personalityTraits,
            interests: update.interests,
            occupation: update.occupation
          })
          .where(eq(familyMembers.id, id));
        
        console.log(`✅ Updated traits for ID ${id}: ${member.name}`);
        updatedCount++;
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} family members with traits and interests.`);
    
  } catch (error) {
    console.error("❌ Error updating family member traits:", error);
    process.exit(1);
  }
}

// Run the update function
updateMemberTraits().then(() => process.exit(0));