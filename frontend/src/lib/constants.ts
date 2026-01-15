export const PREMIUM_STATUS = ["basic_premium", "pro_premium"] as const;

// Fallback prices for subscription plans (used when pricing API fails)
export const FALLBACK_PRICES = {
  basic: 50,
  pro: 100,
} as const;

// User roles
export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  PREMIUM_USER: "PREMIUM_USER",
} as const;

// Auth routes
export const AUTH_LOGIN_URL = "/auth?isLogin=true";
