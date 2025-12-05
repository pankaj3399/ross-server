"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Circle,
  Clock,
  FileText,
  Brain,
  Lock,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface Question {
  level: string;
  stream: string;
  question: string;
  index: number;
  isAnswered: boolean;
}

interface Practice {
  id: string;
  title: string;
  description: string;
  questionsAnswered: number;
  totalQuestions: number;
  isCompleted: boolean;
  isInProgress: boolean;
  questions?: Question[];
}

interface Domain {
  id: string;
  title: string;
  practices: Practice[];
  questionsAnswered: number;
  totalQuestions: number;
  isCompleted: boolean;
  isInProgress: boolean;
}

interface AssessmentTreeNavigationProps {
  domains: Domain[];
  currentDomainId?: string;
  currentPracticeId?: string;
  currentQuestionIndex?: number;
  onDomainClick: (domainId: string) => void;
  onPracticeClick: (domainId: string, practiceId: string) => void;
  onQuestionClick: (domainId: string, practiceId: string, questionIndex: number) => void;
  projectId?: string;
  isPremium?: boolean;
  onFairnessBiasClick?: () => void;
}

const DOMAIN_PRIORITY = [
  { id: "responsible_ai_principles", title: "Responsible AI Principles" },
  { id: "governance", title: "Governance" },
  { id: "data_management", title: "Data Management" },
  { id: "privacy", title: "Privacy" },
  { id: "design", title: "Design" },
  { id: "implementation", title: "Implementation" },
  { id: "verification", title: "Verification" },
  { id: "operations", title: "Operations" },
];

const normalize = (value?: string) => value?.trim().toLowerCase() || "";

