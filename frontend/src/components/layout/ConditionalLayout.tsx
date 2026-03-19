"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AppSidebar } from "./Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { isSidebarVisible, isDashboardRoute, isLandingRoute } from "../../lib/route-utils";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = isSidebarVisible(pathname);
  const isHomePage = isLandingRoute(pathname);

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
  const isDashboard = isDashboardRoute(pathname);


  return (
    <SidebarProvider
      defaultOpen={!isDashboard}
      key={isDashboard ? "dashboard" : "non-dashboard"}
    >
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
