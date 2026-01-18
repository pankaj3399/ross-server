export const isSidebarVisible = (pathname: string | null): boolean => {
  if (!pathname) return false;
  
  // Sidebar should be hidden on authentication pages
  if (pathname.startsWith("/auth")) return false;
  
  // Sidebar should be hidden on the landing page (home)
  if (pathname === "/") return false;
  
  // Visible on all other pages (dashboard, assess, etc.)
  return true;
};
