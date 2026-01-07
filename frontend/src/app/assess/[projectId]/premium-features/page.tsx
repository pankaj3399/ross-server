"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { useRequireAuth } from "../../../../hooks/useRequireAuth";
import { apiService, Domain as ApiDomain, Practice, PracticeQuestionLevels } from "../../../../lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Scale,
  ClipboardCheck,
  Bug,
  Crown,
} from "lucide-react";
import AssessmentTreeNavigation from "../../../../components/AssessmentTreeNavigation";
import { useAssessmentNavigation } from "../../../../hooks/useAssessmentNavigation";
import { PREMIUM_STATUS } from "../../../../lib/constants";

interface PracticeWithLevels extends Practice {
  levels: PracticeQuestionLevels;
}

interface DomainWithLevels extends Omit<ApiDomain, "practices"> {
  practices: Record<string, PracticeWithLevels>;
}

export default function PremiumFeaturesPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, loading: userLoading } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const projectId = params.projectId as string;

  const [domains, setDomains] = useState<DomainWithLevels[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [currentDomainId, setCurrentDomainId] = useState<string>("");
  const [currentPracticeId, setCurrentPracticeId] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Calculate premium status - will be false until user loads
  const isPremium = user?.subscription_status ? PREMIUM_STATUS.includes(user.subscription_status as typeof PREMIUM_STATUS[number]) : false;

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading || userLoading) {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    // Wait for user data to be available before checking premium status
    if (!user) {
      return;
    }

    // Calculate premium status after user is loaded
    const userIsPremium = user.subscription_status ? PREMIUM_STATUS.includes(user.subscription_status as typeof PREMIUM_STATUS[number]) : false;

    // Redirect non-premium users to upgrade page
    if (!userIsPremium) {
      router.push(`/manage-subscription`);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const domainsData = await apiService.getDomainsFull(projectId);

        // Get non-premium domains for the sidebar navigation
        const nonPremiumDomains = domainsData.domains.filter(
          (domain) => domain.is_premium === false
        );

        // Transform domains
        const transformedDomains = nonPremiumDomains.map((domain) => {
          const practicesWithLevels: Record<string, PracticeWithLevels> = {};

          Object.entries(domain.practices).forEach(([practiceId, practice]) => {
            practicesWithLevels[practiceId] = {
              ...practice,
              levels: practice.levels || {},
            };
          });

          return {
            id: domain.id,
            title: domain.title,
            description: domain.description,
            practices: practicesWithLevels,
          };
        });

        setDomains(transformedDomains);

        // Load answers for progress calculation
        apiService.getAnswers(projectId)
          .catch(() => ({ answers: {} }))
          .then((answersData) => {
            const answersMap: Record<string, number> = {};
            if (answersData && answersData.answers) {
              Object.entries(answersData.answers).forEach(([key, value]) => {
                answersMap[key] = value as number;
              });
            }
            setAnswers(answersMap);
          })
          .catch((error) => {
            console.error("Failed to load answers:", error);
          });
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, isAuthenticated, authLoading, userLoading, user, router]);

  const {
    progressData,
    navigateToDomain,
    navigateToPractice,
  } = useAssessmentNavigation({
    domains: domains as any,
    assessmentData: answers as any,
    currentDomainId,
    currentPracticeId,
    currentQuestionIndex,
  });

  const handleDomainClick = (domainId: string) => {
    setCurrentDomainId(domainId);
    navigateToDomain(domainId);
  };

  const handlePracticeClick = (domainId: string, practiceId: string) => {
    setCurrentDomainId(domainId);
    setCurrentPracticeId(practiceId);
    navigateToPractice(domainId, practiceId);
    router.push(`/assess/${projectId}`);
  };

  const handleQuestionClick = (domainId: string, practiceId: string, questionIndex: number) => {
    setCurrentDomainId(domainId);
    setCurrentPracticeId(practiceId);
    setCurrentQuestionIndex(questionIndex);
    router.push(`/assess/${projectId}`);
  };

  if (authLoading || userLoading || !isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Don't render if user data is not loaded yet or if not premium (will redirect)
  if (!user || !isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Tree Navigation Sidebar */}
      <AssessmentTreeNavigation
        domains={progressData}
        currentDomainId={currentDomainId}
        currentPracticeId={currentPracticeId}
        currentQuestionIndex={currentQuestionIndex}
        onDomainClick={handleDomainClick}
        onPracticeClick={handlePracticeClick}
        onQuestionClick={handleQuestionClick}
        projectId={projectId}
        isPremium={isPremium}
        hidePremiumFeaturesButton={true}
        onFairnessBiasClick={() => {
          router.push(`/assess/${projectId}/fairness-bias/options`);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.push(`/assess/${projectId}`)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to AIMA Assessment
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Premium Features
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Features Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 flex flex-col justify-center items-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-purple-950 dark:text-purple-300 mb-3 text-center">
                Take your AI governance to the next level
              </h1>
              <p className="text-lg text-gray-800 dark:text-gray-300 mb-6 text-center max-w-3xl">
                Access advanced premium tools and features to enhance your AI maturity assessment.
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

            {/* Premium Domains Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-3xl p-8 shadow-xl border border-purple-200 dark:border-purple-700 mb-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Premium Domains Assessment
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Access additional premium assessment domains with advanced questions and practices.
              </p>
              <button
                onClick={() => router.push(`/assess/${projectId}/premium-domains`)}
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Go to Premium Domains
              </button>
            </motion.div>

            {/* Manage Subscription Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/manage-subscription")}
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Manage Subscription
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
