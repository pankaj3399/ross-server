import { isPremiumStatus } from "./constants";

export function getReportRoute(projectId: string, subscriptionStatus?: string | null): string {
  const path = isPremiumStatus(subscriptionStatus)
    ? "/score-report-premium"
    : "/score-report-aima";
  return `${path}?projectId=${projectId}`;
}
