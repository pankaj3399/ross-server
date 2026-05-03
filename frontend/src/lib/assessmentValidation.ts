import type { DomainWithLevels } from "../contexts/AssessmentContext";
import { stripHTML } from "./htmlUtils";

export const buildAssessmentAnswerKey = (
  domainId: string,
  practiceId: string,
  level: string | number,
  stream: string,
  questionIndex: number,
): string => `${domainId}:${practiceId}:${level}:${stream}:${questionIndex}`;

export interface MissingQuestion {
  domainId: string;
  practiceId: string;
  level: string;
  stream: string;
  questionIndex: number;
  domainTitle: string;
  practiceTitle: string;
  questionText: string;
}

export const getMissingQuestions = (
  domains: DomainWithLevels[],
  answers: Record<string, number>,
): MissingQuestion[] => {
  const missing: MissingQuestion[] = [];
  for (const domain of domains) {
    for (const [practiceId, practice] of Object.entries(domain.practices)) {
      let questionIndex = 0;
      for (const [level, streams] of Object.entries(practice.levels || {})) {
        for (const [stream, entries] of Object.entries(streams)) {
          if (!Array.isArray(entries)) continue;
          for (const entry of entries) {
            const text =
              typeof entry === "string" ? entry : entry?.question_text;
            if (!text) continue;
            const key = buildAssessmentAnswerKey(domain.id, practiceId, level, stream, questionIndex);
            if (answers[key] === undefined) {
              missing.push({
                domainId: domain.id,
                practiceId,
                level,
                stream,
                questionIndex,
                domainTitle: domain.title,
                practiceTitle: practice.title,
                questionText: stripHTML(text),
              });
            }
            questionIndex++;
          }
        }
      }
    }
  }
  return missing;
};
