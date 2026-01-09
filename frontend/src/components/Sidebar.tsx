"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  User,
  LogOut,
  ChevronDown,
  Database,
  Sun,
  Moon,
  ChevronsUpDown,
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
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { collapsed, mobileOpen, setCollapsed, setMobileOpen, toggleMobile, toggleCollapsed } = useSidebar();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);


  // Calculate dropdown position when collapsed
  useEffect(() => {
    if (collapsed && isUserMenuOpen && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8, // 8px = ml-2
      });
    }
  }, [collapsed, isUserMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
  };

  const shouldHideSidebar = pathname === "/" || pathname?.startsWith("/auth");

  // Get all sidebar items including admin item if user is admin
  const allSidebarItems = [
    ...items,
    ...(user?.role === "ADMIN"
      ? [
          {
            id: "admin-aima",
            label: "Manage AIMA Data",
            href: "/admin/aima-data",
            icon: Database,
          } as SidebarItem,
        ]
      : []),
  ];

  const isActive = (href: string, id: string) => {
    if (href === "#") return false;
    
    const currentPath = pathname || "";
    
    const itemMatchesPath = (itemHref: string, itemId: string) => {
      if (itemHref === "#") return false;
      if (itemId === "premium" && currentPath.includes("/premium-features")) return true;
      if (itemId === "settings" && (currentPath.includes("/settings") || currentPath.includes("/manage-subscription"))) return true;
      if (itemId === "admin-aima" && currentPath.includes("/admin/aima-data")) return true;
      return currentPath === itemHref || (itemHref !== "/" && currentPath.startsWith(itemHref));
    };
    
    if (id === "dashboard") {
      if (currentPath === "/dashboard" || currentPath === "/") {
        return true;
      }
      
      const otherItemMatches = allSidebarItems.some((item) => {
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
            type="button"
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
        {allSidebarItems.map((item) => {
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

      {/* Bottom Section - Theme Toggle and Profile */}
      <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        {/* Theme Toggle */}
        {!collapsed && (
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center space-x-3">
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme
              </span>
            </div>
            <motion.div
              className="relative inline-block w-12 h-6"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={theme === "dark"}
                onChange={toggleTheme}
              />
              <div
                className={`w-12 h-6 rounded-full shadow-inner transition-colors duration-300 cursor-pointer ${
                  theme === "dark"
                    ? "bg-purple-600 dark:bg-purple-600"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                onClick={toggleTheme}
              ></div>
              <motion.div
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow cursor-pointer"
                animate={{
                  x: theme === "dark" ? 28 : 4,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
                onClick={toggleTheme}
              ></motion.div>
            </motion.div>
          </div>
        )}

        {/* Collapsed Theme Toggle */}
        {collapsed && (
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            <Moon className="w-5 h-5" />
          </button>
        )}

        {/* User Profile Card */}
        {isAuthenticated && user && (
          <div className="relative" data-user-menu>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`group w-full flex items-center ${
                collapsed ? "justify-center" : "space-x-3"
              } px-4 py-3 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ${!collapsed ? "border border-gray-200 dark:border-gray-700 hover:shadow-md" : ""}` }
            >
              {/* Profile Picture with Status Indicator */}
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-sm ${!collapsed ? "border-2 border-purple-200 dark:border-purple-400/50" : ""}`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                {/* Green Status Indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>

              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white block truncate">
                      {user.name || "User"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                      {user.email?.length > 20
                        ? `${user.email.substring(0, 20)}...`
                        : user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                </>
              )}
            </motion.button>

            {/* User Dropdown */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: collapsed ? 0 : -10, x: collapsed ? -10 : 0, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                  exit={{ opacity: 0, y: collapsed ? 0 : -10, x: collapsed ? -10 : 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`${
                    collapsed
                      ? "fixed top-auto bottom-4 left-20 ml-2 w-64"
                      : "absolute bottom-full left-0 mb-2 w-full"
                  } bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-3 z-[100] pointer-events-auto`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-2">
                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="group flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <Settings className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">Settings</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="group flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );

  if (shouldHideSidebar) {
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

