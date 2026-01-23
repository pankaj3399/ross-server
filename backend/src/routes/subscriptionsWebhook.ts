import Stripe from "stripe";
import { Request, Response } from "express";
import pool from "../config/database";
import stripe from "../config/stripe";

enum SubscriptionStatus {
    FREE = "free",
    BASIC_PREMIUM = "basic_premium",
    PRO_PREMIUM = "pro_premium",
}

// Helper to normalize price IDs from environment variables (removes single/double quotes)
const getPriceId = (envVar: string | undefined): string => {
    if (!envVar) return "";
    return envVar.replace(/['"]/g, "").trim();
};

async function processSubscriptionDeletionAsync(
    deletedCustomerId: string,
    eventId: string
): Promise<void> {
    const startTime = Date.now();
    
    try {
        console.log(`[Async] Processing subscription deletion for customer ${deletedCustomerId} (event: ${eventId})`);
        
        // Check if customer has any other active subscriptions before setting to free
        // This prevents setting to FREE during upgrades when old subscription is cancelled
        const activeSubscriptions = await stripe.subscriptions.list({
            customer: deletedCustomerId,
            status: "active",
            limit: 1,
        });

        if (activeSubscriptions.data.length > 0) {
            // Customer has another active subscription, don't set to FREE
            // The customer.subscription.created/updated event will handle the status update
            console.log(`[Async] Customer ${deletedCustomerId} has ${activeSubscriptions.data.length} active subscription(s), skipping FREE status update (event: ${eventId}, duration: ${Date.now() - startTime}ms)`);
            return;
        }

        // Only set to free if no other active subscriptions exist
        const deleteResult = await pool.query(
            "UPDATE users SET subscription_status = $1, stripe_subscription_id = NULL WHERE stripe_customer_id = $2 RETURNING id",
            [SubscriptionStatus.FREE, deletedCustomerId]
        );

        if (deleteResult.rows.length > 0) {
            console.log(`[Async] Updated user ${deleteResult.rows[0].id} (customer ${deletedCustomerId}) to free subscription (event: ${eventId}, duration: ${Date.now() - startTime}ms)`);
        } else {
            console.warn(`[Async] No user found with stripe_customer_id ${deletedCustomerId} (event: ${eventId}, duration: ${Date.now() - startTime}ms)`);
        }
    } catch (asyncError) {
        // Log error but don't fail webhook - Stripe will retry if needed
        // Monitor these errors to ensure eventual consistency
        const duration = Date.now() - startTime;
        console.error(`[Async] Error processing subscription deletion for customer ${deletedCustomerId} (event: ${eventId}, duration: ${duration}ms):`, asyncError);
        console.error(`[Async] Error details:`, {
            customerId: deletedCustomerId,
            eventId,
            duration,
            error: asyncError instanceof Error ? asyncError.message : String(asyncError),
            stack: asyncError instanceof Error ? asyncError.stack : undefined,
        });
        
        // Re-throw to be caught by outer catch handler for monitoring
        throw asyncError;
    }
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
        console.log("Webhook event type:", event.type, "event ID:", event.id);
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`);
        return;
    }

    // Acknowledge Stripe immediately after event validation to minimize latency
    // This ensures webhook response time is not affected by async operations
    res.status(200).json({ received: true });

    // Process event asynchronously after acknowledgment
    // Use setImmediate to ensure response is sent before processing begins
    setImmediate(async () => {
        try {
            switch (event.type as string) {
                case "customer.subscription.created":
                case "customer.subscription.updated": {
                    // Single source of truth for subscription status updates
                    const subscription = event.data.object as Stripe.Subscription;
                    const customerId = subscription.customer as string;
                    const subscriptionId = subscription.id;
                    const priceId = subscription.items.data[0]?.price?.id;
                    const stripeStatus = subscription.status;

                    console.log("Subscription event:", { 
                        type: event.type, 
                        customerId, 
                        subscriptionId, 
                        priceId,
                        stripeStatus,
                        eventId: event.id
                    });

                    if (!priceId) {
                        console.warn("No price ID found in subscription items");
                        break;
                    }

                    // SECURITY: Only grant premium status for 'active' or 'trialing' subscriptions
                    // For incomplete, past_due, unpaid, canceled - set to FREE to prevent bypass
                    let subscriptionStatus = SubscriptionStatus.FREE;
                    
                    if (stripeStatus === 'active' || stripeStatus === 'trialing') {
                        // Only grant premium access for paid/trial subscriptions
                        const basicPriceId = getPriceId(process.env.STRIPE_PRICE_ID_BASIC);
                        const proPriceId = getPriceId(process.env.STRIPE_PRICE_ID_PRO);

                        if (priceId === basicPriceId) {
                            subscriptionStatus = SubscriptionStatus.BASIC_PREMIUM;
                        } else if (priceId === proPriceId) {
                            subscriptionStatus = SubscriptionStatus.PRO_PREMIUM;
                        } else {
                            console.warn(`Unrecognized price ID: ${priceId}. Setting status to FREE. (Basic: ${basicPriceId}, Pro: ${proPriceId})`);
                        }
                    } else {
                        // For incomplete, past_due, unpaid, canceled - do NOT grant premium access
                        console.log(`Subscription status is '${stripeStatus}' - not granting premium access until payment is confirmed`);
                        subscriptionStatus = SubscriptionStatus.FREE;
                    }

                    // Update user subscription status and subscription ID with logging
                    const updateResult = await pool.query(
                        "UPDATE users SET subscription_status = $1, stripe_subscription_id = $2 WHERE stripe_customer_id = $3 RETURNING id",
                        [subscriptionStatus, subscriptionId, customerId]
                    );

                    if (updateResult.rows.length > 0) {
                        console.log(`Updated user ${updateResult.rows[0].id} (customer ${customerId}) to ${subscriptionStatus} with subscription ${subscriptionId} (stripe status: ${stripeStatus}, event: ${event.id})`);
                    } else {
                        console.warn(`No user found with stripe_customer_id ${customerId} (event: ${event.id})`);
                    }
                    break;
                }

                case "customer.subscription.deleted": {
                    const deletedSubscription = event.data.object as Stripe.Subscription;
                    const deletedCustomerId = deletedSubscription.customer as string;

                    console.log("Subscription deleted for customer:", deletedCustomerId, "event ID:", event.id);

                    // Process deletion asynchronously - fire and forget with error handling
                    processSubscriptionDeletionAsync(deletedCustomerId, event.id).catch((unhandledError) => {
                        // Catch any unhandled promise rejections in the async path
                        console.error(`[Async] Unhandled error in subscription deletion processing for customer ${deletedCustomerId} (event: ${event.id}):`, unhandledError);
                    });
                    break;
                }

                case "invoice.payment_failed": {
                    const invoice = event.data.object as Stripe.Invoice;
                    const customerIdFailed = invoice.customer as string;

                    console.warn(`[Payment Failed] Invoice payment failed for customer ${customerIdFailed} (event: ${event.id})`, {
                        invoice: invoice.id,
                        customerId: customerIdFailed,
                        eventId: event.id,
                    });
                    break;
                }

                case "invoice.payment_succeeded": {
                    const invoice = event.data.object as Stripe.Invoice;
                    const customerId = invoice.customer as string;
                    const subscriptionId = invoice.subscription as string;

                    console.log(`[Payment Succeeded] Invoice payment succeeded for customer ${customerId} (event: ${event.id})`, {
                        invoice: invoice.id,
                        subscriptionId,
                        customerId,
                        eventId: event.id
                    });

                    // If this is a subscription invoice, verify and update status
                    if (customerId && subscriptionId) {
                        try {
                            // Retrieve the subscription to ensure we get the correct price/status
                            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                            const priceId = subscription.items.data[0]?.price?.id;
                            const stripeStatus = subscription.status;

                            console.log(`[Payment Succeeded] Retrieved subscription ${subscriptionId} for verification`, {
                                status: stripeStatus,
                                priceId
                            });

                            if (!priceId) {
                                console.warn(`[Payment Succeeded] No price ID found in subscription ${subscriptionId}`);
                                break;
                            }

                            // Determine status based on price
                            let subscriptionStatus = SubscriptionStatus.FREE;
                            
                            // For paid invoices, we generally assume active access if status is valid
                            // Note: We check against the same logic as subscription.updated for consistency
                            if (['active', 'trialing'].includes(stripeStatus)) {
                                const basicPriceId = getPriceId(process.env.STRIPE_PRICE_ID_BASIC);
                                const proPriceId = getPriceId(process.env.STRIPE_PRICE_ID_PRO);

                                if (priceId === basicPriceId) {
                                    subscriptionStatus = SubscriptionStatus.BASIC_PREMIUM;
                                } else if (priceId === proPriceId) {
                                    subscriptionStatus = SubscriptionStatus.PRO_PREMIUM;
                                } else {
                                    console.warn(`[Payment Succeeded] Unrecognized price ID: ${priceId}`);
                                }
                            } else {
                                console.log(`[Payment Succeeded] Subscription status is '${stripeStatus}' - not granting premium yet`);
                                // Maintain existing status or handle as needed - simpler to let subscription.updated handle non-active states
                                // But if payment just SUCCEEDED, it really SHOULD be active soon.
                            }

                            if (subscriptionStatus !== SubscriptionStatus.FREE) {
                                const updateResult = await pool.query(
                                    "UPDATE users SET subscription_status = $1, stripe_subscription_id = $2 WHERE stripe_customer_id = $3 RETURNING id",
                                    [subscriptionStatus, subscriptionId, customerId]
                                );

                                if (updateResult.rows.length > 0) {
                                    console.log(`[Payment Succeeded] Updated user ${updateResult.rows[0].id} to ${subscriptionStatus} (subscription: ${subscriptionId})`);
                                } else {
                                    console.warn(`[Payment Succeeded] No user found with customer ID ${customerId}`);
                                }
                            }
                        } catch (err) {
                            console.error(`[Payment Succeeded] Error processing subscription update:`, err);
                        }
                    }
                    break;
                }

                case "checkout.session.completed": {
                    const session = event.data.object as Stripe.Checkout.Session;
                    
                    // Only handle subscription checkouts
                    if (session.mode === "subscription") {
                        const sessionCustomerId = session.customer as string;
                        const sessionSubscriptionId = session.subscription as string;
                        const userId = session.metadata?.userId;
                        const action = session.metadata?.action;

                        console.log(`[Checkout Completed] Processing for user ${userId}, customer ${sessionCustomerId}`, { 
                            subscriptionId: sessionSubscriptionId,
                            action,
                            eventId: event.id
                        });

                        if (!userId) {
                            console.warn("[Checkout Completed] No userId in session metadata, skipping database update");
                            break;
                        }

                        // Determine the starting status by fetching the subscription proactively
                        let subscriptionStatus = SubscriptionStatus.FREE;
                        try {
                            const subscription = await stripe.subscriptions.retrieve(sessionSubscriptionId);
                            const priceId = subscription.items.data[0]?.price?.id;
                            const stripeStatus = subscription.status;

                            console.log(`[Checkout Completed] Retrieved subscription ${sessionSubscriptionId}`, {
                                status: stripeStatus,
                                priceId
                            });

                            // Logic to determine initial status - grant premium if active/trialing
                            if (['active', 'trialing'].includes(stripeStatus)) {
                                const basicPriceId = getPriceId(process.env.STRIPE_PRICE_ID_BASIC);
                                const proPriceId = getPriceId(process.env.STRIPE_PRICE_ID_PRO);

                                if (priceId === basicPriceId) {
                                    subscriptionStatus = SubscriptionStatus.BASIC_PREMIUM;
                                } else if (priceId === proPriceId) {
                                    subscriptionStatus = SubscriptionStatus.PRO_PREMIUM;
                                } else {
                                    console.warn(`[Checkout Completed] Unrecognized price ID: ${priceId}. Expected Basic: ${basicPriceId} or Pro: ${proPriceId}`);
                                }
                            } else {
                                console.log(`[Checkout Completed] Subscription is in '${stripeStatus}' state, initializing as FREE until payment confirms`);
                            }
                        } catch (subError) {
                            console.error("[Checkout Completed] Error fetching subscription details:", subError);
                            // Fallback: stay as FREE, let other handlers fix it later
                        }

                        // If this is an upgrade, cancel the old subscription
                        if (action === "upgrade_to_pro" && session.metadata?.currentSubscriptionId) {
                            const oldSubscriptionId = session.metadata.currentSubscriptionId;
                            
                            try {
                                const oldSubscription = await stripe.subscriptions.retrieve(oldSubscriptionId);
                                const oldSubscriptionCustomerId = oldSubscription.customer as string;
                                
                                if (oldSubscriptionCustomerId === sessionCustomerId) {
                                    await stripe.subscriptions.cancel(oldSubscriptionId);
                                    console.log(`[Checkout Completed] Cancelled old subscription ${oldSubscriptionId} for upgrade`);
                                }
                            } catch (cancelError) {
                                console.error(`[Checkout Completed] Error handling old subscription cancellation:`, cancelError);
                            }
                        }

                        // Link user with Stripe AND update status proactively
                        // RACE CONDITION GUARD: If we are initializing as FREE (status incomplete), 
                        // only update the status if the user IS currently 'free'. This prevents overwriting
                        // a successful 'active' status from a previous invoice.payment_succeeded event.
                        let linkResult;
                        if (subscriptionStatus === SubscriptionStatus.FREE) {
                            linkResult = await pool.query(
                                "UPDATE users SET stripe_customer_id = $1, stripe_subscription_id = $2, subscription_status = CASE WHEN subscription_status = 'free' THEN 'free' ELSE subscription_status END WHERE id = $3 RETURNING id, subscription_status",
                                [sessionCustomerId, sessionSubscriptionId, userId]
                            );
                        } else {
                            linkResult = await pool.query(
                                "UPDATE users SET stripe_customer_id = $1, stripe_subscription_id = $2, subscription_status = $3 WHERE id = $4 RETURNING id, subscription_status",
                                [sessionCustomerId, sessionSubscriptionId, subscriptionStatus, userId]
                            );
                        }

                        if (linkResult.rows.length > 0) {
                            console.log(`[Checkout Completed] Successfully updated user ${linkResult.rows[0].id} status to ${linkResult.rows[0].subscription_status} (event: ${event.id})`);
                        } else {
                            console.warn(`[Checkout Completed] User ${userId} not found in database for update (event: ${event.id})`);
                        }
                    }
                    break;
                }

                case "invoiceitem.created":
                case "invoice.created":
                case "invoice.updated":
                case "invoice.finalized":
                case "payment_intent.created":
                case "payment_intent.succeeded":
                case "charge.succeeded":
                case "invoice.paid":
                case "invoice_payment.paid":
                    // These events are informational or handled by other events (like invoice.payment_succeeded)
                    // We acknowledge them to avoid cluttering logs with "Unhandled event type"
                    console.log(`[Acknowledged] Event type: ${event.type} (event ID: ${event.id})`);
                    break;

                default:
                    console.log(`Unhandled event type: ${event.type} (event ID: ${event.id})`);
            }
        } catch (error) {
            // Log errors but don't send response (already sent)
            console.error("Webhook handler error (async processing):", error);
            console.error("Error details:", {
                eventId: event.id,
                eventType: event.type,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
    });
}
