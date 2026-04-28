"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconArrowLeft,
  IconCheck,
  IconShieldCheck,
  IconAlertCircle,
  IconLoader2,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiService, type CRCResults } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ReportSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";

const formatPercent = (value: number | null): string =>
  value === null ? "—" : `${value.toFixed(1)}%`;

const getMaturityLabel = (percent: number | null): { label: string; color: string } => {
  if (percent === null) return { label: "Insufficient data", color: "text-muted-foreground" };
  if (percent >= 80) return { label: "Strong", color: "text-success" };
  if (percent >= 60) return { label: "Moderate", color: "text-primary" };
  if (percent >= 40) return { label: "Developing", color: "text-warning" };
  return { label: "Needs Attention", color: "text-destructive" };
};

export default function ScoreReportCrcPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const projectId = searchParams.get("projectId");

  const [results, setResults] = useState<CRCResults | null>(null);
  const [complete, setComplete] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    // Stop the loading skeleton in the no-fetch paths; otherwise the missing-
    // projectId / unauthenticated branches below stay behind the skeleton forever.
    if (!isAuthenticated || !projectId) {
      setLoading(false);
      return;
    }

    // Clear stale state from a prior projectId so the new project's skeleton
    // shows instead of the previous report flashing while the new fetch runs.
    setLoading(true);
    setResults(null);
    setError(null);

    const fetchResults = async () => {
      try {
        const response = await apiService.getCRCResults(projectId);
        setResults(response.results);
        setComplete(response.complete);
      } catch (err: any) {
        console.error("Failed to load CRC results:", err);
        setError(err?.message || "Failed to load CRC results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [authLoading, isAuthenticated, projectId]);

  if (authLoading || loading) {
    return <ReportSkeleton />;
  }

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <IconAlertCircle className="w-12 h-12 text-warning mx-auto" />
            <h2 className="text-xl font-semibold">Missing project</h2>
            <p className="text-sm text-muted-foreground">
              The CRC report requires a projectId query parameter.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              <IconArrowLeft className="w-4 h-4 mr-2" />
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <IconAlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Could not load report</h2>
            <p className="text-sm text-muted-foreground">{error ?? "No results returned."}</p>
            <Button onClick={() => router.push(`/assess/${projectId}/crc`)}>
              <IconArrowLeft className="w-4 h-4 mr-2" />
              Back to assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overall, categories, breakdown } = results;
  const maturity = getMaturityLabel(overall.percentage);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push(`/assess/${projectId}/crc`)}
              className="flex items-center gap-2 text-primary hover:text-primary/80"
            >
              <IconArrowLeft className="w-4 h-4" />
              Back to Assessment
            </button>
            <div className="h-6 w-px bg-border" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Report</p>
              <h1 className="text-2xl font-semibold">Compliance Readiness Summary</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {!complete && (
          <div className="rounded-2xl px-4 py-3 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <IconAlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Partial assessment
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                {overall.answeredControls} of {overall.totalControls} controls answered. Scores below
                reflect only the answered controls.
              </p>
            </div>
          </div>
        )}

        {/* Overall summary */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription>Overall compliance readiness</CardDescription>
                  <CardTitle className="text-3xl mt-1">{formatPercent(overall.percentage)}</CardTitle>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${maturity.color}`}>{maturity.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {overall.scoredControls} scored · {overall.answeredControls} answered · {overall.totalControls} total
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={overall.percentage ?? 0} className="h-2" />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-2xl font-semibold text-success">{breakdown.yes}</p>
                  <p className="text-xs text-muted-foreground mt-1">Yes</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-2xl font-semibold text-primary">{breakdown.partial}</p>
                  <p className="text-xs text-muted-foreground mt-1">Partial</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-2xl font-semibold text-destructive">{breakdown.no}</p>
                  <p className="text-xs text-muted-foreground mt-1">No</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-2xl font-semibold text-muted-foreground">{breakdown.na}</p>
                  <p className="text-xs text-muted-foreground mt-1">N/A</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-2xl font-semibold text-muted-foreground">{breakdown.notSure}</p>
                  <p className="text-xs text-muted-foreground mt-1">Not Sure</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Per-category breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">By Category</h2>
            <p className="text-sm text-muted-foreground">{categories.length} categories</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((cat) => {
              const m = getMaturityLabel(cat.percentage);
              return (
                <Card key={`${cat.categoryId ?? "null"}-${cat.categoryName}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <IconShieldCheck className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">{cat.categoryName}</CardTitle>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">{formatPercent(cat.percentage)}</p>
                        <p className={`text-xs font-medium ${m.color}`}>{m.label}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={cat.percentage ?? 0} className="h-1.5" />
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconCheck className="w-3 h-3" />
                        {cat.scoredControls} scored
                      </span>
                      <span>
                        {cat.answeredControls} of {cat.totalControls} answered
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
