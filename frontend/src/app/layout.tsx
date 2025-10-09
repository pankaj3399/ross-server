import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";

export const metadata: Metadata = {
  title: "MaturAIze - AI Maturity Assessment Platform | OWASP AIMA Framework",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
