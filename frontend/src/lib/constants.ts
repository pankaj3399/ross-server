export const MAX_DESCRIPTION_LENGTH = 2000;

export const PREMIUM_STATUS = ["basic_premium", "pro_premium", "trial"] as const;

export const isPremiumStatus = (status?: string | null): boolean => {
  if (!status) return false;
  return PREMIUM_STATUS.includes(status as typeof PREMIUM_STATUS[number]);
};

// Fallback prices for subscription plans (used when pricing API fails)
export const FALLBACK_PRICES = {
  basic: 100, // BLOOM
  pro: 1000,  // BLOOM PLUS
} as const;

// User roles
export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  PREMIUM_USER: "PREMIUM_USER",
} as const;

export const isAdminRole = (role?: string | null): boolean => {
  return Boolean(role && role.trim().toUpperCase() === ROLES.ADMIN);
};

// Auth routes
export const AUTH_LOGIN_URL = "/auth?isLogin=true";

// Project Constants
export const INDUSTRY_OPTIONS = [
  "Healthcare & Life Sciences",
  "Finance & Banking",
  "Insurance",
  "Retail & E-commerce",
  "Manufacturing",
  "Transportation & Logistics",
  "Energy & Utilities",
  "Telecommunications",
  "Technology & Software",
  "Government & Public Sector",
  "Education",
  "Legal & Compliance",
  "Marketing & Advertising",
  "HR & Workforce Tech",
  "Media & Entertainment",
  "Real Estate & Property Tech",
  "Nonprofit",
  "Research & Development",
  "Others",
];

export const AI_SYSTEM_TYPES = [
  "Machine Learning Model",
  "Deep Learning System",
  "NLP System",
  "Computer Vision",
  "Recommendation System",
  "Autonomous System",
  "Other",
];

export const CARD_THEMES = [
  { // Indigo / Purple-Blue
    id: "indigo",
    bg: "card-google-blue",
    border: "border-indigo-500/25",
    shadow: "hover:shadow-indigo-500/5",
    btnPrimary: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25 border-0 font-bold",
    btnSecondary: "border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10",
    badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs",
    badgeRole: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs",
    text: "text-foreground",
    color: "indigo"
  },
  { // Red
    id: "red",
    bg: "card-google-red",
    border: "border-destructive/35",
    shadow: "hover:shadow-destructive/5",
    btnPrimary: "bg-destructive/15 text-destructive dark:text-red-400 hover:bg-destructive/25 border-0 font-bold",
    btnSecondary: "border-destructive/20 text-destructive dark:text-red-400 hover:bg-destructive/10",
    badge: "bg-destructive/10 text-destructive dark:text-red-400 font-semibold shadow-xs",
    badgeRole: "bg-destructive/20 text-destructive dark:text-red-400 font-bold shadow-xs",
    text: "text-foreground",
    color: "destructive"
  },
  { // Yellow
    id: "yellow",
    bg: "card-google-yellow",
    border: "border-warning/50",
    shadow: "hover:shadow-warning/5",
    btnPrimary: "bg-warning/20 text-warning-foreground dark:text-warning hover:bg-warning/30 border-0 font-bold",
    btnSecondary: "border-warning/35 text-warning-foreground dark:text-warning hover:bg-warning/10",
    badge: "bg-warning/15 text-warning-foreground dark:text-warning font-semibold shadow-xs",
    badgeRole: "bg-warning/25 text-warning-foreground dark:text-warning font-bold shadow-xs",
    text: "text-foreground",
    color: "warning"
  },
  { // Green
    id: "green",
    bg: "card-google-green",
    border: "border-success/40",
    shadow: "hover:shadow-success/5",
    btnPrimary: "bg-success/15 text-success dark:text-success hover:bg-success/25 border-0 font-bold",
    btnSecondary: "border-success/30 text-success dark:text-success hover:bg-success/10",
    badge: "bg-success/10 text-success dark:text-success font-semibold shadow-xs",
    badgeRole: "bg-success/20 text-success dark:text-success font-bold shadow-xs",
    text: "text-foreground",
    color: "success"
  },
  { // Purple
    id: "purple",
    bg: "card-google-purple",
    border: "border-purple-500/25",
    shadow: "hover:shadow-purple-500/5",
    btnPrimary: "bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25 border-0 font-bold",
    btnSecondary: "border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold shadow-xs",
    badgeRole: "bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold shadow-xs",
    text: "text-foreground",
    color: "purple"
  }
];

