export const PREMIUM_STATUS = ["basic_premium", "pro_premium"] as const;

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
