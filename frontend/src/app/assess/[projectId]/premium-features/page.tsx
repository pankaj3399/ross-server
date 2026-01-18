"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { useRequireAuth } from "../../../../hooks/useRequireAuth";
import { apiService, Domain as ApiDomain, Practice, PracticeQuestionLevels } from "../../../../lib/api";
import { motion } from "framer-motion";
import AssessmentTreeNavigation from "../../../../components/shared/AssessmentTreeNavigation";
import { useAssessmentNavigation } from "../../../../hooks/useAssessmentNavigation";
import { PREMIUM_STATUS } from "../../../../lib/constants";
import { FeatureCard } from "./components/FeatureCard";
import { IconArrowLeft, IconShield, IconBug, IconScale, IconClipboardCheck, IconCrown } from "@tabler/icons-react";
import { PremiumFeaturesSkeleton } from "../../../../components/Skeleton";

interface PracticeWithLevels extends Practice {
  levels: PracticeQuestionLevels;
}

interface DomainWithLevels {
  id: string;
  title: string;
  description: string;
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

    // Derive premium status from user subscription status
    const isPremium = user.subscription_status
      ? PREMIUM_STATUS.includes(user.subscription_status as typeof PREMIUM_STATUS[number])
      : false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const domainsData = await apiService.getDomainsFull(projectId);

        // Get non-premium domains for the sidebar navigation
        // Using !== true to include domains with undefined is_premium (treating undefined as non-premium)
        const nonPremiumDomains = domainsData.domains.filter(
          (domain) => domain.is_premium !== true
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
        try {
          const answersData = await apiService.getAnswers(projectId);
          const answersMap: Record<string, number> = {};
          if (answersData && answersData.answers) {
            Object.entries(answersData.answers).forEach(([key, value]) => {
              answersMap[key] = value as number;
            });
          }
          setAnswers(answersMap);
        } catch (error) {
          console.error(`Failed to load answers for project ${projectId}:`, error);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, isAuthenticated, authLoading, userLoading, user]);

  const {
    progressData,
    navigateToDomain,
    navigateToPractice,
  } = useAssessmentNavigation({
    domains,
    assessmentData: answers,
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

  // Combined loading check - render loading UI if any of these conditions are true
  if (authLoading || userLoading || loading || !isAuthenticated || !user || !isPremium) {
    return <PremiumFeaturesSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-row-reverse">
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
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.push(`/assess/${projectId}`)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <IconArrowLeft className="w-4 h-4" />
                Back to AIMA Assessment
              </button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Premium Features
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Features Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 flex flex-col justify-center items-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3 text-center">
                Take your AI governance to the next level
              </h1>
              <p className="text-lg text-muted-foreground mb-6 text-center max-w-3xl">
                Access advanced premium tools and features to enhance your AI maturity assessment.
              </p>
            </motion.div>

            {/* Premium Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
              {/* Card 1: AI Vulnerability Assessment */}
              <FeatureCard
                icon={
                  <>
                    <IconShield className="w-28 h-28 text-primary relative z-10 fill-primary" />
                    <IconBug className="w-14 h-14 text-primary-foreground absolute z-50 fill-primary-foreground dark:fill-background" style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }} />
                  </>
                }
                title="AI Vulnerability Assessment"
                description="Automated scanning for security risks in models."
                href={`/assess/${projectId}/premium-domains`}
                delay={0.1}
              />

              {/* Card 2: Automated Bias & Fairness Testing */}
              <FeatureCard
                icon={<IconScale className="w-28 h-28 text-primary" />}
                title="Automated Bias & Fairness Testing"
                description="Detect and mitigate algorithmic bias across datasets."
                href={`/assess/${projectId}/fairness-bias/options`}
                delay={0.2}
              />

              {/* Card 3: Actionable Governance Controls */}
              <FeatureCard
                icon={<IconClipboardCheck className="w-28 h-28 text-primary-foreground fill-primary" />}
                title="Actionable Governance Controls"
                description="Get concrete steps to improve maturity scores."
                href={`/assess/${projectId}/premium-domains`}
                delay={0.3}
              />
            </div>

            {/* Premium Domains Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-3xl p-8 shadow-xl border border-border mb-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <IconCrown className="w-8 h-8 text-primary" />
                <h3 className="text-2xl font-semibold text-card-foreground">
                  Premium Domains Assessment
                </h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Access additional premium assessment domains with advanced questions and practices.
              </p>
              <button
                onClick={() => router.push(`/assess/${projectId}/premium-domains`)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Go to Premium Domains
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
