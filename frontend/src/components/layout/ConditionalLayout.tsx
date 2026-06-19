"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AppSidebar } from "./AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { isSidebarVisible, isLandingRoute } from "../../lib/route-utils";
import TrialBanner from "../features/trial/TrialBanner";
import { useAuth } from "../../contexts/AuthContext";
import AICopilot from "../shared/AICopilot";
import { AssessmentProvider } from "../../contexts/AssessmentContext";
import { useSidebarStore } from "../../store/sidebarStore";

const getProjectIdFromPath = (pathname: string | null): string | null => {
  const match = pathname?.match(/\/assess\/([a-f0-9-]{36})/i);
  return match ? match[1] : null;
};

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = isSidebarVisible(pathname);
  const isHomePage = isLandingRoute(pathname);
  const { isAuthenticated } = useAuth();

  const { sidebarWidth, isResizing, initializeWidth } = useSidebarStore();

  // Run initialization after client-side mount to avoid hydration mismatch
  useEffect(() => {
    initializeWidth();
  }, [initializeWidth]);

  // Handle pages without sidebar (Home, Auth, Invites)
  // Note: isSidebarVisible already returns false for auth and landing routes

  if (!showSidebar) {
    return (
      <div className="min-h-screen flex flex-col">
        {isHomePage && <Header />}
        <main className="flex-1 bg-background">{children}</main>

        {isHomePage && <Footer />}
      </div>
    );
  }

  // Show sidebar on all other pages (Dashboard, Assess, etc.)

  const projectId = getProjectIdFromPath(pathname);

  const sidebarContent = (
    <SidebarProvider
      defaultOpen={true}
      className={isResizing ? "sidebar-resizing" : ""}
      style={{
        "--sidebar-width": `${sidebarWidth}px`,
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <TrialBanner />
        <main className="flex-1 bg-background">{children}</main>
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

