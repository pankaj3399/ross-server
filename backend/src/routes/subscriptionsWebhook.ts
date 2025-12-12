import Stripe from "stripe";
import { Request, Response } from "express";
import pool from "../config/database";
import stripe from "../config/stripe";

enum SubscriptionStatus {
    FREE = "free",
    BASIC_PREMIUM = "basic_premium",
    PRO_PREMIUM = "pro_premium",
}

// Webhook handler function
export default async function subscriptionsWebhookHandler(
    req: Request,
    res: Response
): Promise<void> {
    console.log("Webhook received");
    
    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
        console.error("STRIPE_WEBHOOK_SECRET is not set");
        res.status(500).json({ error: "Webhook secret not configured" });
        return;
    }

    if (!sig) {
        console.error("Missing stripe-signature header");
        res.status(400).json({ error: "Missing stripe-signature header" });
        return;
    }

    let event: Stripe.Event;

    try {
        // req.body should be a Buffer when using express.raw()
        const body = req.body as Buffer | string;
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
        console.log("Webhook event type:", event.type);
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`);
        return;
    }

    try {
        switch (event.type) {
            case "checkout.session.completed":
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const priceId = session.metadata?.priceId;

                console.log("Checkout session completed:", { userId, priceId });

                if (userId && priceId) {
                    // Determine subscription type based on price ID
                    let subscriptionStatus = "free"; // default
                    if (priceId === process.env.STRIPE_PRICE_ID_BASIC) {
                        subscriptionStatus = SubscriptionStatus.BASIC_PREMIUM;
                    } else if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
                        subscriptionStatus = SubscriptionStatus.PRO_PREMIUM;
                    }

                    console.log(`Updating user ${userId} to ${subscriptionStatus}`);

                    await pool.query(
                        "UPDATE users SET subscription_status = $1 WHERE id = $2",
                        [subscriptionStatus, userId]
                    );

                    console.log(`Successfully updated user ${userId} subscription status`);
                } else {
                    console.warn("Missing userId or priceId in session metadata");
                }
                break;

            case "customer.subscription.deleted":
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                console.log("Subscription deleted for customer:", customerId);

                await pool.query(
                    "UPDATE users SET subscription_status = $1 WHERE stripe_customer_id = $2",
                    [SubscriptionStatus.FREE, customerId]
                );

                console.log(`Successfully updated subscription status to free for customer ${customerId}`);
                break;

            case "invoice.payment_failed":
                const invoice = event.data.object as Stripe.Invoice;
                const customerIdFailed = invoice.customer as string;

                console.log("Payment failed for customer:", customerIdFailed);

                await pool.query(
                    "UPDATE users SET subscription_status = $1 WHERE stripe_customer_id = $2",
                    [SubscriptionStatus.FREE, customerIdFailed]
                );

                console.log(`Successfully updated subscription status to free for customer ${customerIdFailed}`);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error("Webhook handler error:", error);
        res.status(500).json({ 
            error: "Webhook handler failed",
            message: error instanceof Error ? error.message : String(error)
        });
    }
}
