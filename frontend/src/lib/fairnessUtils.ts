/**
 * Shared utility functions for fairness and bias evaluation formatting and styling.
 */

export function getVerdictBadgeClass(verdictStr: string): string {
  const v = verdictStr.toLowerCase();
  if (
    v.includes("low bias") ||
    v.includes("low toxicity") ||
    v.includes("highly relevant") ||
    v.includes("highly faithful") ||
    v.includes("pass")
  ) {
    return "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30";
  }
  if (v.includes("moderate")) {
    return "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30";
  }
  if (
    v.includes("high bias") ||
    v.includes("high toxicity") ||
    v.includes("low relevance") ||
    v.includes("low faithfulness") ||
    v.includes("fail")
  ) {
    return "bg-destructive/10 text-destructive border border-destructive/30";
  }
  return "bg-secondary text-secondary-foreground border border-border";
}
