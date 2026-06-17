"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCrown,
  IconShield,
  IconScale,
  IconBug,
  IconChartBar,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";
import { apiService } from "../../../lib/api";
import { showToast } from "../../../lib/toast";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DISMISS_PERMANENT_KEY = (userId: string) => `premium_popup_dismissed_${userId}`;
const DISMISS_SESSION_KEY = (userId: string) => `premium_popup_shown_${userId}_${new Date().toISOString().slice(0, 10)}`;

const HIGHLIGHTS = [
  {
    icon: IconShield,
    title: "Compliance Readiness Controls",
    description: "Track your readiness across EU AI Act, NIST AI RMF, and ISO 42001.",
  },
  {
    icon: IconBug,
    title: "AI Vulnerability Assessment",
    description: "Automated security scanning to identify risks early.",
  },
  {
    icon: IconScale,
    title: "Bias & Fairness Testing",
    description: "Detect algorithmic bias across your datasets and API endpoints.",
  },
  {
    icon: IconChartBar,
    title: "Advanced Reporting",
    description: "Exportable PDF/Excel reports, team collaboration, and unlimited projects.",
  },
];

export default function PremiumReEngagementPopup() {
  const { user, refreshUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Only show for free users who haven't used trial
    if (user.subscription_status !== "free" || user.trial_used) return;

    // Check if permanently dismissed
    const permanentKey = DISMISS_PERMANENT_KEY(user.id);
    if (localStorage.getItem(permanentKey) === "true") return;

    // Check if already shown today
    const sessionKey = DISMISS_SESSION_KEY(user.id);
    if (localStorage.getItem(sessionKey) === "true") return;

    // Check if user has previously chosen the AIMA path (at least one project started)
    // We use the presence of path_choice keys in localStorage as a signal
    const hasChosenAimaPath = Object.keys(localStorage).some(
      (key) => key.startsWith(`path_choice_${user.id}_`) && localStorage.getItem(key) === "aima"
    );

    if (!hasChosenAimaPath) return;

    // Show popup after a delay to let the dashboard load first
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Mark as shown today
      localStorage.setItem(sessionKey, "true");
    }, 1500);

    return () => clearTimeout(timer);
  }, [user]);

  const handleDismiss = () => {
    if (dontShowAgain && user?.id) {
      localStorage.setItem(DISMISS_PERMANENT_KEY(user.id), "true");
    }
    setIsVisible(false);
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      await apiService.startTrial();
      await refreshUser();
      showToast.success("🎉 Your 7-day free trial has started!");
      setIsVisible(false);
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to start trial:", error);
      showToast.error(error.message || "Failed to start free trial.");
    } finally {
      setIsStartingTrial(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-lg p-0 overflow-y-auto max-h-[90vh] border-0 bg-transparent [&>button]:hidden">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
            className="bg-background rounded-3xl shadow-2xl border border-primary/20 overflow-hidden"
          >
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pt-6 pb-4 relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-3 right-3 h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-full"
                onClick={handleDismiss}
              >
                <IconX className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/15 rounded-full flex items-center justify-center">
                  <IconCrown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Welcome back!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You&apos;re missing out on powerful features
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              <p className="text-sm text-muted-foreground mb-5">
                AIMA is just one part of the platform. Here&apos;s what the full AI governance suite gives you:
              </p>

              <div className="space-y-3 mb-6">
                {HIGHLIGHTS.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA Section */}
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Try everything free for 7 days</p>
                    <p className="text-xs text-muted-foreground">No credit card required</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs shrink-0">
                    FREE
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleStartTrial}
                  disabled={isStartingTrial}
                  className="w-full h-11 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                  {isStartingTrial ? (
                    <>
                      <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
                      Starting Trial...
                    </>
                  ) : (
                    <>
                      <IconCrown className="w-4 h-4 mr-2" />
                      Start 7-Day Free Trial
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="rounded border-border w-3.5 h-3.5 text-primary focus:ring-primary/20"
                    />
                    <span className="text-xs text-muted-foreground">Don&apos;t show again</span>
                  </label>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Maybe later
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
