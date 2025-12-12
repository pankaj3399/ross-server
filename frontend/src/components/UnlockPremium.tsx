"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Star, X } from "lucide-react";
import { apiService } from "../lib/api";
import { showToast } from "../lib/toast";
import { Skeleton } from "./Skeleton";
import { usePriceStore } from "../store/priceStore";

const BASIC_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_BASIC || "";
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_PRO || "";
const POST_CHECKOUT_RETURN_URL_KEY = "postCheckoutReturnUrl";

interface UnlockPremiumProps {
  onClose?: () => void;
  featureName?: string;
}

export default function UnlockPremium({ onClose, featureName = "this feature" }: UnlockPremiumProps) {
  const { prices: storePrices, loading: storeLoading, fetched, setPrices, setPriceLoading, setFetched } = usePriceStore();
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  // Use prices from store if available, otherwise fetch
  const prices = storePrices;
  const loadingPrices = storeLoading;

  const saveReturnUrlForCheckout = () => {
    if (typeof window === "undefined") return;
    try {
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      localStorage.setItem(POST_CHECKOUT_RETURN_URL_KEY, currentUrl);
    } catch (error) {
      console.error("Failed to save return URL:", error);
    }
  };

  useEffect(() => {
    // Only fetch if not already fetched
    if (fetched) {
      return;
    }

    if (!BASIC_PRICE_ID || !PRO_PRICE_ID) {
      console.error('Price IDs not configured');
      // Fallback to hardcoded values if price IDs not configured
      setPrices({ basic: 29, pro: 49 });
      setFetched(true);
      return;
    }

    const token = typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;

    if (!token) {
      console.error("Auth token missing; cannot fetch subscription prices.");
      // Fallback to hardcoded values if no token
      setPrices({ basic: 29, pro: 49 });
      setFetched(true);
      return;
    }

    const fetchPrices = async () => {
      setPriceLoading(true);
      try {
        // Fetch prices from your backend API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/subscriptions/prices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceIds: [BASIC_PRICE_ID, PRO_PRICE_ID]
          })
        });

        if (response.ok) {
          const data = await response.json();
          setPrices({
            basic: data.prices[BASIC_PRICE_ID] || null,
            pro: data.prices[PRO_PRICE_ID] || null
          });
        } else {
          console.error('Failed to fetch prices');
          // Fallback to hardcoded values if API fails
          setPrices({ basic: 29, pro: 49 });
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
        // Fallback to hardcoded values if API fails
        setPrices({ basic: 29, pro: 49 });
      } finally {
        setPriceLoading(false);
        setFetched(true);
      }
    };

    fetchPrices();
  }, [fetched, setPrices, setPriceLoading, setFetched]);

  const handleSelectPlan = async (priceId: string, planName: string) => {
    try {
      setUpgradingPlan(planName);
      saveReturnUrlForCheckout();
      const { url } = await apiService.createCheckoutSession(priceId);
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      showToast.error("Failed to start upgrade process. Please try again.");
    } finally {
      setUpgradingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-10"
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unlock Premium to Access {featureName}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Upgrade to premium to unlock this feature and many more advanced capabilities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Basic Premium Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-900 hover:border-purple-500 dark:hover:border-purple-500 transition-all"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Basic Premium
              </h3>
              <div className="mb-4">
                {loadingPrices ? (
                  <div className="flex items-baseline justify-center gap-2">
                    <Skeleton height="2rem" width="60px" />
                    <Skeleton height="1rem" width="50px" />
                  </div>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${prices.basic !== null ? prices.basic : '29'}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  </>
                )}
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4 text-left">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  Access to {featureName}
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  Advanced analytics
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  Priority support
                </li>
              </ul>
              <button
                onClick={() => handleSelectPlan(BASIC_PRICE_ID, "Basic Premium")}
                disabled={upgradingPlan !== null || loadingPrices || !BASIC_PRICE_ID}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {upgradingPlan === "Basic Premium" ? "Processing..." : loadingPrices ? "Loading..." : "Choose Basic"}
              </button>
            </div>
          </motion.div>

          {/* Pro Premium Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative border-2 border-purple-500 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 hover:border-purple-600 transition-all"
          >
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full text-xs font-semibold">
                POPULAR
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Pro Premium
              </h3>
              <div className="mb-4">
                {loadingPrices ? (
                  <div className="flex items-baseline justify-center gap-2">
                    <Skeleton height="2rem" width="60px" />
                    <Skeleton height="1rem" width="50px" />
                  </div>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${prices.pro !== null ? prices.pro : '49'}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  </>
                )}
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4 text-left">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  Everything in Basic
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  Advanced AI features
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  Unlimited projects
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  API access
                </li>
              </ul>
              <button
                onClick={() => handleSelectPlan(PRO_PRICE_ID, "Pro Premium")}
                disabled={upgradingPlan !== null || loadingPrices || !PRO_PRICE_ID}
                className="w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {upgradingPlan === "Pro Premium" ? "Processing..." : loadingPrices ? "Loading..." : "Choose Pro"}
              </button>
            </div>
          </motion.div>
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Cancel anytime. All plans include a 14-day money-back guarantee.
        </p>
      </motion.div>
    </div>
  );
}

