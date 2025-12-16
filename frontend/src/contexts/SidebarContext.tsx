"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  collapsed: boolean;
  mobileOpen: boolean;
  setCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed !== null) {
      setCollapsed(savedCollapsed === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed.toString());
  }, [collapsed]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  const toggleMobile = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        mobileOpen,
        setCollapsed,
        setMobileOpen,
        toggleCollapsed,
        toggleMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

