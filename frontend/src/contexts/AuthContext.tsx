"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiService, User } from "../lib/api";

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
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  mfaRequired: boolean;
  setMfaRequired: (required: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        localStorage.removeItem("auth_token");
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
    try {
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
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    organization?: string;
  }) => {
    try {
      const response = await apiService.register(data);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
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
