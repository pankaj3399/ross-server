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
  '/notifications',
];

export const SUBSCRIPTION_ROUTES: Record<SubscriptionStatus, string[]> = {
  free: [],
  // Trial unlocks basic_premium routes
  trial: ['/fairness', '/crc', '/chat'],
  basic_premium: ['/fairness', '/crc', '/chat'],
  pro_premium: ['/fairness', '/crc', '/chat'],
};

export function getRoutesForSubscription(status: SubscriptionStatus): string[] {
  return [...COMMON_ROUTES, ...SUBSCRIPTION_ROUTES[status]];
}
