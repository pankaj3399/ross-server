export const isSidebarVisible = (pathname: string | null): boolean => {
  if (!pathname) return false;
  
  // Sidebar should be hidden on authentication pages
  if (pathname.startsWith("/auth")) return false;
  
  // Sidebar should be hidden on the landing page (home)
  if (pathname === "/") return false;

  // Sidebar should be hidden on invitation pages

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

export const getRouteFlags = (pathname: string | null) => {
  const isCrcPage = !!pathname?.match(/\/crc($|\/|\?)/);
  const isFairnessPage = !!pathname?.match(/\/fairness-bias($|\/|\?)/);
  const isFairnessRootPage = !!pathname?.match(/\/fairness-bias($|\?|\/$)/);
  const isApiEndpointPage = !!pathname?.match(/\/fairness-bias\/(api-endpoint|api-history)($|\/|\?)/);
  const isVulnerabilityPage = !!pathname?.match(/\/vulnerability-assessment($|\/|\?)/);
  const isDatasetTestingPage = !!pathname?.match(/\/fairness-bias\/dataset-testing($|\/|\?)/);
  const isFairnessOptionsPage = !!pathname?.match(/\/fairness-bias\/options($|\/|\?)/);
  const isTeamPage = !!pathname?.match(/\/team($|\/|\?)/);
  const isSettingsPage = !!pathname?.match(/\/assess\/[^/]+\/settings($|\/|\?)/);
  const isInventoryPage = !!pathname?.match(/\/inventory($|\/|\?)/);
  const isAimaPage = !isCrcPage && !isFairnessPage && !isTeamPage && !isSettingsPage && !isInventoryPage && !!pathname?.match(/\/assess\/[^/]+/);
  const isAimaQuestionPage = isAimaPage && !!pathname?.match(/\/assess\/[^/]+\/[^/]+\/[^/]+/);
  return {
    isCrcPage,
    isFairnessPage,
    isFairnessRootPage,
    isApiEndpointPage,
    isVulnerabilityPage,
    isDatasetTestingPage,
    isFairnessOptionsPage,
    isTeamPage,
    isSettingsPage,
    isInventoryPage,
    isAimaPage,
    isAimaQuestionPage,
  };
};

