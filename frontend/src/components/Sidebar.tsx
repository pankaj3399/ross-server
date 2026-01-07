"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  ChevronsLeft,
  Menu,
  X,
  Gem,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "../contexts/SidebarContext";

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface SidebarProps {
  items?: SidebarItem[];
  showMobileToggle?: boolean;
}

const defaultSidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "overview",
    label: "Overview",
    icon: BarChart3,
    href: "#",
  },
  {
    id: "premium",
    label: "Premium Features",
    icon: Gem,
    href: "/premium-features",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export function Sidebar({
  items = defaultSidebarItems,
  showMobileToggle = true,
}: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { collapsed, mobileOpen, setCollapsed, setMobileOpen, toggleMobile, toggleCollapsed } = useSidebar();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const isLandingPage = pathname === "/" || false;

  const isActive = (href: string, id: string) => {
    if (href === "#") return false;
    
    const currentPath = pathname || "";
    
    const itemMatchesPath = (itemHref: string, itemId: string) => {
      if (itemHref === "#") return false;
      if (itemId === "premium" && (currentPath.includes("/premium-features") || currentPath.includes("/manage-subscription"))) return true;
      if (itemId === "settings" && currentPath.includes("/settings")) return true;
      return currentPath === itemHref || (itemHref !== "/" && currentPath.startsWith(itemHref));
    };
    
    if (id === "dashboard") {
      if (currentPath === "/dashboard" || currentPath === "/") {
        return true;
      }
      
      const otherItemMatches = items.some((item) => {
        if (item.id === "dashboard" || item.disabled) {
          return false;
        }
        return itemMatchesPath(item.href, item.id);
      });
      
      return !otherItemMatches;
    }
    
    return itemMatchesPath(href, id);
  };

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="p-5">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center">
              <img
                src={theme === "dark" ? "/logo-dark.png" : "/logo.png"}
                alt="MATUR.ai Logo"
                className="h-10 w-auto"
              />
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 transition-colors ${collapsed ? "mx-auto" : ""}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeft className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.id);

          if (item.disabled) {
            return (
              <div
                key={item.id}
                className={`flex items-center ${
                  collapsed ? "justify-center" : "space-x-3"
                } px-4 py-3 rounded-lg text-gray-400 dark:text-gray-500 cursor-not-allowed transition-colors`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center ${
                collapsed ? "justify-center" : "space-x-3"
              } px-4 py-3 rounded-lg transition-all duration-200 ${
                active
                  ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-transform ${
                  active ? "scale-110" : ""
                }`}
              />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );

  if (isLandingPage) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      {showMobileToggle && isAuthenticated && (
        <button
          onClick={toggleMobile}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && isAuthenticated && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-full w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col z-40 shadow-xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Only show when authenticated */}
      {isAuthenticated && (
        <aside
          className={`hidden lg:flex flex-col h-screen sticky top-0 bg-gray-50/5 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          {sidebarContent}
        </aside>
      )}
    </>
  );
}

