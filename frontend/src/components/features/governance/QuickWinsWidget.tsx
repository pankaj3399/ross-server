"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconLoader2,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconChevronRight,
  IconSparkles,
  IconFileText
} from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiService, type QuickWinItem } from "@/lib/api";

interface QuickWinsWidgetProps {
  projectId: string;
}

interface DisplayItem extends QuickWinItem {
  isCompleting?: boolean;
}

export function QuickWinsWidget({ projectId }: QuickWinsWidgetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wizardRequired, setWizardRequired] = useState(false);
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const requestSeqRef = useRef(0);
  const replaceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track last clicked item to trigger animation if it gets completed
  const clickedItemRef = useRef<string | null>(null);

  const fetchQuickWins = useCallback(async (isSilent = false) => {
    const requestId = ++requestSeqRef.current;
    if (!isSilent) setLoading(true);
    try {
      const res = await apiService.getQuickWins(projectId);
      if (requestId !== requestSeqRef.current) return;
      if (res.success) {
        setWizardRequired(res.wizardRequired);
        
        if (res.wizardRequired) {
          setDisplayItems([]);
          return;
        }

        const newItems: DisplayItem[] = res.items || [];

        setDisplayItems((prev) => {
          if (prev.length === 0) return newItems;
          const completedIds = prev
            .filter(oldItem => !newItems.some(newItem => newItem.controlId === oldItem.controlId))
            .map(item => item.controlId);

          if (completedIds.length > 0) {
            if (replaceTimeoutRef.current) clearTimeout(replaceTimeoutRef.current);
            replaceTimeoutRef.current = setTimeout(() => {
              if (requestId === requestSeqRef.current) setDisplayItems(newItems);
            }, 1000);
            return prev.map(item =>
              completedIds.includes(item.controlId) ? { ...item, isCompleting: true } : item
            );
          }
          return newItems;
        });
      }
    } catch (err) {
      console.error("Failed to fetch quick wins:", err);
    } finally {
      if (!isSilent && requestId === requestSeqRef.current) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchQuickWins();
    return () => {
      if (replaceTimeoutRef.current) clearTimeout(replaceTimeoutRef.current);
    };
  }, [fetchQuickWins]);

  // Refetch silently on window focus to catch completions from other tabs
  useEffect(() => {
    const handleFocus = () => {
      fetchQuickWins(true);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchQuickWins]);

  const handleItemClick = (item: DisplayItem) => {
    clickedItemRef.current = item.controlId;
    router.push(`/assess/${projectId}/crc?controlId=${item.controlId}`);
  };

  if (loading) {
    return (
      <Card className="border border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="py-10 flex flex-col items-center justify-center space-y-3">
          <IconLoader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing quick wins...</p>
        </CardContent>
      </Card>
    );
  }

  // Pre-wizard State: Show CTA to complete profile
  if (wizardRequired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="relative overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 via-background to-background backdrop-blur-md">
          {/* Glassmorphic glowing accent */}
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
          
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center md:justify-between gap-6">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-2.5 py-0.5">
                ⚡ CRC Optimization
              </Badge>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Complete your AI System Profile to activate Quick Wins
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                Answer a few questions about your AI system to filter out irrelevant compliance controls. 
                We will identify and rank the 5 lowest-effort, highest-impact tasks you can complete this week to jumpstart your readiness score.
              </CardDescription>
            </div>
            <div className="shrink-0">
              <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 border-none rounded-xl font-semibold gap-2">
                <Link href={`/assess/${projectId}/crc/welcome`}>
                  Start System Profile
                  <IconArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Empty State: All quick wins completed!
  if (displayItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border border-emerald-500/20 bg-gradient-to-br from-emerald-950/10 via-background to-background">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
              <IconSparkles className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">🎉 All quick wins completed!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Excellent progress! You have addressed all high-priority, low-effort controls recommended for this week.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Active State: Render recommended quick wins
  return (
    <div className="space-y-4">
      {/* Confetti Animation styles injected locally */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-burst 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}} />

      <Card className="border border-border/80 shadow-sm overflow-hidden bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold flex items-center gap-1.5 text-foreground">
              <IconSparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              ⚡ Quick Wins: Recommended for this week
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              These controls are selected based on low effort, high framework mapping, and compliance priority.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 tabular-nums">
            {displayItems.filter(item => !item.isCompleting).length} suggestions
          </Badge>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          <AnimatePresence initial={false}>
            {displayItems.map((item) => {
              const isLow = item.effortTier === "Low";
              const isMed = item.effortTier === "Medium";
              
              const effortColor = isLow 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : isMed 
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";

              return (
                <motion.div
                  key={item.controlId}
                  layoutId={item.controlId}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative overflow-hidden"
                >
                  {item.isCompleting && <ConfettiBurst />}

                  <button
                    onClick={() => handleItemClick(item)}
                    disabled={item.isCompleting}
                    className={`w-full text-left p-4 sm:p-5 flex gap-4 items-start transition-all hover:bg-muted/40 relative group ${
                      item.isCompleting ? "pointer-events-none opacity-40 duration-700 filter blur-[0.5px]" : ""
                    }`}
                  >
                    {/* Checkbox representation */}
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-md border-2 border-border group-hover:border-primary flex items-center justify-center transition-colors">
                      <IconCheck className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="flex-1 space-y-1.5 min-w-0">
                      {/* Meta Tags */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="font-mono text-[10px] font-semibold tracking-wider">
                          {item.controlShortId}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] font-medium border ${effortColor}`}>
                          <IconClock className="w-2.5 h-2.5 mr-1 inline shrink-0" />
                          {item.effortBadge}
                        </Badge>
                        {item.flag === "MANDATORY" ? (
                          <Badge className="bg-red-500/10 hover:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-semibold">
                            Mandatory
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-500/10 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
                            Recommended
                          </Badge>
                        )}
                        {item.isDocumentationQuickWin && (
                          <Badge className="bg-amber-500/10 hover:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 text-[10px] font-semibold gap-1">
                            <IconFileText className="w-2.5 h-2.5" />
                            Documentation Gap
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline">
                          {item.categoryName}
                        </span>
                      </div>

                      {/* Control Title */}
                      <h4 className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                        {item.controlTitle}
                      </h4>

                      {/* Why it matters */}
                      {item.whyItMatters && (
                        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                          <span className="font-medium text-foreground/70">Goal:</span> {item.whyItMatters}
                        </p>
                      )}
                    </div>

                    <div className="mt-1 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                      <IconChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

// Confetti burst animation particles
function ConfettiBurst() {
  const count = 24;
  const particles = Array.from({ length: count });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((_, i) => {
        // Random distribution coordinates
        const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.3;
        const radius = 60 + Math.random() * 90;
        const tx = `${Math.cos(angle) * radius}px`;
        const ty = `${Math.sin(angle) * radius - 40}px`; // shift upwards slightly
        const rot = `${(Math.random() - 0.5) * 720}deg`;
        const delay = Math.random() * 0.15;
        const duration = 0.5 + Math.random() * 0.45;
        const size = 5 + Math.random() * 7;
        const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
        const color = colors[Math.floor(Math.random() * colors.length)];

        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm animate-confetti"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              "--tx": tx,
              "--ty": ty,
              "--rot": rot,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            } as any}
          />
        );
      })}
    </div>
  );
}
