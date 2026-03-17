export const isSidebarVisible = (pathname: string | null): boolean => {
  if (!pathname) return false;
  
  // Sidebar should be hidden on authentication pages
  if (pathname.startsWith("/auth")) return false;
  
  // Sidebar should be hidden on the landing page (home)
  if (pathname === "/") return false;

  // Sidebar should be hidden on invite pages
  if (pathname.startsWith("/invite")) return false;
  
  // Visible on all other pages (dashboard, assess, etc.)
  return true;
};

export const isDashboardRoute = (pathname: string | null): boolean => {
  // Matches /dashboard and any sub-routes like /dashboard/settings
  return pathname?.startsWith("/dashboard") || false;
};

export const isAuthRoute = (pathname: string | null): boolean => {
  return pathname?.startsWith("/auth") || false;
};

export const isLandingRoute = (pathname: string | null): boolean => {
  return pathname === "/";
};
