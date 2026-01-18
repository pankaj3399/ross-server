"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconChevronRight,
  IconChevronDown,
  IconCircleCheck,
  IconCircle,
  IconClock,
  IconFileText,
  IconBrain,
  IconLock,
  IconCrown,
  IconScale,
} from "@tabler/icons-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PREMIUM_STATUS } from "../../lib/constants";

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
  hidePremiumFeaturesButton?: boolean;
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
  hidePremiumFeaturesButton = false,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  // Determine premium status from user data or prop
  const userIsPremium = user?.subscription_status ? PREMIUM_STATUS.includes(user.subscription_status as typeof PREMIUM_STATUS[number]) : false;
  const premiumStatus = isPremium !== undefined ? isPremium : userIsPremium;
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

  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(
    activeDomainId ?? null,
  );
  const [expandedPractices, setExpandedPractices] = useState<
    Record<string, string | null>
  >(() =>
    activeDomainId && currentPracticeId
      ? { [activeDomainId]: currentPracticeId }
      : {},
  );

  // Refs for scrolling to current question
  const currentQuestionRef = useRef<HTMLDivElement>(null);

  // Keep the active domain expanded when navigation changes it
  useEffect(() => {
    if (!activeDomainId) {
      setExpandedDomainId(null);
      return;
    }
    setExpandedDomainId((prev) =>
      prev === activeDomainId ? prev : activeDomainId,
    );
  }, [activeDomainId]);

  // Keep the active practice expanded when navigation changes it
  useEffect(() => {
    if (!activeDomainId) return;
    if (currentPracticeId === undefined) return;

    setExpandedPractices((prev) => {
      const current = prev[activeDomainId];
      if (current === currentPracticeId) return prev;
      return { ...prev, [activeDomainId]: currentPracticeId ?? null };
    });
  }, [activeDomainId, currentPracticeId]);

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
    setExpandedDomainId((prev) => (prev === domainId ? null : domainId));
  };

  const togglePractice = (domainId: string, practiceId: string) => {
    setExpandedPractices((prev) => {
      const current = prev[domainId];
      return { ...prev, [domainId]: current === practiceId ? null : practiceId };
    });
  };

  const safeProgressPercent = (answered: number, total: number) => {
    if (total === 0) return 0;
    return (answered / total) * 100;
  };

  const getProgressColor = (answered: number, total: number) => {
    if (total === 0) return "text-muted-foreground";
    if (answered === 0) return "text-muted-foreground";
    if (answered === total) return "text-primary";
    return "text-foreground";
  };

  const getProgressIcon = (
    answered: number,
    total: number,
    isCompleted: boolean,
  ) => {
    if (isCompleted) return <IconCircleCheck className="w-4 h-4 text-primary" />;
    if (answered > 0) return <IconClock className="w-4 h-4 text-foreground" />;
    return <IconCircle className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="w-80 bg-background border-r border-border h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <IconBrain className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Assessment Progress
          </h2>
        </div>

        <div className="space-y-2">
          {orderedDomains.map((domain) => {
            const isDomainActive = activeDomainId === domain.id;
            const isDomainExpanded = expandedDomainId === domain.id;

            return (
              <div key={domain.id} className="select-none">
                {/* Domain Header */}
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${isDomainActive
                    ? "bg-accent border border-border"
                    : "hover:bg-muted"
                    }`}
                  onClick={() => {
                    onDomainClick(domain.id);
                    toggleDomain(domain.id);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      {isDomainExpanded ? (
                        <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <IconChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      {getProgressIcon(
                        domain.questionsAnswered,
                        domain.totalQuestions,
                        domain.isCompleted,
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {domain.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${domain.questionsAnswered === domain.totalQuestions
                              ? "bg-primary"
                              : domain.questionsAnswered > 0
                                ? "bg-foreground/50"
                                : "bg-muted-foreground/30"
                              }`}
                            style={{
                              width: `${safeProgressPercent(
                                domain.questionsAnswered,
                                domain.totalQuestions
                              )}%`,
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
                          isDomainExpanded &&
                          expandedPractices[domain.id] === practice.id;

                        return (
                          <div key={practice.id} className="space-y-1">
                            {/* Practice Header */}
                            <div
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${activeDomainId === domain.id &&
                                currentPracticeId === practice.id
                                ? "bg-accent/50 border border-border"
                                : "hover:bg-muted"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onPracticeClick(domain.id, practice.id);
                                togglePractice(domain.id, practice.id);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {practice.questions && practice.questions.length > 0 ? (
                                  isPracticeExpanded ? (
                                    <IconChevronDown className="w-3 h-3 text-muted-foreground" />
                                  ) : (
                                    <IconChevronRight className="w-3 h-3 text-muted-foreground" />
                                  )
                                ) : (
                                  <IconFileText className="w-3 h-3 text-muted-foreground" />
                                )}
                                {getProgressIcon(
                                  practice.questionsAnswered,
                                  practice.totalQuestions,
                                  practice.isCompleted,
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-medium text-foreground truncate">
                                  {practice.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 bg-muted rounded-full h-1">
                                    <div
                                      className={`h-1 rounded-full transition-all duration-300 ${practice.questionsAnswered ===
                                        practice.totalQuestions
                                        ? "bg-primary"
                                        : practice.questionsAnswered > 0
                                          ? "bg-foreground/50"
                                          : "bg-muted-foreground/30"
                                        }`}
                                      style={{
                                        width: `${safeProgressPercent(
                                          practice.questionsAnswered,
                                          practice.totalQuestions
                                        )}%`,
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
                                            ? "bg-accent/30 border border-border"
                                            : "hover:bg-muted"
                                            }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onQuestionClick(domain.id, practice.id, questionIndex);
                                          }}
                                        >
                                          <div className="flex items-center gap-2">
                                            {question.isAnswered ? (
                                              <IconCircleCheck className="w-3 h-3 text-primary" />
                                            ) : (
                                              <IconCircle className="w-3 h-3 text-muted-foreground" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground mb-1">
                                              Level {question.level} • Stream {question.stream}
                                            </div>
                                            <div className="text-xs font-medium text-foreground line-clamp-2">
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

          {/* Fairness & Bias Test Button */}
          {projectId && onFairnessBiasClick && (
            <div className="select-none mt-4">
              <div
                className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90`}
                onClick={onFairnessBiasClick}
              >
                <div className="flex justify-center items-center gap-3 flex-1 bg-primary rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <IconScale className="w-4 h-4 text-primary-foreground stroke-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary-foreground truncate">
                      Fairness & Bias Test
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Premium Features Section */}
          {projectId && !hidePremiumFeaturesButton && (
            <div className="select-none">
              <div
                className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200`}
                onClick={() => {
                  if (premiumStatus) {
                    router.push(`/assess/${projectId}/premium-features`);
                  } else {
                    router.push(`/manage-subscription`);
                  }
                }}
              >
                <div className="flex justify-center items-center gap-3 flex-1 bg-primary rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <IconCrown className="w-4 h-4 text-primary-foreground stroke-2 fill-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary-foreground truncate">
                      Premium Features
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Overall Progress Summary */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Overall Progress
          </h3>
          <div className="space-y-2">
            {orderedDomains.map((domain) => (
              <div
                key={domain.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">
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
