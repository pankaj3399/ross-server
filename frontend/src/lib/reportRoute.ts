export type AssessmentType = "AIMA" | "CRC";

export function getReportRoute(
  projectId: string,
  assessmentType: AssessmentType = "AIMA",
): string {
  if (assessmentType === "CRC") {
    return `/score-report-crc?projectId=${projectId}`;
  }
  return `/score-report-aima?projectId=${projectId}`;
}
