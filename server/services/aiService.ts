import OpenAI from "openai";
import { FamilyMember, Relationship } from "@shared/schema";

// Helper function to reverse relationship type
function reverseRelationship(relationship: string): string {
  const reversals: Record<string, string> = {
    'parent': 'child',
    'child': 'parent',
    'spouse': 'spouse',
    'sibling': 'sibling',
    'half-sibling': 'half-sibling',
    'step-parent': 'step-child',
    'step-child': 'step-parent',
    'guardian': 'ward',
    'ward': 'guardian',
    'grandparent': 'grandchild',
    'grandchild': 'grandparent',
    'uncle': 'nephew/niece',
    'aunt': 'nephew/niece',
    'nephew': 'uncle/aunt',
    'niece': 'uncle/aunt',
    'cousin': 'cousin'
  };
  
  return reversals[relationship.toLowerCase()] || 'relative';
}

// Check for OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const useOpenAI = OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-');

// Log if OpenAI API key is missing
if (!useOpenAI) {
  console.warn("OpenAI API key is missing or invalid. AI-powered features will use fallback mock responses.");
}

// If API key is not available, use mock responses
const useMockResponses = !useOpenAI;

// Initialize the OpenAI client if API key is available
const openai = useOpenAI ? new OpenAI({
  apiKey: OPENAI_API_KEY
}) : null;

/**
 * Service for AI-powered family data analysis and narrative generation
 */
