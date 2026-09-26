"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AppSidebar } from "./AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { isSidebarVisible, isLandingRoute } from "../../lib/route-utils";
import TrialBanner from "../features/trial/TrialBanner";
import { useAuth } from "../../contexts/AuthContext";
import AICopilot from "../shared/AICopilot";
import { AssessmentProvider } from "../../contexts/AssessmentContext";
import { useSidebarStore, getTotalSidebarWidth } from "../../store/sidebarStore";

const RESERVED_ASSESS_ROUTES = new Set(["new", "create", "admin", "list"]);

const getProjectIdFromPath = (pathname: string | null, queryProjectId?: string | null): string | null => {
  if (queryProjectId) return queryProjectId;
  const match = pathname?.match(/\/assess\/([^/]+)/i);
  if (!match) return null;
  const segment = match[1].toLowerCase();
  if (RESERVED_ASSESS_ROUTES.has(segment)) return null;
  return match[1];
};

function ConditionalLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showSidebar = isSidebarVisible(pathname);
  const isHomePage = isLandingRoute(pathname);
  const { isAuthenticated } = useAuth();

  const { sidebarWidth, isSecondaryOpen, isResizing, initializeWidth } = useSidebarStore();

  // Run initialization after client-side mount to avoid hydration mismatch
  useEffect(() => {
    initializeWidth();
  }, [initializeWidth]);

  // Handle pages without sidebar (Home, Auth, Invites)
  if (!showSidebar) {
    return (
      <div className="min-h-screen flex flex-col">
        {isHomePage && <Header />}
        <main className="flex-1 bg-background">{children}</main>
        {isHomePage && <Footer />}
      </div>
    );
  }

  const queryProjectId = searchParams?.get("projectId");
  const projectId = getProjectIdFromPath(pathname, queryProjectId);
  const totalSidebarWidth = getTotalSidebarWidth(isSecondaryOpen, sidebarWidth);

  const sidebarContent = (
    <SidebarProvider
      defaultOpen={true}
      className={isResizing ? "sidebar-resizing" : ""}
      style={{
        "--sidebar-width": `${totalSidebarWidth}px`,
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset className="shadow-[inset_6px_0_12px_-8px_rgba(0,0,0,0.08)] dark:shadow-[inset_6px_0_12px_-8px_rgba(0,0,0,0.4)] border-l border-sidebar-border/30 min-w-0 h-screen overflow-hidden flex flex-col">
        <TrialBanner />
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-border/40 bg-background/95 backdrop-blur shrink-0 z-20">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="size-8" />
            <span className="font-semibold text-sm tracking-tight text-foreground">MATUR.ai</span>
          </div>
        </div>
        <main className="flex-1 bg-background relative flex flex-col min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">{children}</main>
      </SidebarInset>
      {isAuthenticated && <AICopilot />}
    </SidebarProvider>
  );

  if (projectId) {
    return (
      <AssessmentProvider>
        {sidebarContent}
      </AssessmentProvider>
    );
  }

  return sidebarContent;
}

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ConditionalLayoutInner>{children}</ConditionalLayoutInner>
    </Suspense>
  );
}
