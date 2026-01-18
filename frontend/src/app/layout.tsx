import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ConditionalLayout } from "../components/layout/ConditionalLayout";
import StripeProvider from "@/components/providers/StripeProvider";
import ToastComponent from "../components/shared/Toast";

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
              <ConditionalLayout>{children}</ConditionalLayout>
              <ToastComponent />
            </AuthProvider>
          </ThemeProvider>
        </StripeProvider>
      </body>
    </html>
  );
}
