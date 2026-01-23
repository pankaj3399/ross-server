"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { apiService, SubscriptionDetailsResponse, SubscriptionInvoice } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconLoader2,
  IconAlertCircle,
  IconCircleCheck,
  IconX,
  IconAlertTriangle,
  IconChevronDown,
  IconCalendar,
  IconDownload,
  IconArrowRight,
  IconClock,
  IconWallet,
  IconCoins,
  IconHelpCircle,
} from "@tabler/icons-react";
import { ManageSubscriptionSkeleton, BillingHistorySkeleton } from "../../components/Skeleton";
import SubscriptionModal from "../../components/features/subscriptions/SubscriptionModal";
import { SubscriptionPlanDetails } from "../../lib/api";
import { FALLBACK_PRICES } from "../../lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      className="relative overflow-hidden bg-warning/10 border-2 border-warning/20 rounded-2xl p-6 shadow-lg"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full blur-2xl"></div>
      <div className="relative flex items-start gap-4">
        <div className="w-10 h-10 bg-warning rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <IconAlertTriangle className="w-5 h-5 text-warning-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground mb-1">
            Cancellation Scheduled
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Your subscription will be canceled at the end of your current billing period. You&apos;ll continue to have access until then.
          </p>
          {planDetails?.cancel_effective_date && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Access until:</span>
              <span className="font-semibold text-foreground">
                {formatDate(planDetails.cancel_effective_date)}
              </span>
              {typeof planDetails.days_remaining === "number" && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
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

  // Initialize openFaqIndex based on defaultOpen property using lazy initializer
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(() => {
    const defaultOpenIndex = FAQS.findIndex(faq => faq.defaultOpen === true);
    return defaultOpenIndex >= 0 ? defaultOpenIndex : null;
  });

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

  // Use subscription_status directly from backend - do not infer
  const subscription_status = subscriptionStatus?.subscription_status || "free";
  const planDetails = subscriptionDetails?.plan;

  // Calculate billing cycle from period dates (must be before early returns)
  const billingCycle = useMemo(() => {
    if (!planDetails?.current_period_start || !planDetails?.current_period_end) {
      return { cycle: "Billing cycle unknown", savings: null };
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
      // Return neutral response for unclear intervals
      return { cycle: "Custom Billing", savings: null };
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

  // Helper function to format next payment date
  const getNextPaymentDateText = (planDetails: SubscriptionPlanDetails | null | undefined): string => {
    if (planDetails?.renewal_date) {
      return formatDate(planDetails.renewal_date);
    }
    if (planDetails?.current_period_end) {
      return formatDate(planDetails.current_period_end);
    }
    return "—";
  };

  // Helper function to get renewal text
  const getRenewalText = () => {
    if (!planDetails) {
      return "—";
    }

    const isCancelling = planDetails.cancel_at_period_end;
    const renewalDate = isCancelling
      ? (planDetails.cancel_effective_date || planDetails.current_period_end)
      : (planDetails.renewal_date || planDetails.current_period_end);

    // Map billing cycle to interval
    const interval = billingCycle.cycle === "Annual Billing"
      ? "year"
      : billingCycle.cycle === "Quarterly Billing"
        ? "quarter"
        : "month";

    // Format amount only when not null/undefined
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
  };

  // Get next payment amount from backend-provided field, then invoices, then fallback
  const nextPaymentInfo = useMemo(() => {
    if (loadingInvoices) {
      return { amount: null, currency: "USD", isLoading: true };
    }
    // Prefer backend-provided next_payment_amount if available
    if (planDetails?.next_payment_amount !== null && planDetails?.next_payment_amount !== undefined) {
      return {
        amount: planDetails.next_payment_amount,
        currency: "USD", // Backend should provide currency if needed
        isLoading: false,
      };
    }
    // Fallback to most recent invoice
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
    // Final fallback
    if (subscription_status === "pro_premium") {
      return { amount: FALLBACK_PRICES.pro, currency: "USD", isLoading: false };
    } else if (subscription_status === "basic_premium") {
      return { amount: FALLBACK_PRICES.basic, currency: "USD", isLoading: false };
    }
    return { amount: null, currency: "USD", isLoading: false };
  }, [invoices, subscription_status, loadingInvoices, planDetails]);

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
    <div className="min-h-full flex flex-col bg-background">
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            <IconWallet className="w-8 h-8 text-primary-foreground" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Subscription & Billing
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your plan, invoices, and payment methods.
            </p>
          </div>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-success/10 border-l-4 border-success rounded-xl p-4 mb-6 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                <IconCircleCheck className="w-5 h-5 text-success-foreground" />
              </div>
              <p className="text-sm font-medium text-success">{successMessage}</p>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-destructive/10 border-l-4 border-destructive rounded-xl p-4 mb-6 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive rounded-full flex items-center justify-center flex-shrink-0">
                <IconAlertCircle className="w-5 h-5 text-destructive-foreground" />
              </div>
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Current Plan Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary/10 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  CURRENT PLAN
                </span>
                {isPremium && (
                  <Badge className="bg-success text-success-foreground hover:bg-success/90">
                    ACTIVE
                  </Badge>
                )}
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">
                {getPlanDisplayName()}
              </h2>
              {isPremium && planDetails && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconCalendar className="w-4 h-4" />
                  <span>
                    {getRenewalText()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {/* Free Plan Options */}
              {!isPremium && (
                <>
                  <Button onClick={() => setShowUpgradeModal(true)} size="lg" className="gap-2">
                    Upgrade to Premium
                    <IconArrowRight className="w-4 h-4" />
                  </Button>
                </>
              )}

              {/* Basic Plan Options */}
              {subscription_status === "basic_premium" && (
                <>
                  <Button onClick={handleUpgradeToPro} size="lg" className="gap-2">
                    Upgrade to Pro
                    <IconArrowRight className="w-4 h-4" />
                  </Button>
                  <Button onClick={handleCancelSubscription} variant="outline" size="lg" className="gap-2 text-destructive hover:bg-destructive/10">
                    Cancel Subscription
                  </Button>
                </>
              )}

              {/* Pro Plan Options */}
              {subscription_status === "pro_premium" && (
                <>
                  <Button onClick={handleDowngradeToBasic} variant="outline" size="lg" className="gap-2">
                    Downgrade to Basic
                  </Button>
                  <Button onClick={handleCancelSubscription} variant="ghost" size="lg" className="gap-2 text-destructive hover:bg-destructive/10">
                    Cancel Subscription
                  </Button>
                </>
              )}
            </div>
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
              <Card>
                <CardContent className="p-6">
                  <IconCalendar className="w-6 h-6 text-muted-foreground mb-3" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    BILLING CYCLE
                  </p>
                  <p className="text-lg font-bold text-foreground mb-1">
                    {billingCycle.cycle}
                  </p>
                  {billingCycle.savings && (
                    <p className="text-sm text-muted-foreground">{billingCycle.savings}</p>
                  )}
                </CardContent>
              </Card>

              {/* Next Payment Card */}
              <Card>
                <CardContent className="p-6">
                  <IconCoins className="w-6 h-6 text-muted-foreground mb-3" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    NEXT PAYMENT
                  </p>
                  <p className="text-lg font-bold text-foreground mb-1">
                    {nextPaymentInfo.isLoading ? (
                      <IconLoader2 className="w-4 h-4 animate-spin inline" />
                    ) : nextPaymentInfo.amount !== null && nextPaymentInfo.amount !== undefined ? (
                      formatCurrency(nextPaymentInfo.amount, nextPaymentInfo.currency)
                    ) : (
                      "—"
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    On {getNextPaymentDateText(planDetails)}
                  </p>
                </CardContent>
              </Card>

              {/* Days Remaining Card */}
              <Card>
                <CardContent className="p-6">
                  <IconClock className="w-6 h-6 text-muted-foreground mb-3" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    DAYS REMAINING
                  </p>
                  <p className="text-lg font-bold text-foreground mb-1">
                    {typeof planDetails?.days_remaining === "number"
                      ? `${planDetails.days_remaining} day${planDetails.days_remaining === 1 ? "" : "s"}`
                      : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isCanceling ? "Until cancellation" : "Until renewal"}
                  </p>
                </CardContent>
              </Card>

              {/* Cancellation Date Card */}
              <Card>
                <CardContent className="p-6">
                  <IconAlertTriangle className="w-6 h-6 text-muted-foreground mb-3" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    CANCELLATION DATE
                  </p>
                  <p className="text-lg font-bold text-foreground mb-1">
                    {planDetails?.cancel_effective_date
                      ? formatDate(planDetails.cancel_effective_date)
                      : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isCanceling ? "Subscription ends" : "Not scheduled"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <IconHelpCircle className="w-6 h-6 text-foreground" />
                    <h3 className="text-lg font-bold text-foreground">
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
                          className="border border-border rounded-lg overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                            className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-muted/50 transition-colors"
                          >
                            <span className="font-semibold text-foreground flex-1">
                              {faq.question}
                            </span>
                            <IconChevronDown
                              className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
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
                                  <p className="text-sm text-muted-foreground leading-relaxed">
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
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: Billing History */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Billing History</h3>
                </div>

                {loadingInvoices ? (
                  <BillingHistorySkeleton />
                ) : invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No billing history yet.</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {invoices.slice(0, MAX_DISPLAYED_INVOICES).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <IconCircleCheck className="w-5 h-5 text-success" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {formatCurrency(invoice.amount_paid, invoice.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(invoice.created)}
                            </p>
                          </div>
                        </div>
                        {invoice.hosted_invoice_url && (
                          <a
                            href={invoice.hosted_invoice_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <IconDownload className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground text-center pt-2 flex justify-end">
                      Showing top {Math.min(invoices.length, MAX_DISPLAYED_INVOICES)} recent invoices
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-6">
          {isPremium ? (
            <Button
              variant="ghost"
              onClick={handleCancelSubscription}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <IconX className="w-4 h-4 mr-2" />
              Cancel Subscription
            </Button>
          ) : (
            <Button
              variant="ghost"
              disabled
              title="You don't have an active subscription to cancel"
              className="text-muted-foreground"
            >
              <IconX className="w-4 h-4 mr-2" />
              Cancel Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Upgrade Modal - Only shown for free users */}
      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelConfirmation} onOpenChange={setShowCancelConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? You&apos;ll keep access for the rest of this billing period and won&apos;t be charged again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <IconCircleCheck className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Access stays active until the date below</span>
              </li>
              <li className="flex items-start gap-2">
                <IconCircleCheck className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>No further renewals; you can re-upgrade anytime</span>
              </li>
            </ul>

            {/* Show cancellation details if available */}
            {planDetails && (
              <div className="bg-muted rounded-xl p-4 border border-border">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="text-sm font-semibold text-foreground">
                      {getPlanDisplayName()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Access until</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatDate(planDetails.cancel_effective_date || planDetails.current_period_end)}
                    </span>
                  </div>
                  {typeof planDetails.days_remaining === "number" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Days remaining</span>
                      <span className="text-sm font-semibold text-foreground">
                        {planDetails.days_remaining} day{planDetails.days_remaining === 1 ? "" : "s"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              After cancellation, you&apos;ll be downgraded to the Free plan and will lose access to premium features.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirmation(false)}
              disabled={processingAction === "cancel"}
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelSubscription}
              disabled={processingAction === "cancel"}
            >
              {processingAction === "cancel" ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
                  Canceling...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade Confirmation Modal */}
      <Dialog open={showDowngradeConfirmation} onOpenChange={setShowDowngradeConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Downgrade to Basic?</DialogTitle>
            <DialogDescription>
              Are you sure you want to downgrade from Pro Premium to Basic Premium? The change will take effect at the end of your current billing period.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <IconCircleCheck className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>You&apos;ll keep Pro Premium features until the end of your billing period</span>
              </li>
              <li className="flex items-start gap-2">
                <IconCircleCheck className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Your next billing will be at the Basic Premium rate</span>
              </li>
              <li className="flex items-start gap-2">
                <IconCircleCheck className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>You can upgrade back to Pro Premium anytime</span>
              </li>
            </ul>

            {/* Show plan details if available */}
            {planDetails && (
              <div className="bg-muted rounded-xl p-4 border border-border">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current plan</span>
                    <span className="text-sm font-semibold text-foreground">
                      Pro Premium
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Will change to</span>
                    <span className="text-sm font-semibold text-foreground">
                      Basic Premium
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Effective date</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatDate(planDetails.current_period_end)}
                    </span>
                  </div>
                  {typeof planDetails.days_remaining === "number" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Days remaining</span>
                      <span className="text-sm font-semibold text-foreground">
                        {planDetails.days_remaining} day{planDetails.days_remaining === 1 ? "" : "s"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              You&apos;ll lose access to Pro Premium features after the downgrade takes effect.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDowngradeConfirmation(false)}
              disabled={processingAction === "downgrade-basic"}
            >
              Keep Pro
            </Button>
            <Button
              onClick={confirmDowngradeToBasic}
              disabled={processingAction === "downgrade-basic"}
              className="bg-primary hover:bg-primary/90"
            >
              {processingAction === "downgrade-basic" ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
                  Downgrading...
                </>
              ) : (
                "Yes, Downgrade"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
