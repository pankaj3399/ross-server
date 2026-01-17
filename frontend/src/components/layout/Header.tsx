"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { IconSun, IconMoon, IconLogin, IconRocket, IconLayoutDashboard } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-3">
            <img
              src={mounted && theme === "dark" ? "/logo-dark.png" : "/logo.png"}
              alt="MATUR.ai Logo"
              className="h-14 w-auto"
            />
          </Link>

          {/* Navigation Section */}
          <nav className="flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <IconSun className="h-5 w-5" />
              ) : (
                <IconMoon className="h-5 w-5" />
              )}
            </Button>

            {isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">
                  <span className="inline-flex items-center">
                    <IconLayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </span>
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth?isLogin=true">
                    <span className="inline-flex items-center">
                      <IconLogin className="w-4 h-4 mr-2" />
                      Sign in
                    </span>
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/auth?isLogin=false">
                    <span className="inline-flex items-center">
                      <IconRocket className="w-4 h-4 mr-2" />
                      Get Started
                    </span>
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
