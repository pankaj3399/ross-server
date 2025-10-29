import Stripe from "stripe";
import pool from "../config/database";
import stripe from "../config/stripe";
import express from "express";

enum SubscriptionStatus {
    FREE = "free",
    BASIC_PREMIUM = "basic_premium",
    PRO_PREMIUM = "pro_premium",
}

const router = express.Router();
// Webhook handler
router.post(
    "/",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const sig = req.headers["stripe-signature"];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            return res.status(400).send(`Webhook Error: ${err}`);
        }

        try {
            switch (event.type) {
                case "checkout.session.completed":
                    const session = event.data.object as Stripe.Checkout.Session;
                    const userId = session.metadata?.userId;
                    const priceId = session.metadata?.priceId;

                    if (userId && priceId) {
                        // Determine subscription type based on price ID
                        let subscriptionStatus = 'premium'; // default
                        if (priceId === process.env.STRIPE_PRICE_ID_BASIC) {
                            subscriptionStatus = SubscriptionStatus.BASIC_PREMIUM;
                        } else if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
                            subscriptionStatus = SubscriptionStatus.PRO_PREMIUM;
                        }

                        const result = await pool.query(
                            "UPDATE users SET subscription_status = $1 WHERE id = $2",
                            [subscriptionStatus, userId],
                        );
                    }
                    break;

                case "customer.subscription.deleted":
                    const subscription = event.data.object as Stripe.Subscription;
                    const customerId = subscription.customer as string;

                    await pool.query(
                        "UPDATE users SET subscription_status = 'free' WHERE stripe_customer_id = $1",
                        [customerId],
                    );
                    break;

                case "invoice.payment_failed":
                    const invoice = event.data.object as Stripe.Invoice;
                    const customerIdFailed = invoice.customer as string;

                    await pool.query(
                        "UPDATE users SET subscription_status = 'free' WHERE stripe_customer_id = $1",
                        [customerIdFailed],
                    );
                    break;
            }

            res.json({ received: true });
        } catch (error) {
            console.error("Webhook handler error:", error);
            res.status(500).json({ error: "Webhook handler failed" });
        }
    },
);

export default router;