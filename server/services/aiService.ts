import OpenAI from "openai";
import { FamilyMember, Relationship } from "@shared/schema";

// Initialize OpenAI with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Make sure this comment stays in code: the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

/**
 * Service to handle AI operations for relationship analysis and narrative generation
 */
export class AIService {
  /**
   * Analyze relationships between family members
   * @param familyMembers List of family members
   * @param relationships List of relationships between members
   * @returns Analysis of relationships with insights and recommendations
   */
  async analyzeRelationships(
    familyMembers: FamilyMember[],
    relationships: Relationship[]
  ): Promise<{ insights: string; recommendations: string }> {
    try {
      // Create a comprehensive family map from the data
      const familyMap = this.createFamilyMap(familyMembers, relationships);

      // Prepare detailed prompt for OpenAI
      const prompt = `
      Analyze the following family structure and relationships:
      
      ${JSON.stringify(familyMap, null, 2)}
      
      Please provide:
      1. Key insights about this family structure (identify potential relationship gaps, unique patterns, etc.)
      2. Recommendations to strengthen family connections and improve relationships
      
      Format your response as JSON with two fields: "insights" and "recommendations".
      Keep insights fact-based and objective. Keep recommendations supportive and practical.
      Limit your response to key points most relevant to this specific family structure.
      `;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a family relationship expert specializing in analyzing family structures and providing helpful insights. Focus on patterns, potential areas for strengthening relationships, and practical recommendations.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      // Parse and return the analysis
      const analysisText = completion.choices[0].message.content || "{}";
      const analysis = JSON.parse(analysisText);

      return {
        insights: analysis.insights || "No insights available at this time.",
        recommendations: analysis.recommendations || "No recommendations available at this time.",
      };
    } catch (error) {
      console.error("Error analyzing relationships:", error);
      return {
        insights: "Unable to analyze relationships at this time.",
        recommendations: "Please try again later.",
      };
    }
  }

  /**
   * Generate a narrative for a specific family member
   * @param member The family member to generate a narrative for
   * @param familyMembers All family members for context
   * @param relationships All relationships for context
   * @returns A personalized narrative for the family member
   */
  async generateMemberNarrative(
    member: FamilyMember,
    familyMembers: FamilyMember[],
    relationships: Relationship[]
  ): Promise<{ narrative: string; timeline: any[] }> {
    try {
      // Get directly connected members
      const connectedMembers = this.getConnectedMembers(member.id, familyMembers, relationships);
      
      // Prepare prompt for OpenAI
      const prompt = `
      Create a personal narrative for ${member.name} based on this information:
      
      Person: ${JSON.stringify(member, null, 2)}
      
      Connected Family Members: ${JSON.stringify(connectedMembers, null, 2)}
      
      Please provide:
      1. A compelling personal narrative that integrates their biographical information
      2. A timeline of key events in their life (based on available data)
      
      Format your response as JSON with two fields: "narrative" and "timeline" (array of events with dates).
      Make the narrative personal, warm, and reflective of their relationships. Limit to 250 words.
      `;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a skilled biographer and family historian who creates compelling personal narratives. You excel at weaving facts into engaging stories that highlight family connections.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      // Parse and return the narrative
      const narrativeText = completion.choices[0].message.content || "{}";
      const narrative = JSON.parse(narrativeText);

      return {
        narrative: narrative.narrative || "Narrative not available at this time.",
        timeline: narrative.timeline || [],
      };
    } catch (error) {
      console.error("Error generating narrative:", error);
      return {
        narrative: "Unable to generate narrative at this time.",
        timeline: [],
      };
    }
  }

  /**
   * Helper method to create a structured map of the family for AI analysis
   */
  private createFamilyMap(familyMembers: FamilyMember[], relationships: Relationship[]) {
    const memberMap = new Map<number, FamilyMember>();
    
    // Create map of members by ID for easier lookup
    familyMembers.forEach(member => {
      memberMap.set(member.id, member);
    });
    
    // Structure members with their relationships
    const structuredFamily = familyMembers.map(member => {
      const memberRelationships = relationships.filter(
        rel => rel.source_id === member.id || rel.target_id === member.id
      );
      
      const connections = memberRelationships.map(rel => {
        const isSource = rel.source_id === member.id;
        const connectedId = isSource ? rel.target_id : rel.source_id;
        const connectedMember = memberMap.get(connectedId);
        
        if (!connectedMember) return null;
        
        // Determine relationship direction and type
        let relationshipType = rel.relationship_type;
        if (!isSource) {
          // Invert relationship type if needed
          if (relationshipType === "parent") relationshipType = "child";
          else if (relationshipType === "child") relationshipType = "parent";
        }
        
        return {
          id: connectedId,
          name: connectedMember.name,
          relationship: relationshipType,
          category: rel.relation_category,
          birth_date: connectedMember.birth_date,
        };
      }).filter(Boolean);
      
      return {
        id: member.id,
        name: member.name,
        birth_date: member.birth_date,
        role: member.role,
        bio: member.bio,
        connections,
      };
    });
    
    return structuredFamily;
  }

  /**
   * Helper method to get members directly connected to a specific member
   */
  private getConnectedMembers(
    memberId: number, 
    familyMembers: FamilyMember[], 
    relationships: Relationship[]
  ) {
    const memberMap = new Map<number, FamilyMember>();
    
    // Create map of members by ID for easier lookup
    familyMembers.forEach(member => {
      memberMap.set(member.id, member);
    });
    
    // Find relationships involving this member
    const memberRelationships = relationships.filter(
      rel => rel.source_id === memberId || rel.target_id === memberId
    );
    
    // Get connected members with relationship details
    return memberRelationships.map(rel => {
      const isSource = rel.source_id === memberId;
      const connectedId = isSource ? rel.target_id : rel.source_id;
      const connectedMember = memberMap.get(connectedId);
      
      if (!connectedMember) return null;
      
      // Determine relationship direction and type
      let relationshipType = rel.relationship_type;
      if (!isSource) {
        // Invert relationship type if needed
        if (relationshipType === "parent") relationshipType = "child";
        else if (relationshipType === "child") relationshipType = "parent";
      }
      
      return {
        id: connectedId,
        name: connectedMember.name,
        relationship: relationshipType,
        category: rel.relation_category,
        birth_date: connectedMember.birth_date,
        connection: isSource ? "to" : "from",
      };
    }).filter(Boolean);
  }
}

// Export singleton instance
export const aiService = new AIService();