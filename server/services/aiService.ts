import OpenAI from "openai";

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