const AssessmentTreeNavigation: React.FC<AssessmentTreeNavigationProps> = ({
  domains,
  currentDomainId,
  currentPracticeId,
  currentQuestionIndex,
  onDomainClick,
  onPracticeClick,
  onQuestionClick,
  projectId,
  isPremium,
  onFairnessBiasClick,
}) => {
  const { theme } = useTheme();
  const orderedDomains = useMemo(() => {
    const originalOrderMap = new Map<string, number>();
    domains.forEach((domain, index) => {
      originalOrderMap.set(domain.id, index);
    });

    const getPriority = (domain: Domain) => {
      const normalizedId = normalize(domain.id);
      const normalizedTitle = normalize(domain.title);

      const idMatch = DOMAIN_PRIORITY.findIndex(
        (entry) => normalize(entry.id) === normalizedId,
      );
      if (idMatch !== -1) return idMatch;

      const titleMatch = DOMAIN_PRIORITY.findIndex(
        (entry) => normalize(entry.title) === normalizedTitle,
      );
      if (titleMatch !== -1) return titleMatch;

      return DOMAIN_PRIORITY.length + (originalOrderMap.get(domain.id) ?? 0);
    };

    return [...domains].sort((a, b) => {
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return (originalOrderMap.get(a.id) ?? 0) - (originalOrderMap.get(b.id) ?? 0);
    });
  }, [domains]);

  const defaultDomainId = orderedDomains[0]?.id;
  const activeDomainId = currentDomainId ?? defaultDomainId;

  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
    () => new Set(activeDomainId ? [activeDomainId] : []),
  );
  const [expandedPractices, setExpandedPractices] = useState<Set<string>>(
    new Set([currentPracticeId || '']),
  );

  // Refs for scrolling to current question
  const currentQuestionRef = useRef<HTMLDivElement>(null);

  // Keep the active domain expanded
  useEffect(() => {
    if (!activeDomainId) return;
    setExpandedDomains((prev) => {
      if (prev.size === 1 && prev.has(activeDomainId)) {
        return prev;
      }
      return new Set([activeDomainId]);
    });
  }, [activeDomainId]);

  // Keep the active practice expanded
  useEffect(() => {
    if (!currentPracticeId) {
      setExpandedPractices(new Set());
      return;
    }
    setExpandedPractices((prev) => {
      if (prev.size === 1 && prev.has(currentPracticeId)) {
        return prev;
      }
      return new Set([currentPracticeId]);
    });
  }, [currentPracticeId]);

  // Scroll the tree to keep the active question centered
  useEffect(() => {
    if (!currentPracticeId) return;
    const timeoutId = window.setTimeout(() => {
      if (currentQuestionRef.current) {
        currentQuestionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [activeDomainId, currentPracticeId, currentQuestionIndex]);

  const toggleDomain = (domainId: string) => {
    setExpandedDomains((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(domainId)) {
        newSet.delete(domainId);
      } else {
        newSet.add(domainId);
      }
      return newSet;
    });
  };

  const togglePractice = (practiceId: string) => {
    setExpandedPractices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(practiceId)) {
        newSet.delete(practiceId);
      } else {
        newSet.add(practiceId);
      }
      return newSet;
    });
  };

  const getProgressColor = (answered: number, total: number) => {
    if (answered === 0) return "text-gray-400";
    if (answered === total) return "text-green-500";
    return "text-yellow-500";
  };

  const getProgressIcon = (
    answered: number,
    total: number,
    isCompleted: boolean,
  ) => {
    if (isCompleted) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (answered > 0) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <Circle className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assessment Progress
          </h2>
        </div>

        <div className="space-y-2">
          {orderedDomains.map((domain) => {
            const isDomainActive = activeDomainId === domain.id;
            const isDomainExpanded =
              expandedDomains.has(domain.id) || isDomainActive;

            return (
              <div key={domain.id} className="select-none">
                {/* Domain Header */}
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${isDomainActive
                      ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  onClick={() => {
                    onDomainClick(domain.id);
                    toggleDomain(domain.id);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      {isDomainExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      {getProgressIcon(
                        domain.questionsAnswered,
                        domain.totalQuestions,
                        domain.isCompleted,
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {domain.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${domain.questionsAnswered === domain.totalQuestions
                                ? "bg-green-500"
                                : domain.questionsAnswered > 0
                                  ? "bg-yellow-500"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            style={{
                              width: `${(domain.questionsAnswered /
                                  domain.totalQuestions) *
                                100
                                }%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-xs font-medium ${getProgressColor(
                            domain.questionsAnswered,
                            domain.totalQuestions,
                          )}`}
                        >
                          {domain.questionsAnswered}/{domain.totalQuestions}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Practices */}
                <AnimatePresence>
                  {isDomainExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-6 mt-2 space-y-1"
                    >
                      {domain.practices.map((practice) => {
                        const isPracticeActive =
                          activeDomainId === domain.id &&
                          currentPracticeId === practice.id;
                        const isPracticeExpanded =
                          expandedPractices.has(practice.id) || isPracticeActive;

                        return (
                          <div key={practice.id} className="space-y-1">
                            {/* Practice Header */}
                            <div
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${activeDomainId === domain.id &&
                                  currentPracticeId === practice.id
                                  ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onPracticeClick(domain.id, practice.id);
                                togglePractice(practice.id);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {practice.questions && practice.questions.length > 0 ? (
                                  isPracticeExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-gray-500" />
                                  )
                                ) : (
                                  <FileText className="w-3 h-3 text-gray-400" />
                                )}
                                {getProgressIcon(
                                  practice.questionsAnswered,
                                  practice.totalQuestions,
                                  practice.isCompleted,
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                  {practice.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                    <div
                                      className={`h-1 rounded-full transition-all duration-300 ${practice.questionsAnswered ===
                                          practice.totalQuestions
                                          ? "bg-green-500"
                                          : practice.questionsAnswered > 0
                                            ? "bg-yellow-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                        }`}
                                      style={{
                                        width: `${(practice.questionsAnswered /
                                            practice.totalQuestions) *
                                          100
                                          }%`,
                                      }}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs ${getProgressColor(
                                      practice.questionsAnswered,
                                      practice.totalQuestions,
                                    )}`}
                                  >
                                    {practice.questionsAnswered}/
                                    {practice.totalQuestions}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Questions */}
                            {practice.questions && practice.questions.length > 0 && (
                              <AnimatePresence>
                                {isPracticeExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="ml-6 space-y-1"
                                  >
                                    {practice.questions.map((question, questionIndex) => {
                                      const isCurrentQuestion =
                                        activeDomainId === domain.id &&
                                        currentPracticeId === practice.id &&
                                        currentQuestionIndex === questionIndex;

                                      return (
                                        <div
                                          key={questionIndex}
                                          ref={isCurrentQuestion ? currentQuestionRef : null}
                                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${isCurrentQuestion
                                              ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700"
                                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onQuestionClick(domain.id, practice.id, questionIndex);
                                          }}
                                        >
                                          <div className="flex items-center gap-2">
                                            {question.isAnswered ? (
                                              <CheckCircle className="w-3 h-3 text-green-500" />
                                            ) : (
                                              <Circle className="w-3 h-3 text-gray-400" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                              Level {question.level} • Stream {question.stream}
                                            </div>
                                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                                              {question.question}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Fairness & Bias Test Section */}
          {projectId && onFairnessBiasClick && (
            <div className="select-none">
              <div
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${"hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                onClick={onFairnessBiasClick}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {!isPremium && (
                      <Lock className="w-4 h-4 text-gray-500" />
                    )}
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      Fairness & Bias Test
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Overall Progress Summary */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Overall Progress
          </h3>
          <div className="space-y-2">
            {orderedDomains.map((domain) => (
              <div
                key={domain.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  {domain.title}
                </span>
                <span
                  className={getProgressColor(
                    domain.questionsAnswered,
                    domain.totalQuestions,
                  )}
                >
                  {domain.questionsAnswered}/{domain.totalQuestions}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentTreeNavigation;
