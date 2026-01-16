"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AppSidebar } from "./Sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAuthPage = pathname?.startsWith("/auth");
  const isAssessPage = pathname?.startsWith("/assess");
  const showSidebar = !isHomePage && !isAuthPage && !isAssessPage;

  if (!showSidebar) {
    return (
      <div className="min-h-screen flex flex-col">
        {isHomePage && <Header />}
        <main className="flex-1">{children}</main>
        {isHomePage && <Footer />}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 p-4 pt-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
