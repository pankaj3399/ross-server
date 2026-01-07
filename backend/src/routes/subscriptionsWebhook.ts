import Stripe from "stripe";
import { Request, Response } from "express";
import pool from "../config/database";
import stripe from "../config/stripe";

enum SubscriptionStatus {
    FREE = "free",
    BASIC_PREMIUM = "basic_premium",
    PRO_PREMIUM = "pro_premium",
}

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
            switch (event.type) {
                case "customer.subscription.created":
                case "customer.subscription.updated":
                    // Single source of truth for subscription status updates
                    const subscription = event.data.object as Stripe.Subscription;
                    const customerId = subscription.customer as string;
                    const subscriptionId = subscription.id;
                    const priceId = subscription.items.data[0]?.price?.id;

                    console.log("Subscription event:", { 
                        type: event.type, 
                        customerId, 
                        subscriptionId, 
                        priceId,
                        eventId: event.id
                    });

                    if (!priceId) {
                        console.warn("No price ID found in subscription items");
                        break;
                    }

                    // Determine subscription status based on price ID
                    let subscriptionStatus = SubscriptionStatus.FREE;
                    if (priceId === process.env.STRIPE_PRICE_ID_BASIC) {
                        subscriptionStatus = SubscriptionStatus.BASIC_PREMIUM;
                    } else if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
                        subscriptionStatus = SubscriptionStatus.PRO_PREMIUM;
                    }

                    // Update user subscription status and subscription ID with logging
                    const updateResult = await pool.query(
                        "UPDATE users SET subscription_status = $1, stripe_subscription_id = $2 WHERE stripe_customer_id = $3 RETURNING id",
                        [subscriptionStatus, subscriptionId, customerId]
                    );

                    if (updateResult.rows.length > 0) {
                        console.log(`Updated user ${updateResult.rows[0].id} (customer ${customerId}) to ${subscriptionStatus} with subscription ${subscriptionId} (event: ${event.id})`);
                    } else {
                        console.warn(`No user found with stripe_customer_id ${customerId} (event: ${event.id})`);
                    }
                    break;

                case "customer.subscription.deleted":
                    const deletedSubscription = event.data.object as Stripe.Subscription;
                    const deletedCustomerId = deletedSubscription.customer as string;

                    console.log("Subscription deleted for customer:", deletedCustomerId, "event ID:", event.id);

                    // Process deletion asynchronously - fire and forget with error handling
                    processSubscriptionDeletionAsync(deletedCustomerId, event.id).catch((unhandledError) => {
                        // Catch any unhandled promise rejections in the async path
                        console.error(`[Async] Unhandled error in subscription deletion processing for customer ${deletedCustomerId} (event: ${event.id}):`, unhandledError);
                    });
                    break;

                case "invoice.payment_failed":
                    const invoice = event.data.object as Stripe.Invoice;
                    const customerIdFailed = invoice.customer as string;

                    console.log("Payment failed for customer:", customerIdFailed, "event ID:", event.id);

                    await pool.query(
                        "UPDATE users SET subscription_status = $1 WHERE stripe_customer_id = $2",
                        [SubscriptionStatus.FREE, customerIdFailed]
                    );

                    console.log(`Successfully updated subscription status to free for customer ${customerIdFailed} (event: ${event.id})`);
                    break;

                case "checkout.session.completed":
                    const session = event.data.object as Stripe.Checkout.Session;
                    
                    // Only handle subscription checkouts - link user with Stripe only
                    if (session.mode === "subscription") {
                        const sessionCustomerId = session.customer as string;
                        const sessionSubscriptionId = session.subscription as string;
                        const userId = session.metadata?.userId;
                        const action = session.metadata?.action;

                        console.log("Checkout session completed:", { 
                            customerId: sessionCustomerId, 
                            subscriptionId: sessionSubscriptionId,
                            userId,
                            action,
                            eventId: event.id
                        });

                        if (!userId) {
                            console.warn("No userId in session metadata");
                            break;
                        }

                        // If this is an upgrade, cancel the old subscription
                        if (action === "upgrade_to_pro" && session.metadata?.currentSubscriptionId) {
                            const oldSubscriptionId = session.metadata.currentSubscriptionId;
                            
                            try {
                                // Retrieve the subscription to verify it belongs to the same customer
                                const oldSubscription = await stripe.subscriptions.retrieve(oldSubscriptionId);
                                const oldSubscriptionCustomerId = oldSubscription.customer as string;
                                
                                // Verify the subscription belongs to the same customer
                                if (oldSubscriptionCustomerId !== sessionCustomerId) {
                                    console.warn(`Skipping cancellation: old subscription ${oldSubscriptionId} belongs to customer ${oldSubscriptionCustomerId}, but current session is for customer ${sessionCustomerId} (event: ${event.id})`);
                                } else {
                                    // Customer IDs match, proceed with cancellation
                                    try {
                                        await stripe.subscriptions.cancel(oldSubscriptionId);
                                        console.log(`Cancelled old subscription ${oldSubscriptionId} for upgrade (event: ${event.id})`);
                                    } catch (cancelError) {
                                        console.error(`Error cancelling old subscription ${oldSubscriptionId}:`, cancelError);
                                        // Continue anyway - the new subscription is already created
                                    }
                                }
                            } catch (retrieveError) {
                                console.error(`Error retrieving old subscription ${oldSubscriptionId} for verification:`, retrieveError);
                                // Don't proceed with cancellation if we can't verify ownership
                            }
                        }

                        // Link user with Stripe - save customer ID and subscription ID only
                        // Do NOT update subscription_status here - that's handled by customer.subscription.updated
                        const linkResult = await pool.query(
                            "UPDATE users SET stripe_customer_id = $1, stripe_subscription_id = $2 WHERE id = $3 RETURNING id",
                            [sessionCustomerId, sessionSubscriptionId, userId]
                        );

                        if (linkResult.rows.length > 0) {
                            console.log(`Linked user ${linkResult.rows[0].id} with Stripe customer ${sessionCustomerId} and subscription ${sessionSubscriptionId} (event: ${event.id})`);
                        } else {
                            console.warn(`No user found with id ${userId} (event: ${event.id})`);
                        }
                    }
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
