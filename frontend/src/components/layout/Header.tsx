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
            <img src="/matur-logo-slogan.png" alt="Matur AI" className="h-8 group-data-[collapsible=icon]:hidden" />
          </Link>

          {/* Navigation Section */}
          <nav className="flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <IconSun className="size-6" />
              ) : (
                <IconMoon className="size-6" />
              )}
            </Button>

            {isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">
                  <span className="inline-flex items-center">
                    <IconLayoutDashboard className="size-6 mr-2" />
                    Dashboard
                  </span>
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth?isLogin=true">
                    <span className="inline-flex items-center">
                      <IconLogin className="size-6 mr-2" />
                      Sign in
                    </span>
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/auth?isLogin=false">
                    <span className="inline-flex items-center">
                      <IconRocket className="size-6 mr-2" />
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
