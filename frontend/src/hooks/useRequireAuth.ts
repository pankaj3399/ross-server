"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export function useRequireAuth(redirectTo: string = "/auth") {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (isAuthenticated) {
      hasRedirected.current = false;
      return;
    }

    if (!isAuthenticated && pathname !== redirectTo && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, pathname, redirectTo, router]);

  return {
    loading,
    isAuthenticated,
  };
}

