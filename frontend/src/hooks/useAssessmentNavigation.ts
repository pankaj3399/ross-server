"use client";

import { useState, useCallback, useMemo } from "react";
import type { PracticeQuestionLevels, PracticeQuestionDetail } from "../lib/api";

interface Question {
  level: string;
  stream: string;
  question: string;
}

type LevelQuestionEntry =
  | string
  | {
      question_text: string;
      description?: string | null;
    };

// Practice interface that accepts PracticeQuestionLevels from the API
// PracticeQuestionDetail matches the object form of LevelQuestionEntry
interface Practice {
  title: string;
  description: string;
  levels: PracticeQuestionLevels;
}

interface QuestionWithStatus {
  level: string;
  stream: string;
  question: string;
  index: number;
  isAnswered: boolean;
}

export interface Domain {
  id: string;
  title: string;
  description: string;
  practices: Record<string, Practice>;
}

interface AssessmentData {
  [key: string]: number;
}

// Helper function to get all questions from levels structure
const extractQuestionText = (
  entry: LevelQuestionEntry | PracticeQuestionDetail | undefined,
): string | null => {
  if (!entry) return null;
  if (typeof entry === "string") {
    return entry;
  }
  return entry.question_text || null;
};

const getAllQuestions = (practice: Practice): Question[] => {
  const questions: Question[] = [];
  if (!practice?.levels) return questions;

  Object.entries(practice.levels).forEach(([level, streams]) => {
    Object.entries(streams).forEach(
      ([stream, questionEntries]) => {
        if (Array.isArray(questionEntries)) {
          questionEntries.forEach((questionEntry) => {
            const questionText = extractQuestionText(questionEntry);
            if (!questionText) {
              return;
            }
            questions.push({
              level,
              stream,
              question: questionText,
            });
          });
        }
      },
    );
  });
  return questions;
};

interface UseAssessmentNavigationProps {
  domains: Domain[];
  assessmentData: AssessmentData;
  currentDomainId?: string;
  currentPracticeId?: string;
  currentQuestionIndex?: number;
}

