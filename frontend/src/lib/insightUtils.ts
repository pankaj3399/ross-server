/**
 * Utility functions for parsing and processing AI-generated insights
 */

export interface InsightSections {
  analysis: string;
  strengths: string;
  improvements: string;
  recommendations: string[];
}

/**
 * Splits a text block into individual recommendation items based on common bullet patterns.
 * Handles: "1.", "1)", "(1)", "-", "•"
 */
export const splitRecommendations = (text: string): string[] => {
  if (!text) return [];
  
  // Pattern matches:
  // 1. Optional newline/whitespace
  // 2. Either:
  //    a. \d+[\.\)] - digit(s) followed by . or )
  //    b. \(\d+\)   - digit(s) in parentheses
  //    c. [-•]      - hyphen or bullet
  // 3. Followed by whitespace
  return text
    .split(/(?:\r\n|\r|\n)?(?:\d+[\.\)]|\(\d+\)|[-•\u2022])\s+/)
    .map(r => r.trim())
    .filter(r => r.length > 0);
};

/**
 * Parses raw AI insight text into structured sections.
 */
export const parseInsightText = (text: string): InsightSections => {
  const sections: InsightSections = {
    analysis: "",
    strengths: "",
    improvements: "",
    recommendations: []
  };

  if (!text) return sections;

  const analysisPattern = /(?:Current Performance Analysis|Analysis|1\.\s*A brief analysis[^:]+):?\s*([\s\S]*?)(?=(?:Key strengths|Strengths|2\.|Areas|Specific|$))/i;
  const strengthsPattern = /(?:Key strengths|Strengths|2\.\s*Key strengths[^:]+):?\s*([\s\S]*?)(?=(?:Areas|Improvements|3\.|Specific|$))/i;
  const improvementsPattern = /(?:Areas that need improvement|Areas for Improvement|3\.\s*Areas[^:]+):?\s*([\s\S]*?)(?=(?:Specific|Actionable|Recommendations|4\.)|$)/i;
  const recommendationsPattern = /(?:Specific actionable recommendations|Actionable Recommendations|Recommendations|4\.\s*Specific[^:]+):?\s*([\s\S]*)/i;

  const analysisMatch = text.match(analysisPattern);
  const strengthsMatch = text.match(strengthsPattern);
  const improvementsMatch = text.match(improvementsPattern);
  const recommendationsMatch = text.match(recommendationsPattern);

  if (analysisMatch) sections.analysis = analysisMatch[1].trim();
  else if (!strengthsMatch && !improvementsMatch && !recommendationsMatch) sections.analysis = text;

  if (strengthsMatch) sections.strengths = strengthsMatch[1].trim();
  if (improvementsMatch) sections.improvements = improvementsMatch[1].trim();

  if (recommendationsMatch) {
    sections.recommendations = splitRecommendations(recommendationsMatch[1].trim());
  }

  return sections;
};
