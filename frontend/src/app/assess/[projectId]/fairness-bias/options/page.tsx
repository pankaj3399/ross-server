"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { PREMIUM_STATUS } from "../../../../../lib/constants";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Globe,
  Upload,
  Github,
  CheckCircle,
} from "lucide-react";
import SubscriptionModal from "../../../../../components/features/subscriptions/SubscriptionModal";
import { OptionsGridSkeleton } from "../../../../../components/Skeleton";

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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const isPremium = user?.subscription_status ? PREMIUM_STATUS.includes(user.subscription_status as typeof PREMIUM_STATUS[number]) : false;

  // Show subscription modal for non-premium users
  useEffect(() => {
    if (!loading && user && !isPremium) {
      setShowSubscriptionModal(true);
    }
  }, [loading, user, isPremium]);

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
      color: "bg-primary text-primary-foreground",
      hoverColor: "hover:bg-primary/90",
    },
    {
      id: "api-endpoint" as TestMethod,
      title: "API Automated Testing",
      description: "Provide your model's API endpoint URL. We'll send prompts to your API and automatically evaluate the responses for fairness and bias",
      icon: Globe,
      color: "bg-info text-info-foreground",
      hoverColor: "hover:bg-info/90",
    },
    {
      id: "dataset-testing" as TestMethod,
      title: "Dataset Testing",
      description: "Upload your CSV file to automatically run fairness and bias evaluations on your data.",
      icon: Upload,
      color: "bg-success text-success-foreground",
      hoverColor: "hover:bg-success/90",
    },
  ];

  if (loading || !user) {
    return <OptionsGridSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Blurred Content */}
      <div className={isPremium ? "" : "blur-sm pointer-events-none select-none"}>
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/assess/${projectId}/premium-domains`)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Fairness & Bias Test
                </h1>
                <p className="text-sm text-muted-foreground">
                  Select a method to test your model for fairness and bias
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Choose Your Testing Method
            </h2>
            <p className="text-muted-foreground">
              Select one of the following options to proceed with fairness and bias testing
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
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
                    bg-card
                    ${isSelected
                      ? "border-primary shadow-lg scale-105"
                      : "border-border hover:border-primary/50 hover:shadow-md"
                    }
                    ${!isPremium ? "cursor-not-allowed" : ""}
                  `}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`
                      w-16 h-16 rounded-xl flex items-center justify-center mb-4
                      ${option.color}
                    `}
                  >
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {option.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
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
                ${selectedMethod && isPremium
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
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

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          router.push(`/assess/${projectId}/fairness-bias/options`);
        }}
      />
    </div >
  );
}

