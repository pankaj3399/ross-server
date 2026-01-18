"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export const useTheme = () => {
  const context = useNextTheme();

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  const toggleTheme = () => {
    context.setTheme(context.theme === "dark" ? "light" : "dark");
  };

  return { ...context, toggleTheme };
};
