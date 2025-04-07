# AI Integration Documentation

This document outlines the AI features integrated into the Family App and how they work.

## Overview

The Family App includes two core AI-powered features:
1. **Relationship Insights** - AI analysis of family relationships
2. **Member Narratives** - AI-generated biographical narratives for family members

## Technical Implementation

### API Endpoints

The AI features are exposed through two main API endpoints:

1. **`/api/analyze/relationships`** - Returns insights about family relationships
2. **`/api/family-members/:id/narrative`** - Returns a narrative biography for a specific family member

### AI Service

The `aiService.ts` module handles all AI-related functionality:

- **Dependencies**: OpenAI Node.js SDK
- **Model Used**: GPT-4o (latest version)
- **Error Handling**: Includes comprehensive error handling for API rate limits and failures

```typescript
// Sample request to the OpenAI API for relationship analysis
const response = await openai.chat.completions.create({
  model: "gpt-4o", // Using latest model
  messages: [
    {
      role: "system",
      content: "You are a family relationship analyst..."
    },
    {
      role: "user",
      content: `Analyze these family relationships: ${JSON.stringify(relationships)}`
    }
  ],
  temperature: 0.7,
  max_tokens: 700
});
```

### Relationship Insights

This feature analyzes:
- Family structure and connections
- Relationship health and dynamics
- Potential areas for relationship improvements
- Family patterns across generations

### Member Narratives

For each family member, the AI generates:
- A biographical narrative based on available data
- Key life events and milestones
- Relationship context within the family
- A summary of their role in the family structure

## Error Handling and Fallbacks

The AI integration includes robust error handling:

1. **API Rate Limits**: If the OpenAI API rate limit is reached, the system provides a fallback response
2. **Connection Issues**: Network or API failures trigger graceful fallbacks with appropriate user messaging
3. **Token Limits**: Controls are in place to prevent exceeding token limits in requests

## Privacy Considerations

- All AI requests are processed securely with appropriate authentication
- No family data is retained by the AI service beyond the immediate request
- The OpenAI API key is stored securely as an environment variable

## Configuration

The AI features can be configured through environment variables:

- `OPENAI_API_KEY` - Required for API access
- Other configuration options can be added in the `.env` file

## Future Enhancements

Potential future AI features include:
- Family event recommendations based on relationship data
- Conflict resolution suggestions
- Legacy planning assistance
- Memory preservation through interview question generation
