"use client";

import React from "react";
import { AssessmentProvider, useAssessmentContext } from "../../../contexts/AssessmentContext";
import AssessmentTreeNavigation from "../../../components/shared/AssessmentTreeNavigation";
import { useRouter } from "next/navigation";
import { useAssessmentNavigation } from "../../../hooks/useAssessmentNavigation";

function AssessmentLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const {
        projectId,
        domains,
        currentDomainId,
        currentPracticeId,
        currentQuestionIndex,
        setCurrentDomainId,
        setCurrentPracticeId,
        setCurrentQuestionIndex,
        isPremium,
        answers,
    } = useAssessmentContext();

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
        // Logic to select first practice/question if needed, or just navigate
        // Replicating logic from page.tsx roughly but trusting nav hook or doing simple selection
        const domain = domains.find((d) => d.id === domainId);
        if (domain) {
            const firstPracticeId = Object.keys(domain.practices)[0];
            if (firstPracticeId) {
                const firstPractice = domain.practices[firstPracticeId];
                setCurrentDomainId(domainId);
                setCurrentPracticeId(firstPracticeId);
                setCurrentQuestionIndex(0);
            }
        }
        navigateToDomain(domainId);
    };

    const handlePracticeClick = (domainId: string, practiceId: string) => {
        setCurrentDomainId(domainId);
        setCurrentPracticeId(practiceId);
        setCurrentQuestionIndex(0);
        navigateToPractice(domainId, practiceId);
        // Ensure we are on the main assessment page if clicking a practice
        // But if we are in premium-features, maybe we want to go back?
        // The previous logic pushed router to `/assess/${projectId}`.
        // Let's do that to ensure we see the questions.
        router.push(`/assess/${projectId}`);
    };

    const handleQuestionClick = (domainId: string, practiceId: string, questionIndex: number) => {
        setCurrentDomainId(domainId);
        setCurrentPracticeId(practiceId);
        setCurrentQuestionIndex(questionIndex);
        router.push(`/assess/${projectId}`);
    };

    return (
        <div className="h-screen flex flex-row-reverse overflow-hidden">
            {/* Tree Navigation Sidebar - Persistent */}
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
                hidePremiumFeaturesButton={false} // Allow navigation to premium features
                onFairnessBiasClick={() => {
                    router.push(`/assess/${projectId}/fairness-bias/options`);
                }}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

export default function AssessmentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AssessmentProvider>
            <AssessmentLayoutContent>{children}</AssessmentLayoutContent>
        </AssessmentProvider>
    );
}
