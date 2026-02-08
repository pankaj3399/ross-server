"use client";

import React from "react";
import { AssessmentProvider, useAssessmentContext } from "../../../contexts/AssessmentContext";
import AssessmentTreeNavigation from "../../../components/shared/AssessmentTreeNavigation";
import { useRouter, usePathname } from "next/navigation";
import { useAssessmentNavigation } from "../../../hooks/useAssessmentNavigation";
import { Breadcrumb } from "../../../components/shared/Breadcrumb";

const getBreadcrumbLabel = (pathname: string) => {
    if (pathname.includes("premium-features")) return "Premium Features";
    if (pathname.includes("premium-domains")) return "Premium Domains";
    if (pathname.includes("fairness-bias/options")) return "Fairness & Bias Testing";
    if (pathname.includes("fairness-bias/api-endpoint")) return "API Automated Testing";
    if (pathname.includes("fairness-bias/dataset-testing")) return "Dataset Testing";
    if (pathname.includes("fairness-bias")) return "Fairness & Bias Testing";
    return "AI Maturity Assessment (AIMA)";
};

function AssessmentLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
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
        projectName,
        answers,
    } = useAssessmentContext();

    const {
        progressData,
        navigateToPractice,
    } = useAssessmentNavigation({
        domains,
        assessmentData: answers,
        currentDomainId,
        currentPracticeId,
        currentQuestionIndex,
    });

    const handleDomainClick = (domainId: string) => {
        // Logic to select first practice/question if needed
        const domain = domains.find((d) => d.id === domainId);
        if (domain) {
            const firstPracticeId = Object.keys(domain.practices)[0];
            if (firstPracticeId) {
                setCurrentDomainId(domainId);
                setCurrentPracticeId(firstPracticeId);
                setCurrentQuestionIndex(0);
            }
        }

        // We rely on state setters (above) and router.push as the single source of truth.
        // The expansion logic is handled within the navigation component itself based on active domain.

        // Ensure we navigate to the base route to show the question view
        router.push(`/assess/${projectId}`);
    };

    const handlePracticeClick = (domainId: string, practiceId: string) => {
        setCurrentDomainId(domainId);
        setCurrentPracticeId(practiceId);
        setCurrentQuestionIndex(0);
        setCurrentQuestionIndex(0);
        // navigateToPractice(domainId, practiceId); // REMOVED: Redundant with router.push logic and internal state setters
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
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="px-8 py-6 max-w-7xl w-full mx-auto">
                    <Breadcrumb
                        projectName={projectName || "Loading project..."}
                        projectHref={`/assess/${projectId}`}
                        items={[
                            {
                                label: getBreadcrumbLabel(pathname)
                            }
                        ]}
                    />
                    <div className="mt-2 flex-1">
                        {children}
                    </div>
                </div>
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
