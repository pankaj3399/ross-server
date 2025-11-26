export type SubscriptionStatus = 'free' | 'basic_premium' | 'pro_premium';

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

export const SUBSCRIPTION_ROUTES: Record<SubscriptionStatus, string[]> = {
  free: [],
  basic_premium: ['/fairness'],
  pro_premium: ['/fairness'],
};

export function getRoutesForSubscription(status: SubscriptionStatus): string[] {
  return [...COMMON_ROUTES, ...SUBSCRIPTION_ROUTES[status]];
}
