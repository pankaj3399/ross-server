import { isPremiumStatus } from "./constants";

export type AssessmentType = "AIMA" | "CRC";

export function getReportRoute(
  projectId: string,
  subscriptionStatus?: string | null,
  assessmentType: AssessmentType = "AIMA",
): string {
  if (assessmentType === "CRC") {
    return `/score-report-crc?projectId=${projectId}`;
  }
  const path = isPremiumStatus(subscriptionStatus)
    ? "/score-report-premium"
    : "/score-report-aima";
  return `${path}?projectId=${projectId}`;
}
