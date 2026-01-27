"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentContext } from "../../../../contexts/AssessmentContext";
import { IconCrown, IconScale, IconArrowLeft } from "@tabler/icons-react";
import { AssessmentSkeleton } from "../../../../components/Skeleton";
import QuestionView from "../../../../components/assess/QuestionView";

export default function PremiumDomainsPage() {
  const router = useRouter();
  const {
    projectId,
    loading,
    answers,
    domains,
    isPremium,
    currentDomainId,
    currentPracticeId,
    setCurrentDomainId,
    setCurrentPracticeId,
    setCurrentQuestionIndex,
    questions,
  } = useAssessmentContext();

  const [initializing, setInitializing] = useState(true);
  const [noPremiumDomains, setNoPremiumDomains] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!isPremium) {
      router.push(`/assess/${projectId}/premium-features`);
      return;
    }

    // Find premium domains
    const premiumDomains = domains.filter(d => d.is_premium === true);

    if (premiumDomains.length === 0) {
      setNoPremiumDomains(true);
      setInitializing(false);
      return;
    }

    // Attempt to set current domain to a premium one if not already
    // If currentDomainId is already a premium domain, we are good.
    const currentIsPremium = premiumDomains.some(d => d.id === currentDomainId);

    if (!currentIsPremium) {
      // Select first premium domain
      const firstDomain = premiumDomains[0];
      if (firstDomain) {
        setCurrentDomainId(firstDomain.id);
        const firstPracticeId = Object.keys(firstDomain.practices)[0];
        if (firstPracticeId) {
          setCurrentPracticeId(firstPracticeId);
          setCurrentQuestionIndex(0);
        }
      }
    }

    setInitializing(false);
  }, [loading, isPremium, domains, currentDomainId, projectId, router, setCurrentDomainId, setCurrentPracticeId, setCurrentQuestionIndex]);

  if (loading || initializing) {
    return <AssessmentSkeleton />;
  }

  // Not premium redirect handled in useEffect, but safe return here
  if (!isPremium) return null;

  if (noPremiumDomains) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-full">
        <div className="text-center max-w-md px-4">
          <IconCrown className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            No Premium Domains Available
          </h1>
          <p className="text-muted-foreground mb-8">
            There are currently no premium domains available for this project. Please check back later.
          </p>
          <div className="flex flex-col gap-4">
            {projectId && (
              <button
                type="button"
                onClick={() => router.push(`/assess/${projectId}/fairness-bias/options`)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-300 font-semibold"
              >
                <IconScale className="w-5 h-5" />
                Fairness & Bias Test
              </button>
            )}
            {projectId && (
              <button
                type="button"
                onClick={() => router.push(`/assess/${projectId}`)}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground hover:bg-muted rounded-xl transition-all duration-300"
              >
                <IconArrowLeft className="w-4 h-4" />
                Back to Assessment
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If we have questions, show the view
  if (questions && questions.length > 0) {
    return <QuestionView />;
  }

  // Fallback if no questions loaded yet or empty practice
  return <AssessmentSkeleton />;
}
