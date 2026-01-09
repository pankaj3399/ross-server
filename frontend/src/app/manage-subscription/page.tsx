"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { apiService, SubscriptionDetailsResponse, SubscriptionInvoice } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  AlertTriangle,
  ChevronDown,
  Calendar,
  Download,
  ArrowRight,
  Clock,
  Wallet,
  Coins,
  MessageCircleQuestionMark,
} from "lucide-react";
import Link from "next/link";
import { ManageSubscriptionSkeleton, BillingHistorySkeleton } from "../../components/Skeleton";
import SubscriptionModal from "../../components/SubscriptionModal";
import { SubscriptionPlanDetails } from "../../lib/api";
import { FALLBACK_PRICES } from "../../lib/constants";

// FAQ data shared across the component
interface FAQItem {
  question: string;
  answer: string;
  defaultOpen: boolean;
}

const FAQS: FAQItem[] = [
  {
    question: "Can I upgrade my subscription at any time?",
    answer: "Yes, you can upgrade your plan at any time from your dashboard. The price difference will be calculated and applied to your next billing cycle.",
    defaultOpen: true
  },
  {
    question: "What happens when I cancel my subscription?",
    answer: "When you cancel, you'll maintain full access to all premium features until your current billing period ends. After cancellation, you'll be automatically downgraded to the Free plan.",
    defaultOpen: false
  },
  {
    question: "Can I downgrade my subscription?",
    answer: "Yes, you can downgrade your subscription at any time. The downgrade will take effect at the end of your current billing period, so you'll continue to have access to your current plan's features until then.",
    defaultOpen: false
  },
  {
    question: "Will I be charged immediately when I upgrade?",
    answer: "Yes, when you upgrade, you'll be charged a prorated amount for the remainder of your current billing period. This ensures you only pay for the time you'll have access to the upgraded features. Your next full billing cycle will reflect the new plan's regular pricing.",
    defaultOpen: false
  },
  {
    question: "Do I get a refund if I downgrade or cancel?",
    answer: "No, refunds are not issued for downgrades or cancellations. Since you've already paid for the current billing period, you'll continue to have access to your current plan's features until the period ends. This ensures you receive the full value of what you've paid for.",
    defaultOpen: false
  }
];

// UI constants
const MAX_DISPLAYED_INVOICES = 7;

interface CancellationScheduledCardProps {
  planDetails: SubscriptionPlanDetails | null | undefined;
  formatDate: (value: string | null | undefined) => string;
}

