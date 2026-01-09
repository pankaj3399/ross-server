export const PREMIUM_STATUS = ["basic_premium", "pro_premium"] as const;

// Default fallback prices for subscription plans
export const DEFAULT_FALLBACK_PRICES = {
  basic: 50,
  pro: 100,
} as const;

// Alternative fallback prices used in some components
export const ALTERNATIVE_FALLBACK_PRICES = {
  basic: 29,
  pro: 49,
} as const;
