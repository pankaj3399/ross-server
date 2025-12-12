"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Building, Shield, CheckCircle, Loader, Star } from "lucide-react";
import { apiService } from "../lib/api";
import { showToast } from "../lib/toast";
import { Skeleton } from "./Skeleton";

const BASIC_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_BASIC || "";
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_PRO || "";
const POST_CHECKOUT_RETURN_URL_KEY = "postCheckoutReturnUrl";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
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
        setPrices({ basic: 29, pro: 49 });
        return;
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      if (!token) {
        console.error("Auth token missing; cannot fetch subscription prices.");
        setPrices({ basic: 29, pro: 49 });
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
          setPrices({ basic: 29, pro: 49 });
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
        setPrices({ basic: 29, pro: 49 });
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="text-center mb-6 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-3"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-3">
              <Crown className="w-6 h-6 text-white" />
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          >
            Choose Your Premium Plan
          </motion.h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 flex-1 min-h-0">
          {/* Basic Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="relative group h-full flex flex-col"
          >
            <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-400 hover:border-blue-300 dark:hover:border-blue-300 transition-all duration-300 h-full flex flex-col">
              {/* Plan Badge */}
              <div className="absolute -top-3 left-6">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                  Small Teams
                </span>
              </div>

              <div className="text-center mb-6 flex-shrink-0">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Premium Basic
                </h3>
                <div className="mb-3">
                  {loadingPrices ? (
                    <div className="flex items-center justify-center gap-2">
                      <Skeleton height="1.5rem" width="60px" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                        ${prices.basic || 29}
                      </span>
                      <div className="text-left">
                        <div className="text-sm text-gray-500 dark:text-gray-400">/month</div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Everything you need to get started
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6 flex-1 overflow-y-auto">
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
                    className="flex items-center gap-2"
                  >
                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                      {feature}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPlan(BASIC_PRICE_ID, "basic")}
                disabled={upgradingPlan === "basic" || loadingPrices}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl flex-shrink-0"
              >
                {upgradingPlan === "basic" ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4" />
                    Choose Basic Premium
                  </>
                )}
              </motion.button>
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
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg"
              >
                ⭐ Most Popular
              </motion.div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-400 hover:border-purple-300 dark:hover:border-purple-300 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-pink-400 to-purple-400 rounded-full translate-y-10 -translate-x-10"></div>
              </div>

              <div className="relative flex flex-col h-full">
                <div className="text-center mb-6 flex-shrink-0">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Premium Pro
                  </h3>
                  <div className="mb-3">
                    {loadingPrices ? (
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton height="1.5rem" width="60px" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                          ${prices.pro || 49}
                        </span>
                        <div className="text-left">
                          <div className="text-sm text-gray-500 dark:text-gray-400">/month</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    For growing organizations
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6 flex-1 overflow-y-auto">
                  {[
                    "Everything in Basic Premium",
                    "Custom assessment templates",
                    "Advanced API access",
                    "White-label options",
                    "Advanced analytics dashboard",
                    "24/7 phone & chat support",
                    "Dedicated account manager",
                    "Custom integrations",
                    "Priority feature requests",
                  ].map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPlan(PRO_PRICE_ID, "pro")}
                  disabled={upgradingPlan === "pro" || loadingPrices}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl flex-shrink-0"
                >
                  {upgradingPlan === "pro" ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      Choose Pro Premium
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center space-y-3 flex-shrink-0"
        >
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm font-medium"
          >
            Maybe later
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

