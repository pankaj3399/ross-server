"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Home,
  BarChart3,
  Shield,
  Bell,
  ChevronDown,
  Database,
} from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, auth: true },
    { name: "Settings", href: "/settings", icon: Settings, auth: true },
  ];

  // Admin navigation - only show for admin users
  const adminNavigation = [
    {
      name: "Manage AIMA Data",
      href: "/admin/aima-data",
      icon: Database,
      auth: true,
      adminOnly: true,
    },
  ];

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {/* <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-10 h-10 bg-gradient-to-br from-purple-600 via-purple-700 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <div className="group-hover:translate-x-0.5 transition-transform duration-300">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                MATUR.ai
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                AI Maturity Assessment
              </p>
            </div>
          </Link> */}

          <div className="flex items-center space-x-3 group">
            <img
              src={theme === "dark" ? "/logo-dark.png" : "/logo.png"}
              alt="MATUR.ai Logo"
              className="h-14 my-2"
            />
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${isActive(item.href)
                      ? "bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 text-purple-700 dark:text-purple-300 shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-transform duration-300 ${isActive(item.href)
                        ? "scale-110"
                        : "group-hover:scale-110"
                        }`}
                    />
                    <span className="relative z-10">{item.name}</span>
                    {isActive(item.href) && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 rounded-xl"
                        initial={false}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </Link>
                );
              })}

              {/* Admin Navigation - only show for admin users */}
              {user?.role === "ADMIN" &&
                adminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${isActive(item.href)
                        ? "bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 text-red-700 dark:text-red-300 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-transform duration-300 ${isActive(item.href)
                          ? "scale-110"
                          : "group-hover:scale-110"
                          }`}
                      />
                      <span className="relative z-10">{item.name}</span>
                      {isActive(item.href) && (
                        <motion.div
                          layoutId="adminTab"
                          className="absolute inset-0 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 rounded-xl"
                          initial={false}
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
            </nav>
          )}

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-purple-500/25 transition-all duration-300">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                      {user?.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isUserMenuOpen ? "rotate-180" : ""
                      }`}
                  />
                </motion.button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-3 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
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
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth?isLogin=true"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth?isLogin=false"
                  className="group relative bg-gradient-to-r from-purple-600 via-purple-700 to-violet-600 hover:from-purple-700 hover:via-purple-800 hover:to-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 overflow-hidden"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </Link>
              </div>
            )}

            {/* Mobile menu button - only show when authenticated */}
            {isAuthenticated && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50"
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </motion.div>
              </motion.button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-gray-200/50 dark:border-gray-700/50 py-4 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/50"
            >
              <nav className="space-y-1">
                {isAuthenticated &&
                  navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${isActive(item.href)
                          ? "bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 text-purple-700 dark:text-purple-300 shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
                          }`}
                      >
                        <Icon
                          className={`w-5 h-5 transition-transform duration-300 ${isActive(item.href)
                            ? "scale-110"
                            : "group-hover:scale-110"
                            }`}
                        />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}

                {/* Admin Navigation - only show for admin users */}
                {isAuthenticated &&
                  user?.role === "ADMIN" &&
                  adminNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${isActive(item.href)
                          ? "bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 text-red-700 dark:text-red-300 shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
                          }`}
                      >
                        <Icon
                          className={`w-5 h-5 transition-transform duration-300 ${isActive(item.href)
                            ? "scale-110"
                            : "group-hover:scale-110"
                            }`}
                        />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}

                {!isAuthenticated && (
                  <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <Link
                      href="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="group block w-full bg-gradient-to-r from-purple-600 via-purple-700 to-violet-600 hover:from-purple-700 hover:via-purple-800 hover:to-violet-700 text-white px-6 py-3.5 rounded-xl text-sm font-semibold text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 relative overflow-hidden"
                    >
                      <span className="relative z-10">Get Started</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </Link>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close dropdowns */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </header>
  );
}
