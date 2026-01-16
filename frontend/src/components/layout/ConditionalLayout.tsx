"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AppSidebar } from "./Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAuthPage = pathname?.startsWith("/auth");

  // Only hide sidebar on auth pages (user not logged in)
  if (isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Show sidebar on all other pages (including home, assess, etc.)
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {isHomePage && <Header />}
        <main className="flex-1">{children}</main>
        {isHomePage && <Footer />}
      </SidebarInset>
    </SidebarProvider>
  );
}
