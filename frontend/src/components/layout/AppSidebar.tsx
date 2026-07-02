"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconLayoutDashboard,
  IconSettings,
  IconLogout,
  IconDiamond,
  IconUser,
  IconDatabase,
  IconMoon,
  IconSun,
  IconCrown,
  IconShieldCheck,
  IconBell,
  IconMessageChatbot,
  IconChevronRight,
  IconChevronsRight,
  IconCircleCheck,
  IconCircle,
  IconFolder,
  IconShield,
  IconScale,
  IconClipboardCheck,
  IconTable,
  IconLock,
  IconUsers,
  IconBriefcase,
  IconLayoutDashboard as IconDashboard,
  IconChevronDown,
  IconSelector,
  IconBug,
  IconGift,
} from "@tabler/icons-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { AUTH_LOGIN_URL, ROLES, PREMIUM_STATUS } from "../../lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { isSidebarVisible } from "../../lib/route-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { useNotificationStore } from "@/store/notificationStore";
import { useOptionalAssessmentContext } from "../../contexts/AssessmentContext";
import { apiService, CRCControl } from "../../lib/api";
import { cn } from "@/lib/utils";
import SubscriptionModal from "../features/subscriptions/SubscriptionModal";
import { ProjectSelectionModal } from "./ProjectSelectionModal";
import { useSidebarStore, MIN_WIDTH, MAX_WIDTH_RATIO } from "../../store/sidebarStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
  activePatterns?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const sortDomainsByPriority = (domainsList: any[]) => {
  const originalOrderMap = new Map<string, number>();
  domainsList.forEach((domain: any, index: number) => {
    originalOrderMap.set(domain.id, index);
  });

  const getPriority = (domain: any) => {
    const normalizedId = normalize(domain.id);
    const normalizedTitle = normalize(domain.title);
    const idMatch = DOMAIN_PRIORITY.findIndex((entry) => normalize(entry.id) === normalizedId);
    if (idMatch !== -1) return idMatch;
    const titleMatch = DOMAIN_PRIORITY.findIndex((entry) => normalize(entry.title) === normalizedTitle);
    if (titleMatch !== -1) return titleMatch;
    return DOMAIN_PRIORITY.length + (originalOrderMap.get(domain.id) ?? 0);
  };

  return [...domainsList].sort((a: any, b: any) => {
    const priorityA = getPriority(a);
    const priorityB = getPriority(b);
    return priorityA !== priorityB ? priorityA - priorityB : (originalOrderMap.get(a.id) ?? 0) - (originalOrderMap.get(b.id) ?? 0);
  });
};

// ─── Route Flag Helpers ───────────────────────────────────────────────────────

const getProjectIdFromPath = (pathname: string | null): string | null => {
  const match = pathname?.match(/\/assess\/([a-f0-9-]{36})/i);
  return match ? match[1] : null;
};

