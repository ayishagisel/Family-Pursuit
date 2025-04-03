import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface AIValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions?: {
    name?: string;
    role?: string;
    relationship?: string;
  };
}

export function useAIValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<AIValidationResult | null>(null);

  const validateFamilyMemberData = async (data: {
    name: string;
    role: string;
    relationship: string;
  }): Promise<AIValidationResult> => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Type assertion to inform TypeScript about the expected return type
      const result = await apiRequest("POST", '/api/validate/family-member', data) as AIValidationResult;

      setValidationResult(result);
      return result;
    } catch (error) {
      console.error("AI validation error:", error);
      const fallbackResult: AIValidationResult = {
        isValid: true, // Default to true to avoid blocking submission in case of API errors
        issues: ["Unable to perform AI validation"]
      };
      setValidationResult(fallbackResult);
      return fallbackResult;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateFamilyMemberData,
    isValidating,
    validationResult
  };
}