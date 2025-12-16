import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SidebarProvider } from "../contexts/SidebarContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Sidebar } from "../components/Sidebar";
import StripeProvider from "@/components/StripeProvider";
import ToastComponent from "../components/Toast";

export const metadata: Metadata = {
  title: "MATUR.ai - AI Maturity Assessment Platform | OWASP AIMA Framework",
  description:
    "Comprehensive AI maturity assessment platform using OWASP AIMA framework. Evaluate your organization's AI governance, security, ethics, and responsible AI practices.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body>
        <StripeProvider>
          <ThemeProvider>
            <AuthProvider>
              <SidebarProvider>
                <div className="min-h-screen flex">
                  <Sidebar />
                  <div className="flex-1 flex flex-col min-w-0">
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                </div>
                <ToastComponent />
              </SidebarProvider>
            </AuthProvider>
          </ThemeProvider>
        </StripeProvider>
      </body>
    </html>
  );
}
