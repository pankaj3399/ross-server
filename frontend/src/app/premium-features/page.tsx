"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Shield,
  Scale,
  ClipboardCheck,
  Bug,
} from "lucide-react";
import { useEffect } from "react";
import { useRequireAuth } from "../../hooks/useRequireAuth";

export default function PremiumFeaturesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { loading: authLoading } = useRequireAuth();

  useEffect(() => {
    // Auth check is handled by useRequireAuth hook
    // This effect only needs to handle the loading state
  }, [isAuthenticated, authLoading, router]);

  const handleUpgrade = () => {
    router.push("/manage-subscription");
  };

  const isPremium = user?.subscription_status === "basic_premium" || user?.subscription_status === "pro_premium";

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 my-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex flex-col justify-center items-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-purple-950 dark:text-purple-300 mb-3">
              Unlock advanced AI governance tools.
            </h1>
            <p className="text-lg text-gray-800 dark:text-gray-300 mb-6">
              Take your AI maturity to the next level with automated testing and actionable insights.
            </p>
          </motion.div>

          {/* Premium Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
            {/* Card 1: AI Vulnerability Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
            >
              <div className="rounded-2xl flex items-center justify-center mb-6 mx-auto relative">
                <Shield className="w-28 h-28 text-purple-600 dark:text-purple-400 relative z-10 fill-purple-600 dark:fill-purple-400" />
                <Bug className="w-14 h-14 text-white dark:text-purple-400 absolute z-50 fill-white dark:fill-gray-900" style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                AI Vulnerability Assessment
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed text-center">
                Automated scanning for security risks in models.
              </p>
            </motion.div>

            {/* Card 2: Automated Bias & Fairness Testing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
            >
              <div className="rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Scale className="w-28 h-28 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                Automated Bias & Fairness Testing
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed text-center">
                Detect and mitigate algorithmic bias across datasets.
              </p>
            </motion.div>

            {/* Card 3: Actionable Governance Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
            >
              <div className="rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <ClipboardCheck className="w-28 h-28 text-white dark:text-purple-400 fill-purple-600 dark:fill-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                Actionable Governance Controls
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed text-center">
                Get concrete steps to improve maturity scores.
              </p>
            </motion.div>
          </div>

          {/* Upgrade/Manage Subscription Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleUpgrade}
            className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
          >
            {isPremium ? "Manage Subscription" : "Upgrade to Premium"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

