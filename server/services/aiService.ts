import OpenAI from "openai";
import { FamilyMember, Relationship } from "@shared/schema";

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions?: {
    name?: string;
    role?: string;
    relationship?: string;
  };
}

interface RelationshipInsight {
  summary: string;
  keyPoints: string[];
  suggestions: string[];
}

/**
 * Validates family member data using OpenAI's GPT model
 * @param memberData Data to validate
 * @returns Validation result with issues and suggestions
 */
export async function validateFamilyMemberData(memberData: {
  name: string;
  role: string;
  relationship: string;
}): Promise<ValidationResult> {
  try {
    // Create a prompt for the AI to validate the family member data
    const prompt = `
    Please validate the following family member data and check for any issues:
    
    Name: ${memberData.name}
    Role: ${memberData.role}
    Relationship: ${memberData.relationship}
    
    Assess if this is valid family member data. Check for:
    1. Is the name appropriate and realistic for a family member?
    2. Does the role make sense in a family context (e.g., father, mother, sister, etc.)?
    3. Is the relationship appropriate?
    4. Any inconsistencies between the fields?
    
    Respond in JSON format with these fields:
    - isValid (boolean): whether the data appears valid
    - issues (array): list of specific issues found
    - suggestions (object): suggested corrections if any issues were found
    
    Example response:
    {
      "isValid": true,
      "issues": []
    }
    
    Or if issues are found:
    {
      "isValid": false,
      "issues": ["Role 'XYZ' is not a common family role"],
      "suggestions": {
        "role": "Cousin"
      }
    }
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a family data validation assistant. You check family member data for accuracy and consistency."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3 // Lower temperature for more consistent, focused responses
    });

    // Parse the response
    const resultText = response.choices[0].message.content;
    if (!resultText) {
      throw new Error("Empty response from AI");
    }

    const result = JSON.parse(resultText) as ValidationResult;
    return result;
  } catch (error) {
    console.error("AI validation error:", error);
    // Return a default validation result in case of error
    return {
      isValid: true, // We default to true to avoid blocking submissions on API failure
      issues: ["Unable to perform AI validation"],
    };
  }
}

/**
 * Analyzes family relationships to provide insights and suggestions
 * @param familyMembers List of family members
 * @param relationships List of relationships between members
 * @param focusMemberId Optional ID of a member to focus analysis on
 * @returns Insights and suggestions about the relationships
 */
export async function analyzeRelationships(
  familyMembers: FamilyMember[],
  relationships: Relationship[],
  focusMemberId?: number
): Promise<RelationshipInsight> {
  try {
    // Create a simplified data structure for analysis
    const simplifiedMembers = familyMembers.map(member => ({
      id: member.id,
      name: member.name,
      birthDate: member.birth_date,
      role: member.role
    }));

    const simplifiedRelationships = relationships.map(rel => ({
      source: familyMembers.find(m => m.id === rel.source_id)?.name || `Member ${rel.source_id}`,
      target: familyMembers.find(m => m.id === rel.target_id)?.name || `Member ${rel.target_id}`,
      type: rel.relationship_type,
      notes: rel.notes || ""
    }));

    // Get focus member if specified
    let focusMember = null;
    if (focusMemberId) {
      focusMember = familyMembers.find(m => m.id === focusMemberId);
    }

    // Create a prompt for relationship analysis
    const prompt = `
    Please analyze these family relationships and provide insights:
    
    ${focusMember ? `FOCUS MEMBER: ${focusMember.name}, Role: ${focusMember.role}` : 'OVERALL FAMILY ANALYSIS'}
    
    FAMILY MEMBERS:
    ${JSON.stringify(simplifiedMembers, null, 2)}
    
    RELATIONSHIPS:
    ${JSON.stringify(simplifiedRelationships, null, 2)}
    
    ${focusMember 
      ? `Analyze the relationships involving ${focusMember.name} and provide insights about their connections to other family members.` 
      : 'Analyze the overall family structure and identify key patterns, potential issues, or interesting observations.'}
    
    Consider:
    1. Complex or unusual relationship patterns
    2. Missing connections that might be important
    3. Interesting family dynamics
    4. Suggestions for enhancing family connections
    5. Potential data inconsistencies
    
    Respond in JSON format with these fields:
    - summary (string): A brief overview of the key insights
    - keyPoints (array): List of specific observations or insights
    - suggestions (array): Recommended actions or improvements
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a family relationship analyst. You provide insights about family structures and connections."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5 // Slightly higher temperature for more creative insights
    });

    // Parse the response
    const resultText = response.choices[0].message.content;
    if (!resultText) {
      throw new Error("Empty response from AI");
    }

    const result = JSON.parse(resultText) as RelationshipInsight;
    return result;
  } catch (error) {
    console.error("AI relationship analysis error:", error);
    // Return a default insight in case of error
    return {
      summary: "Unable to analyze relationships due to a technical issue.",
      keyPoints: ["AI analysis service is currently unavailable."],
      suggestions: ["Try again later or analyze the relationships manually."]
    };
  }
}

/**
 * Generates a narrative about a specific family member based on their data and relationships
 * @param member The family member to create a narrative for
 * @param relationships Relationships involving this member
 * @param relatedMembers Other family members related to this person
 * @returns A narrative story about the family member
 */
export async function generateFamilyMemberNarrative(
  member: FamilyMember,
  relationships: Relationship[],
  relatedMembers: FamilyMember[]
): Promise<string> {
  try {
    // Extract relevant relationships for this member
    const memberRelationships = relationships.filter(
      rel => rel.source_id === member.id || rel.target_id === member.id
    );
    
    // Map relationship IDs to names for clearer context
    const relationshipDescriptions = memberRelationships.map(rel => {
      const isSource = rel.source_id === member.id;
      const otherMemberId = isSource ? rel.target_id : rel.source_id;
      const otherMember = relatedMembers.find(m => m.id === otherMemberId);
      
      return {
        type: rel.relationship_type,
        direction: isSource ? "to" : "from",
        otherPerson: otherMember?.name || `Unknown (ID: ${otherMemberId})`,
        notes: rel.notes
      };
    });

    // Create a prompt for narrative generation
    const prompt = `
    Please create a warm, personal narrative about this family member based on their information:
    
    NAME: ${member.name}
    ROLE: ${member.role}
    BIRTH DATE: ${member.birth_date || 'Unknown'}
    LOCATION: ${member.location || 'Unknown'}
    BIO: ${member.bio || 'No additional information available'}
    
    RELATIONSHIPS:
    ${JSON.stringify(relationshipDescriptions, null, 2)}
    
    Create a brief, engaging narrative that captures this person's place in the family.
    Focus on their connections to others, their role, and any notable details from their bio.
    The tone should be warm and personal, as if written by a caring family member.
    Keep it under 250 words and make it feel like a meaningful personal description.
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a family historian who writes meaningful, personal narratives about family members. Your writing captures the essence of each person and their relationships."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7 // Higher temperature for more creative, warm narrative
    });

    // Return the narrative
    const narrative = response.choices[0].message.content;
    if (!narrative) {
      throw new Error("Empty response from AI");
    }

    return narrative;
  } catch (error) {
    console.error("AI narrative generation error:", error);
    // Return a generic narrative in case of error
    return `${member.name} is a ${member.role} in the family. Additional details and a personalized narrative are currently unavailable due to a technical issue.`;
  }
}