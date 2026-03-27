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

const tryExtractSection = (
  text: string,
  headingPattern: RegExp,
  stopPattern?: RegExp | null,
  shouldClean: boolean = true
): string => {
  const headingMatch = text.match(headingPattern);
  if (!headingMatch || headingMatch.index === undefined) return "";

  const start = headingMatch.index + headingMatch[0].length;
  const afterHeading = text.slice(start).trimStart();
  const stopMatch = stopPattern ? afterHeading.match(stopPattern) : null;
  const raw = stopMatch ? afterHeading.slice(0, stopMatch.index) : afterHeading;
  return shouldClean ? cleanSection(raw) : raw.trim();
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

const cleanRecommendationItems = (items: string[]): string[] =>
  items
    .map(item => cleanSection(item))
    .filter(item => item.length > 0);

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

  const optionalSectionNumberPrefix = String.raw`(?:\d+(?:\.\d+)*(?:[.)])?\s*)?`;

  const stopAfterAnalysis = new RegExp(
    String.raw`(?:\n\s*${optionalSectionNumberPrefix}(?:KEY\s+)?STRENGTHS?\b|\n\s*${optionalSectionNumberPrefix}AREAS?\s+FOR\s+IMPROVEMENT\b|\n\s*${optionalSectionNumberPrefix}GAP\s+ANALYSIS\b|\n\s*${optionalSectionNumberPrefix}(?:TOP\s+)?RECOMMENDATIONS?\b|\n\s*${optionalSectionNumberPrefix}ACTION\s+PLAN\b|\n\s*${optionalSectionNumberPrefix}NEXT\s+STEPS?\b)`,
    "i"
  );
  const stopAfterStrengths = new RegExp(
    String.raw`(?:\n\s*${optionalSectionNumberPrefix}AREAS?\s+FOR\s+IMPROVEMENT\b|\n\s*${optionalSectionNumberPrefix}GAP\s+ANALYSIS\b|\n\s*${optionalSectionNumberPrefix}(?:TOP\s+)?RECOMMENDATIONS?\b|\n\s*${optionalSectionNumberPrefix}ACTION\s+PLAN\b|\n\s*${optionalSectionNumberPrefix}NEXT\s+STEPS?\b)`,
    "i"
  );
  const stopAfterImprovements = new RegExp(
    String.raw`(?:\n\s*${optionalSectionNumberPrefix}(?:TOP\s+)?RECOMMENDATIONS?\b|\n\s*${optionalSectionNumberPrefix}ACTION\s+PLAN\b|\n\s*${optionalSectionNumberPrefix}NEXT\s+STEPS?\b)`,
    "i"
  );
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
    recommendationHeadingPattern,
    null,
    false
  );

  if (recommendationSection) {
    sections.recommendations = cleanRecommendationItems(splitRecommendations(recommendationSection));
  }

  if (!sections.analysis) {
    const firstParagraph = normalized
      .split(/\n\n+/)
      .map(part => part.trim())
      .find(part => part.length > 0 && !/\b(?:TOP\s+)?RECOMMENDATIONS?\b|\bRECOMMEND(?:ATION)?S?\b|\bACTIONABLE\s+RECOMMEND(?:ATION)?S?\b|\bACTION\s+PLAN\b|\bNEXT\s+STEPS?\b|\bKEY\s+STRENGTHS?\b|\bSTRENGTHS?\b|\bAREAS?\s+FOR\s+IMPROVEMENT\b|\bAREAS?\s+THAT\s+NEED\s+IMPROVEMENT\b|\bIMPROVEMENTS?\b|\bGAP\s+ANALYSIS\b|\bKEY\s+INDICATORS?\b/i.test(part));

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

      const fallbackSplit = cleanRecommendationItems(splitRecommendations(recommendationOnlyText)).slice(0, 6);
      if (fallbackSplit.length > 0) {
        sections.recommendations = fallbackSplit;
      }
    }
  }

  return sections;
};