function CancellationScheduledCard({ planDetails, formatDate }: CancellationScheduledCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-red-900/20 border-2 border-amber-300/50 dark:border-amber-700/50 rounded-2xl p-6 shadow-lg"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-2xl"></div>
      <div className="relative flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-500 dark:bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Cancellation Scheduled
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Your subscription will be canceled at the end of your current billing period. You&apos;ll continue to have access until then.
          </p>
          {planDetails?.cancel_effective_date && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Access until:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatDate(planDetails.cancel_effective_date)}
              </span>
              {typeof planDetails.days_remaining === "number" && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {planDetails.days_remaining} day{planDetails.days_remaining === 1 ? "" : "s"} remaining
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ManageSubscriptionPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscription_status: string;
    hasStripeCustomer: boolean;
  } | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetailsResponse | null>(null);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoicesHasMore, setInvoicesHasMore] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showDowngradeConfirmation, setShowDowngradeConfirmation] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  
  // Initialize openFaqIndex based on defaultOpen property
  const defaultOpenIndex = useMemo(() => {
    const index = FAQS.findIndex(faq => faq.defaultOpen === true);
    return index >= 0 ? index : null;
  }, []);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(defaultOpenIndex);

  // Refs for focus management
  const cancelModalRef = useRef<HTMLDivElement>(null);
  const downgradeModalRef = useRef<HTMLDivElement>(null);
  const cancelModalTitleRef = useRef<HTMLHeadingElement>(null);
  const downgradeModalTitleRef = useRef<HTMLHeadingElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [status, details] = await Promise.all([
          apiService.getSubscriptionStatus(),
          apiService.getSubscriptionDetails(),
        ]);
        setSubscriptionStatus(status);
        setSubscriptionDetails(details);
      } catch (err: any) {
        console.error("Error loading subscription status:", err);
        setError(err.message || "Failed to load subscription information.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, authLoading, router]);

  // Lazy load invoices separately (only when subscription details are loaded)
  useEffect(() => {
    if (!subscriptionDetails || !subscriptionStatus?.hasStripeCustomer) {
      return;
    }

    const loadInvoices = async () => {
      try {
        setLoadingInvoices(true);
        const response = await apiService.getInvoices(10);
        setInvoices(response.invoices);
        setInvoicesHasMore(response.has_more);
      } catch (err: any) {
        console.error("Error loading invoices:", err);
        // Don't show error to user, just log it - invoices are not critical
      } finally {
        setLoadingInvoices(false);
      }
    };

    loadInvoices();
  }, [subscriptionDetails, subscriptionStatus]);

  // Focus management and keyboard handlers for Cancel Confirmation Modal
  useEffect(() => {
    if (!showCancelConfirmation) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the modal title when it opens
    const timer = setTimeout(() => {
      cancelModalTitleRef.current?.focus();
    }, 100);

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processingAction) {
        setShowCancelConfirmation(false);
      }
    };

    // Trap focus within modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !cancelModalRef.current) return;

      // Only trap focus if the active element is within the modal
      if (!cancelModalRef.current.contains(document.activeElement)) return;

      const focusableElements = cancelModalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
      // Return focus to the previously focused element
      previousFocusRef.current?.focus();
    };
  }, [showCancelConfirmation, processingAction]);

  // Focus management and keyboard handlers for Downgrade Confirmation Modal
  useEffect(() => {
    if (!showDowngradeConfirmation) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the modal title when it opens
    const timer = setTimeout(() => {
      downgradeModalTitleRef.current?.focus();
    }, 100);

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processingAction) {
        setShowDowngradeConfirmation(false);
      }
    };

    // Trap focus within modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !downgradeModalRef.current) return;

      // Only trap focus if the active element is within the modal
      if (!downgradeModalRef.current.contains(document.activeElement)) return;

      const focusableElements = downgradeModalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
      // Return focus to the previously focused element
      previousFocusRef.current?.focus();
    };
  }, [showDowngradeConfirmation, processingAction]);

  // Use subscription_status directly from backend - do not infer
  const subscription_status = subscriptionStatus?.subscription_status || "free";
  const planDetails = subscriptionDetails?.plan;

  // Calculate billing cycle from period dates (must be before early returns)
  // Note: This logic uses day-based thresholds to infer billing intervals. It handles:
  // - Annual: ~300-400 days (accounts for leap years and slight variations)
  // - Quarterly: ~80-100 days (approximately 3 months)
  // - Monthly: ~25-35 days (accounts for month length variations)
  // Custom intervals or explicit interval fields are not currently available in the planDetails type.
  const billingCycle = useMemo(() => {
    if (!planDetails?.current_period_start || !planDetails?.current_period_end) {
      return { cycle: "Annual Billing", savings: "Save 20% vs Monthly" };
    }

    const start = new Date(planDetails.current_period_start);
    const end = new Date(planDetails.current_period_end);
    const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Day-based inference with broader thresholds
    if (daysDiff >= 300 && daysDiff <= 400) {
      return { cycle: "Annual Billing", savings: "Save 20% vs Monthly" };
    } else if (daysDiff >= 80 && daysDiff <= 100) {
      return { cycle: "Quarterly Billing", savings: null };
    } else if (daysDiff >= 25 && daysDiff <= 35) {
      return { cycle: "Monthly Billing", savings: null };
    } else {
      // Default to annual if unclear
      return { cycle: "Annual Billing", savings: "Save 20% vs Monthly" };
    }
  }, [planDetails]);

  // Helper to reload subscription status and user profile
  const reloadSubscriptionData = async () => {
    try {
      const [status, details] = await Promise.all([
        apiService.getSubscriptionStatus(),
        apiService.getSubscriptionDetails(),
      ]);
      setSubscriptionStatus(status);
      setSubscriptionDetails(details);
      await refreshUser();
    } catch (err: any) {
      console.error("Error reloading subscription data:", err);
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency?: string | null) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: (currency || "USD").toUpperCase(),
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      const currencyCode = currency?.toUpperCase() || "USD";
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  };

  // Get next payment amount from most recent invoice (memoized to avoid UI flash)
  const nextPaymentInfo = useMemo(() => {
    if (loadingInvoices) {
      return { amount: null, currency: "USD", isLoading: true };
    }
    if (invoices.length > 0) {
      // Get the most recent paid invoice
      const paidInvoice = invoices.find(inv => inv.status === "paid") || invoices[0];
      if (paidInvoice) {
        return {
          amount: paidInvoice.amount_paid,
          currency: paidInvoice.currency || "USD",
          isLoading: false,
        };
      }
    }
    // Fallback: try to infer from plan name
    if (subscription_status === "pro_premium") {
      return { amount: FALLBACK_PRICES.pro, currency: "USD", isLoading: false };
    } else if (subscription_status === "basic_premium") {
      return { amount: FALLBACK_PRICES.basic, currency: "USD", isLoading: false };
    }
    return { amount: null, currency: "USD", isLoading: false };
  }, [invoices, subscription_status, loadingInvoices]);

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  const handleUpgradeToPro = async () => {
    try {
      setProcessingAction("upgrade-pro");
      setError(null);
      setSuccessMessage(null);

      const response = await apiService.upgradeToPro();

      if (response.url) {
        // Redirect to Stripe checkout
        window.location.href = response.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      console.error("Error upgrading to Pro:", err);
      const errorMessage = err.message || "Failed to upgrade to Pro. Please try again.";
      setError(errorMessage);
      setProcessingAction(null);
    }
  };

  const handleDowngradeToBasic = () => {
    // Show confirmation modal instead of downgrading directly
    setShowDowngradeConfirmation(true);
  };

  const confirmDowngradeToBasic = async () => {
    try {
      setShowDowngradeConfirmation(false);
      setProcessingAction("downgrade-basic");
      setError(null);
      setSuccessMessage(null);

      const response = await apiService.downgradeToBasic();

      const endDateText = response.current_period_end
        ? formatDate(response.current_period_end)
        : null;
      const daysText =
        typeof response.days_remaining === "number"
          ? `${response.days_remaining} day${response.days_remaining === 1 ? "" : "s"} remaining`
          : null;
      const detailsMessage = endDateText
        ? `Effective ${endDateText}${daysText ? ` (${daysText})` : ""}`
        : null;

      // Show success message with period end info when available
      setSuccessMessage(
        detailsMessage
          ? `${response.message || "Subscription downgrade scheduled successfully."} • ${detailsMessage}`
          : response.message || "Subscription downgrade scheduled successfully.",
      );

      // Reload subscription status from backend
      await reloadSubscriptionData();

      setProcessingAction(null);
    } catch (err: any) {
      console.error("Error downgrading to Basic:", err);
      const errorMessage = err.message || "Failed to downgrade to Basic. Please try again.";
      setError(errorMessage);
      setProcessingAction(null);
    }
  };

  const handleCancelSubscription = () => {
    // Prevent cancellation if user doesn't have an active subscription
    if (!isPremium) {
      return;
    }
    // Show confirmation modal instead of canceling directly
    setShowCancelConfirmation(true);
  };

  const confirmCancelSubscription = async () => {
    try {
      setShowCancelConfirmation(false);
      setProcessingAction("cancel");
      setError(null);
      setSuccessMessage(null);

      const response = await apiService.cancelSubscription();

      const endDateText = response.current_period_end
        ? formatDate(response.current_period_end)
        : null;
      const daysText =
        typeof response.days_remaining === "number"
          ? `${response.days_remaining} day${response.days_remaining === 1 ? "" : "s"} remaining`
          : null;
      const detailsMessage = endDateText
        ? `Access until ${endDateText}${daysText ? ` (${daysText})` : ""}`
        : null;

      // Show success message with end date and days remaining when available
      setSuccessMessage(
        detailsMessage
          ? `${response.message || "Subscription cancellation scheduled successfully."} • ${detailsMessage}`
          : response.message || "Subscription cancellation scheduled successfully.",
      );

      // Reload subscription status from backend
      await reloadSubscriptionData();

      setProcessingAction(null);
    } catch (err: any) {
      console.error("Error canceling subscription:", err);
      const errorMessage = err.message || "Failed to cancel subscription. Please try again.";
      setError(errorMessage);
      setProcessingAction(null);
    }
  };

  // Show loading state while auth is loading or data is loading
  if (authLoading || loading) {
    return <ManageSubscriptionSkeleton />;
  }

  // Don't render if not authenticated (useRequireAuth will handle redirect)
  if (!isAuthenticated) {
    return <ManageSubscriptionSkeleton />;
  }

  // Determine plan display name
  const getPlanDisplayName = () => {
    if (subscription_status === "basic_premium") return "Basic Premium";
    if (subscription_status === "pro_premium") return "Pro Premium";
    return "Free";
  };

  const isPremium = subscription_status === "basic_premium" || subscription_status === "pro_premium";
  const isCanceling = !!planDetails?.cancel_at_period_end;
  // Invoices are now loaded separately via lazy loading

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" strokeWidth={2}/>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Subscription & Billing
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your plan, invoices, and payment methods.
            </p>
          </div>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 rounded-xl p-4 mb-6 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">{successMessage}</p>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-l-4 border-red-500 rounded-xl p-4 mb-6 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Current Plan Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  CURRENT PLAN
                </span>
                {isPremium && (
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                    ACTIVE
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {getPlanDisplayName()}
              </h2>
              {isPremium && planDetails && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {(() => {
                      const isCancelling = planDetails.cancel_at_period_end;
                      const renewalDate = isCancelling 
                        ? (planDetails.cancel_effective_date || planDetails.current_period_end)
                        : (planDetails.renewal_date || planDetails.current_period_end);
                      const interval = billingCycle.cycle === "Annual Billing" ? "year" : billingCycle.cycle === "Quarterly Billing" ? "quarter" : "month";
                      const amount = nextPaymentInfo.amount !== null && nextPaymentInfo.amount !== undefined
                        ? formatCurrency(nextPaymentInfo.amount, nextPaymentInfo.currency)
                        : null;
                      
                      if (renewalDate && amount && !isCancelling) {
                        return `Renews on ${formatDate(renewalDate)} — ${amount}/${interval}`;
                      } else if (renewalDate && isCancelling) {
                        return `Access until ${formatDate(renewalDate)}`;
                      } else if (renewalDate) {
                        return `Renews on ${formatDate(renewalDate)}`;
                      } else {
                        return "—";
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpgradeClick}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              Change Plan
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Main Content Grid: Left side (Cards + FAQ), Right side (Billing History) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Two Cards + FAQ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Four Cards Row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* Billing Cycle Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-3"/>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  BILLING CYCLE
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {billingCycle.cycle}
                </p>
                {billingCycle.savings && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{billingCycle.savings}</p>
                )}
              </div>

              {/* Next Payment Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <Coins className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-3" />
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  NEXT PAYMENT
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {nextPaymentInfo.isLoading ? (
                    <Loader className="w-4 h-4 animate-spin inline" />
                  ) : nextPaymentInfo.amount !== null && nextPaymentInfo.amount !== undefined ? (
                    formatCurrency(nextPaymentInfo.amount, nextPaymentInfo.currency)
                  ) : (
                    "—"
                  )}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  On {planDetails?.renewal_date ? formatDate(planDetails.renewal_date) : planDetails?.current_period_end ? formatDate(planDetails.current_period_end) : "—"}
                </p>
              </div>

              {/* Days Remaining Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-3" />
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  DAYS REMAINING
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {typeof planDetails?.days_remaining === "number"
                    ? `${planDetails.days_remaining} day${planDetails.days_remaining === 1 ? "" : "s"}`
                    : "—"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isCanceling ? "Until cancellation" : "Until renewal"}
                </p>
              </div>

              {/* Cancellation Date Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <AlertTriangle className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-3" />
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  CANCELLATION DATE
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {planDetails?.cancel_effective_date
                    ? formatDate(planDetails.cancel_effective_date)
                    : "—"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isCanceling ? "Subscription ends" : "Not scheduled"}
                </p>
              </div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <MessageCircleQuestionMark className="w-6 h-6 text-gray-800 dark:text-gray-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Frequently Asked Questions
                </h3>
              </div>

              <div className="space-y-3">
                {FAQS.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-white flex-1">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 pt-0">
                              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Billing History */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white dark:bg-gray-800 rounded-xl px-6 py-3.5 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Billing History</h3>
            </div>

            {loadingInvoices ? (
              <BillingHistorySkeleton />
            ) : invoices.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">No billing history yet.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {invoices.slice(0, MAX_DISPLAYED_INVOICES).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(invoice.amount_paid, invoice.currency)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(invoice.created)}
                        </p>
                      </div>
                    </div>
                    {invoice.hosted_invoice_url && (
                      <a
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 flex justify-end">
                  Showing top {MAX_DISPLAYED_INVOICES} recent invoices
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-6">
          {isPremium ? (
            <button
              type="button"
              onClick={handleCancelSubscription}
              className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <X className="w-4 h-4" />
              Cancel Subscription
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="You don't have an active subscription to cancel"
              className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60"
            >
              <X className="w-4 h-4" />
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Upgrade Modal - Only shown for free users */}
      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirmation && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
            aria-describedby="cancel-modal-description"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            tabIndex={-1}
            onClick={() => !processingAction && setShowCancelConfirmation(false)}
          >
            <motion.div
              ref={cancelModalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-1">
                  <h3
                    id="cancel-modal-title"
                    ref={cancelModalTitleRef}
                    className="text-xl font-bold text-gray-900 dark:text-white mb-2"
                    tabIndex={-1}
                  >
                    Cancel Subscription?
                  </h3>
                  <div id="cancel-modal-description">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                      Are you sure you want to cancel? You&apos;ll keep access for the rest of this billing period and won&apos;t be charged again.
                    </p>
                    <ul className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Access stays active until the date below</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>No further renewals; you can re-upgrade anytime</span>
                      </li>
                    </ul>

                    {/* Show cancellation details if available */}
                    {planDetails && (
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Plan</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {getPlanDisplayName()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Access until</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatDate(planDetails.cancel_effective_date || planDetails.current_period_end)}
                            </span>
                          </div>
                          {typeof planDetails.days_remaining === "number" && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Days remaining</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {planDetails.days_remaining} day{planDetails.days_remaining === 1 ? "" : "s"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      After cancellation, you&apos;ll be downgraded to the Free plan and will lose access to premium features.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirmation(false)}
                  disabled={processingAction === "cancel"}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={confirmCancelSubscription}
                  disabled={processingAction === "cancel"}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingAction === "cancel" ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    "Yes, Cancel"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Downgrade Confirmation Modal */}
      <AnimatePresence>
        {showDowngradeConfirmation && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="downgrade-modal-title"
            aria-describedby="downgrade-modal-description"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            tabIndex={-1}
            onClick={() => !processingAction && setShowDowngradeConfirmation(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && !processingAction) {
                setShowDowngradeConfirmation(false);
              }
            }}
          >
            <motion.div
              ref={downgradeModalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-1">
                  <h3
                    id="downgrade-modal-title"
                    ref={downgradeModalTitleRef}
                    className="text-xl font-bold text-gray-900 dark:text-white mb-2"
                    tabIndex={-1}
                  >
                    Downgrade to Basic?
                  </h3>
                  <div id="downgrade-modal-description">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                      Are you sure you want to downgrade from Pro Premium to Basic Premium? The change will take effect at the end of your current billing period.
                    </p>
                    <ul className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>You&apos;ll keep Pro Premium features until the end of your billing period</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Your next billing will be at the Basic Premium rate</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>You can upgrade back to Pro Premium anytime</span>
                      </li>
                    </ul>

                    {/* Show plan details if available */}
                    {planDetails && (
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Current plan</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              Pro Premium
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Will change to</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              Basic Premium
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Effective date</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatDate(planDetails.current_period_end)}
                            </span>
                          </div>
                          {typeof planDetails.days_remaining === "number" && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Days remaining</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {planDetails.days_remaining} day{planDetails.days_remaining === 1 ? "" : "s"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      You&apos;ll lose access to Pro Premium features after the downgrade takes effect.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDowngradeConfirmation(false)}
                  disabled={processingAction === "downgrade-basic"}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keep Pro
                </button>
                <button
                  type="button"
                  onClick={confirmDowngradeToBasic}
                  disabled={processingAction === "downgrade-basic"}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingAction === "downgrade-basic" ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Downgrading...
                    </>
                  ) : (
                    "Yes, Downgrade"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