export const aiService = {
  /**
   * Generates a narrative for a family member based on their data and relationships
   */
  generateMemberNarrative: async (
    member: any,
    allMembers: any[],
    relationships: any[]
  ) => {
    try {
      // If we're using mock responses, return a pre-defined narrative
      if (useMockResponses) {
        const fullName = member.name || 'Family member';
        const firstName = fullName.split(' ')[0];
        
        console.log(`Using mock narrative for ${fullName}`);
        return {
          narrative: `${fullName} is a cherished member of our family. ${
            member.birth_date ? `Born on ${new Date(member.birth_date).toLocaleDateString()}, ` : ''
          }${member.role ? `${firstName} has the important role of ${member.role.toLowerCase()} in the family. ` : ''}
          
          ${firstName} is known for their warmth, compassion, and unwavering support of family members through both celebrations and challenges. ${
            member.bio ? member.bio : `They've created countless precious memories that the family treasures.`
          }
          
          ${
            relationships.filter(r => r.source_id === member.id || r.target_id === member.id).length > 0 ?
            `Their relationships with family members are characterized by deep care and mutual respect. ` :
            `They are looking forward to building new family connections. `
          }${
            member.location ? `Currently residing in ${member.location}, ` : ''
          }${firstName} continues to be a central part of family gatherings and traditions.
          
          What makes ${firstName} truly special is their ability to bring people together, creating a sense of belonging for everyone around them. Their legacy is one of love, generosity, and the importance of family bonds.`
        };
      }
      
      // We only use OpenAI or mock responses now
      
      // If OpenAI API is available, use it
      if (useOpenAI) {
        // Filter relationships related to this member
        const memberRelationships = relationships.filter(
          (rel: any) => rel.source_id === member.id || rel.target_id === member.id
        );
        
        // Create a prompt with member information and their relationships
        const prompt = `
          Please generate a personal narrative/bio for a family member with the following information:
          
          Name: ${member.name}
          Birth Date: ${member.birth_date ? new Date(member.birth_date).toLocaleDateString() : 'Unknown'}
          Role: ${member.role || 'Unknown'}
          ${member.bio ? `Bio: ${member.bio}` : ''}
          ${member.location ? `Location: ${member.location}` : ''}
          ${member.occupation ? `Occupation: ${member.occupation}` : ''}
          ${member.personality_traits && member.personality_traits.length > 0 ? `Personality Traits: ${member.personality_traits.join(', ')}` : ''}
          ${member.interests && member.interests.length > 0 ? `Interests: ${member.interests.join(', ')}` : ''}
          
          Relationships:
          ${memberRelationships.map((rel: any) => {
            const isSource = rel.source_id === member.id;
            const otherId = isSource ? rel.target_id : rel.source_id;
            const otherMember = allMembers.find((m: any) => m.id === otherId);
            const relType = isSource ? rel.relationship_type : reverseRelationship(rel.relationship_type);
            return `- ${relType} of ${otherMember ? otherMember.name : 'Unknown'} (${rel.relation_category})`;
          }).join('\n')}
          
          Please write a warm, personal narrative about this person's life, their relationships, 
          and their role in the family. Make it personal and meaningful, like someone describing 
          a beloved family member. Focus on known facts but gently fill in details that would make 
          sense given the information provided. Keep it under 350 words.
        `;

        // Call the OpenAI API
        const response = await openai!.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          messages: [
            {
              role: "system",
              content: "You are a thoughtful family historian who writes warm, personal narratives about family members. Your tone is gentle and empathetic. When writing a narrative, you MUST incorporate the personality traits, interests, and occupation provided to create an authentic portrayal that feels uniquely personalized to the individual. Explicitly reference these characteristics throughout the narrative, showing how they influence the person's relationships, experiences, and place within the family. Use specific traits to illustrate character and interests to highlight passions. The narrative should feel deeply personal through these specific details rather than generic observations."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
        });

        return {
          narrative: response.choices[0].message.content || "Unable to generate narrative."
        };
      }
      
      // If we reach here, neither API is available but useMockResponses is false
      // This should not happen in normal conditions, but we'll return an error
      throw new Error("No AI service available to generate narrative.");
      
      // We should never reach here
    } catch (error: any) {
      console.error("Error generating member narrative:", error);
      
      // If we hit a rate limit, quota error, or authentication error (invalid API key), use fallback data
      if (error.status === 429 || error.status === 401 || 
          (error.code && (error.code === 'insufficient_quota' || error.code === 'invalid_api_key'))) {
        console.log("Using fallback narrative due to API error:", error.status || error.code);
        return {
          narrative: `# ${member.name}'s Family Story

${member.name} is a ${member.role.toLowerCase()} in the family known for ${
  member.personality_traits && member.personality_traits.length > 0 
    ? `being ${member.personality_traits.slice(0, 3).join(', ')} and `
    : ''
}${
  member.interests && member.interests.length > 0
    ? `enjoying ${member.interests.slice(0, 3).join(', ')}`
    : 'their unique contributions to family gatherings'
}.

${member.occupation 
  ? `As a ${member.occupation}, they bring valuable perspective to family discussions. ` 
  : ''}${
  member.personality_traits && member.personality_traits.length > 0
    ? `Their ${member.personality_traits[0]} nature means they often ${
      member.personality_traits[0] === 'patient' ? 'take time to listen carefully to everyone\'s concerns' :
      member.personality_traits[0] === 'creative' ? 'find unique solutions to family challenges' :
      member.personality_traits[0] === 'organized' ? 'help keep family gatherings running smoothly' :
      member.personality_traits[0] === 'thoughtful' ? 'remember important details about each family member' :
      member.personality_traits[0] === 'nurturing' ? 'make sure everyone feels cared for and supported' :
      member.personality_traits[0] === 'humorous' ? 'bring laughter and light-heartedness to family events' :
      member.personality_traits[0] === 'adventurous' ? 'encourage the family to try new activities together' :
      'provide a unique perspective in family discussions'
    }. `
    : ''
}

${
  member.interests && member.interests.length > 0
    ? `Their passion for ${member.interests[0]} often ${
      member.interests[0] === 'gardening' ? 'brings beautiful flowers and fresh vegetables to family gatherings' :
      member.interests[0] === 'cooking' ? 'means delicious meals that bring the family together around the table' :
      member.interests[0] === 'music' ? 'fills family gatherings with melody and rhythm that everyone enjoys' :
      member.interests[0] === 'photography' ? 'ensures precious family moments are captured and preserved' :
      member.interests[0] === 'hiking' ? 'leads to memorable family adventures in nature' :
      member.interests[0] === 'reading' ? 'sparks interesting conversations about books and ideas' :
      member.interests[0] === 'technology' ? 'helps other family members solve tech problems and stay connected' :
      'provides opportunities for connection with other family members'
    }.`
    : 'They have a special way of connecting with each family member on a personal level.'
}

They maintain meaningful relationships with several family members, particularly ${
  relationships.filter(r => r.source_id === member.id || r.target_id === member.id).length > 0
    ? relationships.slice(0, 2).map((rel: any) => {
        const isSource = rel.source_id === member.id;
        const otherId = isSource ? rel.target_id : rel.source_id;
        const otherMember = allMembers.find((m: any) => m.id === otherId);
        return otherMember ? otherMember.name : 'family members';
      }).join(' and ')
    : 'close family members'
}. ${
  member.personality_traits && member.personality_traits.length > 1
    ? `Their ${member.personality_traits[1]} personality trait complements their other qualities and makes them especially good at bringing the family together.`
    : 'Their unique qualities make them an essential part of the family fabric.'
}

*Note: This is a simplified narrative generated when the AI service is unavailable. A more personalized narrative would be created when the service is accessible.*`,
          fallback: true
        };
      }
      
      // Otherwise return the error
      return {
        narrative: `Error generating narrative: ${error.message}`,
        error: true
      };
    }
  },

  /**
   * Analyzes family relationships to provide insights
   */
  analyzeRelationships: async (
    familyMembers: any[],
    relationships: any[]
  ) => {
    try {
      // If we're using mock responses, return a pre-defined analysis
      if (useMockResponses) {
        console.log(`Using mock relationship analysis for ${familyMembers.length} members and ${relationships.length} relationships`);
        
        // Count generations by analyzing birth years
        const birthYears = familyMembers
          .filter(m => m.birth_date)
          .map(m => new Date(m.birth_date).getFullYear());
        
        // Handle the case where there are no birth years or too few to analyze
        let generationSpan = 3; // Default if we can't calculate
        if (birthYears.length > 0) {
          const oldestYear = Math.min(...birthYears);
          const youngestYear = Math.max(...birthYears);
          generationSpan = Math.floor((youngestYear - oldestYear) / 20) || 1; // At least 1
        }
        
        // Count relationship types
        const relationTypes = relationships.reduce((acc: Record<string, number>, rel) => {
          const type = rel.relationship_type.toLowerCase();
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        const parentChildCount = (relationTypes['parent'] || 0) + (relationTypes['child'] || 0);
        const siblingCount = relationTypes['sibling'] || 0;
        const spouseCount = relationTypes['spouse'] || 0;
        
        return {
          analysis: `
            ## Family Structure Analysis
            
            This family consists of ${familyMembers.length} members connected through ${relationships.length} different relationships, forming a rich tapestry of connections spanning approximately ${generationSpan || 3} generations. The family demonstrates a beautiful blend of traditional and modern family structures, with a notable emphasis on maintaining strong bonds across generations.
            
            The family has a well-balanced generational spread, with members born across different decades, providing a wealth of varied perspectives and experiences. This multi-generational aspect creates wonderful opportunities for wisdom sharing between older and younger family members.
            
            Relationship patterns show a healthy distribution of ${parentChildCount} parent-child connections, ${siblingCount || 'several'} sibling relationships, and ${spouseCount || 'multiple'} spouse partnerships. The family demonstrates resilience through its interconnected support network where extended family members actively participate in each other's lives.
            
            What makes this family unique is its embrace of both biological and chosen family connections. The family tree shows thoughtful integration of step-relationships, in-laws, and other non-traditional bonds that enrich the family experience.
            
            The family's strengths lie in its commitment to maintaining connections despite geographical distances and generational differences. Consider nurturing these strengths through regular family gatherings, shared digital spaces for remote members, and intentional mentoring relationships between generations. Encouraging the documentation of family stories and traditions would further strengthen the sense of shared identity that is already evident in this vibrant family network.
          `
        };
      }
      
      // We only use OpenAI or mock responses now
      
      // If OpenAI API is available, use it
      if (useOpenAI) {
        // Create a prompt with all family members and their relationships
        const prompt = `
          Please analyze this family structure:
          
          Family Members: ${familyMembers.length} members
          Relationships: ${relationships.length} connections
          
          Member details:
          ${familyMembers.map((member: any) => {
            const traits = member.personality_traits && member.personality_traits.length > 0 ? 
              ` [Traits: ${member.personality_traits.slice(0, 3).join(', ')}]` : '';
            const interests = member.interests && member.interests.length > 0 ? 
              ` [Interests: ${member.interests.slice(0, 3).join(', ')}]` : '';
            const occupation = member.occupation ? ` [${member.occupation}]` : '';
            
            return `- ${member.name}: ${member.role || 'family member'}${occupation}${member.birth_date ? 
              ` (born ${new Date(member.birth_date).toLocaleDateString()})` : ''}${traits}${interests}`;
          }).join('\n')}
          
          Relationship types:
          ${Array.from(new Set(relationships.map((rel: any) => rel.relationship_type))).join(', ')}
          
          Relationship categories:
          ${Array.from(new Set(relationships.map((rel: any) => rel.relation_category))).join(', ')}
          
          Please provide a warm, insightful analysis of this family structure. Include observations about:
          1. Overall family composition and generational spread
          2. Notable relationship patterns
          3. How personality traits and interests might influence family dynamics
          4. Unique aspects of this family's connections
          5. Strengths that could be nurtured
          
          Format your response with clear section headings using markdown (##). Keep it under 400 words.
        `;

        // Call the OpenAI API
        const response = await openai!.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          messages: [
            {
              role: "system",
              content: "You are a compassionate family relationship expert who provides warm, supportive insights about families. You MUST thoroughly analyze how personality traits and interests influence family dynamics. Look for specific patterns and complementary traits across family members that strengthen relationships or might occasionally cause tension. Reference concrete examples of how particular traits (such as 'patient' complementing 'energetic') create balance in the family system, and how shared interests (like 'gardening' or 'music') serve as connection points across generations. Your analysis should feel specific to this unique family rather than generic observations that could apply to any family."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
        });

        return {
          analysis: response.choices[0].message.content || "Unable to generate relationship analysis."
        };
      }
      
      // If we reach here, neither API is available but useMockResponses is false
      // This should not happen in normal conditions, but we'll return an error
      throw new Error("No AI service available to generate relationship analysis.");
    } catch (error: any) {
      console.error("Error analyzing relationships:", error);
      
      // If we hit a rate limit, quota error, or authentication error (invalid API key), use fallback data
      if (error.status === 429 || error.status === 401 || 
          (error.code && (error.code === 'insufficient_quota' || error.code === 'invalid_api_key'))) {
        console.log("Using fallback relationship analysis due to API error:", error.status || error.code);
        
        // Count generations by analyzing birth years
        const birthYears = familyMembers
          .filter((m: any) => m.birth_date)
          .map((m: any) => new Date(m.birth_date).getFullYear());
        
        // Handle the case where there are no birth years or too few to analyze
        let generationSpan = 3; // Default if we can't calculate
        if (birthYears.length > 0) {
          const oldestYear = Math.min(...birthYears);
          const youngestYear = Math.max(...birthYears);
          generationSpan = Math.floor((youngestYear - oldestYear) / 20) || 1; // At least 1
        }
        
        // Count relationship types
        const relationTypes = relationships.reduce((acc: Record<string, number>, rel: any) => {
          const type = rel.relationship_type.toLowerCase();
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        const parentChildCount = (relationTypes['parent'] || 0) + (relationTypes['child'] || 0);
        const siblingCount = relationTypes['sibling'] || 0;
        const spouseCount = relationTypes['spouse'] || 0;
        
        // Gather personality traits and interests to mention in the analysis
        const traits = new Set<string>();
        const interests = new Set<string>();
        
        familyMembers.forEach((member: any) => {
          if (member.personality_traits) {
            member.personality_traits.forEach((trait: string) => traits.add(trait));
          }
          if (member.interests) {
            member.interests.forEach((interest: string) => interests.add(interest));
          }
        });
        
        const commonTraits = Array.from(traits).slice(0, 5);
        const commonInterests = Array.from(interests).slice(0, 5);
        
        return {
          analysis: `
## Family Structure Analysis

This family consists of ${familyMembers.length} members connected through ${relationships.length} different relationships, forming a rich tapestry of connections spanning approximately ${generationSpan || 3} generations. The family demonstrates a beautiful blend of traditional and modern family structures, with a notable emphasis on maintaining strong bonds across generations.

## Generational Composition

The family has a well-balanced generational spread, with members born across different decades, providing a wealth of varied perspectives and experiences. This multi-generational aspect creates wonderful opportunities for wisdom sharing between older and younger family members.

## Relationship Patterns

Relationship patterns show a healthy distribution of ${parentChildCount} parent-child connections, ${siblingCount || 'several'} sibling relationships, and ${spouseCount || 'multiple'} spouse partnerships. The family demonstrates resilience through its interconnected support network where extended family members actively participate in each other's lives.

## Personality Dynamics

The family shows a diverse mix of personality traits including ${commonTraits.join(', ')}. This variety creates a dynamic where different members can complement each other's strengths. Family members share interests in ${commonInterests.join(', ')}, which provides natural opportunities for bonding and shared activities.

## Unique Aspects

What makes this family unique is its embrace of both biological and chosen family connections. The family tree shows thoughtful integration of step-relationships, in-laws, and other non-traditional bonds that enrich the family experience.

## Nurturing Strengths

The family's strengths lie in its commitment to maintaining connections despite geographical distances and generational differences. Consider nurturing these strengths through regular family gatherings, shared digital spaces for remote members, and intentional mentoring relationships between generations. Encouraging the documentation of family stories and traditions would further strengthen the sense of shared identity that is already evident in this vibrant family network.

*Note: This is a simplified analysis generated when the AI service is unavailable. A more personalized analysis would be created when the service is accessible.*
          `,
          fallback: true
        };
      }
      
      // Otherwise return the error
      return {
        analysis: `Error analyzing relationships: ${error.message}`,
        error: true
      };
    }
  }
};