"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { apiService, SubscriptionDetailsResponse, SubscriptionInvoice } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Loader,
  AlertCircle,
  CheckCircle,
  Crown,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  X,
  Sparkles,
  Zap,
  Shield,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { SimplePageSkeleton } from "../../components/Skeleton";
import SubscriptionModal from "../../components/SubscriptionModal";
import { SubscriptionPlanDetails } from "../../lib/api";

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

  if (loading) {
    return <SimplePageSkeleton />;
  }

  // Use subscription_status directly from backend - do not infer
  const subscription_status = subscriptionStatus?.subscription_status || "free";

  // Determine plan display name
  const getPlanDisplayName = () => {
    if (subscription_status === "basic_premium") return "Basic Premium";
    if (subscription_status === "pro_premium") return "Pro Premium";
    return "Free";
  };

  const isPremium = subscription_status === "basic_premium" || subscription_status === "pro_premium";
  const planDetails = subscriptionDetails?.plan;
  const isCanceling = !!planDetails?.cancel_at_period_end;
  // Invoices are now loaded separately via lazy loading

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-8 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back to Dashboard</span>
          </motion.button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 md:p-10"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 mb-10"
          >
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Manage Subscription
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1.5 text-sm md:text-base">
                View and manage your subscription plan
              </p>
            </div>
          </motion.div>

          {/* Current Subscription Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-pink-50 dark:from-purple-900/30 dark:via-violet-900/30 dark:to-pink-900/30 rounded-2xl p-8 mb-8 border border-purple-200/50 dark:border-purple-800/50 shadow-lg"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
            
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3">
                  Current Plan
                </p>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {getPlanDisplayName()}
                  </h2>
                  {isPremium && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-orange-500/30"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      PREMIUM
                    </motion.span>
                  )}
                </div>
                {isPremium && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Active subscription • Manage billing and payment methods</span>
                  </div>
                )}
                {subscription_status === "free" && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Upgrade to unlock premium features
                  </p>
                )}
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-20 h-20 bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/40"
              >
                <Crown className="w-10 h-10 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Plan Details & Billing Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8"
          >
            <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
                    Plan details
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Billing & renewal
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200">
                  {isCanceling ? "Cancels at period end" : "Renews automatically"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Signed up</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(subscriptionDetails?.signup_date)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Account creation date</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Current period</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {planDetails?.current_period_start && planDetails?.current_period_end
                      ? `${formatDate(planDetails.current_period_start)} → ${formatDate(planDetails.current_period_end)}`
                      : "—"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isCanceling ? "Will end at period end" : "Renews unless canceled"}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                    {isCanceling ? "Access until" : "Renews on"}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isCanceling
                      ? formatDate(planDetails?.cancel_effective_date || planDetails?.current_period_end)
                      : formatDate(planDetails?.renewal_date || planDetails?.current_period_end)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isCanceling ? "You keep access until this date" : "Next billing date"}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Days remaining</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {typeof planDetails?.days_remaining === "number"
                      ? `${planDetails.days_remaining} day${planDetails.days_remaining === 1 ? "" : "s"}`
                      : "—"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Includes today&apos;s access
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
                    Payment history
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent charges</h3>
                </div>
              </div>
              {loadingInvoices ? (
                <div className="flex items-center justify-center py-4">
                  <Loader className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-300" />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Loading invoices...</span>
                </div>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 bg-gray-50/60 dark:bg-gray-900/40"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(invoice.amount_paid, invoice.currency)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(invoice.created)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 capitalize">
                          {invoice.status?.replace("_", " ") || "paid"}
                        </span>
                        {invoice.hosted_invoice_url && (
                          <a
                            href={invoice.hosted_invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-purple-600 dark:text-purple-300 hover:underline"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

          {/* Subscription Actions */}
          <div className="mb-8">
            {/* Free Plan Actions */}
            {subscription_status === "free" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-amber-900/20 border-2 border-yellow-300/50 dark:border-yellow-700/50 rounded-2xl p-8 shadow-lg"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Upgrade to Premium
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Unlock advanced features, priority support, and more
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpgradeClick}
                    disabled={processingAction !== null}
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500 hover:from-yellow-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 flex items-center justify-center gap-2"
                  >
                    <span>View Plans & Upgrade</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Basic Premium Actions */}
            {subscription_status === "basic_premium" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={isCanceling ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}
              >
                {!isCanceling && (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpgradeToPro}
                    disabled={processingAction !== null}
                    className="group relative overflow-hidden px-6 py-5 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 flex items-center justify-center gap-3"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {processingAction === "upgrade-pro" ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5" />
                        <span>Upgrade to Pro</span>
                      </>
                    )}
                  </motion.button>
                )}
                {isCanceling ? (
                  <CancellationScheduledCard planDetails={planDetails} formatDate={formatDate} />
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelSubscription}
                    disabled={processingAction !== null}
                    className="group relative overflow-hidden px-6 py-5 bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 flex items-center justify-center gap-3 border border-red-700/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {processingAction === "cancel" ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5" />
                        <span>Cancel Subscription</span>
                      </>
                    )}
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Pro Premium Actions */}
            {subscription_status === "pro_premium" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={isCanceling ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}
              >
                {!isCanceling && (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDowngradeToBasic}
                    disabled={processingAction !== null}
                    className="group relative overflow-hidden px-6 py-5 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-3"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {processingAction === "downgrade-basic" ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-5 h-5" />
                        <span>Downgrade to Basic</span>
                      </>
                    )}
                  </motion.button>
                )}
                {isCanceling ? (
                  <CancellationScheduledCard planDetails={planDetails} formatDate={formatDate} />
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelSubscription}
                    disabled={processingAction !== null}
                    className="group relative overflow-hidden px-6 py-5 bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 flex items-center justify-center gap-3 border border-red-700/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {processingAction === "cancel" ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5" />
                        <span>Cancel Subscription</span>
                      </>
                    )}
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">
                  About Subscription Management
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>You can upgrade, downgrade, or cancel your subscription at any time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Subscription changes are processed securely through Stripe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Changes take effect at the end of your current billing period</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Canceling your subscription will downgrade you to the Free plan</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
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
