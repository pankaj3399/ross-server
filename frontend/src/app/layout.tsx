import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { Header } from "../components/Header";
import { Breadcrumb } from "../components/Breadcrumb";
import { Footer } from "../components/Footer";

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
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <Breadcrumb />
              </div>
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
