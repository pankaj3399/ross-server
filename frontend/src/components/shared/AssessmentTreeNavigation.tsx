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
  IconScale,
  IconClipboardCheck,
  IconLock,
  IconClock,
  IconFolder,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useAuth } from "../../contexts/AuthContext";
import { useAssessmentContext } from "../../contexts/AssessmentContext";
import { useRouter } from "next/navigation";
import { PREMIUM_STATUS } from "../../lib/constants";
import { apiService } from "../../lib/api";
import { cn } from "@/lib/utils";
import SubscriptionModal from "../features/subscriptions/SubscriptionModal";
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

const CompactProgress = ({ current, total, isCompleted, size = "default" }: { current: number; total: number; isCompleted: boolean; size?: "default" | "sm" }) => {
  return (
    <span
      className={cn(
        size === "sm" ? "text-[9px]" : "text-[10px]",
        "font-mono ml-auto",
        isCompleted ? "text-green-500" : current > 0 ? "text-blue-500" : "text-muted-foreground/60"
      )}
    >
      {current}/{total}
    </span>
  );
};

const DomainTreeItem = ({
  domain,
  currentDomainId,
  currentPracticeId,
  currentQuestionIndex,
  expandedDomainId,
  onDomainClick,
  onPracticeClick,
  onQuestionClick,
  toggleDomain,
  premiumStatus = true,
  activeQuestionRef,
}: {
  domain: Domain;
  currentDomainId: string | undefined;
  currentPracticeId: string | undefined;
  currentQuestionIndex: number | null | undefined;
  expandedDomainId: string | null;
  onDomainClick: (id: string) => void;
  onPracticeClick: (domainId: string, practiceId: string) => void;
  onQuestionClick: (domainId: string, practiceId: string, index: number) => void;
  toggleDomain: (id: string) => void;
  premiumStatus?: boolean;
  activeQuestionRef?: React.RefObject<HTMLLIElement>;
}) => {
  const isDomainActive = currentDomainId === domain.id;
  const isDomainExpanded = expandedDomainId === domain.id;

  return (
    <SidebarMenuItem key={domain.id}>
      <SidebarMenuButton
        onClick={() => {
          onDomainClick(domain.id);
          toggleDomain(domain.id);
        }}
        isActive={isDomainActive && !currentPracticeId}
        className="group/domain h-9 px-2"
      >
        <IconChevronRight
          className={cn(
            "h-3.5 w-3.5 transition-transform text-muted-foreground group-hover/domain:text-foreground",
            isDomainExpanded && "rotate-90"
          )}
        />
        <span className={cn(
          "font-semibold text-sm truncate ml-1",
          isDomainActive && !currentPracticeId ? "text-foreground" : "text-foreground/80"
        )}>
          {domain.title}
        </span>
        <CompactProgress
          current={domain.questionsAnswered}
          total={domain.totalQuestions}
          isCompleted={domain.isCompleted}
        />
        {!premiumStatus && domain.is_premium && <IconLock className="ml-1 h-3 w-3 text-muted-foreground/50" />}
      </SidebarMenuButton>

      <AnimatePresence>
        {isDomainExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <SidebarMenuSub className="border-l border-sidebar-border ml-[21px] pl-4 mt-1 gap-1">
              {domain.practices.map((practice) => {
                const isPracticeActive = isDomainActive && currentPracticeId === practice.id;
                const isPracticeSelectedOnly = isPracticeActive && (currentQuestionIndex === null || currentQuestionIndex === undefined);

                return (
                  <SidebarMenuSubItem key={practice.id}>
                    <SidebarMenuSubButton
                      onClick={() => onPracticeClick(domain.id, practice.id)}
                      isActive={isPracticeSelectedOnly}
                      className="group/practice h-8 px-2"
                    >
                      <IconFolder className="h-3.5 w-3.5 text-muted-foreground group-hover/practice:text-foreground" />
                      <span className="text-[13px] truncate ml-2 text-foreground/70 group-hover/practice:text-foreground">
                        {practice.title}
                      </span>
                      <CompactProgress
                        current={practice.questionsAnswered}
                        total={practice.totalQuestions}
                        isCompleted={practice.isCompleted}
                        size="sm"
                      />
                    </SidebarMenuSubButton>

                    {isPracticeActive && practice.questions && practice.questions.length > 0 && (
                      <SidebarMenuSub className="border-l border-sidebar-border/50 ml-2 pl-3 mt-1 gap-0.5">
                        {practice.questions.map((q, qIdx) => {
                          const isQuestionActive = isPracticeActive && currentQuestionIndex === qIdx;
                          return (
                            <SidebarMenuSubItem key={qIdx} ref={isQuestionActive ? activeQuestionRef : undefined}>
                              <SidebarMenuSubButton
                                onClick={() => onQuestionClick(domain.id, practice.id, qIdx)}
                                isActive={isQuestionActive}
                                className="h-7 px-2 group/question"
                              >
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full transition-colors",
                                  q.isAnswered ? "bg-primary" : "border border-muted-foreground/40",
                                  isQuestionActive && "ring-2 ring-primary/20"
                                )} />
                                <span className={cn(
                                  "text-[12px] truncate ml-2",
                                  isQuestionActive ? "text-foreground font-medium" : "text-muted-foreground group-hover/question:text-foreground"
                                )}>
                                  Q{qIdx + 1}: {q.question}
                                </span>
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
};

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

  // Safe context usage - might be used outside provider in some tests/stories
  let crcCategories: string[] = [];
  try {
    const context = useAssessmentContext();
    crcCategories = context.crcCategories;
  } catch (e) {
    // Ignore if not in provider
  }

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

  const { standardDomains } = useMemo(() => {
    return {
      standardDomains: orderedDomains.filter(d => !d.is_premium),
    };
  }, [orderedDomains]);

  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(activeDomainId ?? null);
  const [expandedPractices, setExpandedPractices] = useState<Record<string, string | null>>(() =>
    activeDomainId && currentPracticeId ? { [activeDomainId]: currentPracticeId } : {}
  );
  const [isAssessmentExpanded, setIsAssessmentExpanded] = useState(true);
  const [isPremiumDomainsExpanded, setIsPremiumDomainsExpanded] = useState(true);
  const [isPremiumFeaturesExpanded, setIsPremiumFeaturesExpanded] = useState(true);
  const [isFairnessExpanded, setIsFairnessExpanded] = useState(false);
  const [isCrcExpanded, setIsCrcExpanded] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Sidebar resize logic
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default 20rem = 320px
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate new width: Since sidebar is on the right, moving mouse left (decreasing X) increases width
      // We need to base it on the window width or the sidebar's right edge position
      // Easier approach: The sidebar right edge is fixed at screen right (due to flex-row-reverse in layout)
      // So new width = window.innerWidth - e.clientX

      const newWidth = window.innerWidth - e.clientX;

      // Limit constraints (min 200px, max 800px or 50% screen)
      const constrainedWidth = Math.max(200, Math.min(newWidth, window.innerWidth * 0.5));
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto'; // Re-enable text selection
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Reset styles on cleanup to handle unmount during resize
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing]);





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



  return (
    <div className="relative flex-shrink-0" style={{ width: sidebarWidth }}>
      {/* Resize Handle - Positioned on the LEFT edge because layout is reversed */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        aria-valuenow={sidebarWidth}
        aria-valuemin={200}
        aria-valuemax={typeof window !== "undefined" ? window.innerWidth * 0.5 : 800}
        tabIndex={0}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 z-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-primary/30"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsResizing(true);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            setSidebarWidth(prev => Math.min(prev + 10, window.innerWidth * 0.5));
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            setSidebarWidth(prev => Math.max(200, prev - 10));
          } else if (e.key === "Escape") {
            e.preventDefault();
            setIsResizing(false);
          }
        }}
      />
      <Sidebar
        collapsible="none"
        className="h-full border-r bg-sidebar"
        style={{
          width: "100%", // Fill the wrapper
          "--sidebar-width": `${sidebarWidth}px`,
          borderLeft: "1px solid hsl(var(--border))", // Add border to the left side since it faces content
          borderRight: "none" // Remove default right border
        } as React.CSSProperties}
      >
        <SidebarContent>
          {/* SECTION 1: ASSESSMENT */}
          <SidebarGroup className="px-2 py-1">
            <button
              type="button"
              className="group/label w-full flex items-center px-2 py-2 mb-2 cursor-pointer rounded-md transition-colors hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-primary/20"
              onClick={() => setIsAssessmentExpanded(!isAssessmentExpanded)}
              aria-expanded={isAssessmentExpanded}
            >
              <IconChevronsRight
                className={cn(
                  "h-5 w-5 transition-transform text-foreground",
                  isAssessmentExpanded && "rotate-90"
                )}
              />
              <span className="ml-2 text-[13px] font-bold uppercase tracking-[0.15em] text-foreground group-hover/label:text-foreground">
                AI Maturity Assessment (AIMA)
              </span>
            </button>
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
                      {standardDomains.map((domain) => (
                        <DomainTreeItem
                          key={domain.id}
                          domain={domain}
                          currentDomainId={activeDomainId}
                          currentPracticeId={currentPracticeId}
                          currentQuestionIndex={currentQuestionIndex}
                          expandedDomainId={expandedDomainId}
                          onDomainClick={onDomainClick}
                          onPracticeClick={onPracticeClick}
                          onQuestionClick={onQuestionClick}
                          toggleDomain={toggleDomain}
                          premiumStatus={premiumStatus}
                          activeQuestionRef={currentQuestionRef}
                        />
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </motion.div>
              )}
            </AnimatePresence>
          </SidebarGroup>



          {/* SECTION 3: PREMIUM FEATURES */}
          {projectId && !hidePremiumFeaturesButton && (
            <SidebarGroup className="px-2 py-1">
              <button
                type="button"
                className="group/label w-full flex items-center px-2 py-2 mb-2 cursor-pointer rounded-md transition-colors hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-primary/20"
                onClick={() => setIsPremiumFeaturesExpanded(!isPremiumFeaturesExpanded)}
                aria-expanded={isPremiumFeaturesExpanded}
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
              </button>
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
                            id: "fairness",
                            label: "Automated Bias & Fairness Testing",
                            icon: IconScale,
                            onClick: () => router.push(`/assess/${projectId}/fairness-bias/options`),
                            locked: false,
                            color: "text-amber-500"
                          },
                          {
                            id: "crc",
                            label: "Compliance Readiness Controls",
                            icon: IconShieldCheck,
                            onClick: () => premiumStatus ? router.push(`/assess/${projectId}/crc`) : setShowSubscriptionModal(true),
                            locked: !premiumStatus,
                            color: "text-emerald-500"
                          }
                        ].map((item, idx) => {
                          const isFairness = item.id === "fairness";
                          const showToggle = isFairness;

                          let isExpanded = false;
                          if (isFairness) isExpanded = isFairnessExpanded;
                          if (item.id === "crc") isExpanded = isCrcExpanded;

                          return (
                            <SidebarMenuItem key={idx}>
                              <SidebarMenuButton
                                onClick={() => {
                                  if (isFairness) {
                                    setIsFairnessExpanded(!isFairnessExpanded);
                                    item.onClick();
                                  } else if (item.id === "crc") {
                                    setIsCrcExpanded(!isCrcExpanded);
                                    item.onClick();
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
                                    (!showToggle && item.id !== "crc") && "invisible"
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
                                        <SidebarMenuSubItem>
                                          <SidebarMenuSubButton onClick={() => premiumStatus ? router.push(`/assess/${projectId}/fairness-bias`) : setShowSubscriptionModal(true)} className="h-8 px-2">
                                            <span className="text-[13px] truncate ml-2 text-foreground/70">Manual Prompt Testing</span>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                          <SidebarMenuSubButton onClick={() => premiumStatus ? router.push(`/assess/${projectId}/fairness-bias/api-endpoint`) : setShowSubscriptionModal(true)} className="h-8 px-2">
                                            <span className="text-[13px] truncate ml-2 text-foreground/70">API Automated Testing</span>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                          <SidebarMenuSubButton onClick={() => premiumStatus ? router.push(`/assess/${projectId}/fairness-bias/dataset-testing`) : setShowSubscriptionModal(true)} className="h-8 px-2">
                                            <span className="text-[13px] truncate ml-2 text-foreground/70">Dataset Testing</span>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                      </SidebarMenuSub>
                                    )}
                                    {item.id === "crc" && crcCategories.length > 0 && (
                                      <SidebarMenuSub className="border-l border-sidebar-border ml-[21px] pl-4 mt-1 gap-1">
                                        {crcCategories.map((cat, catIdx) => (
                                          <SidebarMenuSubItem key={catIdx}>
                                            <SidebarMenuSubButton
                                              onClick={() => premiumStatus ? router.push(`/assess/${projectId}/crc?category=${encodeURIComponent(cat)}`) : setShowSubscriptionModal(true)}
                                              className="h-8 px-2"
                                            >
                                              <span className="text-[13px] truncate ml-2 text-foreground/70">{cat}</span>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        ))}
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





        </SidebarContent >
      </Sidebar >
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div >
  );
};

export default AssessmentTreeNavigation;
