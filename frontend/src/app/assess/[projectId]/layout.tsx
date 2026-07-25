"use client";

import React from "react";
import { useAssessmentContext } from "../../../contexts/AssessmentContext";
import { usePathname } from "next/navigation";
import { Breadcrumb } from "../../../components/shared/Breadcrumb";
import { WizardGateProvider } from "../../../components/features/wizard/WizardGateProvider";
import { useAuth } from "../../../contexts/AuthContext";
import { isPremiumStatus } from "../../../lib/constants";
import { getRouteFlags } from "../../../lib/route-utils";


const getBreadcrumbLabel = (pathname: string) => {
    if (pathname.includes("premium-features")) return "Premium Features";
    if (pathname.includes("premium-domains")) return "Premium Domains";
    if (pathname.includes("fairness-bias/options")) return "Fairness & Bias Testing";
    if (pathname.includes("fairness-bias/api-endpoint")) return "API Automated Testing";
    if (pathname.includes("vulnerability-assessment")) return "AI Vulnerability Assessment";
    if (pathname.includes("fairness-bias/dataset-testing")) return "Dataset Testing";
    if (pathname.includes("fairness-bias")) return "Fairness & Bias Testing";
    if (pathname.includes("crc/dashboard")) return "Compliance Readiness Dashboard";
    if (pathname.includes("crc/welcome")) return "Compliance Readiness Controls (CRC)";
    if (pathname.includes("crc")) return "Compliance Readiness Controls (CRC)";
    if (pathname.includes("inventory")) return "AI Component Inventory";
    if (pathname.includes("team")) return "Team Management";
    return "AI Maturity Assessment (AIMA)";
};

function AssessmentLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const {
        projectId,
        projectName,
        loading,
    } = useAssessmentContext();

    const premiumStatus = isPremiumStatus(user?.subscription_status);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const isCrcPage = pathname.includes("/crc");
    const isInventoryPage = pathname.includes("/inventory");
    const isFairnessPage = pathname.includes("/fairness-bias");
    const isVulnerabilityAssessmentPage = pathname.includes("/vulnerability-assessment");
    const isPremiumDomainsPage = pathname.includes("/premium-domains");
    const isPremiumFeaturesPage = pathname.includes("/premium-features");
    const isSettingsPage = pathname.includes("/settings") || pathname.includes("/team");

    const isPremiumRoute = 
        (isCrcPage ||
         isInventoryPage ||
         isFairnessPage ||
         isVulnerabilityAssessmentPage ||
         isPremiumDomainsPage ||
         isPremiumFeaturesPage) &&
        !isSettingsPage;

    // For premium users, the project breadcrumb link goes to CRC dashboard (not AIMA)
    const projectBreadcrumbHref = premiumStatus
        ? `/assess/${projectId}/crc/dashboard`
        : `/assess/${projectId}`;

    const isMainAssessment = pathname === `/assess/${projectId}`;
    const { isAimaQuestionPage } = getRouteFlags(pathname);
    const hideLayoutBreadcrumb = isMainAssessment || isAimaQuestionPage || isCrcPage || isInventoryPage || isFairnessPage || isVulnerabilityAssessmentPage || isSettingsPage;

    const renderedChildren = isPremiumRoute ? (
        <WizardGateProvider projectId={projectId} featureName={getBreadcrumbLabel(pathname)}>
            {children}
        </WizardGateProvider>
    ) : (
        children
    );

    return (
        <div className="flex flex-col min-h-full">
            {/* Main Content Area — navigation now lives in the unified left sidebar */}
            <div className="flex-1">
                {hideLayoutBreadcrumb ? (
                    renderedChildren
                ) : (
                    <div className="px-8 py-6 w-full">
                        <Breadcrumb
                            projectName={projectName || "Loading project..."}
                            projectHref={projectBreadcrumbHref}
                            items={[
                                {
                                    label: getBreadcrumbLabel(pathname)
                                }
                            ]}
                        />
                        <div className="mt-2 flex-1">
                            {renderedChildren}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AssessmentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AssessmentLayoutContent>{children}</AssessmentLayoutContent>;
}
