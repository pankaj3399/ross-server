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
  IconChevronsLeft,
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
  IconShieldLock,
  IconMessageReport,
  IconApi,
  IconCpu,
  IconLoader2,
  IconSearch,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { AUTH_LOGIN_URL, ROLES, PREMIUM_STATUS } from "../../lib/constants";
import { getRouteFlags } from "../../lib/route-utils";
import { useCrcCategoryExpansion } from "@/hooks/useCrcCategoryExpansion";
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
import { apiService, CRCControl, Project } from "../../lib/api";
import { cn, getDomainIcon } from "@/lib/utils";
import SubscriptionModal from "../features/subscriptions/SubscriptionModal";
import { ProjectSelectionModal } from "./ProjectSelectionModal";
import { useSidebarStore, getTotalSidebarWidth, ACTIVITY_BAR_WIDTH, MIN_WIDTH, MAX_WIDTH_RATIO } from "../../store/sidebarStore";
import { buildAssessmentAnswerKey } from "@/lib/assessmentValidation";

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
      size === "sm" ? "text-[10px]" : "text-[11px]",
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
        className={cn(
          "group/domain h-8 px-2 transition-all",
          isDomainActive && !currentPracticeId && "border-l-[3px] border-[var(--section-free)] bg-[var(--section-free)]/10 text-[var(--section-free)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
        )}
      >
        <IconChevronRight
          className={cn(
            "h-3.5 w-3.5 transition-transform text-muted-foreground group-hover/domain:text-foreground shrink-0",
            isDomainExpanded && "rotate-90"
          )}
        />
        {(() => {
          const Icon = getDomainIcon(domain.title);
          return <Icon className="w-3.5 h-3.5 shrink-0 text-[var(--section-free)]" />;
        })()}
        <span className={cn(
          "font-bold text-sm truncate ml-1.5 flex-1 min-w-0 text-foreground",
          isDomainActive && !currentPracticeId && "text-primary font-extrabold"
        )}>
          {domain.title}
        </span>
        <CompactProgress
          current={domain.questionsAnswered}
          total={domain.totalQuestions}
          isCompleted={domain.isCompleted}
        />
        {!premiumStatus && domain.is_premium && <IconLock className="ml-1 h-3.5 w-3.5 text-amber-400 shrink-0" />}
      </SidebarMenuButton>

      <AnimatePresence>
        {isDomainExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <SidebarMenuSub className="mt-1 gap-1 border-l border-sidebar-border/40 ml-3.5 pl-1.5">
              {domain.practices.map((practice) => {
                const isPracticeActive = isDomainActive && currentPracticeId === practice.id;
                const isPracticeSelectedOnly = isPracticeActive && (currentQuestionIndex === null || currentQuestionIndex === undefined);

                return (
                  <SidebarMenuSubItem key={practice.id}>
                    <SidebarMenuSubButton
                      onClick={() => onPracticeClick(domain.id, practice.id)}
                      isActive={isPracticeSelectedOnly}
                      className={cn(
                        "group/practice h-7 px-2 transition-all rounded-md",
                        isPracticeSelectedOnly
                          ? "border-l-[3px] border-primary bg-primary/15 text-primary font-bold pl-1.5 rounded-l-none"
                          : "hover:bg-sidebar-accent/50"
                      )}
                    >
                      <span className={cn(
                        "text-[13px] truncate flex-1 min-w-0 font-medium",
                        isPracticeActive ? "text-foreground font-semibold" : "text-foreground/90 group-hover/practice:text-foreground"
                      )}>
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
                      <SidebarMenuSub className="border-l border-sidebar-border/30 my-1 ml-2 pl-1 gap-0.5">
                        {practice.questions.map((q, qIdx) => {
                          const isQuestionActive = isPracticeActive && currentQuestionIndex === qIdx;
                          return (
                            <SidebarMenuSubItem key={qIdx} ref={isQuestionActive ? activeQuestionRef : undefined}>
                              <SidebarMenuSubButton
                                onClick={() => onQuestionClick(domain.id, practice.id, qIdx)}
                                isActive={isQuestionActive}
                                className={cn(
                                  "h-7 px-2 group/question transition-all rounded-md w-full",
                                  isQuestionActive
                                    ? "border-l-[3px] border-primary bg-primary/20 text-white font-semibold pl-1.5 rounded-l-none"
                                    : "hover:bg-sidebar-accent/60"
                                )}
                              >
                                {q.isAnswered ? (
                                  <IconCircleCheck className={cn("h-3.5 w-3.5 shrink-0", isQuestionActive ? "text-emerald-400" : "text-emerald-500/90")} />
                                ) : (
                                  <IconCircle className={cn("h-3.5 w-3.5 shrink-0", isQuestionActive ? "text-primary" : "text-zinc-400 dark:text-zinc-500")} />
                                )}
                                <span className={cn(
                                  "text-[12.5px] truncate ml-1.5 flex-1 min-w-0 leading-normal",
                                  isQuestionActive
                                    ? "text-white dark:text-white font-semibold"
                                    : "text-zinc-300 dark:text-zinc-200 font-medium group-hover/question:text-white"
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

const ActivityBarButton = ({
  icon: Icon,
  label,
  isActive,
  badge,
  iconColorClass,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  badge?: number;
  iconColorClass?: string;
  onClick: () => void;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative flex items-center justify-center size-9 rounded-xl transition-all duration-200 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 select-none",
          isActive
            ? "bg-primary/15 font-semibold shadow-xs ring-1 ring-primary/20"
            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
        )}
        aria-label={label}
      >
        <Icon className={cn("size-5 shrink-0 transition-transform group-hover:scale-110", isActive ? (iconColorClass || "text-primary") : "text-muted-foreground/80 group-hover:text-foreground")} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-1 right-1 size-2 bg-primary rounded-full ring-2 ring-sidebar" />
        )}
      </button>
    </TooltipTrigger>
    <TooltipContent side="right" sideOffset={8} className="font-medium text-sm">
      {label}
    </TooltipContent>
  </Tooltip>
);

// ─── Main Sidebar Content Component ───────────────────────────────────────────

function SidebarContentComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { setOpenMobile, state, setOpen } = useSidebar();
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

  // ─── Sidebar Resizable & Secondary State ─────────────────────────────────────
  const { sidebarWidth, setSidebarWidth, isSecondaryOpen, setIsSecondaryOpen, isResizing, setIsResizing } = useSidebarStore();

  const getTabFromPathname = useCallback((path: string | null): "dashboard" | "aima" | "premium" | "settings" | "admin" => {
    if (!path) return "dashboard";
    const flags = getRouteFlags(path);
    if (flags.isCrcPage || flags.isFairnessPage || flags.isVulnerabilityPage || flags.isInventoryPage) {
      return "premium";
    }
    if (flags.isAimaPage) {
      return "aima";
    }
    if (flags.isTeamPage || flags.isSettingsPage || flags.isWizardSettingsPage) {
      return "settings";
    }
    const isAdmin = Boolean(user?.role && user.role.trim().toUpperCase() === "ADMIN");
    if (path.startsWith("/admin") && isAdmin) {
      return "admin";
    }
    return "dashboard";
  }, [user?.role]);

  const [activeTab, setActiveTab] = useState<"dashboard" | "aima" | "premium" | "settings" | "admin">(() => getTabFromPathname(pathname));

  useEffect(() => {
    setActiveTab(getTabFromPathname(pathname));
  }, [pathname, getTabFromPathname]);

  const handleTabClick = (tab: "dashboard" | "aima" | "premium" | "settings" | "admin") => {
    if (activeTab === tab) {
      setIsSecondaryOpen((prev) => !prev);
    } else {
      setActiveTab(tab);
      setIsSecondaryOpen(true);
    }
  };

  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    setIsLoadingProjects(true);
    apiService.getProjects()
      .then((data) => {
        if (active && Array.isArray(data)) {
          setUserProjects(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch projects in sidebar:", err);
      })
      .finally(() => {
        if (active) setIsLoadingProjects(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  const filteredSidebarProjects = useMemo(() => {
    if (!projectSearchQuery.trim()) return userProjects;
    const q = projectSearchQuery.toLowerCase();
    return userProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.ai_system_type && p.ai_system_type.toLowerCase().includes(q)) ||
        (p.industry && p.industry.toLowerCase().includes(q))
    );
  }, [userProjects, projectSearchQuery]);

  const totalSidebarWidth = getTotalSidebarWidth(isSecondaryOpen, sidebarWidth);

  // ─── Project Selection Modal State ──────────────────────────────────────────
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [pendingDestinationRoute, setPendingDestinationRoute] = useState<string>("");
  const [staticDomains, setStaticDomains] = useState<any[]>([]);

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
          const answerKey = buildAssessmentAnswerKey(domain.id, practiceId, q.level, q.stream, idx);
          return {
            ...q,
            index: idx,
            isAnswered: answers ? (answers[answerKey] !== undefined && answers[answerKey] !== null) : false,
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
  const { expandedCrcCategories, setExpandedCrcCategories } = useCrcCategoryExpansion(currentCategory);

  const currentQuestionRef = useRef<HTMLLIElement>(null);

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

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
      const newWidth = Math.max(MIN_WIDTH, Math.min(e.clientX - 48, window.innerWidth * MAX_WIDTH_RATIO));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.classList.remove("sidebar-resizing");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    document.body.classList.add("sidebar-resizing");

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.classList.remove("sidebar-resizing");
    };
  }, [isResizing, setSidebarWidth, setIsResizing]);

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

  const adminNavItems: SidebarItem[] = useMemo(() => {
    const isAdmin = Boolean(user?.role && user.role.trim().toUpperCase() === "ADMIN");
    if (!isAdmin) return [];
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

  // ─── Render Dual Sidebar ────────────────────────────────────────────────────

  return (
    <>
      <TooltipProvider delayDuration={0}>
        {/* Layout width spacer */}
        <div
          className="shrink-0 h-screen pointer-events-none"
          style={{ width: `${totalSidebarWidth}px` }}
          aria-hidden="true"
        />

        {/* Fixed position dual sidebar */}
        <aside
          className="fixed top-0 left-0 bottom-0 z-30 h-screen flex select-none bg-sidebar border-r-0 p-0 shadow-none"
          style={{ width: `${totalSidebarWidth}px` }}
        >
          <div className="flex h-screen w-full select-none">
          {/* ─── 1. Thin Primary Activity Bar (48px) ─────────────────────────── */}
          <div className="w-[48px] shrink-0 h-screen min-h-screen border-r border-sidebar-border/40 bg-sidebar flex flex-col justify-between items-center py-0 z-10 select-none">
            {/* Top Header Aligned with Secondary Header (h-12) */}
            <div className="flex flex-col items-center w-full">
              <div className="h-12 w-full flex items-center justify-center border-b border-sidebar-border/30 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setIsSecondaryOpen((prev) => !prev)}
                      className="size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors cursor-pointer focus:outline-none"
                      aria-label={isSecondaryOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                      {isSecondaryOpen ? (
                        <>
                          <img src="/matur-logo-slogan.png" alt="MATUR.ai" className="size-5 object-contain dark:hidden" />
                          <img src="/matur-dark.png" alt="MATUR.ai" className="size-5 object-contain hidden dark:block" />
                        </>
                      ) : (
                        <IconChevronsRight className="size-4 shrink-0 text-primary" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">
                    {isSecondaryOpen ? "MATUR.ai" : "Expand Sidebar"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Navigation Icon Buttons */}
              <div className="flex flex-col gap-1.5 w-full items-center py-1.5">
                <ActivityBarButton
                  icon={IconLayoutDashboard}
                  label="Dashboard"
                  isActive={activeTab === "dashboard"}
                  iconColorClass="text-[var(--primary)]"
                  onClick={() => handleTabClick("dashboard")}
                />
                <ActivityBarButton
                  icon={IconClipboardCheck}
                  label="AIMA Assessment"
                  isActive={activeTab === "aima"}
                  iconColorClass="text-[var(--section-free)]"
                  onClick={() => handleTabClick("aima")}
                />
                <ActivityBarButton
                  icon={IconDiamond}
                  label="Premium Features"
                  isActive={activeTab === "premium"}
                  iconColorClass="text-[var(--section-premium)]"
                  onClick={() => handleTabClick("premium")}
                />
                <ActivityBarButton
                  icon={IconBriefcase}
                  label="Project Settings"
                  isActive={activeTab === "settings"}
                  iconColorClass="text-[var(--section-settings)]"
                  onClick={() => handleTabClick("settings")}
                />
                {Boolean(user?.role && user.role.trim().toUpperCase() === "ADMIN") && (
                  <ActivityBarButton
                    icon={IconShieldLock}
                    label="Admin Panel"
                    isActive={activeTab === "admin"}
                    iconColorClass="text-[var(--section-admin)]"
                    onClick={() => handleTabClick("admin")}
                  />
                )}
              </div>
            </div>

            {/* Bottom Profile / Theme / Notification Controls */}
            <div className="flex flex-col items-center gap-2 w-full pb-3">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Notifications"
                    className="relative flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors focus:outline-none cursor-pointer"
                  >
                    <IconBell className="size-5 shrink-0" />
                    {myInvitations.length > 0 && (
                      <span className="absolute top-1 right-1 size-2 bg-primary rounded-full ring-2 ring-sidebar" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" side="right" align="end">
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
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Switcher */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors focus:outline-none cursor-pointer"
                    aria-label="Toggle Theme"
                  >
                    {theme === "dark" ? <IconSun className="size-5 text-primary" /> : <IconMoon className="size-5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="text-xs">
                  Toggle Theme ({theme === "dark" ? "Light" : "Dark"})
                </TooltipContent>
              </Tooltip>

              {/* User Profile */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button aria-label="User profile menu" className="flex items-center justify-center size-9 rounded-lg bg-transparent border-0 cursor-pointer relative hover:bg-sidebar-accent/60 focus:outline-none focus:ring-1 focus:ring-ring select-none">
                      <Avatar className="size-7 rounded-full shrink-0 select-none">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center size-7">
                          {(user.name || user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" side="right" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1 overflow-hidden">
                        <p className="text-sm font-semibold leading-none truncate text-foreground">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/settings")} className="flex items-center gap-2 cursor-pointer">
                      <IconUser className="size-4 shrink-0 text-muted-foreground" />
                      <span>Profile Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer">
                      <IconLogout className="size-4 shrink-0" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* ─── 2. Expanded Secondary Details Sidebar ──────────────────────── */}
          <AnimatePresence initial={false}>
            {isSecondaryOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: sidebarWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={isResizing ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }}
                style={{ width: sidebarWidth }}
                className="relative h-screen min-h-screen border-r border-sidebar-border/40 bg-sidebar flex flex-col shrink-0 overflow-hidden"
              >
                {/* Header */}
                <div className="h-12 px-3 flex items-center justify-between border-b border-sidebar-border/30 bg-sidebar/50 shrink-0 select-none">
                  <span className="text-base font-bold tracking-tight text-foreground truncate">
                    MATUR<span className="text-primary font-semibold">.ai</span>
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setIsSecondaryOpen(false)}
                        className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors focus:outline-none cursor-pointer"
                        aria-label="Collapse Sidebar"
                      >
                        <IconChevronsLeft className="size-4 shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Collapse Details Sidebar
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Details Content Container */}
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                  {/* Project Selection Card (for non-dashboard tabs) */}
                  {activeTab !== "dashboard" && (
                    <div className="mb-2">
                      <button
                        type="button"
                        onClick={() => setShowProjectModal(true)}
                        className="flex items-center justify-between w-full p-2.5 rounded-xl border border-sidebar-border/60 bg-gradient-to-r from-sidebar-accent/50 to-sidebar-accent/20 hover:from-sidebar-accent/70 hover:to-sidebar-accent/40 transition-all duration-200 cursor-pointer text-left group shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="size-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
                            <IconFolder className="size-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-foreground truncate">{projectName || "Select Project"}</span>
                          </div>
                        </div>
                        <IconSelector className="size-4 text-muted-foreground/70 shrink-0 ml-1.5 group-hover:text-primary transition-colors" />
                      </button>
                    </div>
                  )}

                  {/* Tab specific detail menus */}
                  {activeTab === "dashboard" && (
                    <div className="flex flex-col gap-3">
                      {/* Overview Dashboard Link */}
                      <div className="flex flex-col gap-1">
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === "/dashboard" || pathname === "/"}
                          className={cn(
                            "h-8 px-2 transition-all",
                            (pathname === "/dashboard" || pathname === "/") && "border-l-[3px] border-primary bg-primary/10 text-primary pl-1.5 font-semibold rounded-l-none rounded-r-md"
                          )}
                        >
                          <Link href="/dashboard" className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium">
                            <IconDashboard className="size-4 text-primary shrink-0" />
                            <span>Dashboard</span>
                          </Link>
                        </SidebarMenuButton>
                      </div>

                      {/* Project Search & List Section */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-2 py-0.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Projects ({userProjects.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowProjectModal(true)}
                            className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                          >
                            Modal View
                          </button>
                        </div>

                        {/* Search Input Filter */}
                        {userProjects.length > 2 && (
                          <div className="px-0.5">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search projects..."
                                value={projectSearchQuery}
                                onChange={(e) => setProjectSearchQuery(e.target.value)}
                                className="w-full h-7 pl-7 pr-2 text-sm rounded-md border border-border/50 bg-background/80 focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/60"
                              />
                              <IconSearch className="size-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                            </div>
                          </div>
                        )}

                        {isLoadingProjects ? (
                          <div className="flex items-center justify-center p-4">
                            <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : userProjects.length === 0 ? (
                          <div className="p-3 text-center rounded-lg border border-dashed border-border/50 bg-muted/20">
                            <p className="text-xs text-muted-foreground">No projects found</p>
                            <button
                              type="button"
                              onClick={() => router.push("/dashboard")}
                              className="mt-2 text-xs text-primary font-medium hover:underline cursor-pointer"
                            >
                              + Create Project
                            </button>
                          </div>
                        ) : filteredSidebarProjects.length === 0 ? (
                          <div className="p-3 text-center rounded-lg border border-dashed border-border/40 bg-muted/10">
                            <p className="text-xs text-muted-foreground">No matching projects</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-0.5">
                            {filteredSidebarProjects.map((p) => {
                              const isSelected = projectId === p.id;
                              const statusLabel = p.status === "completed" ? "Completed" : p.status === "in_progress" ? "In Progress" : "Not Started";
                              const statusColor = p.status === "completed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : p.status === "in_progress" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20";

                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => router.push(`/assess/${p.id}`)}
                                  className={cn(
                                    "flex flex-col gap-1 p-2 rounded-lg border transition-all text-left cursor-pointer group",
                                    isSelected
                                      ? "border-primary/50 bg-primary/10 text-foreground font-medium shadow-xs"
                                      : "border-border/40 dark:border-sidebar-border/60 bg-slate-50/50 dark:bg-sidebar-accent/20 hover:bg-slate-100 dark:hover:bg-sidebar-accent/60 text-foreground/90"
                                  )}
                                >
                                  <div className="flex items-center gap-2 w-full min-w-0">
                                    <div className={cn(
                                      "size-6 rounded-md flex items-center justify-center shrink-0 transition-colors",
                                      isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                                    )}>
                                      <IconFolder className="size-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold truncate text-foreground flex-1 min-w-0">{p.name}</span>
                                    {isSelected && (
                                      <span className="size-2 rounded-full bg-primary shrink-0 ml-auto" />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-1 pl-8 text-[10px] text-muted-foreground">
                                    <span className="truncate max-w-[110px]">{p.ai_system_type || "General AI"}</span>
                                    <span className={cn("px-1.5 py-0.5 rounded font-medium text-[9px] border", statusColor)}>
                                      {statusLabel}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "aima" && (
                    <div className="flex flex-col gap-1">
                      <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300 dark:text-zinc-400 flex items-center gap-1.5 border-b border-sidebar-border/30 mb-1">
                        <span className="size-1.5 rounded-full bg-primary shrink-0" />
                        <span>AIMA Domains</span>
                      </div>
                      <SidebarMenu className="gap-0.5">
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
                      </SidebarMenu>
                    </div>
                  )}

                  {activeTab === "premium" && (
                    <div className="flex flex-col gap-3">
                      {/* CRC Governance & Controls */}
                      <div className="flex flex-col gap-1">
                        <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5 border-b border-sidebar-border/30 mb-1">
                          <span className="size-1.5 rounded-full bg-[var(--section-premium)] shrink-0" />
                          <span>CRC Governance & Controls</span>
                        </div>
                        <SidebarMenuButton
                          onClick={() => handleProjectNav("/crc/dashboard")}
                          isActive={routeFlags.isCrcPage && pathname?.endsWith("/dashboard")}
                          className={cn(
                            "h-8 px-2 transition-all",
                            routeFlags.isCrcPage && pathname?.endsWith("/dashboard") && "border-l-[3px] border-[var(--section-premium)] bg-[var(--section-premium)]/10 text-[var(--section-premium)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                          )}
                        >
                          <IconLayoutDashboard className="size-4 text-[var(--section-premium)] shrink-0" />
                          <span className="text-sm font-medium truncate">CRC Dashboard</span>
                        </SidebarMenuButton>
                        <SidebarMenuButton
                          onClick={() => handleProjectNav("/crc/risks")}
                          isActive={routeFlags.isRiskRegisterPage}
                          className={cn(
                            "h-8 px-2 transition-all",
                            routeFlags.isRiskRegisterPage && "border-l-[3px] border-[var(--section-premium)] bg-[var(--section-premium)]/10 text-[var(--section-premium)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                          )}
                        >
                          <IconAlertTriangle className="size-4 text-[var(--section-premium)] shrink-0" />
                          <span className="text-sm font-medium truncate">AI Risk Register</span>
                        </SidebarMenuButton>

                        {/* Categories */}
                        {crcCategories.map((cat: any, idx: number) => {
                          const categoryName = typeof cat === "string" ? cat : (cat?.category_name || cat?.name || `Category ${idx + 1}`);
                          const categoryKey = typeof cat === "string" ? cat : (cat?.id || cat?.category_name || idx);
                          const isCatExpanded = !!expandedCrcCategories[categoryName];
                          const catControls = controlsByCategory[categoryName] || [];
                          const isCatActive = currentCategory === categoryName;
                          return (
                            <div key={categoryKey} className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedCrcCategories((prev: Record<string, boolean>) => ({
                                    ...prev,
                                    [categoryName]: !prev[categoryName],
                                  }));
                                }}
                                className={cn(
                                  "flex items-center gap-1.5 h-7 px-2 rounded-md text-sm font-medium transition-colors w-full text-left cursor-pointer hover:bg-sidebar-accent/50",
                                  isCatActive && "text-[var(--section-premium)] font-semibold bg-[var(--section-premium)]/10 border-l-[3px] border-[var(--section-premium)] pl-1.5 rounded-l-none rounded-r-md"
                                )}
                              >
                                <IconChevronRight className={cn("size-3.5 text-muted-foreground transition-transform shrink-0", isCatExpanded && "rotate-90")} />
                                <span className="truncate flex-1">{categoryName}</span>
                                <span className="text-xs text-muted-foreground/70 font-mono">{catControls.length}</span>
                              </button>

                              <AnimatePresence>
                                {isCatExpanded && catControls.length > 0 && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden pl-4 flex flex-col gap-0.5 mt-0.5"
                                  >
                                    {catControls.map((ctrl: CRCControl) => {
                                      const isCtrlActive = currentControlId === ctrl.id;
                                      return (
                                        <button
                                          key={ctrl.id}
                                          type="button"
                                          onClick={() => handleProjectNav(`/crc?controlId=${ctrl.id}`)}
                                          className={cn(
                                            "flex items-center gap-1.5 h-6 px-2 rounded-md text-xs transition-colors w-full text-left cursor-pointer",
                                            isCtrlActive ? "text-[var(--section-premium)] font-semibold bg-[var(--section-premium)]/15 border-l-[3px] border-[var(--section-premium)] pl-1 rounded-l-none rounded-r-md" : "text-muted-foreground hover:text-foreground"
                                          )}
                                        >
                                          <IconShieldCheck className="size-3 shrink-0 text-[var(--section-premium)]" />
                                          <span className="truncate">{ctrl.control_id} - {ctrl.control_title}</span>
                                        </button>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>

                      {/* Fairness & Bias */}
                      <div className="flex flex-col gap-1">
                        <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5 border-b border-sidebar-border/30 mb-1">
                          <span className="size-1.5 rounded-full bg-[var(--section-premium)] shrink-0" />
                          <span>Fairness & Bias</span>
                        </div>
                        <SidebarMenuButton
                          onClick={() => handleProjectNav("/fairness-bias")}
                          isActive={routeFlags.isManualPromptPage}
                          className={cn(
                            "h-8 px-2 transition-all",
                            routeFlags.isManualPromptPage && "border-l-[3px] border-[var(--section-premium)] bg-[var(--section-premium)]/10 text-[var(--section-premium)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                          )}
                        >
                          <IconScale className="size-4 text-[var(--section-premium)] shrink-0" />
                          <span className="text-sm font-medium truncate">Manual Prompt Testing</span>
                        </SidebarMenuButton>
                        <SidebarMenuButton
                          onClick={() => handleProjectNav("/fairness-bias/api-endpoint")}
                          isActive={routeFlags.isApiEndpointPage}
                          className={cn(
                            "h-8 px-2 transition-all",
                            routeFlags.isApiEndpointPage && "border-l-[3px] border-[var(--section-premium)] bg-[var(--section-premium)]/10 text-[var(--section-premium)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                          )}
                        >
                          <IconApi className="size-4 text-[var(--section-premium)] shrink-0" />
                          <span className="text-sm font-medium truncate">API Automated Testing</span>
                        </SidebarMenuButton>
                        <SidebarMenuButton
                          onClick={() => handleProjectNav("/fairness-bias/dataset-testing")}
                          isActive={routeFlags.isDatasetTestingPage}
                          className={cn(
                            "h-8 px-2 transition-all",
                            routeFlags.isDatasetTestingPage && "border-l-[3px] border-[var(--section-premium)] bg-[var(--section-premium)]/10 text-[var(--section-premium)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                          )}
                        >
                          <IconTable className="size-4 text-[var(--section-premium)] shrink-0" />
                          <span className="text-sm font-medium truncate">Dataset Testing</span>
                        </SidebarMenuButton>
                        <SidebarMenuButton
                          onClick={() => handleProjectNav("/fairness-bias/options")}
                          isActive={routeFlags.isFairnessOptionsPage}
                          className={cn(
                            "h-8 px-2 transition-all",
                            routeFlags.isFairnessOptionsPage && "border-l-[3px] border-[var(--section-premium)] bg-[var(--section-premium)]/10 text-[var(--section-premium)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                          )}
                        >
                          <IconSettings className="size-4 text-[var(--section-premium)] shrink-0" />
                          <span className="text-sm font-medium truncate">Testing Options & Hub</span>
                        </SidebarMenuButton>
                      </div>

                      {/* Security & Assets */}
                      <div className="flex flex-col gap-1">
                        <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5 border-b border-sidebar-border/30 mb-1">
                          <span className="size-1.5 rounded-full bg-[var(--section-premium)] shrink-0" />
                          <span>Security & Assets</span>
                        </div>
                        <SidebarMenuButton
                          onClick={() => handleProjectNav("/vulnerability-assessment")}
                          isActive={routeFlags.isVulnerabilityPage}
                          className={cn(
                            "h-8 px-2 transition-all",
                            routeFlags.isVulnerabilityPage && "border-l-[3px] border-[var(--section-premium)] bg-[var(--section-premium)]/10 text-[var(--section-premium)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                          )}
                        >
                          <IconShieldLock className="size-4 text-[var(--section-premium)] shrink-0" />
                          <span className="text-sm font-medium truncate">AI Vulnerability Assessment</span>
                        </SidebarMenuButton>
                        <SidebarMenuButton
                          onClick={() => handleProjectNav("/inventory")}
                          isActive={routeFlags.isInventoryPage}
                          className={cn(
                            "h-8 px-2 transition-all",
                            routeFlags.isInventoryPage && "border-l-[3px] border-[var(--section-premium)] bg-[var(--section-premium)]/10 text-[var(--section-premium)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                          )}
                        >
                          <IconFolder className="size-4 text-[var(--section-premium)] shrink-0" />
                          <span className="text-sm font-medium truncate">AI Component Inventory</span>
                        </SidebarMenuButton>
                      </div>
                    </div>
                  )}

                  {activeTab === "settings" && (
                    <div className="flex flex-col gap-1">
                      <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                        Project Settings
                      </div>
                      <SidebarMenuButton
                        onClick={() => handleProjectNav("/settings")}
                        isActive={routeFlags.isSettingsPage}
                        className={cn(
                          "h-8 px-2 transition-all",
                          routeFlags.isSettingsPage && "border-l-[3px] border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                        )}
                      >
                        <IconBriefcase className="size-4 text-[var(--primary)] shrink-0" />
                        <span className="text-sm font-medium truncate">Project Information</span>
                      </SidebarMenuButton>
                      <SidebarMenuButton
                        onClick={() => handleProjectNav("/team")}
                        isActive={routeFlags.isTeamPage}
                        className={cn(
                          "h-8 px-2 transition-all",
                          routeFlags.isTeamPage && "border-l-[3px] border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                        )}
                      >
                        <IconUsers className="size-4 text-[var(--primary)] shrink-0" />
                        <span className="text-sm font-medium truncate">Team Members</span>
                      </SidebarMenuButton>
                      <SidebarMenuButton
                        onClick={() => handleProjectNav("/settings/wizard")}
                        isActive={routeFlags.isWizardSettingsPage}
                        className={cn(
                          "h-8 px-2 transition-all",
                          routeFlags.isWizardSettingsPage && "border-l-[3px] border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                        )}
                      >
                        <IconCpu className="size-4 text-[var(--primary)] shrink-0" />
                        <span className="text-sm font-medium truncate">AI System Profile</span>
                      </SidebarMenuButton>
                    </div>
                  )}

                  {activeTab === "admin" && Boolean(user?.role && user.role.trim().toUpperCase() === "ADMIN") && (
                    <div className="flex flex-col gap-1">
                      <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-[var(--section-admin)]">
                        Admin Tools
                      </div>
                      {adminNavItems.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item);
                        return (
                          <SidebarMenuButton
                            key={item.id}
                            asChild
                            isActive={active}
                            className={cn(
                              "h-8 px-2 transition-all",
                              active && "border-l-[3px] border-[var(--section-admin)] bg-[var(--section-admin)]/10 text-[var(--section-admin)] pl-1.5 font-semibold rounded-l-none rounded-r-md"
                            )}
                          >
                            <Link href={item.href} className="flex items-center gap-2 text-sm font-medium">
                              <Icon className="size-4 text-[var(--section-admin)] shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Drag Resize Handle on right edge */}
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
                  <div className={cn(
                    "absolute inset-y-0 left-1/2 -translate-x-1/2 transition-all duration-150",
                    isResizing
                      ? "w-[3px] bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                      : "w-[1px] bg-border/80 group-hover/resize:bg-primary/60 group-hover/resize:w-[3px]"
                  )} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

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
      </TooltipProvider>
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
