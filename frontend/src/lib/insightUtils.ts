/**
 * Utility functions for parsing and processing AI-generated insights
 */

export interface InsightSections {
  analysis: string;
  strengths: string;
  improvements: string;
  recommendations: string[];
}

const normalizeInsightText = (text: string): string =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const cleanSection = (text: string): string =>
  text
    .replace(/^(?:[-•\u2022]|\d+[\.)]|\(\d+\))\s+/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();

const tryExtractSection = (text: string, headingPattern: RegExp, stopPattern?: RegExp | null): string => {
  const headingMatch = text.match(headingPattern);
  if (!headingMatch || headingMatch.index === undefined) return "";

  const start = headingMatch.index + headingMatch[0].length;
  const afterHeading = text.slice(start).trimStart();
  const stopMatch = stopPattern ? afterHeading.match(stopPattern) : null;
  const raw = stopMatch ? afterHeading.slice(0, stopMatch.index) : afterHeading;
  return cleanSection(raw);
};

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
    .filter(r => r.length > 0)
    .filter(r => !/^top recommendations?:?$/i.test(r));
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

  const normalized = normalizeInsightText(text);

  const stopAfterAnalysis = /(?:\n\s*(?:KEY\s+)?STRENGTHS?\b|\n\s*AREAS?\s+FOR\s+IMPROVEMENT\b|\n\s*GAP\s+ANALYSIS\b|\n\s*(?:TOP\s+)?RECOMMENDATIONS?\b|\n\s*ACTION\s+PLAN\b|\n\s*NEXT\s+STEPS?\b|\n\s*\d+[.)]\s)/i;
  const stopAfterStrengths = /(?:\n\s*AREAS?\s+FOR\s+IMPROVEMENT\b|\n\s*GAP\s+ANALYSIS\b|\n\s*(?:TOP\s+)?RECOMMENDATIONS?\b|\n\s*ACTION\s+PLAN\b|\n\s*NEXT\s+STEPS?\b|\n\s*\d+[.)]\s)/i;
  const stopAfterImprovements = /(?:\n\s*(?:TOP\s+)?RECOMMENDATIONS?\b|\n\s*ACTION\s+PLAN\b|\n\s*NEXT\s+STEPS?\b|\n\s*\d+[.)]\s)/i;
  const recommendationHeadingPattern = /(?:^|\n)\s*(?:4[.)]\s*)?(?:TOP\s+RECOMMENDATIONS?|SPECIFIC\s+ACTIONABLE\s+RECOMMENDATIONS?|ACTIONABLE\s+RECOMMENDATIONS?|RECOMMENDATIONS?|ACTION\s+PLAN|NEXT\s+STEPS?)\s*:?\s*/i;
  const nextTopLevelHeadingPattern = /\n\s*(?:\d+[.)]\s*)?(?:STRATEGIC\s+ANALYSIS|CURRENT\s+PERFORMANCE\s+ANALYSIS|PERFORMANCE\s+ANALYSIS|ANALYSIS|EXECUTIVE\s+SUMMARY|OVERVIEW|KEY\s+STRENGTHS?|STRENGTHS?|KEY\s+INDICATORS|AREAS?\s+THAT\s+NEED\s+IMPROVEMENT|AREAS?\s+FOR\s+IMPROVEMENT|IMPROVEMENTS?|GAP\s+ANALYSIS|TOP\s+RECOMMENDATIONS?|SPECIFIC\s+ACTIONABLE\s+RECOMMENDATIONS?|ACTIONABLE\s+RECOMMENDATIONS?|RECOMMENDATIONS?|ACTION\s+PLAN|NEXT\s+STEPS?)\s*:?\s*/i;

  sections.analysis = tryExtractSection(
    normalized,
    /(?:^|\n)\s*(?:1[.)]\s*)?(?:STRATEGIC\s+ANALYSIS|CURRENT\s+PERFORMANCE\s+ANALYSIS|PERFORMANCE\s+ANALYSIS|ANALYSIS|EXECUTIVE\s+SUMMARY|OVERVIEW)\s*:?\s*/i,
    stopAfterAnalysis
  );

  sections.strengths = tryExtractSection(
    normalized,
    /(?:^|\n)\s*(?:2[.)]\s*)?(?:KEY\s+STRENGTHS?|STRENGTHS?|KEY\s+INDICATORS)\s*:?\s*/i,
    stopAfterStrengths
  );

  sections.improvements = tryExtractSection(
    normalized,
    /(?:^|\n)\s*(?:3[.)]\s*)?(?:AREAS?\s+THAT\s+NEED\s+IMPROVEMENT|AREAS?\s+FOR\s+IMPROVEMENT|IMPROVEMENTS?|GAP\s+ANALYSIS)\s*:?\s*/i,
    stopAfterImprovements
  );

  const recommendationSection = tryExtractSection(
    normalized,
    recommendationHeadingPattern
  );

  if (recommendationSection) {
    sections.recommendations = splitRecommendations(recommendationSection);
  }

  if (!sections.analysis) {
    const firstParagraph = normalized
      .split(/\n\n+/)
      .map(part => part.trim())
      .find(part => part.length > 0 && !/(?:^|\s)(?:TOP\s+)?RECOMMENDATIONS?|ACTION\s+PLAN|NEXT\s+STEPS?|KEY\s+STRENGTHS?|AREAS?\s+FOR\s+IMPROVEMENT|GAP\s+ANALYSIS(?:\s|$)/i.test(part));

    if (firstParagraph) {
      sections.analysis = cleanSection(firstParagraph);
    }
  }

  if (!sections.analysis && !sections.strengths && !sections.improvements && sections.recommendations.length === 0) {
    sections.analysis = normalized;
  }

  if (sections.recommendations.length === 0) {
    const recommendationHeadingMatch = normalized.match(recommendationHeadingPattern);
    if (recommendationHeadingMatch && recommendationHeadingMatch.index !== undefined) {
      const start = recommendationHeadingMatch.index + recommendationHeadingMatch[0].length;
      const afterHeading = normalized.slice(start).trimStart();
      const nextHeadingMatch = afterHeading.match(nextTopLevelHeadingPattern);
      const recommendationOnlyText = nextHeadingMatch
        ? afterHeading.slice(0, nextHeadingMatch.index)
        : afterHeading;

      const fallbackSplit = splitRecommendations(cleanSection(recommendationOnlyText)).slice(0, 6);
      if (fallbackSplit.length > 0) {
        sections.recommendations = fallbackSplit;
      }
    }
  }

  return sections;
};
