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
  const isRiskRegisterPage = !!pathname?.match(/\/crc\/risks($|\/|\?)/);
  const isFairnessPage = !!pathname?.match(/\/fairness-bias($|\/|\?)/);
  const isFairnessRootPage = !!pathname?.match(/\/fairness-bias($|\?|\/$)/);
  const isApiEndpointPage = !!pathname?.match(/\/fairness-bias\/(api-endpoint|api-history)($|\/|\?)/);
  const isVulnerabilityPage = !!pathname?.match(/\/vulnerability-assessment($|\/|\?)/);
  const isDatasetTestingPage = !!pathname?.match(/\/fairness-bias\/dataset-(testing|history)($|\/|\?)/);
  const isFairnessOptionsPage = !!pathname?.match(/\/fairness-bias\/options($|\/|\?)/);
  const isManualPromptPage = isFairnessPage && !isApiEndpointPage && !isDatasetTestingPage && !isFairnessOptionsPage;
  const isTeamPage = !!pathname?.match(/\/team($|\/|\?)/);
  const isWizardSettingsPage = !!pathname?.match(/\/assess\/[^/]+\/settings\/wizard($|\/|\?)/);
  const isSettingsPage = !!pathname?.match(/\/assess\/[^/]+\/settings($|\/|\?)/) && !isWizardSettingsPage;
  const isInventoryPage = !!pathname?.match(/\/inventory($|\/|\?)/);
  const isAimaPage = !isCrcPage && !isFairnessPage && !isTeamPage && !isSettingsPage && !isWizardSettingsPage && !isInventoryPage && !!pathname?.match(/\/assess\/[^/]+/);
  const isAimaQuestionPage = isAimaPage && !!pathname?.match(/\/assess\/[^/]+\/[^/]+\/[^/]+/);
  return {
    isCrcPage,
    isRiskRegisterPage,
    isFairnessPage,
    isFairnessRootPage,
    isManualPromptPage,
    isApiEndpointPage,
    isVulnerabilityPage,
    isDatasetTestingPage,
    isFairnessOptionsPage,
    isTeamPage,
    isSettingsPage,
    isWizardSettingsPage,
    isInventoryPage,
    isAimaPage,
    isAimaQuestionPage,
  };
};

