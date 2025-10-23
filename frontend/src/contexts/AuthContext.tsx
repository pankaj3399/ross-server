"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiService, AuthResponse, User } from "../lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    mfaCode?: string,
    backupCode?: string,
  ) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    organization?: string;
  }) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  mfaRequired: boolean;
  setMfaRequired: (required: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Auth initialization failed:", error);
        // Only remove token if it's an authentication error
        if (error instanceof Error && error.message.includes("401")) {
          localStorage.removeItem("auth_token");
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (
    email: string,
    password: string,
    mfaCode?: string,
    backupCode?: string,
  ) => {
    const response = await apiService.login(
      email,
      password,
      mfaCode,
      backupCode,
    );

    // Check if MFA is required
    if ("requiresMFA" in response && response.requiresMFA) {
      setMfaRequired(true);
      throw new Error("MFA_REQUIRED");
    }

    // If we get here, it's a successful login
    if ("user" in response) {
      setUser(response.user);
      setMfaRequired(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    organization?: string;
  }) => {
    const response = await apiService.register(data);
    setUser(response.user);
    return response
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setMfaRequired(false);
  };

  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // Don't logout on refresh failure, just log the error
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    mfaRequired,
    setMfaRequired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
