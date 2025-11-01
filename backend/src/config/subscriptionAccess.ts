export type SubscriptionStatus = 'free' | 'basic_premium' | 'pro_premium';

// Common routes accessible by all subscription levels
const COMMON_ROUTES: string[] = [
  '/auth',
  '/health',
  '/webhook',
  '/aima',
  '/projects',
  '/answers',
  '/notes',
  '/subscriptions',
];

// Only uncommon/unique routes are listed here, common routes are added automatically
export const SUBSCRIPTION_ROUTES: Record<SubscriptionStatus, string[]> = {
  free: [],
  basic_premium: ['/fairness'],
  pro_premium: ['/fairness'],
};

//Get all routes accessible by a subscription status
export function getRoutesForSubscription(status: SubscriptionStatus): string[] {
  return [...COMMON_ROUTES, ...SUBSCRIPTION_ROUTES[status]];
}
