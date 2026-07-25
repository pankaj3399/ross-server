"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrialConfirmationModal } from "./TrialConfirmationModal";
import { useTrialStart } from "./useTrialStart";
import {
  IconCircleCheck,
  IconCrown,
  IconBrain,
  IconShield,
  IconScale,
  IconBug,
  IconChartBar,
  IconUsers,
  IconLoader2,
  IconArrowRight,
  IconCompass,
  IconFolder,
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

import { IconTrash } from "@tabler/icons-react";

interface PathSelectionModalProps {
  isOpen: boolean;
  projectId: string;
  onSelectAima: () => void;
  onSelectPremium: () => void;
  onUpgradeClick?: () => void;
  onClose?: () => void;
  onDeleteProject?: (projectId: string) => void;
}

const AIMA_FEATURES = [
  "Basic AI maturity assessment questions",
  "Domain-level scoring across governance areas",
  "Single project",
];

const PREMIUM_FEATURES = [
  {
    icon: IconShield,
    text: "Compliance Readiness Controls (CRC)",
    description: "Track compliance across EU AI Act, NIST AI RMF & ISO 42001",
  },
  {
    icon: IconBug,
    text: "AI Vulnerability Assessment",
    description: "Automated security scanning for your AI models",
  },
  {
    icon: IconScale,
    text: "Automated Bias & Fairness Testing",
    description: "Test via manual prompts, API endpoints, or datasets",
  },
  {
    icon: IconChartBar,
    text: "Enhanced Reporting & Analytics",
    description: "Exportable PDF/Excel reports with actionable insights",
  },
  {
    icon: IconFolder,
    text: "Unlimited Projects",
    description: "No cap on the number of AI systems you can assess",
  },
  {
    icon: IconUsers,
    text: "Team Collaboration",
    description: "Invite team members with role-based permissions",
  },
];

export default function PathSelectionModal({
  isOpen,
  projectId,
  onSelectAima,
  onSelectPremium,
  onUpgradeClick,
  onClose,
  onDeleteProject,
}: PathSelectionModalProps) {
  const { user } = useAuth();
  const { confirmTrial, isStartingTrial } = useTrialStart();
  const [isSelectingAima, setIsSelectingAima] = useState(false);
  const [showTrialConfirm, setShowTrialConfirm] = useState(false);

  const isPaidUser = user?.subscription_status && user?.subscription_status !== "free";
  const hasUsedTrial = user?.trial_used;

  const handleSelectAima = async () => {
    setIsSelectingAima(true);
    try {
      // Record the path choice
      await apiService.recordPathChoice("aima");
      onSelectAima();
    } catch (error: any) {
      console.error("Failed to record path choice:", error);
      showToast.error(error.message || "Failed to record path choice. Please try again.");
    } finally {
      setIsSelectingAima(false);
    }
  };

  const handleSelectPremium = async () => {
    if (isPaidUser) {
      onSelectPremium();
      return;
    }

    if (hasUsedTrial) {
      onUpgradeClick?.();
      return;
    }

    setShowTrialConfirm(true);
  };

  const handleConfirmTrial = () => {
    confirmTrial(() => {
      setShowTrialConfirm(false);
      onSelectPremium();
    });
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && onClose) onClose(); }}>
      <DialogContent
        className="max-w-5xl p-0 overflow-y-auto max-h-[95vh] border-0 bg-transparent"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="text-center px-8 pt-8 pb-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 flex justify-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <IconCompass className="w-9 h-9 text-primary" />
              </div>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-3xl font-extrabold tracking-tight"
            >
              Choose Your Path
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground mt-2 max-w-2xl mx-auto text-base"
            >
              Start with a basic assessment or unlock the full AI governance suite.
              You can always upgrade later.
            </motion.p>
          </div>

          {/* Two-Column Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 px-6 pb-6">
            {/* Left Column — AIMA Free (narrower, 2/5) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 p-6 rounded-2xl border border-border bg-muted/30 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                  <IconBrain className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">AIMA</h3>
                  <p className="text-xs text-muted-foreground font-medium">AI Maturity Assessment</p>
                </div>
              </div>

              <Badge variant="secondary" className="w-fit mb-4 text-xs">
                Free
              </Badge>

              <p className="text-sm text-muted-foreground mb-6">
                Answer structured questions to gauge your organization&apos;s AI maturity level.
              </p>

              <div className="space-y-3 mb-8 flex-1">
                {AIMA_FEATURES.map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-start gap-2.5"
                  >
                    <IconCircleCheck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleSelectAima}
                disabled={isSelectingAima || isStartingTrial}
                className="w-full h-12 text-base font-medium border-border hover:bg-muted"
              >
                {isSelectingAima ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <IconBrain className="w-5 h-5 mr-2" />
                    Continue with AIMA
                    <IconArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>

            {/* Right Column — Premium CRC (wider, 3/5, highlighted) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-3 relative p-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5 flex flex-col"
            >
              {/* Recommended badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="absolute -top-3 right-6"
              >
                <Badge className="bg-primary text-primary-foreground border-0 font-bold tracking-wide px-3 py-1 text-xs">
                  ★ RECOMMENDED
                </Badge>
              </motion.div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center">
                  <IconCrown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Full AI Governance Suite</h3>
                  <p className="text-xs text-muted-foreground font-medium">AIMA + CRC + Premium Features</p>
                </div>
              </div>

              <Badge className="w-fit mb-4 text-xs bg-primary/10 text-primary border-primary/20">
                {isPaidUser ? "Included in your Plan" : hasUsedTrial ? "Premium Upgrade" : "7-Day Free Trial"}
              </Badge>

              <p className="text-sm text-foreground/80 mb-6">
                Everything in AIMA, plus comprehensive compliance controls, vulnerability scanning, bias testing, and more — the complete toolkit for responsible AI governance.
              </p>

              <div className="space-y-4 mb-8 flex-1">
                {PREMIUM_FEATURES.map((feature, i) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{feature.text}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={handleSelectPremium}
                disabled={isStartingTrial || isSelectingAima}
                className="w-full h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
              >
                {isStartingTrial ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
                    {isPaidUser ? "Loading..." : "Starting Trial..."}
                  </>
                ) : (
                  <>
                    <IconCrown className="w-5 h-5 mr-2" />
                    {isPaidUser ? "Start with CRC (Premium)" : hasUsedTrial ? "Upgrade to Premium" : "Start 7-Day Free Trial"}
                  </>
                )}
              </Button>
              {!isPaidUser && !hasUsedTrial && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  No credit card required
                </p>
              )}
            </motion.div>
          </div>

          {(onDeleteProject || onClose) && (
            <div className="flex justify-between items-center px-6 py-3 border-t border-border bg-muted/20">
              {onDeleteProject ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(projectId);
                  }}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <IconTrash className="w-4 h-4" />
                  <span>Delete Project</span>
                </Button>
              ) : <div />}
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Close & Decide Later
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>

    <TrialConfirmationModal
      isOpen={showTrialConfirm}
      onClose={() => setShowTrialConfirm(false)}
      onConfirm={handleConfirmTrial}
      isLoading={isStartingTrial}
    />
    </>
  );
}
