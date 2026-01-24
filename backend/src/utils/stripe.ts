import Stripe from "stripe";
import { SubscriptionStatus } from "../config/subscriptionAccess";

// Cache normalized price IDs at module load time
export const BASIC_PRICE_ID = process.env.STRIPE_PRICE_ID_BASIC ? process.env.STRIPE_PRICE_ID_BASIC.replace(/['"]/g, "").trim() : "";
export const PRO_PRICE_ID = process.env.STRIPE_PRICE_ID_PRO ? process.env.STRIPE_PRICE_ID_PRO.replace(/['"]/g, "").trim() : "";

// Helper to normalize price IDs from environment variables (removes single/double quotes)
// Keeping this for backward compatibility if needed, but preferred to use constants
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
        if (priceId === BASIC_PRICE_ID) {
            return 'basic_premium';
        } else if (priceId === PRO_PRICE_ID) {
            return 'pro_premium';
        } else {
            console.warn(`Unrecognized price ID: ${priceId}`);
            // Fall through to return FREE
        }
    }
    
    return 'free';
};
