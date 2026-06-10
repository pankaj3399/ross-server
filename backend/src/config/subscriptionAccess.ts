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
  trial: ['/fairness', '/crc', '/chat', '/inventory', '/wizard'],
  basic_premium: ['/fairness', '/crc', '/chat', '/inventory', '/wizard'],
  pro_premium: ['/fairness', '/crc', '/chat', '/inventory', '/wizard'],
};

export function getRoutesForSubscription(status: SubscriptionStatus): string[] {
  return [...COMMON_ROUTES, ...SUBSCRIPTION_ROUTES[status]];
}
