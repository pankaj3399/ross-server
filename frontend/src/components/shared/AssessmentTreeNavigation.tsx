"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconChevronRight,
  IconChevronsRight,
  IconCircleCheck,
  IconCircle,
  IconFileText,
  IconBrain,
  IconShield,
  IconScale,
  IconClipboardCheck,
  IconLock,
  IconClock,
} from "@tabler/icons-react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PREMIUM_STATUS } from "../../lib/constants";
import { apiService } from "../../lib/api";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

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
  is_premium?: boolean;
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
  hidePremiumFeaturesButton = false,
}) => {
  const { user } = useAuth();
  const router = useRouter();

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
      const idMatch = DOMAIN_PRIORITY.findIndex((entry) => normalize(entry.id) === normalizedId);
      if (idMatch !== -1) return idMatch;
      const titleMatch = DOMAIN_PRIORITY.findIndex((entry) => normalize(entry.title) === normalizedTitle);
      if (titleMatch !== -1) return titleMatch;
      return DOMAIN_PRIORITY.length + (originalOrderMap.get(domain.id) ?? 0);
    };

    return [...domains].sort((a, b) => {
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      return priorityA !== priorityB ? priorityA - priorityB : (originalOrderMap.get(a.id) ?? 0) - (originalOrderMap.get(b.id) ?? 0);
    });
  }, [domains]);

  const activeDomainId = currentDomainId;

  const { standardDomains, premiumDomains } = useMemo(() => {
    return {
      standardDomains: orderedDomains.filter(d => !d.is_premium),
      premiumDomains: orderedDomains.filter(d => d.is_premium)
    };
  }, [orderedDomains]);

  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(activeDomainId ?? null);
  const [expandedPractices, setExpandedPractices] = useState<Record<string, string | null>>(() =>
    activeDomainId && currentPracticeId ? { [activeDomainId]: currentPracticeId } : {}
  );
  const [isAssessmentExpanded, setIsAssessmentExpanded] = useState(true);
  const [isPremiumDomainsExpanded, setIsPremiumDomainsExpanded] = useState(true);
  const [isPremiumFeaturesExpanded, setIsPremiumFeaturesExpanded] = useState(true);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isFairnessHistoryExpanded, setIsFairnessHistoryExpanded] = useState(false);
  const [isGovernanceExpanded, setIsGovernanceExpanded] = useState(false);

  // Fetch recent reports when premium features are expanded
  useEffect(() => {
    if (projectId && isPremiumFeaturesExpanded) {
      const fetchReports = async () => {
        try {
          const response = await apiService.getDatasetReports(projectId);
          if (response.success) {
            setRecentReports(response.reports.slice(0, 3));
          }
        } catch (error) {
          console.error("Failed to fetch recent reports:", error);
        }
      };
      fetchReports();
    }
  }, [projectId, isPremiumFeaturesExpanded]);

  const handleReportClick = (report: any) => {
    const payload = {
      result: {
        fairness: report.fairness_data,
        fairnessResult: report.fairness_result,
        biasness: report.biasness_result,
        toxicity: report.toxicity_result,
        relevance: report.relevance_result,
        faithfulness: report.faithfulness_result,
      },
      fileMeta: {
        name: report.file_name,
        size: report.file_size,
        uploadedAt: report.uploaded_at,
      },
      preview: report.csv_preview,
      generatedAt: report.created_at,
      selections: report.selections || {
        metric: "adverseImpact",
        method: "selectionRate",
        group: "genderRace",
        resumeFilter: "all",
        threshold: 0.5,
        testType: "userData",
      },
    };

    if (typeof window !== "undefined") {
      const storageKey = `dataset-testing-report:${projectId}`;
      window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
      router.push(`/assess/${projectId}/fairness-bias/dataset-testing/report`);
    }
  };

  const currentQuestionRef = useRef<HTMLLIElement>(null);

  // Sync expansions with navigation
  useEffect(() => {
    if (activeDomainId) {
      setExpandedDomainId((prev) => (prev === activeDomainId ? prev : activeDomainId));
    }
  }, [activeDomainId]);

  useEffect(() => {
    if (activeDomainId && currentPracticeId) {
      setExpandedPractices((prev) => {
        if (prev[activeDomainId] === currentPracticeId) return prev;
        return { ...prev, [activeDomainId]: currentPracticeId };
      });
    }
  }, [activeDomainId, currentPracticeId]);

  // Scroll to active question
  useEffect(() => {
    if (!currentPracticeId) return;
    const timeoutId = window.setTimeout(() => {
      currentQuestionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [activeDomainId, currentPracticeId, currentQuestionIndex]);

  const toggleDomain = (domainId: string) => {
    setExpandedDomainId((prev) => (prev === domainId ? null : domainId));
  };

  const togglePractice = (domainId: string, practiceId: string) => {
    setExpandedPractices((prev) => ({
      ...prev,
      [domainId]: prev[domainId] === practiceId ? null : practiceId,
    }));
  };

  const CompactProgress = ({ current, total, isCompleted }: { current: number; total: number; isCompleted: boolean }) => {
    return (
      <span
        className={cn(
          "text-[10px] font-mono ml-auto",
          isCompleted ? "text-green-500" : current > 0 ? "text-blue-500" : "text-muted-foreground/60"
        )}
      >
        {current}/{total}
      </span>
    );
  };

  return (
    <Sidebar collapsible="none" className="w-80 border-r bg-sidebar" style={{ "--sidebar-width": "20rem" } as React.CSSProperties}>
      <SidebarContent>
        {/* SECTION 1: ASSESSMENT */}
        <SidebarGroup className="px-2 py-1">
          <div
            className="group/label flex items-center px-2 py-2 mb-2 cursor-pointer rounded-md transition-colors hover:bg-sidebar-accent"
            onClick={() => setIsAssessmentExpanded(!isAssessmentExpanded)}
          >
            <IconChevronsRight
              className={cn(
                "h-5 w-5 transition-transform text-foreground",
                isAssessmentExpanded && "rotate-90"
              )}
            />
            <span className="ml-2 text-[13px] font-bold uppercase tracking-[0.15em] text-foreground group-hover/label:text-foreground">
              Assessment Progress
            </span>
          </div>
          <AnimatePresence>
            {isAssessmentExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <SidebarGroupContent>
                  <SidebarMenu>
                    {standardDomains.map((domain) => {
                      const isActive = activeDomainId === domain.id && !currentPracticeId;
                      const isExpanded = expandedDomainId === domain.id;

                      return (
                        <SidebarMenuItem key={domain.id}>
                          <SidebarMenuButton
                            onClick={() => {
                              onDomainClick(domain.id);
                              toggleDomain(domain.id);
                            }}
                            isActive={isActive}
                            className="group/domain h-9 px-2"
                          >
                            <IconChevronRight
                              className={cn(
                                "h-3.5 w-3.5 transition-transform text-muted-foreground group-hover/domain:text-foreground",
                                isExpanded && "rotate-90"
                              )}
                            />
                            <span className={cn(
                              "font-semibold text-sm truncate ml-1",
                              isActive ? "text-foreground" : "text-foreground/80"
                            )}>
                              {domain.title}
                            </span>
                            <CompactProgress
                              current={domain.questionsAnswered}
                              total={domain.totalQuestions}
                              isCompleted={domain.isCompleted}
                            />
                          </SidebarMenuButton>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <SidebarMenuSub>
                                  {domain.practices.map((practice) => {
                                    const isPracticeActive = activeDomainId === domain.id && currentPracticeId === practice.id;
                                    const isPracticeExpanded = expandedPractices[domain.id] === practice.id;

                                    return (
                                      <SidebarMenuSubItem key={practice.id}>
                                        <SidebarMenuSubButton
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onPracticeClick(domain.id, practice.id);
                                            togglePractice(domain.id, practice.id);
                                          }}
                                          isActive={isPracticeActive && !currentQuestionIndex && currentQuestionIndex !== 0}
                                          className="group/practice h-8 px-2"
                                        >
                                          <IconChevronRight
                                            className={cn(
                                              "h-3 w-3 transition-transform opacity-60 group-hover/practice:opacity-100",
                                              isPracticeExpanded && "rotate-90",
                                              (!practice.questions || practice.questions.length === 0) && "invisible"
                                            )}
                                          />
                                          <span className={cn(
                                            "truncate ml-1 text-[13px]",
                                            isPracticeActive ? "text-foreground font-medium" : "text-foreground/80"
                                          )}>
                                            {practice.title}
                                          </span>
                                          <CompactProgress
                                            current={practice.questionsAnswered}
                                            total={practice.totalQuestions}
                                            isCompleted={practice.isCompleted}
                                          />
                                        </SidebarMenuSubButton>

                                        {/* Questions nested inside practice */}
                                        {isPracticeExpanded && practice.questions && practice.questions.length > 0 && (
                                          <SidebarMenuSub className="border-l border-sidebar-border ml-2.5 pl-3 mt-1 gap-0.5">
                                            {practice.questions.map((question, qIdx) => {
                                              const isQActive = isPracticeActive && currentQuestionIndex === qIdx;
                                              return (
                                                <SidebarMenuSubItem key={qIdx} ref={isQActive ? currentQuestionRef : null}>
                                                  <SidebarMenuSubButton
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      onQuestionClick(domain.id, practice.id, qIdx);
                                                    }}
                                                    isActive={isQActive}
                                                    className="h-auto py-2 px-2"
                                                  >
                                                    <div className="flex items-start gap-2.5 w-full">
                                                      <div className="mt-1 shrink-0">
                                                        {question.isAnswered ?
                                                          <IconCircleCheck className="h-3 w-3 text-green-500" /> :
                                                          <IconCircle className="h-3 w-3 text-muted-foreground/30" />
                                                        }
                                                      </div>
                                                      <span className={cn(
                                                        "text-[12px] leading-snug line-clamp-2",
                                                        isQActive ? "text-sidebar-foreground font-medium" : "text-muted-foreground/80"
                                                      )}>
                                                        {question.question}
                                                      </span>
                                                    </div>
                                                  </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                              );
                                            })}
                                          </SidebarMenuSub>
                                        )}
                                      </SidebarMenuSubItem>
                                    );
                                  })}
                                </SidebarMenuSub>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </motion.div>
            )}
          </AnimatePresence>
        </SidebarGroup>



        {/* SECTION 3: PREMIUM FEATURES */}
        {projectId && !hidePremiumFeaturesButton && (
          <SidebarGroup className="px-2 py-1">
            <div
              className="group/label flex items-center px-2 py-2 mb-2 cursor-pointer rounded-md transition-colors hover:bg-sidebar-accent"
              onClick={() => setIsPremiumFeaturesExpanded(!isPremiumFeaturesExpanded)}
            >
              <IconChevronsRight
                className={cn(
                  "h-5 w-5 transition-transform text-foreground",
                  isPremiumFeaturesExpanded && "rotate-90"
                )}
              />
              <span className="ml-2 text-[13px] font-bold uppercase tracking-[0.15em] text-foreground group-hover/label:text-foreground">
                Premium Features
              </span>
            </div>
            <AnimatePresence>
              {isPremiumFeaturesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-1">
                      {[
                        {
                          id: "vulnerability",
                          label: "AI Vulnerability Assessment",
                          icon: IconShield,
                          onClick: () => premiumStatus ? router.push(`/assess/${projectId}/premium-domains`) : router.push(`/manage-subscription`),
                          locked: !premiumStatus,
                          color: "text-blue-500"
                        },
                        {
                          id: "fairness",
                          label: "Automated Bias & Fairness Testing",
                          icon: IconScale,
                          onClick: () => router.push(`/assess/${projectId}/fairness-bias/options`),
                          locked: false,
                          color: "text-amber-500"
                        },
                        {
                          id: "governance",
                          label: "Actionable Governance Controls",
                          icon: IconClipboardCheck,
                          onClick: () => { }, // Handled in the parent onClick
                          locked: false,
                          color: "text-green-500"
                        }
                      ].map((item, idx) => {
                        const isFairness = item.id === "fairness";
                        const isGovernance = item.id === "governance";

                        // Expand logic
                        const showHistoryToggle = isFairness;
                        const showGovernanceToggle = isGovernance;

                        let isExpanded = false;
                        if (isFairness) isExpanded = isFairnessHistoryExpanded;
                        if (isGovernance) isExpanded = isGovernanceExpanded;

                        return (
                          <SidebarMenuItem key={idx}>
                            <SidebarMenuButton
                              onClick={() => {
                                if (isFairness) {
                                  setIsFairnessHistoryExpanded(!isFairnessHistoryExpanded);
                                } else if (isGovernance) {
                                  setIsGovernanceExpanded(!isGovernanceExpanded);
                                } else {
                                  item.onClick();
                                }
                              }}
                              className="group/premium-btn h-10 px-2"
                            >
                              <IconChevronRight
                                className={cn(
                                  "h-4 w-4 transition-transform text-muted-foreground group-hover/premium-btn:text-foreground",
                                  isExpanded && "rotate-90",
                                  (!showHistoryToggle && !showGovernanceToggle) && "invisible"
                                )}
                              />
                              <item.icon className={cn("ml-1 h-5 w-5", item.color)} />
                              <span className="font-semibold text-[14px] truncate ml-2 text-foreground/80 group-hover/premium-btn:text-foreground">
                                {item.label}
                              </span>
                              {item.locked && <IconLock className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />}
                            </SidebarMenuButton>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  {isFairness && (
                                    <SidebarMenuSub className="border-l border-sidebar-border ml-[21px] pl-4 mt-1 gap-1">
                                      {recentReports.length > 0 ? (
                                        recentReports.map((report) => (
                                          <SidebarMenuSubItem key={report.id}>
                                            <SidebarMenuSubButton
                                              onClick={() => handleReportClick(report)}
                                              className="h-auto py-2 px-2 group/history-item"
                                            >
                                              <div className="flex items-center gap-3 w-full">
                                                <IconClock className="h-3.5 w-3.5 text-muted-foreground/60 group-hover/history-item:text-foreground" />
                                                <span className="text-[13px] leading-snug truncate text-muted-foreground/80 group-hover/history-item:text-foreground">
                                                  {report.file_name}
                                                </span>
                                              </div>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        ))
                                      ) : (
                                        <div className="px-2 py-2 text-[12px] text-muted-foreground/80 italic">
                                          No evaluations yet
                                        </div>
                                      )}
                                      <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                          onClick={() => router.push(`/assess/${projectId}/fairness-bias/dataset-testing`)}
                                          className="h-auto py-2 px-2 mt-1 hover:bg-sidebar-accent/50"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] uppercase tracking-wider font-bold text-primary/80 hover:text-primary">
                                              View All History →
                                            </span>
                                          </div>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                  )}

                                  {isGovernance && premiumDomains.length > 0 && (
                                    <SidebarMenuSub className="border-l border-sidebar-border ml-[21px] pl-4 mt-1 gap-1">
                                      {premiumDomains.map((domain) => {
                                        const isActive = activeDomainId === domain.id && !currentPracticeId;
                                        const isExpanded = expandedDomainId === domain.id;

                                        return (
                                          <SidebarMenuSubItem key={domain.id}>
                                            <SidebarMenuSubButton
                                              onClick={() => {
                                                onDomainClick(domain.id);
                                                toggleDomain(domain.id);
                                              }}
                                              isActive={isActive}
                                              className="group/domain h-9 px-2"
                                            >
                                              <IconChevronRight
                                                className={cn(
                                                  "h-3.5 w-3.5 transition-transform text-muted-foreground group-hover/domain:text-foreground",
                                                  isExpanded && "rotate-90"
                                                )}
                                              />
                                              <IconBrain className="ml-1 h-3.5 w-3.5 text-purple-500" />
                                              <span className={cn(
                                                "font-semibold text-sm truncate ml-1",
                                                isActive ? "text-foreground" : "text-foreground/80"
                                              )}>
                                                {domain.title}
                                              </span>
                                              <CompactProgress
                                                current={domain.questionsAnswered}
                                                total={domain.totalQuestions}
                                                isCompleted={domain.isCompleted}
                                              />
                                              {!premiumStatus && <IconLock className="ml-1 h-3 w-3 text-muted-foreground/50" />}
                                            </SidebarMenuSubButton>

                                            <AnimatePresence>
                                              {isExpanded && (
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: "auto", opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  transition={{ duration: 0.2 }}
                                                  className="overflow-hidden"
                                                >
                                                  <SidebarMenuSub className="border-l border-sidebar-border ml-2.5 pl-3 mt-1 gap-0.5">
                                                    {domain.practices.map((practice) => {
                                                      const isPracticeActive = activeDomainId === domain.id && currentPracticeId === practice.id;
                                                      const isPracticeExpanded = expandedPractices[domain.id] === practice.id;

                                                      return (
                                                        <SidebarMenuSubItem key={practice.id}>
                                                          <SidebarMenuSubButton
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              onPracticeClick(domain.id, practice.id);
                                                              togglePractice(domain.id, practice.id);
                                                            }}
                                                            isActive={isPracticeActive && !currentQuestionIndex && currentQuestionIndex !== 0}
                                                            className="group/practice h-8 px-2"
                                                          >
                                                            <IconChevronRight
                                                              className={cn(
                                                                "h-3 w-3 transition-transform opacity-60 group-hover/practice:opacity-100",
                                                                isPracticeExpanded && "rotate-90",
                                                                (!practice.questions || practice.questions.length === 0) && "invisible"
                                                              )}
                                                            />
                                                            <span className={cn(
                                                              "truncate ml-1 text-[13px]",
                                                              isPracticeActive ? "text-foreground font-medium" : "text-foreground/80"
                                                            )}>
                                                              {practice.title}
                                                            </span>
                                                            <CompactProgress
                                                              current={practice.questionsAnswered}
                                                              total={practice.totalQuestions}
                                                              isCompleted={practice.isCompleted}
                                                            />
                                                          </SidebarMenuSubButton>

                                                          {/* Questions nested inside practice */}
                                                          {isPracticeExpanded && practice.questions && practice.questions.length > 0 && (
                                                            <SidebarMenuSub className="border-l border-sidebar-border ml-2.5 pl-3 mt-1 gap-0.5">
                                                              {practice.questions.map((question, qIdx) => {
                                                                const isQActive = isPracticeActive && currentQuestionIndex === qIdx;
                                                                return (
                                                                  <SidebarMenuSubItem key={qIdx} ref={isQActive ? currentQuestionRef : null}>
                                                                    <SidebarMenuSubButton
                                                                      onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onQuestionClick(domain.id, practice.id, qIdx);
                                                                      }}
                                                                      isActive={isQActive}
                                                                      className="h-auto py-1.5"
                                                                    >
                                                                      <div className="flex items-start gap-2 w-full">
                                                                        <div className="mt-0.5 shrink-0">
                                                                          {question.isAnswered ?
                                                                            <IconCircleCheck className="h-3.5 w-3.5 text-green-500" /> :
                                                                            <IconCircle className="h-3.5 w-3.5 text-muted-foreground/40" />
                                                                          }
                                                                        </div>
                                                                        <span className={cn(
                                                                          "text-xs leading-relaxed line-clamp-2",
                                                                          isQActive ? "text-sidebar-foreground" : "text-muted-foreground/80"
                                                                        )}>
                                                                          {question.question}
                                                                        </span>
                                                                      </div>
                                                                    </SidebarMenuSubButton>
                                                                  </SidebarMenuSubItem>
                                                                );
                                                              })}
                                                            </SidebarMenuSub>
                                                          )}
                                                        </SidebarMenuSubItem>
                                                      );
                                                    })}
                                                  </SidebarMenuSub>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </SidebarMenuSubItem>
                                        );
                                      })}
                                    </SidebarMenuSub>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </motion.div>
              )}
            </AnimatePresence>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AssessmentTreeNavigation;
