import Stripe from "stripe";

export enum SubscriptionStatus {
    FREE = "free",
    BASIC_PREMIUM = "basic_premium",
    PRO_PREMIUM = "pro_premium",
}

// Helper to normalize price IDs from environment variables (removes single/double quotes)
export const getPriceId = (envVar: string | undefined): string => {
    if (!envVar) return "";
    return envVar.replace(/['"]/g, "").trim();
};

export const determineSubscriptionStatus = (
    stripeStatus: Stripe.Subscription.Status,
    priceId: string | undefined
): SubscriptionStatus => {
    // Only grant premium status for 'active' or 'trialing' subscriptions
    if (['active', 'trialing'].includes(stripeStatus)) {
        const basicPriceId = getPriceId(process.env.STRIPE_PRICE_ID_BASIC);
        const proPriceId = getPriceId(process.env.STRIPE_PRICE_ID_PRO);

        if (priceId === basicPriceId) {
            return SubscriptionStatus.BASIC_PREMIUM;
        } else if (priceId === proPriceId) {
            return SubscriptionStatus.PRO_PREMIUM;
        } else {
            console.warn(`Unrecognized price ID: ${priceId}`);
            // Fall through to return FREE
        }
    }
    
    return SubscriptionStatus.FREE;
};
