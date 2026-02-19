"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FeatureCard } from "./components/FeatureCard";
import { IconArrowLeft, IconShield, IconBug, IconScale, IconClipboardCheck, IconCrown } from "@tabler/icons-react";
import { PremiumFeaturesSkeleton } from "../../../../components/Skeleton";
import { useAssessmentContext } from "../../../../contexts/AssessmentContext";

export default function PremiumFeaturesPage() {
  const router = useRouter();
  const {
    projectId,
    loading,
    isPremium,
  } = useAssessmentContext();

  // Show loading UI while auth/data is loading
  if (loading) {
    return <PremiumFeaturesSkeleton />;
  }

  // Redirect non-premium users to subscription page logic
  if (!isPremium) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-full">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconCrown className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">Premium Feature</h2>
          <p className="text-muted-foreground mb-6">
            Premium features are available for premium subscribers only. Upgrade your plan to access advanced AI governance tools.
          </p>
          <button
            type="button"
            onClick={() => router.push("/subscriptions")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
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
              icon={<IconShield className="w-28 h-28 text-primary-foreground fill-primary" />}
              title="Compliance Readiness Controls"
              description="Manage compliance status across multiple frameworks."
              href={`/assess/${projectId}/crc`}
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
              type="button"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Go to Premium Domains
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
