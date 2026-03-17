"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AppSidebar } from "./Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { isSidebarVisible } from "../../lib/route-utils";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = isSidebarVisible(pathname);
  const isHomePage = pathname === "/";
  const isAuthPage = pathname?.startsWith("/auth");

  // Only hide sidebar layout on auth pages, home page, or invite pages
  if (!showSidebar) {
    return (
      <div className="min-h-screen flex flex-col">
        {isHomePage && <Header />}
        <main className="flex-1">{children}</main>
        {isHomePage && <Footer />}
      </div>
    );
  }

  // Show sidebar on all other pages (including home, assess, etc.)
  const isDashboard = pathname === "/dashboard";

  return (
    <SidebarProvider defaultOpen={!isDashboard} key={isDashboard ? 'dashboard' : 'non-dashboard'}>
      <AppSidebar />
      <SidebarInset {...(isHomePage ? { style: { marginLeft: 0 } } : {})}>
        {isHomePage && <Header />}
        <main className="flex-1 bg-background">{children}</main>
        {isHomePage && <Footer />}
      </SidebarInset>
    </SidebarProvider>
  );
}
