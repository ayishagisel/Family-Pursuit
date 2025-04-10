import express from "express";
import path from "path";

// Stand-alone API endpoint for testing
const app = express();
const port = 5050;

// Import dependencies
import { storage } from "./storage";

// Set up JSON parsing
app.use(express.json());

// Simple test endpoint with fallback content
app.get("/test-fallback", async (req, res) => {
  try {
    console.log("Standalone test endpoint called");
    
    // Retrieve data
    const familyMembers = await storage.getAllFamilyMembers();
    console.log(`Retrieved ${familyMembers.length} family members`);
    
    const relationships = await storage.getAllRelationships();
    console.log(`Retrieved ${relationships.length} relationships`);
    
    // Generate fallback content directly
    console.log("Generating fallback relationship analysis...");
    
    // Count generations by analyzing birth years
    const birthYears = familyMembers
      .filter((m) => m.birth_date)
      .map((m) => new Date(m.birth_date).getFullYear());
    
    // Handle the case where there are no birth years or too few to analyze
    let generationSpan = 3; // Default if we can't calculate
    if (birthYears.length > 0) {
      const oldestYear = Math.min(...birthYears);
      const youngestYear = Math.max(...birthYears);
      generationSpan = Math.floor((youngestYear - oldestYear) / 20) || 1; // At least 1
    }
    
    // Count relationship types
    const relationTypes = relationships.reduce((acc, rel) => {
      const type = (rel.relationship_type || "unknown").toLowerCase();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const parentChildCount = (relationTypes['parent'] || 0) + (relationTypes['child'] || 0);
    const siblingCount = relationTypes['sibling'] || 0;
    const spouseCount = relationTypes['spouse'] || 0;
    
    // Gather personality traits and interests to mention in the analysis
    const traits = new Set();
    const interests = new Set();
    
    familyMembers.forEach((member) => {
      if (member.personality_traits && Array.isArray(member.personality_traits)) {
        member.personality_traits.forEach((trait) => traits.add(trait));
      }
      if (member.interests && Array.isArray(member.interests)) {
        member.interests.forEach((interest) => interests.add(interest));
      }
    });
    
    const commonTraits = Array.from(traits).slice(0, 5);
    const commonInterests = Array.from(interests).slice(0, 5);
    
    console.log("Sending fallback analysis response");
    return res.json({
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
    });
  } catch (error) {
    console.error("Error in relationship analysis:", error);
    res.status(500).json({
      message: error.message || "An error occurred while analyzing the family relationships.",
      error: true,
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Stand-alone test server running at http://localhost:${port}`);
});