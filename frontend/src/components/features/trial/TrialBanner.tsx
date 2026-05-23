"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconClock, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import SubscriptionModal from "../subscriptions/SubscriptionModal";

export default function TrialBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    if (user?.subscription_status === "trial" && user.trial_ends_at) {
      const endsAt = new Date(user.trial_ends_at).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24)));
      setDaysRemaining(remaining);

      // Only show banner if not previously dismissed in localStorage for this user
      const isDismissed = localStorage.getItem(`trial_banner_dismissed_${user.id}`) === "true";
      if (!isDismissed) {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [user]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (user?.id) {
      localStorage.setItem(`trial_banner_dismissed_${user.id}`, "true");
    }
  };

  if (user?.subscription_status !== "trial" || daysRemaining === null || !isVisible) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-primary/20"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <IconClock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Free Trial Active
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                      {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upgrade to Premium anytime to keep full access and preserve your data.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  Upgrade Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleDismiss}
                >
                  <IconX className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentPlan="trial"
        title="Upgrade to Premium"
        description="Your trial gives you full access to BLOOM. Upgrade now to keep these features and preserve your data."
      />
    </>
  );
}

