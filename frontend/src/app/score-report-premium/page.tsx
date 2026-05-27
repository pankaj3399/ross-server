"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReportSkeleton } from "../../components/Skeleton";

function PremiumRedirectClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");

  useEffect(() => {
    const target = projectId
      ? `/score-report-aima?projectId=${projectId}`
      : "/dashboard";
    router.replace(target);
  }, [projectId, router]);

  return null;
}

/**
 * Legacy premium report route — now redirects to the unified AIMA report.
 *
 * The AIMA report page handles premium-domain visibility itself based on
 * the project's capability flags, so a separate premium report page is no
 * longer needed.  This redirect ensures old bookmarks / shared links still
 * resolve gracefully.
 */
export default function PremiumReportRedirect() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <PremiumRedirectClient />
    </Suspense>
  );
}