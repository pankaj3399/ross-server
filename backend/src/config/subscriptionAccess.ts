export type SubscriptionStatus = 'free' | 'basic_premium' | 'pro_premium' | 'trial';

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
  // Trial currently has the same route-level access as free;
  // business logic for trial-specific perks can be layered on later.
  trial: [],
  basic_premium: ['/fairness', '/crc'],
  pro_premium: ['/fairness', '/crc'],
};

export function getRoutesForSubscription(status: SubscriptionStatus): string[] {
  return [...COMMON_ROUTES, ...SUBSCRIPTION_ROUTES[status]];
}
