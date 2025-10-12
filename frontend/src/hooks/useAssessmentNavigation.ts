"use client";

import { useState, useCallback, useMemo } from "react";

interface Question {
  level: string;
  stream: string;
  question: string;
}

interface Practice {
  title: string;
  description: string;
  questions: Question[];
  levels: {
    [level: string]: {
      [stream: string]: string[];
    };
  };
}

interface Domain {
  id: string;
  title: string;
  description: string;
  practices: { [key: string]: Practice };
}

interface AssessmentData {
  [key: string]: number;
}

interface UseAssessmentNavigationProps {
  domains: any[]; // Use any for now to avoid type conflicts
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
      }> = [];

      Object.entries(domain.practices).forEach(([practiceId, practice]) => {
        // Count answers for this practice by checking keys that match the pattern
        const practiceAnswers = Object.keys(assessmentData).filter((key) =>
          key.startsWith(`${domain.id}:${practiceId}:`),
        );

        // Calculate total questions from levels structure
        let totalQuestions = 0;
        Object.entries((practice as Practice).levels).forEach(
          ([level, streams]) => {
            Object.entries(streams as Record<string, string[]>).forEach(
              ([stream, questions]) => {
                totalQuestions += questions.length;
              },
            );
          },
        );

        const questionsAnswered = practiceAnswers.length;
        const isCompleted = questionsAnswered === totalQuestions;
        const isInProgress = questionsAnswered > 0 && !isCompleted;

        practiceProgress.push({
          id: practiceId,
          title: (practice as Practice).title,
          description: (practice as Practice).description,
          questionsAnswered,
          totalQuestions,
          isCompleted,
          isInProgress,
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

    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < practice.questions.length) {
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
      return {
        domainId: currentDomainId,
        practiceId: prevPracticeId,
        questionIndex: prevPractice.questions.length - 1,
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
      return {
        domainId: prevDomain.id,
        practiceId: lastPracticeId,
        questionIndex: lastPractice.questions.length - 1,
      };
    }

    return null; // At the beginning
  }, [currentDomainId, currentPracticeId, currentQuestionIndex, domains]);

  const getFirstUnansweredQuestion = useCallback(() => {
    for (const domain of domains) {
      for (const [practiceId, practice] of Object.entries(domain.practices)) {
        let questionIndex = 0;
        for (const [level, streams] of Object.entries(
          (practice as Practice).levels,
        )) {
          for (const [stream, questions] of Object.entries(
            streams as Record<string, string[]>,
          )) {
            for (let i = 0; i < questions.length; i++) {
              const key = `${domain.id}:${practiceId}:${level}:${stream}:${i}`;
              if (!(key in assessmentData)) {
                return {
                  domainId: domain.id,
                  practiceId,
                  questionIndex,
                };
              }
              questionIndex++;
            }
          }
        }
      }
    }
    return null; // All questions answered
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
