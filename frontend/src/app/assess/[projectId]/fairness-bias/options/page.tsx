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
import { apiService } from "../../../../../lib/api";

type TestMethod =
  | "prompt-response"
  | "api-endpoint"
  | "dataset-testing"
  | "github-repo"
  | null;

export interface ReportSelections {
  metric: string;
  method: string;
  group: string;
  resumeFilter: string;
  threshold: number;
  testType: string;
}

export interface DatasetReport {
  id: string;
  file_name: string;
  file_size: number;
  created_at: string;
  uploaded_at: string;
  csv_preview: any;
  fairness_data: any;
  fairness_result: any;
  biasness_result: any;
  toxicity_result: any;
  relevance_result: any;
  faithfulness_result: any;
  selections?: ReportSelections;
}

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

  const [recentReports, setRecentReports] = useState<DatasetReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (projectId && isPremium) {
      const fetchReports = async () => {
        setRecentReports([]);
        setLoadingReports(true);
        try {
          const response = await apiService.getDatasetReports(projectId);
          if (isMounted) {
            if (response.success) {
              const reports = Array.isArray(response.reports) ? response.reports : [];
              setRecentReports(reports.slice(0, 5));
            } else {
              setRecentReports([]);
            }
          }
        } catch (error) {
          console.error("Failed to fetch recent reports:", error);
          if (isMounted) setRecentReports([]);
        } finally {
          if (isMounted) setLoadingReports(false);
        }
      };
      fetchReports();
    } else {
      setRecentReports([]);
    }
    return () => { isMounted = false; };
  }, [projectId, isPremium]);

  const handleReportClick = (report: DatasetReport) => {
    const payload = {
      result: {
        fairness: report.fairness_data,
        fairnessResult: report.fairness_result,
        biasness: report.biasness_result,
        toxicity: report.toxicity_result,
        relevance: report.relevance_result,
        faithfulness: report.faithfulness_result,
      },
      fileMeta: {
        name: report.file_name,
        size: report.file_size,
        uploadedAt: report.uploaded_at,
      },
      preview: report.csv_preview,
      generatedAt: report.created_at,
      selections: report.selections ?? {
        metric: "adverseImpact",
        method: "selectionRate",
        group: "genderRace",
        resumeFilter: "all",
        threshold: 0.5,
        testType: "userData",
      },
    };

    if (typeof window !== "undefined") {
      const storageKey = `dataset-testing-report:${projectId}`;
      window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
      router.push(`/assess/${projectId}/fairness-bias/dataset-testing/report`);
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
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
          <div className="flex justify-center mb-16">
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

          {/* Recent Evaluations Section */}
          {isPremium && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Recent Evaluations</h2>
                {recentReports.length > 0 && (
                  <button
                    type="button"
                    onClick={() => router.push(`/assess/${projectId}/fairness-bias/dataset-testing`)}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    View All
                  </button>
                )}
              </div>

              {loadingReports ? (
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentReports.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {recentReports.map((report) => (
                    <motion.button
                      key={report.id}
                      type="button"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex w-full items-center justify-between p-4 bg-card hover:bg-muted/50 border border-border rounded-xl cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      onClick={() => handleReportClick(report)}
                      aria-label={`View report for ${report.file_name}`}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {report.file_name}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>
                              {new Date(report.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>
                              {report.file_size ? `${(report.file_size / 1024).toFixed(1)} KB` : "— KB"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20">
                  <p className="text-muted-foreground">No evaluations ran yet.</p>
                </div>
              )}
            </div>
          )}
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

