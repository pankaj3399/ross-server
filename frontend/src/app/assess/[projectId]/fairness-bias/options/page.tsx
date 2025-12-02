"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Globe,
  Upload,
  Github,
  CheckCircle,
} from "lucide-react";
import UnlockPremium from "../../../../../components/UnlockPremium";

type TestMethod = 
  | "prompt-response"
  | "api-endpoint"
  | "dataset-testing"
  | "github-repo"
  | null;

export default function FairnessBiasOptions() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const projectId = params.projectId as string;
  const [selectedMethod, setSelectedMethod] = useState<TestMethod>(null);

  const PREMIUM_STATUS = ["basic_premium", "pro_premium"];
  const isPremium = user?.subscription_status ? PREMIUM_STATUS.includes(user.subscription_status) : false;

  const handleMethodSelect = (method: TestMethod) => {
    setSelectedMethod(method);
  };

  const handleContinue = () => {
    if (!selectedMethod) return;

    switch (selectedMethod) {
      case "prompt-response":
        router.push(`/assess/${projectId}/fairness-bias`);
        break;
      case "api-endpoint":
        // Navigate to API endpoint input page
        router.push(`/assess/${projectId}/fairness-bias/api-endpoint`);
        break;
      case "dataset-testing":
        // TODO: Navigate to csv file upload page
        router.push(`/assess/${projectId}/fairness-bias/dataset-testing`);
        break;
      case "github-repo":
        // TODO: Navigate to GitHub repo input page
        router.push(`/assess/${projectId}/fairness-bias/github`);
        break;
    }
  };

  const options = [
    {
      id: "prompt-response" as TestMethod,
      title: "Manual Prompt Testing",
      description: "Provide prompt responses manually and generate a comprehensive fairness and bias report",
      icon: FileText,
      color: "from-purple-600 to-violet-600",
      hoverColor: "from-purple-700 to-violet-700",
    },
    {
      id: "api-endpoint" as TestMethod,
      title: "API Automated Testing",
      description: "Provide your model's API endpoint URL. We'll send prompts to your API and automatically evaluate the responses for fairness and bias",
      icon: Globe,
      color: "from-blue-600 to-cyan-600",
      hoverColor: "from-blue-700 to-cyan-700",
    },
    {
      id: "dataset-testing" as TestMethod,
      title: "Dataset Testing",
      description: "Upload your CSV file to automatically run fairness and bias evaluations on your data.",
      icon: Upload,
      color: "from-green-600 to-emerald-600",
      hoverColor: "from-green-700 to-emerald-700",
    },
    {
      id: "github-repo" as TestMethod,
      title: "GitHub Repository URL",
      description: "Provide a GitHub repository URL and required file names for automated testing",
      icon: Github,
      color: "from-orange-600 to-red-600",
      hoverColor: "from-orange-700 to-red-700",
    },
  ];

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative">
      {/* Blurred Content */}
      <div className={isPremium ? "" : "blur-sm pointer-events-none select-none"}>
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/assess/${projectId}`)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Fairness & Bias Test
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select a method to test your model for fairness and bias
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Choose Your Testing Method
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select one of the following options to proceed with fairness and bias testing
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {options.map((option, index) => {
              const Icon = option.icon;
              const isSelected = selectedMethod === option.id;

              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => isPremium && handleMethodSelect(option.id)}
                  className={`
                    relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200
                    bg-white dark:bg-gray-800
                    ${
                      isSelected
                        ? "border-purple-500 dark:border-purple-400 shadow-lg scale-105"
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md"
                    }
                    ${!isPremium ? "cursor-not-allowed" : ""}
                  `}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`
                      w-16 h-16 rounded-xl flex items-center justify-center mb-4
                      bg-gradient-to-br ${option.color}
                    `}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {option.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <motion.button
              onClick={handleContinue}
              disabled={!selectedMethod || !isPremium}
              className={`
                px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200
                ${
                  selectedMethod && isPremium
                    ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }
              `}
              whileHover={selectedMethod && isPremium ? { scale: 1.05 } : {}}
              whileTap={selectedMethod && isPremium ? { scale: 0.95 } : {}}
            >
              Continue
            </motion.button>
          </div>
        </div>
      </div>

      {/* Upgrade Overlay for Non-Premium Users */}
      {!isPremium && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-2xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                Upgrade to Unlock This Page
              </h2>
              <p className="text-white/90 text-lg drop-shadow-md">
                Get access to Fairness & Bias Test and unlock advanced features
              </p>
            </div>
            <UnlockPremium
              featureName="Fairness & Bias Test"
              onClose={() => router.push(`/assess/${projectId}`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

