"use client";

import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative"
    >
      <div className="relative w-6 h-6">
        <IconSun
          className={`absolute inset-0 w-6 h-6 text-foreground transition-all duration-300 ${theme === "light"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-75"
            }`}
        />
        <IconMoon
          className={`absolute inset-0 w-6 h-6 text-foreground transition-all duration-300 ${theme === "dark"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 -rotate-90 scale-75"
            }`}
        />
      </div>
    </Button>
  );
};