export const useAssessmentNavigation = ({
  domains,
  assessmentData,
  currentDomainId,
  currentPracticeId,
  currentQuestionIndex = 0,
}: UseAssessmentNavigationProps) => {
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
    new Set([currentDomainId || domains[0]?.id]),
  );

  // Calculate progress for each practice and domain
  const progressData = useMemo(() => {
    const domainProgress = domains.map((domain) => {
      let domainQuestionsAnswered = 0;
      let domainTotalQuestions = 0;
      const practiceProgress: Array<{
        id: string;
        title: string;
        description: string;
        questionsAnswered: number;
        totalQuestions: number;
        isCompleted: boolean;
        isInProgress: boolean;
        questions: QuestionWithStatus[];
      }> = [];

      Object.entries(domain.practices).forEach(([practiceId, practice]) => {
        // Count answers for this practice by checking keys that match the pattern
        const practiceAnswers = Object.keys(assessmentData).filter((key) =>
          key.startsWith(`${domain.id}:${practiceId}:`),
        );

        // Calculate total questions from levels structure and create question objects
        let totalQuestions = 0;
        const questions: QuestionWithStatus[] = [];
        let questionIndex = 0;

        Object.entries(practice.levels).forEach(
          ([level, streams]) => {
            Object.entries(streams).forEach(([stream, questionEntries]) => {
              questionEntries.forEach((questionEntry, entryIndex) => {
                const questionText = extractQuestionText(questionEntry);
                if (!questionText) {
                  return;
                }
                const key = `${domain.id}:${practiceId}:${level}:${stream}:${questionIndex}`;
                const isAnswered = key in assessmentData;

                questions.push({
                  level,
                  stream,
                  question: questionText,
                  index: questionIndex,
                  isAnswered,
                });

                questionIndex++;
                totalQuestions++;
              });
            });
          },
        );

        const questionsAnswered = practiceAnswers.length;
        const isCompleted = questionsAnswered === totalQuestions;
        const isInProgress = questionsAnswered > 0 && !isCompleted;

        practiceProgress.push({
          id: practiceId,
          title: practice.title,
          description: practice.description,
          questionsAnswered,
          totalQuestions,
          isCompleted,
          isInProgress,
          questions,
        });

        domainQuestionsAnswered += questionsAnswered;
        domainTotalQuestions += totalQuestions;
      });

      return {
        id: domain.id,
        title: domain.title,
        practices: practiceProgress,
        questionsAnswered: domainQuestionsAnswered,
        totalQuestions: domainTotalQuestions,
        isCompleted: domainQuestionsAnswered === domainTotalQuestions,
        isInProgress:
          domainQuestionsAnswered > 0 &&
          domainQuestionsAnswered < domainTotalQuestions,
      };
    });

    return domainProgress;
  }, [domains, assessmentData]);

  // Navigation functions
  const navigateToDomain = useCallback((domainId: string) => {
    setExpandedDomains((prev) => new Set([...Array.from(prev), domainId]));
  }, []);

  const navigateToPractice = useCallback(
    (domainId: string, practiceId: string) => {
      setExpandedDomains((prev) => new Set([...Array.from(prev), domainId]));
    },
    [],
  );

  const navigateToQuestion = useCallback(
    (domainId: string, practiceId: string, questionIndex: number) => {
      setExpandedDomains((prev) => new Set([...Array.from(prev), domainId]));
    },
    [],
  );

  const getNextQuestion = useCallback(() => {
    if (!currentDomainId || !currentPracticeId) return null;

    const domain = domains.find((d) => d.id === currentDomainId);
    if (!domain) return null;

    const practice = domain.practices[currentPracticeId];
    if (!practice) return null;

    const allQuestions = getAllQuestions(practice);
    const nextQuestionIndex = currentQuestionIndex + 1;

    if (nextQuestionIndex < allQuestions.length) {
      return {
        domainId: currentDomainId,
        practiceId: currentPracticeId,
        questionIndex: nextQuestionIndex,
      };
    }

    // Move to next practice
    const practiceIds = Object.keys(domain.practices);
    const currentPracticeIndex = practiceIds.indexOf(currentPracticeId);
    if (currentPracticeIndex < practiceIds.length - 1) {
      const nextPracticeId = practiceIds[currentPracticeIndex + 1];
      return {
        domainId: currentDomainId,
        practiceId: nextPracticeId,
        questionIndex: 0,
      };
    }

    // Move to next domain
    const currentDomainIndex = domains.findIndex(
      (d) => d.id === currentDomainId,
    );
    if (currentDomainIndex < domains.length - 1) {
      const nextDomain = domains[currentDomainIndex + 1];
      const nextPracticeId = Object.keys(nextDomain.practices)[0];
      return {
        domainId: nextDomain.id,
        practiceId: nextPracticeId,
        questionIndex: 0,
      };
    }

    return null; // Assessment complete
  }, [currentDomainId, currentPracticeId, currentQuestionIndex, domains]);

  const getPreviousQuestion = useCallback(() => {
    if (!currentDomainId || !currentPracticeId) return null;

    const domain = domains.find((d) => d.id === currentDomainId);
    if (!domain) return null;

    const practice = domain.practices[currentPracticeId];
    if (!practice) return null;

    const prevQuestionIndex = currentQuestionIndex - 1;
    if (prevQuestionIndex >= 0) {
      return {
        domainId: currentDomainId,
        practiceId: currentPracticeId,
        questionIndex: prevQuestionIndex,
      };
    }

    // Move to previous practice
    const practiceIds = Object.keys(domain.practices);
    const currentPracticeIndex = practiceIds.indexOf(currentPracticeId);
    if (currentPracticeIndex > 0) {
      const prevPracticeId = practiceIds[currentPracticeIndex - 1];
      const prevPractice = domain.practices[prevPracticeId];
      const prevQuestions = getAllQuestions(prevPractice);
      return {
        domainId: currentDomainId,
        practiceId: prevPracticeId,
        questionIndex: prevQuestions.length - 1,
      };
    }

    // Move to previous domain
    const currentDomainIndex = domains.findIndex(
      (d) => d.id === currentDomainId,
    );
    if (currentDomainIndex > 0) {
      const prevDomain = domains[currentDomainIndex - 1];
      const prevPracticeIds = Object.keys(prevDomain.practices);
      const lastPracticeId = prevPracticeIds[prevPracticeIds.length - 1];
      const lastPractice = prevDomain.practices[lastPracticeId];
      const lastQuestions = getAllQuestions(lastPractice);
      return {
        domainId: prevDomain.id,
        practiceId: lastPracticeId,
        questionIndex: lastQuestions.length - 1,
      };
    }

    return null; // At the beginning
  }, [currentDomainId, currentPracticeId, currentQuestionIndex, domains]);

  const getFirstUnansweredQuestion = useCallback(() => {
    // Find the first unanswered question in the practice with the most progress
    let bestResumePosition = null;
    let maxAnsweredCount = 0;

    for (const domain of domains) {
      for (const [practiceId, practice] of Object.entries(domain.practices)) {
        let answeredCount = 0;
        let questionIndex = 0;
        let firstUnansweredIndex: number | null = null;

        // Count answered questions and find first unanswered in this practice
        for (const [level, streams] of Object.entries(practice.levels)) {
          for (const [stream, questions] of Object.entries(streams)) {
            questions.forEach((questionEntry) => {
              const questionText = extractQuestionText(questionEntry);
              if (!questionText) {
                return;
              }
              const key = `${domain.id}:${practiceId}:${level}:${stream}:${questionIndex}`;
              if (key in assessmentData) {
                answeredCount++;
                console.log(
                  `Found answered question: ${key} at practice question index: ${questionIndex}`,
                );
              } else if (firstUnansweredIndex === null) {
                firstUnansweredIndex = questionIndex;
                console.log(
                  `First unanswered question in this practice: ${key} at index: ${questionIndex}`,
                );
              }
              questionIndex++;
            });
          }
        }

        // If this practice has more answered questions, it's a better resume point
        if (answeredCount > maxAnsweredCount && firstUnansweredIndex !== null) {
          maxAnsweredCount = answeredCount;
          bestResumePosition = {
            domainId: domain.id,
            practiceId,
            questionIndex: firstUnansweredIndex,
          };
          console.log(
            `New best resume position: ${domain.id}:${practiceId} at question ${firstUnansweredIndex} (${answeredCount} answered)`,
          );
        }
      }
    }

    if (bestResumePosition) {
      console.log(`Resuming from best position:`, bestResumePosition);
      return bestResumePosition;
    }

    return null; // No questions answered, start from beginning
  }, [domains, assessmentData]);

  return {
    progressData,
    expandedDomains,
    setExpandedDomains,
    navigateToDomain,
    navigateToPractice,
    navigateToQuestion,
    getNextQuestion,
    getPreviousQuestion,
    getFirstUnansweredQuestion,
  };
};