const getRouteFlags = (pathname: string | null) => {
  const isCrcPage = !!pathname?.match(/\/crc($|\/|\?)/);
  const isFairnessPage = !!pathname?.match(/\/fairness-bias($|\/|\?)/);
  const isFairnessRootPage = !!pathname?.match(/\/fairness-bias($|\?|\/$)/);
  const isApiEndpointPage = !!pathname?.match(/\/fairness-bias\/api-endpoint($|\/|\?)/);
  const isVulnerabilityPage = !!pathname?.match(/\/vulnerability-assessment($|\/|\?)/);
  const isDatasetTestingPage = !!pathname?.match(/\/fairness-bias\/dataset-testing($|\/|\?)/);
  const isFairnessOptionsPage = !!pathname?.match(/\/fairness-bias\/options($|\/|\?)/);
  const isTeamPage = !!pathname?.match(/\/team($|\/|\?)/);
  const isSettingsPage = !!pathname?.match(/\/assess\/[^/]+\/settings($|\/|\?)/);
  const isInventoryPage = !!pathname?.match(/\/inventory($|\/|\?)/);
  const isAimaPage = !isCrcPage && !isFairnessPage && !isTeamPage && !isSettingsPage && !isInventoryPage && !!pathname?.match(/\/assess\/[^/]+/);
  return {
    isCrcPage,
    isFairnessPage,
    isFairnessRootPage,
    isApiEndpointPage,
    isVulnerabilityPage,
    isDatasetTestingPage,
    isFairnessOptionsPage,
    isTeamPage,
    isSettingsPage,
    isInventoryPage,
    isAimaPage,
  };
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

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

interface Question {
  level: string;
  stream: string;
  question: string;
  index: number;
  isAnswered: boolean;
}

const CompactProgress = ({ current, total, isCompleted, size = "default" }: { current: number; total: number; isCompleted: boolean; size?: "default" | "sm" }) => (
  <span
    className={cn(
      size === "sm" ? "text-[9px]" : "text-[10px]",
      "font-mono ml-auto shrink-0",
      isCompleted ? "text-green-500" : current > 0 ? "text-blue-500" : "text-muted-foreground/60"
    )}
  >
    {current}/{total}
  </span>
);

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
        className="group/domain h-8 px-2"
      >
        <IconChevronRight
          className={cn(
            "h-3.5 w-3.5 transition-transform text-muted-foreground group-hover/domain:text-foreground",
            isDomainExpanded && "rotate-90"
          )}
        />
        <span className={cn(
          "font-semibold text-xs truncate ml-0.5",
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
            <SidebarMenuSub className="border-l border-sidebar-border ml-[18px] pl-3 mt-1 gap-0.5">
              {domain.practices.map((practice) => {
                const isPracticeActive = isDomainActive && currentPracticeId === practice.id;
                const isPracticeSelectedOnly = isPracticeActive && (currentQuestionIndex === null || currentQuestionIndex === undefined);

                return (
                  <SidebarMenuSubItem key={practice.id}>
                    <SidebarMenuSubButton
                      onClick={() => onPracticeClick(domain.id, practice.id)}
                      isActive={isPracticeSelectedOnly}
                      className="group/practice h-7 px-2"
                    >
                      <IconFolder className="h-3 w-3 text-muted-foreground group-hover/practice:text-foreground" />
                      <span className="text-[12px] truncate ml-1.5 text-foreground/70 group-hover/practice:text-foreground">
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
                      <SidebarMenuSub className="border-l border-sidebar-border/50 ml-2 pl-2.5 mt-0.5 gap-0">
                        {practice.questions.map((q, qIdx) => {
                          const isQuestionActive = isPracticeActive && currentQuestionIndex === qIdx;
                          return (
                            <SidebarMenuSubItem key={qIdx} ref={isQuestionActive ? activeQuestionRef : undefined}>
                              <SidebarMenuSubButton
                                onClick={() => onQuestionClick(domain.id, practice.id, qIdx)}
                                isActive={isQuestionActive}
                                className="h-6 px-2 group/question"
                              >
                                {q.isAnswered ? (
                                  <IconCircleCheck className={cn("h-3 w-3", isQuestionActive ? "text-primary" : "text-success")} />
                                ) : (
                                  <IconCircle className={cn("h-3 w-3", isQuestionActive ? "text-primary" : "text-muted-foreground/40")} />
                                )}
                                <span className={cn(
                                  "text-[11px] truncate ml-1.5",
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

// ─── Main Sidebar Content Component ───────────────────────────────────────────

function SidebarContentComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { setOpenMobile, state } = useSidebar();
  const { invitations: myInvitations, fetchInvitations, removeInvitation, clearInvitations } = useNotificationStore();
  const [decliningTokens, setDecliningTokens] = useState<Set<string>>(new Set());
  const fetchInProgress = useRef(false);
  const decliningTokensRef = useRef<Set<string>>(new Set());

  // Assessment context (available when inside /assess/[projectId])
  const assessmentContext = useOptionalAssessmentContext();

  // Subscription modal state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Choose Your Plan");
  const [modalDescription, setModalDescription] = useState<string | undefined>();

  const openSubscriptionModal = useCallback((title?: string, description?: string) => {
    setModalTitle(title || "Choose Your Plan");
    setModalDescription(description);
    setShowSubscriptionModal(true);
  }, []);

  // ─── Project Selection Modal State ──────────────────────────────────────────
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [pendingDestinationRoute, setPendingDestinationRoute] = useState<string>("");
  const [staticDomains, setStaticDomains] = useState<any[]>([]);

  // ─── Sidebar Resizable State ────────────────────────────────────────────────
  const { sidebarWidth, setSidebarWidth, isResizing, setIsResizing } = useSidebarStore();

  const handleProjectAction = useCallback((destinationRoute: string) => {
    const isInsideProject = !!getProjectIdFromPath(pathname);
    if (!isInsideProject) {
      setPendingDestinationRoute(destinationRoute);
      setShowProjectModal(true);
      return true;
    }
    return false;
  }, [pathname]);

  const handleProjectNav = useCallback((route: string) => {
    if (handleProjectAction(route)) return;
    const pid = getProjectIdFromPath(pathname);
    if (pid) router.push(`/assess/${pid}${route}`);
  }, [handleProjectAction, pathname, router]);

  // ─── Determine project context ──────────────────────────────────────────────

  const projectId = getProjectIdFromPath(pathname);
  const isInsideProject = !!projectId;

  // Extract assessment data from context
  const domains = assessmentContext?.domains || [];
  const currentDomainId = assessmentContext?.currentDomainId;
  const currentPracticeId = assessmentContext?.currentPracticeId;
  const currentQuestionIndex = assessmentContext?.currentQuestionIndex;
  const setCurrentDomainId = assessmentContext?.setCurrentDomainId;
  const setCurrentPracticeId = assessmentContext?.setCurrentPracticeId;
  const setCurrentQuestionIndex = assessmentContext?.setCurrentQuestionIndex;
  const isPremium = assessmentContext?.isPremium;
  const projectName = assessmentContext?.projectName;
  const answers = assessmentContext?.answers;

  // CRC data from assessment context
  const crcCategories = assessmentContext?.crcCategories || [];
  const crcControls = assessmentContext?.crcControls || [];
  const crcResponses = assessmentContext?.crcResponses || {};

  const controlsByCategory = useMemo(() => {
    return crcControls.reduce((acc: Record<string, CRCControl[]>, control: CRCControl) => {
      if (!acc[control.category_name]) acc[control.category_name] = [];
      acc[control.category_name].push(control);
      return acc;
    }, {});
  }, [crcControls]);

  const userIsPremium = user?.subscription_status ? PREMIUM_STATUS.includes(user.subscription_status as typeof PREMIUM_STATUS[number]) : false;
  const premiumStatus = isPremium !== undefined ? isPremium : userIsPremium;

  // ─── Route flags ────────────────────────────────────────────────────────────

  const routeFlags = getRouteFlags(pathname);
  const queryCategory = searchParams?.get("category");
  const currentControlId = searchParams?.get("controlId");
  const activeControl = crcControls.find(c => c.id === currentControlId);
  const currentCategory = activeControl ? activeControl.category_name : queryCategory;

  // ─── Domain ordering ────────────────────────────────────────────────────────

  const orderedDomains = useMemo(() => {
    return sortDomainsByPriority(domains);
  }, [domains]);

  const standardDomains = useMemo(() => orderedDomains.filter((d: any) => !d.is_premium), [orderedDomains]);

  // Helper to extract linear list of questions from structured levels map
  const getQuestionsListFromLevels = useCallback((levels: any) => {
    const questionsList: any[] = [];
    if (!levels) return questionsList;
    Object.entries(levels).forEach(([level, streams]: [string, any]) => {
      Object.entries(streams || {}).forEach(([stream, questionEntries]: [string, any]) => {
        if (Array.isArray(questionEntries)) {
          questionEntries.forEach((questionEntry: any) => {
            if (typeof questionEntry === "string") {
              questionsList.push({
                level,
                stream,
                question: questionEntry,
                description: null,
              });
            } else if (questionEntry && questionEntry.question_text) {
              questionsList.push({
                level,
                stream,
                question: questionEntry.question_text,
                description: questionEntry.description || null,
              });
            }
          });
        }
      });
    });
    return questionsList;
  }, []);

  // ─── Progress data for domains (build from answers like useAssessmentNavigation) ──

  const progressData = useMemo(() => {
    if (!domains.length) return [];

    return orderedDomains.map((domain: any) => {
      const practices = Object.entries(domain.practices || {}).map(([practiceId, practice]: [string, any]) => {
        const rawQuestions = getQuestionsListFromLevels(practice.levels);
        const questions = rawQuestions.map((q: any, idx: number) => {
          const answerKey = `${domain.id}_${practiceId}_${idx}`;
          return {
            ...q,
            index: idx,
            isAnswered: answers ? !!answers[answerKey] : false,
          };
        });

        const questionsAnswered = questions.filter((q: any) => q.isAnswered).length;
        return {
          id: practiceId,
          title: practice.title || practiceId,
          description: practice.description || "",
          questionsAnswered,
          totalQuestions: questions.length,
          isCompleted: questionsAnswered === questions.length && questions.length > 0,
          isInProgress: questionsAnswered > 0 && questionsAnswered < questions.length,
          questions,
        };
      });

      const totalQuestions = practices.reduce((sum: number, p: any) => sum + p.totalQuestions, 0);
      const questionsAnswered = practices.reduce((sum: number, p: any) => sum + p.questionsAnswered, 0);

      return {
        ...domain,
        practices,
        totalQuestions,
        questionsAnswered,
        isCompleted: questionsAnswered === totalQuestions && totalQuestions > 0,
        isInProgress: questionsAnswered > 0 && questionsAnswered < totalQuestions,
      };
    });
  }, [orderedDomains, answers, domains, getQuestionsListFromLevels]);

  // ─── Static domains fallback data outside project ──────────────────────────

  const transformedStaticDomains = useMemo(() => {
    if (!staticDomains.length) return [];

    const sortedDomains = sortDomainsByPriority(staticDomains);

    return sortedDomains.map((domain: any) => {
      const practices = Object.entries(domain.practices || {}).map(([practiceId, practice]: [string, any]) => {
        const rawQuestions = getQuestionsListFromLevels(practice.levels);
        const questions = rawQuestions.map((q: any, idx: number) => ({
          ...q,
          index: idx,
          isAnswered: false,
        }));

        return {
          id: practiceId,
          title: practice.title || practiceId,
          description: practice.description || "",
          questionsAnswered: 0,
          totalQuestions: questions.length,
          isCompleted: false,
          isInProgress: false,
          questions,
        };
      });

      const totalQuestions = practices.reduce((sum: number, p: any) => sum + p.totalQuestions, 0);

      return {
        ...domain,
        practices,
        totalQuestions,
        questionsAnswered: 0,
        isCompleted: false,
        isInProgress: false,
      };
    });
  }, [staticDomains, getQuestionsListFromLevels]);

  // Unified domain list that is always populated
  const displayDomains = useMemo(() => {
    if (isInsideProject && progressData.length > 0) {
      return progressData.filter((d: any) => !d.is_premium);
    }
    if (!isInsideProject && transformedStaticDomains.length > 0) {
      return transformedStaticDomains.filter((d: any) => !d.is_premium);
    }
    // Fallback to static AIMA domains outline when outside a project and loading
    return DOMAIN_PRIORITY.map((d) => ({
      id: d.id,
      title: d.title,
      practices: [],
      questionsAnswered: 0,
      totalQuestions: 0,
      isCompleted: false,
      isInProgress: false,
      is_premium: false,
    }));
  }, [isInsideProject, progressData, transformedStaticDomains]);

  // ─── Expansion states ───────────────────────────────────────────────────────

  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(currentDomainId ?? null);
  // For premium/trial users: collapse AIMA by default, expand Premium Features + CRC
  const [isAssessmentExpanded, setIsAssessmentExpanded] = useState(!premiumStatus);
  const [isFreeExpanded, setIsFreeExpanded] = useState(!premiumStatus);
  const [isPremiumFeaturesExpanded, setIsPremiumFeaturesExpanded] = useState(true);
  const [isFairnessExpanded, setIsFairnessExpanded] = useState(!!routeFlags.isFairnessPage);
  const [isCrcExpanded, setIsCrcExpanded] = useState(premiumStatus || !!routeFlags.isCrcPage);
  const [expandedCrcCategories, setExpandedCrcCategories] = useState<Record<string, boolean>>(
    currentCategory ? { [currentCategory]: true } : {}
  );
  const [isProjectSettingsExpanded, setIsProjectSettingsExpanded] = useState(!!routeFlags.isTeamPage || !!routeFlags.isSettingsPage);

  const currentQuestionRef = useRef<HTMLLIElement>(null);

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  // Keep AIMA Assessment toggle closed by default for admin and premium accounts
  useEffect(() => {
    if (user?.role === ROLES.ADMIN || premiumStatus) {
      setIsAssessmentExpanded(false);
      setIsFreeExpanded(false);
    } else {
      setIsAssessmentExpanded(true);
      setIsFreeExpanded(true);
    }
    if (premiumStatus) {
      setIsPremiumFeaturesExpanded(true);
      setIsCrcExpanded(true);
    } else {
      setIsPremiumFeaturesExpanded(false);
      setIsCrcExpanded(false);
    }
  }, [user?.role, premiumStatus]);

  useEffect(() => {
    if (isAuthenticated && !fetchInProgress.current) {
      fetchInProgress.current = true;
      fetchInvitations().finally(() => {
        fetchInProgress.current = false;
      });
    }
  }, [isAuthenticated, pathname, fetchInvitations]);

  // Fetch static AIMA domains when outside a project
  useEffect(() => {
    if (isInsideProject || !isAuthenticated) return;

    let active = true;
    apiService.getDomainsFull()
      .then((data) => {
        if (!active) return;
        if (data && data.domains) {
          setStaticDomains(data.domains);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch static AIMA domains:", err);
      });

    return () => {
      active = false;
    };
  }, [isInsideProject, isAuthenticated]);

  // Sidebar drag resizing listeners
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(MIN_WIDTH, Math.min(e.clientX, window.innerWidth * MAX_WIDTH_RATIO));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth, setIsResizing]);

  // Auto-manage expansion based on route
  useEffect(() => {
    if (!pathname || !isInsideProject) return;

    const flags = getRouteFlags(pathname);

    if (flags.isCrcPage) {
      setIsPremiumFeaturesExpanded(true);
      setIsCrcExpanded(true);
    } else if (flags.isFairnessPage || flags.isVulnerabilityPage) {
      setIsPremiumFeaturesExpanded(true);
      if (flags.isFairnessPage) {
        setIsFairnessExpanded(true);
      }
    } else if (flags.isInventoryPage) {
      setIsPremiumFeaturesExpanded(true);
    } else if (flags.isAimaPage) {
      // Only auto-expand AIMA for free (non-premium) users
      if (!premiumStatus) {
        setIsFreeExpanded(true);
        setIsAssessmentExpanded(true);
      }
    } else if (flags.isTeamPage || flags.isSettingsPage) {
      setIsProjectSettingsExpanded(true);
    }
  }, [pathname, isInsideProject, premiumStatus]);

  // Sync domain expansion
  useEffect(() => {
    if (currentDomainId) {
      setExpandedDomainId((prev) => (prev === currentDomainId ? prev : currentDomainId));
    }
  }, [currentDomainId]);

  // Scroll to active question
  useEffect(() => {
    if (!currentPracticeId) return;
    const timeoutId = window.setTimeout(() => {
      currentQuestionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [currentDomainId, currentPracticeId, currentQuestionIndex]);

  // CRC category expansion sync
  useEffect(() => {
    if (currentCategory) {
      setExpandedCrcCategories(prev => {
        if (prev[currentCategory]) return prev;
        return { ...prev, [currentCategory]: true };
      });
    }
  }, [currentCategory]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleDecline = async (token: string) => {
    if (decliningTokensRef.current.has(token)) return;
    decliningTokensRef.current.add(token);
    setDecliningTokens(prev => new Set(prev).add(token));
    try {
      await apiService.declineInvitation(token);
      showToast.success("Invitation declined");
      removeInvitation(token);
    } catch (error: any) {
      showToast.error(error.message || "Failed to decline invitation");
    } finally {
      decliningTokensRef.current.delete(token);
      setDecliningTokens(prev => {
        const next = new Set(prev);
        next.delete(token);
        return next;
      });
    }
  };

  const handleLogout = () => {
    clearInvitations();
    logout();
    router.replace(AUTH_LOGIN_URL);
  };

  // Assessment navigation handlers
  const handleDomainClick = useCallback((domainId: string) => {
    if (handleProjectAction("")) return;
    if (!assessmentContext || !projectId) return;
    const domain = domains.find((d: any) => d.id === domainId);
    if (domain) {
      const firstPracticeId = Object.keys(domain.practices)[0];
      if (firstPracticeId) {
        setCurrentDomainId?.(domainId);
        setCurrentPracticeId?.(firstPracticeId);
        setCurrentQuestionIndex?.(0);
      }
    }
    router.push(`/assess/${projectId}`);
  }, [assessmentContext, projectId, domains, setCurrentDomainId, setCurrentPracticeId, setCurrentQuestionIndex, router, handleProjectAction]);

  const handlePracticeClick = useCallback((domainId: string, practiceId: string) => {
    if (!assessmentContext || !projectId) return;
    setCurrentDomainId?.(domainId);
    setCurrentPracticeId?.(practiceId);
    setCurrentQuestionIndex?.(0);
    router.push(`/assess/${projectId}`);
  }, [assessmentContext, projectId, setCurrentDomainId, setCurrentPracticeId, setCurrentQuestionIndex, router]);

  const handleQuestionClick = useCallback((domainId: string, practiceId: string, questionIndex: number) => {
    if (!assessmentContext || !projectId) return;
    setCurrentDomainId?.(domainId);
    setCurrentPracticeId?.(practiceId);
    setCurrentQuestionIndex?.(questionIndex);
    router.push(`/assess/${projectId}`);
  }, [assessmentContext, projectId, setCurrentDomainId, setCurrentPracticeId, setCurrentQuestionIndex, router]);

  const toggleDomain = useCallback((domainId: string) => {
    setExpandedDomainId((prev) => (prev === domainId ? null : domainId));
  }, []);

  const globalNavItems: SidebarItem[] = useMemo(() => {
    return [
      { id: "dashboard", label: "Dashboard", icon: IconLayoutDashboard, href: "/dashboard" },
      { id: "settings", label: "Settings", icon: IconSettings, href: "/settings", activePatterns: ["/settings", "/manage-subscription"] },
    ];
  }, []);

  const adminNavItems: SidebarItem[] = useMemo(() => {
    if (user?.role !== ROLES.ADMIN) return [];
    return [
      { id: "admin-aima", label: "Manage AIMA Data", href: "/admin/aima-data", icon: IconDatabase, activePatterns: ["/admin/aima-data"] },
      { id: "admin-crc", label: "CRC Controls", href: "/admin/crc", icon: IconShieldCheck, activePatterns: ["/admin/crc"] },
      { id: "admin-chatbot", label: "Chatbot Settings", href: "/admin/chatbot", icon: IconMessageChatbot, activePatterns: ["/admin/chatbot"] },
    ];
  }, [user?.role]);

  // ─── Active state detection ─────────────────────────────────────────────────

  const isItemActive = useCallback((item: SidebarItem) => {
    if (item.href === "#") return false;
    const currentPath = pathname || "";

    if (item.id === "dashboard") {
      return currentPath === "/dashboard" || currentPath === "/" || currentPath.startsWith("/dashboard/");
    }

    if (item.activePatterns?.length) {
      return item.activePatterns.some(p => currentPath.startsWith(p));
    }
    return currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href));
  }, [pathname]);

  if (!isAuthenticated) return null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Sidebar
        collapsible="icon"
        variant="sidebar"
        className="border-r-0"
        style={{
          "--sidebar-width": `${sidebarWidth}px`,
        } as React.CSSProperties}
      >
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center justify-between w-full gap-2 group-data-[collapsible=icon]:justify-center">
            {state === "expanded" && (
              <>
                <img src="/matur-logo-slogan.png" alt="MATUR.ai" className="h-7 dark:hidden" />
                <img src="/matur-dark.png" alt="MATUR.ai" className="h-7 hidden dark:block" />
              </>
            )}
            <SidebarTrigger className={cn("size-7 text-muted-foreground hover:text-foreground", state === "collapsed" && "mx-auto")} />
          </div>
        </SidebarHeader>

        {/* ─── Content ─────────────────────────────────────────────────── */}
        <SidebarContent>
          {/* Global Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Dashboard */}
                {(() => {
                  const item = globalNavItems.find((i) => i.id === "dashboard");
                  if (!item) return null;
                  const Icon = item.icon;
                  const active = isItemActive(item);
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        disabled={item.disabled}
                        tooltip={item.label}
                        className={cn(
                          "transition-all duration-250 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:[&>svg]:!size-[22px] group-data-[collapsible=icon]:mx-auto",
                          active && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:rounded-md font-semibold rounded-l-none rounded-r-md"
                        )}
                      >
                        <Link href={item.disabled ? "#" : item.href} className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center">
                          <Icon className={cn("size-5 shrink-0 transition-colors duration-200", active ? "text-primary" : "text-muted-foreground/80")} />
                          {state === "expanded" && (
                            <span className={cn("text-sm font-medium", active ? "text-foreground font-semibold" : "text-foreground/80")}>{item.label}</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })()}

                {/* Free section — collapsible, contains AIMA Assessment */}
                {(() => {
                  const isAimaActive = routeFlags.isAimaPage;
                  const isFreeActive = isAimaActive;
                  return (
                    <SidebarMenuItem key="free-section">
                      <SidebarMenuButton
                        isActive={isFreeActive}
                        onClick={() => {
                          setIsFreeExpanded(!isFreeExpanded);
                        }}
                        className={cn(
                          "transition-all duration-250 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:[&>svg]:!size-[22px] group-data-[collapsible=icon]:mx-auto",
                          isFreeActive && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:rounded-md font-semibold rounded-l-none rounded-r-md"
                        )}
                        tooltip="Free"
                      >
                        <IconGift className={cn("size-5 shrink-0 transition-colors duration-200", isFreeActive ? "text-primary" : "text-muted-foreground/80")} />
                        {state === "expanded" && (
                          <span className={cn("text-sm font-medium", isFreeActive ? "text-foreground font-semibold" : "text-foreground/80")}>Free</span>
                        )}
                        {state === "expanded" && (
                          <IconChevronRight
                            className={cn(
                              "ml-auto h-3.5 w-3.5 transition-transform text-muted-foreground shrink-0",
                              isFreeExpanded && "rotate-90"
                            )}
                          />
                        )}
                      </SidebarMenuButton>

                      <AnimatePresence>
                        {isFreeExpanded && state === "expanded" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <SidebarMenuSub className="border-l border-sidebar-border ml-[18px] pl-3 mt-0.5 gap-0.5">
                              {/* AIMA Assessment — nested inside Free */}
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  onClick={() => {
                                    setIsAssessmentExpanded(!isAssessmentExpanded);
                                    if (isInsideProject && projectId) {
                                      router.push(`/assess/${projectId}`);
                                    } else {
                                      handleProjectAction("");
                                    }
                                  }}
                                  isActive={isAimaActive}
                                  className={cn(
                                    "group/aima h-8 px-2 transition-all duration-200",
                                    isAimaActive && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 font-semibold rounded-l-none rounded-r-md"
                                  )}
                                >
                                  <IconClipboardCheck className={cn("size-5 transition-colors duration-200", isAimaActive ? "text-primary" : "text-blue-500")} />
                                  <span className={cn("text-[13px] truncate ml-1", isAimaActive ? "text-foreground font-semibold" : "text-foreground/80")}>
                                    AIMA Assessment
                                  </span>
                                  <IconChevronRight
                                    className={cn(
                                      "ml-auto h-3.5 w-3.5 transition-transform text-muted-foreground shrink-0",
                                      isAssessmentExpanded && "rotate-90"
                                    )}
                                  />
                                </SidebarMenuSubButton>

                                <AnimatePresence>
                                  {isAssessmentExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <SidebarMenuSub className="border-l border-sidebar-border ml-[18px] pl-3 mt-0.5 gap-0.5">
                                        {displayDomains.map((domain: any) => (
                                          <DomainTreeItem
                                            key={domain.id}
                                            domain={domain}
                                            currentDomainId={currentDomainId}
                                            currentPracticeId={currentPracticeId}
                                            currentQuestionIndex={currentQuestionIndex}
                                            expandedDomainId={expandedDomainId}
                                            onDomainClick={isInsideProject ? handleDomainClick : () => handleProjectAction("")}
                                            onPracticeClick={isInsideProject ? handlePracticeClick : () => handleProjectAction("")}
                                            onQuestionClick={isInsideProject ? handleQuestionClick : () => handleProjectAction("")}
                                            toggleDomain={isInsideProject ? toggleDomain : () => {}}
                                            premiumStatus={premiumStatus}
                                            activeQuestionRef={currentQuestionRef}
                                          />
                                        ))}
                                      </SidebarMenuSub>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </SidebarMenuSubItem>
                            </SidebarMenuSub>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </SidebarMenuItem>
                  );
                })()}

                {/* Premium Features collapsible item */}
                {(() => {
                  const isPremiumActive = pathname === "/premium-features" || routeFlags.isCrcPage || routeFlags.isFairnessPage || routeFlags.isVulnerabilityPage || routeFlags.isInventoryPage;
                  return (
                    <SidebarMenuItem key="premium">
                      <SidebarMenuButton
                        isActive={isPremiumActive}
                        onClick={() => {
                          setIsPremiumFeaturesExpanded(!isPremiumFeaturesExpanded);
                        }}
                        className={cn(
                          "transition-all duration-250 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:[&>svg]:!size-[22px] group-data-[collapsible=icon]:mx-auto",
                          isPremiumActive && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:rounded-md font-semibold rounded-l-none rounded-r-md"
                        )}
                        tooltip="Premium Features"
                      >
                        <IconDiamond className={cn("size-5 shrink-0 transition-colors duration-200", isPremiumActive ? "text-primary" : "text-muted-foreground/80")} />
                        {state === "expanded" && (
                          <span className={cn("text-sm font-medium", isPremiumActive ? "text-foreground font-semibold" : "text-foreground/80")}>Premium Features</span>
                        )}
                        {state === "expanded" && (
                          <IconChevronRight
                            className={cn(
                              "ml-auto h-3.5 w-3.5 transition-transform text-muted-foreground shrink-0",
                              isPremiumFeaturesExpanded && "rotate-90"
                            )}
                          />
                        )}
                      </SidebarMenuButton>

                      <AnimatePresence>
                        {isPremiumFeaturesExpanded && state === "expanded" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <SidebarMenuSub className="border-l border-sidebar-border ml-[18px] pl-3 mt-0.5 gap-0.5">
                              {/* AI Vulnerability Assessment */}
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  onClick={() => premiumStatus
                                    ? handleProjectNav(`/vulnerability-assessment`)
                                    : openSubscriptionModal("Unlock Premium to Access AI Vulnerability Assessment", "Upgrade to premium to unlock this feature and many more advanced capabilities.")}
                                  isActive={routeFlags.isVulnerabilityPage}
                                  className={cn(
                                    "group/premium-btn h-8 px-2 transition-all duration-200",
                                    routeFlags.isVulnerabilityPage && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 font-semibold rounded-l-none rounded-r-md"
                                  )}
                                >
                                  <IconShield className={cn("size-5 transition-colors duration-200", routeFlags.isVulnerabilityPage ? "text-primary" : "text-blue-500")} />
                                  <span className={cn("text-[13px] truncate ml-1", routeFlags.isVulnerabilityPage ? "text-foreground font-semibold" : "text-foreground/80")}>
                                    AI Vulnerability Assessment
                                  </span>
                                  {!premiumStatus && <IconLock className="ml-auto h-3 w-3 text-muted-foreground/50" />}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>

                              {/* CRC */}
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  onClick={() => {
                                    setIsCrcExpanded(!isCrcExpanded);
                                    premiumStatus
                                      ? handleProjectNav(`/crc/dashboard`)
                                      : openSubscriptionModal("Unlock Premium to Access Compliance Readiness Controls (CRC)", "Upgrade to premium.");
                                  }}
                                  isActive={routeFlags.isCrcPage}
                                  className={cn(
                                    "group/premium-btn h-8 px-2 transition-all duration-200",
                                    routeFlags.isCrcPage && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 font-semibold rounded-l-none rounded-r-md"
                                  )}
                                >
                                  <IconChevronRight className={cn("h-3.5 w-3.5 transition-transform text-muted-foreground shrink-0", isCrcExpanded && "rotate-90")} />
                                  <IconShieldCheck className={cn("size-5 transition-colors duration-200", routeFlags.isCrcPage ? "text-primary" : "text-emerald-500")} />
                                  <span className={cn("font-medium text-[13px] truncate ml-1", routeFlags.isCrcPage ? "text-foreground font-semibold" : "text-foreground/80")}>
                                    CRC
                                  </span>
                                  {!premiumStatus && <IconLock className="ml-auto h-3 w-3 text-muted-foreground/50" />}
                                </SidebarMenuSubButton>

                                <AnimatePresence>
                                  {isCrcExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <SidebarMenuSub className="border-l border-sidebar-border ml-[18px] pl-3 mt-0.5 gap-0.5">
                                        {/* Dashboard */}
                                        <SidebarMenuSubItem>
                                          <SidebarMenuSubButton
                                            onClick={() => premiumStatus ? handleProjectNav(`/crc/dashboard`) : openSubscriptionModal()}
                                            className="h-7 px-2 group/cat"
                                            isActive={pathname?.endsWith("/crc/dashboard") || false}
                                          >
                                            <IconDashboard className="h-3 w-3 text-muted-foreground group-hover/cat:text-foreground" />
                                            <span className={cn("text-[12px] truncate ml-1.5", pathname?.endsWith("/crc/dashboard") ? "text-foreground font-medium" : "text-foreground/70")}>
                                              Readiness Dashboard
                                            </span>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        {/* Risk Register */}
                                        <SidebarMenuSubItem>
                                          <SidebarMenuSubButton
                                            onClick={() => premiumStatus ? handleProjectNav(`/crc/risks`) : openSubscriptionModal()}
                                            className="h-7 px-2 group/cat"
                                            isActive={pathname?.endsWith("/crc/risks") || false}
                                          >
                                            <IconClipboardCheck className="h-3 w-3 text-muted-foreground group-hover/cat:text-foreground" />
                                            <span className={cn("text-[12px] truncate ml-1.5", pathname?.endsWith("/crc/risks") ? "text-foreground font-medium" : "text-foreground/70")}>
                                              AI Risk Register
                                            </span>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        {/* CRC Categories */}
                                        {crcCategories.filter((cat: string) => (controlsByCategory[cat] || []).length > 0).map((cat: string) => {
                                          const catControls = controlsByCategory[cat] || [];
                                          const answeredInCat = catControls.filter((c: CRCControl) => crcResponses[c.id] !== undefined).length;
                                          const isCatExpanded = expandedCrcCategories[cat];

                                          return (
                                            <SidebarMenuSubItem key={cat}>
                                              <div className="flex items-center gap-0.5 group/cat">
                                                <button
                                                  type="button"
                                                  aria-label={`Toggle ${cat}`}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedCrcCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
                                                  }}
                                                  className="h-7 w-5 flex items-center justify-center hover:bg-sidebar-accent rounded transition-colors"
                                                >
                                                  <IconChevronRight className={cn("h-2.5 w-2.5 transition-transform text-muted-foreground", isCatExpanded && "rotate-90")} />
                                                </button>
                                                <SidebarMenuSubButton
                                                  onClick={() => {
                                                    if (premiumStatus) {
                                                      handleProjectNav(`/crc?category=${encodeURIComponent(cat)}`);
                                                      setExpandedCrcCategories(prev => ({ ...prev, [cat]: true }));
                                                    } else {
                                                      openSubscriptionModal();
                                                    }
                                                  }}
                                                  className="h-7 px-2 flex-1 group/cat"
                                                  isActive={currentCategory === cat}
                                                >
                                                  <IconFolder className="h-3 w-3 text-muted-foreground group-hover/cat:text-foreground" />
                                                  <span className={cn("text-[12px] truncate ml-1.5", currentCategory === cat ? "text-foreground font-medium" : "text-foreground/70")}>
                                                    {cat}
                                                  </span>
                                                  <CompactProgress current={answeredInCat} total={catControls.length} isCompleted={answeredInCat === catControls.length && catControls.length > 0} size="sm" />
                                                </SidebarMenuSubButton>
                                              </div>

                                              {isCatExpanded && catControls.length > 0 && (
                                                <SidebarMenuSub className="border-l border-sidebar-border/50 ml-2 pl-2.5 mt-0.5 gap-0">
                                                  {catControls.map((control: CRCControl) => {
                                                    const isAnswered = crcResponses[control.id] !== undefined;
                                                    return (
                                                      <SidebarMenuSubItem key={control.id}>
                                                        <SidebarMenuSubButton
                                                          onClick={() => premiumStatus ? handleProjectNav(`/crc?controlId=${control.id}`) : openSubscriptionModal()}
                                                          className="h-6 px-2 group/control"
                                                          isActive={currentControlId === control.id}
                                                        >
                                                          {isAnswered ? (
                                                            <IconCircleCheck className={cn("h-3 w-3", currentControlId === control.id ? "text-primary" : "text-success")} />
                                                          ) : (
                                                            <IconCircle className={cn("h-3 w-3", currentControlId === control.id ? "text-primary" : "text-muted-foreground/40")} />
                                                          )}
                                                          <span className={cn("text-[11px] truncate ml-1.5", currentControlId === control.id ? "text-foreground font-medium" : "text-muted-foreground group-hover/control:text-foreground")}>
                                                            {control.control_id}
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
                              </SidebarMenuSubItem>

                              {/* AI Component Inventory */}
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  onClick={() => premiumStatus
                                    ? handleProjectNav(`/inventory`)
                                    : openSubscriptionModal("Unlock Premium to Access AI Component Inventory")}
                                  isActive={routeFlags.isInventoryPage}
                                  className={cn(
                                    "group/premium-btn h-8 px-2 transition-all duration-200",
                                    routeFlags.isInventoryPage && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 font-semibold rounded-l-none rounded-r-md"
                                  )}
                                >
                                  <IconTable className={cn("size-5 transition-colors duration-200", routeFlags.isInventoryPage ? "text-primary" : "text-blue-500")} />
                                  <span className={cn("text-[13px] truncate ml-1", routeFlags.isInventoryPage ? "text-foreground font-semibold" : "text-foreground/80")}>
                                    AI Component Inventory
                                  </span>
                                  {!premiumStatus && <IconLock className="ml-auto h-3 w-3 text-muted-foreground/50" />}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>

                              {/* Bias & Fairness Testing */}
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  onClick={() => {
                                    setIsFairnessExpanded(!isFairnessExpanded);
                                    handleProjectNav(`/fairness-bias/options`);
                                  }}
                                  isActive={routeFlags.isFairnessPage && !routeFlags.isVulnerabilityPage}
                                  className={cn(
                                    "group/premium-btn h-8 px-2 transition-all duration-200",
                                    (routeFlags.isFairnessPage && !routeFlags.isVulnerabilityPage) && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 font-semibold rounded-l-none rounded-r-md"
                                  )}
                                >
                                  <IconChevronRight className={cn("h-3.5 w-3.5 transition-transform text-muted-foreground shrink-0", isFairnessExpanded && "rotate-90")} />
                                  <IconScale className={cn("size-5 transition-colors duration-200", (routeFlags.isFairnessPage && !routeFlags.isVulnerabilityPage) ? "text-primary" : "text-amber-500")} />
                                  <span className={cn("font-medium text-[13px] truncate ml-1", (routeFlags.isFairnessPage && !routeFlags.isVulnerabilityPage) ? "text-foreground font-semibold" : "text-foreground/80")}>
                                    Bias & Fairness Testing
                                  </span>
                                </SidebarMenuSubButton>

                                <AnimatePresence>
                                  {isFairnessExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <SidebarMenuSub className="border-l border-sidebar-border ml-[18px] pl-3 mt-0.5 gap-0.5">
                                        <SidebarMenuSubItem>
                                          <SidebarMenuSubButton
                                            onClick={() => premiumStatus ? handleProjectNav(`/fairness-bias`) : openSubscriptionModal("Unlock Premium to Access Manual Prompt Testing")}
                                            className="h-7 px-2 group/fairness"
                                            isActive={(routeFlags.isFairnessRootPage || routeFlags.isFairnessPage) && !routeFlags.isApiEndpointPage && !routeFlags.isDatasetTestingPage && !routeFlags.isFairnessOptionsPage}
                                          >
                                            <span className={cn("text-[12px] truncate ml-1.5",
                                              (routeFlags.isFairnessRootPage || (routeFlags.isFairnessPage && !routeFlags.isApiEndpointPage && !routeFlags.isDatasetTestingPage && !routeFlags.isFairnessOptionsPage))
                                                ? "text-foreground font-medium" : "text-foreground/70")}>
                                              Manual Prompt Testing
                                            </span>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                          <SidebarMenuSubButton
                                            onClick={() => premiumStatus ? handleProjectNav(`/fairness-bias/api-endpoint`) : openSubscriptionModal("Unlock Premium to Access API Automated Testing")}
                                            className="h-7 px-2 group/fairness"
                                            isActive={routeFlags.isApiEndpointPage}
                                          >
                                            <span className={cn("text-[12px] truncate ml-1.5", routeFlags.isApiEndpointPage ? "text-foreground font-medium" : "text-foreground/70")}>
                                              API Automated Testing
                                            </span>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                          <SidebarMenuSubButton
                                            onClick={() => premiumStatus ? handleProjectNav(`/fairness-bias/dataset-testing`) : openSubscriptionModal("Unlock Premium to Access Dataset Testing")}
                                            className="h-7 px-2 group/fairness"
                                            isActive={routeFlags.isDatasetTestingPage}
                                          >
                                            <span className={cn("text-[12px] truncate ml-1.5", routeFlags.isDatasetTestingPage ? "text-foreground font-medium" : "text-foreground/70")}>
                                              Dataset Testing
                                            </span>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                      </SidebarMenuSub>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </SidebarMenuSubItem>
                            </SidebarMenuSub>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </SidebarMenuItem>
                  );
                })()}

                {/* Project Settings collapsible item */}
                {(() => {
                  const isProjectSettingsActive = routeFlags.isSettingsPage || routeFlags.isTeamPage;
                  return (
                    <SidebarMenuItem key="project-settings">
                      <SidebarMenuButton
                        isActive={isProjectSettingsActive}
                        onClick={() => {
                          setIsProjectSettingsExpanded(!isProjectSettingsExpanded);
                          if (isInsideProject && projectId) {
                            router.push(`/assess/${projectId}/settings`);
                          } else {
                            handleProjectAction("/settings");
                          }
                        }}
                        className={cn(
                          "transition-all duration-250 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:[&>svg]:!size-[22px] group-data-[collapsible=icon]:mx-auto",
                          isProjectSettingsActive && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:rounded-md font-semibold rounded-l-none rounded-r-md"
                        )}
                        tooltip="Project Settings"
                      >
                        <IconSettings className={cn("size-5 shrink-0 transition-colors duration-200", isProjectSettingsActive ? "text-primary" : "text-muted-foreground/80")} />
                        {state === "expanded" && (
                          <span className={cn("text-sm font-medium", isProjectSettingsActive ? "text-foreground font-semibold" : "text-foreground/80")}>Project Settings</span>
                        )}
                        {state === "expanded" && (
                          <IconChevronRight
                            className={cn(
                              "ml-auto h-3.5 w-3.5 transition-transform text-muted-foreground shrink-0",
                              isProjectSettingsExpanded && "rotate-90"
                            )}
                          />
                        )}
                      </SidebarMenuButton>

                      <AnimatePresence>
                        {isProjectSettingsExpanded && state === "expanded" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <SidebarMenuSub className="border-l border-sidebar-border ml-[18px] pl-3 mt-0.5 gap-0.5">
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  onClick={() => handleProjectNav(`/settings`)}
                                  isActive={routeFlags.isSettingsPage}
                                  className={cn(
                                    "h-8 px-2 transition-all duration-200",
                                    routeFlags.isSettingsPage && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 font-semibold rounded-l-none rounded-r-md"
                                  )}
                                >
                                  <IconBriefcase className={cn("size-5 transition-colors duration-200", routeFlags.isSettingsPage ? "text-primary" : "text-muted-foreground")} />
                                  <span className={cn("text-[13px] truncate ml-1", routeFlags.isSettingsPage ? "text-foreground font-semibold" : "text-foreground/80")}>
                                    Project Information
                                  </span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  onClick={() => handleProjectNav(`/team`)}
                                  isActive={routeFlags.isTeamPage}
                                  className={cn(
                                    "h-8 px-2 transition-all duration-200",
                                    routeFlags.isTeamPage && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 font-semibold rounded-l-none rounded-r-md"
                                  )}
                                >
                                  <IconUsers className={cn("size-5 transition-colors duration-200", routeFlags.isTeamPage ? "text-primary" : "text-muted-foreground")} />
                                  <span className={cn("text-[13px] truncate ml-1", routeFlags.isTeamPage ? "text-foreground font-semibold" : "text-foreground/80")}>
                                    Teams
                                  </span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            </SidebarMenuSub>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </SidebarMenuItem>
                  );
                })()}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Spacer to push Admin Navigation to the bottom of the container */}
          <div className="flex-grow" />

          {/* Admin Navigation */}
          {adminNavItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60 px-2">Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item);
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                          className={cn(
                            "transition-all duration-250 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:[&>svg]:!size-[22px] group-data-[collapsible=icon]:mx-auto",
                            active && "border-l-[3px] border-primary bg-sidebar-accent/60 text-sidebar-accent-foreground pl-1.5 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:rounded-md font-semibold rounded-l-none rounded-r-md"
                          )}
                        >
                          <Link href={item.href} className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center">
                            <Icon className={cn("size-5 shrink-0 transition-colors duration-200", active ? "text-primary" : "text-muted-foreground/80")} />
                            {state === "expanded" && (
                              <span className={cn("text-sm font-medium", active ? "text-foreground font-semibold" : "text-foreground/80")}>{item.label}</span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

        </SidebarContent>

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
          <SidebarSeparator className="mb-2" />

          {/* User Profile Selector Card & Settings Shortcut Button */}
          {user && (
            <div className="flex items-center gap-2 w-full group-data-[collapsible=icon]:flex-col">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {state === "collapsed" ? (
                    <button className="flex items-center justify-center size-8 rounded-lg bg-transparent border-0 cursor-pointer mx-auto relative hover:bg-sidebar-accent/60 focus:outline-none focus:ring-1 focus:ring-ring select-none">
                      <Avatar className="size-6 rounded-full shrink-0 select-none">
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center size-6">
                          {(user.name || user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Small red dot on avatar if there are pending invitations/notifications */}
                      {myInvitations.length > 0 && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-sidebar" />
                      )}
                    </button>
                  ) : (
                    <button className="flex items-center gap-2 w-full flex-1 text-left p-1.5 h-[38px] rounded-lg border border-border/40 dark:border-sidebar-border bg-slate-50 dark:bg-sidebar-accent/30 hover:bg-slate-100 dark:hover:bg-sidebar-accent/60 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer relative">
                      <Avatar className="size-7 rounded-lg shrink-0 select-none">
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold rounded-lg flex items-center justify-center size-7">
                          {(user.name || user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0 leading-tight justify-center">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {user.name || "User"}
                        </span>
                      </div>
                      <IconSelector className="size-3.5 text-muted-foreground/75 shrink-0 ml-0.5" />
                    </button>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" side="right" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1 overflow-hidden">
                      <p className="text-sm font-semibold leading-none truncate text-foreground">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Notifications Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center cursor-pointer">
                      <IconBell className="size-4 mr-2 text-primary" />
                      <span>Notifications</span>
                      {myInvitations.length > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {myInvitations.length}
                        </span>
                      )}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="w-80">
                        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Invitations</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {myInvitations.length > 0 ? (
                          <div className="max-h-[250px] overflow-y-auto">
                            {myInvitations.map((inv) => (
                              <div key={inv.id} className="p-3 text-xs flex flex-col gap-2 border-b last:border-0 hover:bg-muted/50 transition-colors">
                                <p className="text-foreground leading-snug">
                                  <span className="font-semibold">{inv.inviter?.name || "Someone"}</span> invited you to join <span className="font-semibold text-primary">{inv.project.name}</span>
                                </p>
                                <div className="flex gap-2 mt-1">
                                  <Button size="sm" className="flex-1 h-7 text-[10px] py-0" onClick={() => router.push(`/invite/accept?token=${encodeURIComponent(inv.token)}`)}>
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] py-0 text-destructive hover:bg-destructive/10" onClick={() => handleDecline(inv.token)} disabled={decliningTokens.has(inv.token)}>
                                    {decliningTokens.has(inv.token) ? "Declining..." : "Decline"}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-xs text-muted-foreground text-center">No new notifications</div>
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Theme Toggle (Inline inside dropdown) */}
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); toggleTheme(); }} className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center">
                      {theme === "dark" ? <IconSun className="size-4 mr-2 text-primary" /> : <IconMoon className="size-4 mr-2 text-primary" />}
                      <span>Theme Mode</span>
                    </div>
                    <Switch checked={theme === "dark"} className="pointer-events-none scale-75" />
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  
                  {/* Profile Settings */}
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer">
                      <IconSettings className="size-4 mr-2" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Sign Out */}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                    <IconLogout className="size-4 mr-2" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {state === "expanded" && (
                <Link
                  href="/settings"
                  title="Profile Settings"
                  className="h-[38px] w-[38px] rounded-lg shrink-0 flex items-center justify-center border border-border/40 dark:border-sidebar-border bg-slate-50 dark:bg-sidebar-accent/30 hover:bg-slate-100 dark:hover:bg-sidebar-accent/60 transition-all duration-200 cursor-pointer group/settings"
                >
                  <IconSettings className="size-[18px] text-muted-foreground/75 group-hover/settings:text-foreground transition-colors" />
                </Link>
              )}
            </div>
          )}
        </SidebarFooter>

        {/* Resize Handle – drag to widen/narrow the sidebar */}
        {state === "expanded" && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuenow={sidebarWidth}
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={typeof window !== "undefined" ? Math.round(window.innerWidth * MAX_WIDTH_RATIO) : 800}
            tabIndex={0}
            className="absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize z-[100] group/resize focus-visible:outline-none select-none pointer-events-auto"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsResizing(true);
            }}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 40 : 10;
              if (e.key === "ArrowRight") {
                e.preventDefault();
                setSidebarWidth(sidebarWidth + step);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setSidebarWidth(sidebarWidth - step);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setIsResizing(false);
                e.currentTarget.blur();
              }
            }}
          >
            {/* Visible drag line/border */}
            <div className={cn(
              "absolute inset-y-0 left-1/2 -translate-x-1/2 transition-all duration-150",
              isResizing
                ? "w-[3px] bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                : "w-[1px] bg-border/80 group-hover/resize:bg-primary/60 group-hover/resize:w-[3px]"
            )} />
          </div>
        )}

        {/* Remove SidebarRail — replaced by resize handle above */}
      </Sidebar>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        title={modalTitle}
        description={modalDescription}
      />
      <ProjectSelectionModal
        isOpen={showProjectModal}
        onOpenChange={setShowProjectModal}
        onSelectProject={(selectedId) => {
          setShowProjectModal(false);
          router.push(`/assess/${selectedId}${pendingDestinationRoute}`);
        }}
      />
    </>
  );
}

// ─── Exported Wrapper ─────────────────────────────────────────────────────────

export function AppSidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const shouldHideSidebar = !isSidebarVisible(pathname);

  if (shouldHideSidebar || !isAuthenticated) {
    return null;
  }

  return <SidebarContentComponent />;
}

// Mobile trigger button
export function SidebarMobileTrigger() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const shouldHide = !isSidebarVisible(pathname);

  if (shouldHide || !isAuthenticated) {
    return null;
  }

  return (
    <div className="md:hidden fixed top-4 left-4 z-50">
      <SidebarTrigger />
    </div>
  );
}
