"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Building, Shield, CheckCircle, Loader, Star, Award, CircleStar } from "lucide-react";
import { apiService } from "../lib/api";
import { showToast } from "../lib/toast";
import { Skeleton } from "./Skeleton";
import { FALLBACK_PRICES } from "../lib/constants";

const BASIC_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_BASIC || "";
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_PRO || "";
const POST_CHECKOUT_RETURN_URL_KEY = "postCheckoutReturnUrl";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: 'free' | 'basic_premium' | 'pro_premium';
  onUpgradeToPro?: () => void;
  onDowngradeToBasic?: () => void;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentPlan = 'free',
  onUpgradeToPro,
  onDowngradeToBasic,
}: SubscriptionModalProps) {
  const [prices, setPrices] = useState<{ basic: number | null; pro: number | null }>({
    basic: null,
    pro: null,
  });
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

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
    if (!isOpen) return;

    const fetchPrices = async () => {
      if (!BASIC_PRICE_ID || !PRO_PRICE_ID) {
        console.error("Price IDs not configured");
        setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
        return;
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      if (!token) {
        console.error("Auth token missing; cannot fetch subscription prices.");
        setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
        return;
      }

      setLoadingPrices(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/subscriptions/prices`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              priceIds: [BASIC_PRICE_ID, PRO_PRICE_ID],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setPrices({
            basic: data.prices[BASIC_PRICE_ID] || null,
            pro: data.prices[PRO_PRICE_ID] || null,
          });
        } else {
          console.error("Failed to fetch prices");
          setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
        setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, [isOpen]);

  const handleSelectPlan = async (priceId: string, planName: string) => {
    try {
      setUpgradingPlan(planName);
      saveReturnUrlForCheckout();
      const { url } = await apiService.createCheckoutSession(priceId);
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      showToast.error("Failed to start upgrade process. Please try again.");
      setUpgradingPlan(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-4xl shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative">
              <CircleStar className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-gray-900 dark:text-white"
          >
            Choose Your Premium Plan
          </motion.h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Basic Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="relative group h-full flex flex-col"
          >
            {/* Plan Badge */}
            <div className="absolute -top-3 left-6 z-30">
              <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg uppercase tracking-wide">
                {currentPlan === 'basic_premium' ? '✓ Current Plan' : 'Small Teams'}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
              <div className="text-center mb-6 flex-shrink-0">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Premium Basic
                </h3>
                <div className="mb-3">
                  {loadingPrices ? (
                    <div className="flex items-center justify-center gap-2">
                      <Skeleton height="2rem" width="80px" />
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                        ${prices.basic || FALLBACK_PRICES.basic}
                      </span>
                      <span className="text-lg text-gray-500 dark:text-gray-400">/month</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Everything you need to get started.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6 flex-1">
                {[
                  "Unlimited AI assessments",
                  "Advanced reporting & analytics",
                  "Priority email support",
                  "PDF export capabilities",
                  "Team collaboration tools",
                  "Custom assessment templates",
                  "Data backup & security",
                ].map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                      {feature}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              {currentPlan === 'basic_premium' ? (
                <div className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-3.5 px-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 cursor-not-allowed">
                  <CheckCircle className="w-4 h-4" />
                  Current Plan
                </div>
              ) : currentPlan === 'pro_premium' ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (onDowngradeToBasic) {
                      onDowngradeToBasic();
                      onClose();
                    }
                  }}
                  disabled={upgradingPlan === "basic" || loadingPrices}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3.5 px-4 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl flex-shrink-0"
                >
                  {upgradingPlan === "basic" ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Downgrade to Basic
                    </>
                  )}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPlan(BASIC_PRICE_ID, "basic")}
                  disabled={upgradingPlan === "basic" || loadingPrices}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3.5 px-4 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl flex-shrink-0"
                >
                  {upgradingPlan === "basic" ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Upgrade to Basic
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Pro Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="relative group h-full flex flex-col"
          >
            {/* Popular Badge */}
            <div className="absolute -top-3 right-6 z-30">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg tracking-wide"
              >
                {currentPlan === 'pro_premium' ? '✓ Current Plan' : '★ MOST POPULAR'}
              </motion.div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-300 h-full flex flex-col relative overflow-hidden">

              <div className="relative flex flex-col h-full">
                <div className="text-center mb-6 flex-shrink-0">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center relative">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Premium Pro
                  </h3>
                  <div className="mb-3">
                    {loadingPrices ? (
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton height="2rem" width="80px" />
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                          ${prices.pro || FALLBACK_PRICES.pro}
                        </span>
                        <span className="text-lg text-gray-500 dark:text-gray-400">/month</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    For growing organizations.
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6 flex-1">
                  {[
                    "Everything in Basic Premium",
                    "Custom assessment templates",
                    "Advanced API access",
                    "White-label options",
                    "Advanced analytics dashboard",
                    "24/7 phone & chat support",
                    "Dedicated account manager",
                    "Custom integrations",
                  ].map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                {currentPlan === 'pro_premium' ? (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-3.5 px-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 cursor-not-allowed">
                    <CheckCircle className="w-4 h-4" />
                    Current Plan
                  </div>
                ) : currentPlan === 'basic_premium' ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (onUpgradeToPro) {
                        onUpgradeToPro();
                        onClose();
                      } else {
                        handleSelectPlan(PRO_PRICE_ID, "pro");
                      }
                    }}
                    disabled={upgradingPlan === "pro" || loadingPrices}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3.5 px-4 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl flex-shrink-0"
                  >
                    {upgradingPlan === "pro" ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Award className="w-5 h-5" />
                        Upgrade to Pro
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectPlan(PRO_PRICE_ID, "pro")}
                    disabled={upgradingPlan === "pro" || loadingPrices}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3.5 px-4 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl flex-shrink-0"
                  >
                    {upgradingPlan === "pro" ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Award className="w-5 h-5" />
                        Upgrade to Pro
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors text-sm font-medium"
          >
            Maybe later
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

