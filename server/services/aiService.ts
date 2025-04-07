import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OpenAI API key in environment variables");
      }
      
      // Filter relationships related to this member
      const memberRelationships = relationships.filter(
        (rel: any) => rel.member1Id === member.id || rel.member2Id === member.id
      );
      
      // Enhance relationships with member names for better context
      const enhancedRelationships = memberRelationships.map((rel: any) => {
        const otherId = rel.member1Id === member.id ? rel.member2Id : rel.member1Id;
        const otherMember = allMembers.find((m: any) => m.id === otherId);
        
        return {
          ...rel,
          member1Name: rel.member1Id === member.id ? 
            `${member.firstName} ${member.lastName}` : 
            otherMember ? `${otherMember.firstName} ${otherMember.lastName}` : 'Unknown',
          member2Name: rel.member2Id === member.id ? 
            `${member.firstName} ${member.lastName}` : 
            otherMember ? `${otherMember.firstName} ${otherMember.lastName}` : 'Unknown',
        };
      });
      
      // Create a prompt with member information and their relationships
      const prompt = `
        Please generate a personal narrative/bio for a family member with the following information:
        
        Name: ${member.firstName} ${member.lastName}
        Birth Date: ${member.birthDate || 'Unknown'}
        ${member.deathDate ? `Death Date: ${member.deathDate}` : ''}
        ${member.bio ? `Bio: ${member.bio}` : ''}
        ${member.occupation ? `Occupation: ${member.occupation}` : ''}
        ${member.location ? `Location: ${member.location}` : ''}
        
        Relationships:
        ${enhancedRelationships.map((rel: any) => {
          const relType = rel.relationType;
          const otherPerson = rel.member1Id === member.id ? rel.member2Name : rel.member1Name;
          return `- ${relType} of ${otherPerson}`;
        }).join('\n')}
        
        Please write a warm, personal narrative about this person's life, their relationships, 
        and their role in the family. Make it personal and meaningful, like someone describing 
        a beloved family member. Focus on known facts but gently fill in details that would make 
        sense given the information provided. Keep it under 350 words.
      `;

      // Call the OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a thoughtful family historian who writes warm, personal narratives about family members. Your tone is gentle and empathetic."
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
    } catch (error: any) {
      console.error("Error generating member narrative:", error);
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
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OpenAI API key in environment variables");
      }
      
      // Create a prompt with all family members and their relationships
      const membersInfo = familyMembers.map((member: any) => 
        `${member.firstName} ${member.lastName} (ID: ${member.id})${member.birthDate ? `, born ${member.birthDate}` : ''}`
      ).join('\n');
      
      // Enhance relationships with member names for better context
      const enhancedRelationships = relationships.map((rel: any) => {
        const member1 = familyMembers.find((m: any) => m.id === rel.member1Id);
        const member2 = familyMembers.find((m: any) => m.id === rel.member2Id);
        const member1Name = member1 ? `${member1.firstName} ${member1.lastName}` : 'Unknown';
        const member2Name = member2 ? `${member2.firstName} ${member2.lastName}` : 'Unknown';
        return `- ${member1Name} is the ${rel.relationType} of ${member2Name} ${rel.relationCategory ? `(${rel.relationCategory})` : ''}`;
      }).join('\n');
      
      const prompt = `
        Please analyze this family based on the members and their relationships:
        
        Family Members:
        ${membersInfo}
        
        Relationships:
        ${enhancedRelationships}
        
        Provide insights about this family such as:
        1. Overall family structure and size
        2. Generational spread
        3. Notable relationship patterns
        4. Unique or interesting aspects about this family
        5. Potential relationship strengths to nurture
        
        Keep your analysis warm, supportive, and focused on positive insights. Highlight the unique 
        aspects of this family structure. Keep it under 400 words.
      `;

      // Call the OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a compassionate family relationship expert who provides warm, supportive insights about families."
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
    } catch (error: any) {
      console.error("Error analyzing relationships:", error);
      return {
        analysis: `Error analyzing relationships: ${error.message}`,
        error: true
      };
    }
  }
};