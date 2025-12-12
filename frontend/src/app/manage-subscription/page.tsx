"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { apiService } from "../../lib/api";
import { motion } from "framer-motion";
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
} from "lucide-react";
import Link from "next/link";
import { SimplePageSkeleton } from "../../components/Skeleton";
import SubscriptionModal from "../../components/SubscriptionModal";

const BASIC_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_BASIC || "";
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_PRO || "";

export default function ManageSubscriptionPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscription_status: string;
    hasStripeCustomer: boolean;
  } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const status = await apiService.getSubscriptionStatus();
        setSubscriptionStatus(status);
      } catch (err: any) {
        console.error("Error loading subscription status:", err);
        setError("Failed to load subscription information.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, router]);


  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };


  const handleDowngradeToBasic = async () => {
    if (!BASIC_PRICE_ID) {
      setError("Basic plan price ID is not configured.");
      return;
    }

    try {
      setProcessingAction("downgrade-basic");
      setError(null);
      const { url } = await apiService.createCheckoutSession(BASIC_PRICE_ID);
      window.location.href = url;
    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      const errorMessage = err.message || "Failed to start downgrade process. Please try again.";
      setError(errorMessage);
      setProcessingAction(null);
    }
  };

  const handleUpgradeToPro = async () => {
    if (!PRO_PRICE_ID) {
      setError("Pro plan price ID is not configured.");
      return;
    }

    try {
      setProcessingAction("upgrade-pro");
      setError(null);
      const { url } = await apiService.createCheckoutSession(PRO_PRICE_ID);
      window.location.href = url;
    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      const errorMessage = err.message || "Failed to start upgrade process. Please try again.";
      setError(errorMessage);
      setProcessingAction(null);
    }
  };

  const handleDowngradeToFree = async () => {
    if (!subscriptionStatus?.hasStripeCustomer) {
      setError("You need to have an active subscription to downgrade.");
      return;
    }

    try {
      setProcessingAction("downgrade-free");
      setError(null);
      const response = await apiService.createPortalSession();
      
      if (response.url) {
        // Redirect to Stripe billing portal where they can cancel
        window.location.href = response.url;
      } else {
        setError("Failed to access billing portal. Please try again.");
        setProcessingAction(null);
      }
    } catch (err: any) {
      console.error("Error creating portal session:", err);
      const errorMessage = err.message || "Failed to access billing portal. Please try again.";
      setError(errorMessage);
      setProcessingAction(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionStatus?.hasStripeCustomer) {
      setError("You don't have an active subscription to cancel.");
      return;
    }

    try {
      setProcessingAction("cancel");
      setError(null);
      const response = await apiService.createPortalSession();
      
      if (response.url) {
        // Redirect to Stripe billing portal where they can cancel
        window.location.href = response.url;
      } else {
        setError("Failed to access billing portal. Please try again.");
        setProcessingAction(null);
      }
    } catch (err: any) {
      console.error("Error creating portal session:", err);
      const errorMessage = err.message || "Failed to access billing portal. Please try again.";
      setError(errorMessage);
      setProcessingAction(null);
    }
  };

  if (loading) {
    return <SimplePageSkeleton />;
  }

  const isFree = !subscriptionStatus || subscriptionStatus.subscription_status === 'free';
  const isBasicPremium = subscriptionStatus?.subscription_status === 'basic_premium';
  const isProPremium = subscriptionStatus?.subscription_status === 'pro_premium';
  const isPremium = isBasicPremium || isProPremium;

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </motion.button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Manage Subscription
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                View and manage your subscription plan
              </p>
            </div>
          </div>

          {/* Current Subscription Status */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-6 mb-8 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Current Plan
                </p>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {isFree ? 'Free' : isBasicPremium ? 'Basic Premium' : isProPremium ? 'Pro Premium' : 'Free'}
                  </h2>
                  {isPremium && (
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ⭐ PREMIUM
                    </span>
                  )}
                </div>
                {isPremium && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Active subscription • Manage billing and payment methods
                  </p>
                )}
                {isFree && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Upgrade to unlock premium features
                  </p>
                )}
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Subscription Options */}
          {isFree ? (
            <div className="mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Upgrade to Premium
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                  Unlock advanced features, priority support, and more with our premium plans.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpgradeClick}
                  className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all"
                >
                  View Plans & Upgrade
                </motion.button>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {/* Pro Premium Options */}
              {isProPremium && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDowngradeToBasic}
                    disabled={processingAction !== null}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDowngradeToFree}
                    disabled={processingAction !== null}
                    className="w-full px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingAction === "downgrade-free" ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-5 h-5" />
                        <span>Downgrade to Free</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelSubscription}
                    disabled={processingAction !== null}
                    className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
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
                </>
              )}

              {/* Basic Premium Options */}
              {isBasicPremium && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpgradeToPro}
                    disabled={processingAction !== null}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelSubscription}
                    disabled={processingAction !== null}
                    className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDowngradeToFree}
                    disabled={processingAction !== null}
                    className="w-full px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingAction === "downgrade-free" ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-5 h-5" />
                        <span>Downgrade to Free</span>
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  About Subscription Management
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• You can upgrade, downgrade, or cancel your subscription at any time</li>
                  <li>• Subscription changes are processed securely through Stripe</li>
                  <li>• Changes take effect at the end of your current billing period</li>
                  <li>• Canceling your subscription will downgrade you to the Free plan</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Upgrade Modal */}
      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
