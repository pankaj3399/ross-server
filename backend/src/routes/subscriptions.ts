import { Router } from "express";
import Stripe from "stripe";
import express from "express";
import { z } from "zod";
import stripe from "../config/stripe";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { invoiceCache, default as InvoiceCache } from "../utils/invoiceCache";

const router = Router();

const formatPlanName = (priceId?: string | null) => {
  if (!priceId) return "Unknown plan";
  if (priceId === process.env.STRIPE_PRICE_ID_BASIC) return "Basic Premium";
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "Pro Premium";
  return "Unknown plan";
};

const calculateDaysRemaining = (periodEnd?: number | null) => {
  if (!periodEnd) return null;
  const now = Date.now();
  const end = periodEnd * 1000;
  const diffMs = end - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const buildDowngradePhases = (
  currentPriceId: string,
  basicPriceId: string,
  currentPeriodStart: number,
  currentPeriodEnd: number
): Stripe.SubscriptionScheduleUpdateParams.Phase[] => {
  return [
    {
      items: [{ price: currentPriceId, quantity: 1 }],
      start_date: currentPeriodStart,
      end_date: currentPeriodEnd,
    },
    {
      items: [{ price: basicPriceId, quantity: 1 }],
      start_date: currentPeriodEnd,
    },
  ];
};

// Create checkout session
router.post("/create-checkout-session", authenticateToken, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "Price ID is required" });
    }

    // Create or get Stripe customer
    let customerId = req.user!.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        metadata: {
          userId: req.user!.id,
        },
      });
      customerId = customer.id;

      // Update user with customer ID
      await pool.query(
        "UPDATE users SET stripe_customer_id = $1 WHERE id = $2",
        [customerId, req.user!.id],
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?canceled=true`,
      metadata: {
        userId: req.user!.id,
        priceId: priceId,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Create portal session
router.post("/create-portal-session", authenticateToken, async (req, res) => {
  try {
    const customerId = req.user!.stripe_customer_id;

    if (!customerId) {
      return res.status(400).json({ error: "No subscription found" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

// Get subscription status
router.get("/status", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT subscription_status, stripe_customer_id FROM users WHERE id = $1",
      [req.user!.id],
    );

    const user = result.rows[0];
    res.json({
      subscription_status: user.subscription_status,
      hasStripeCustomer: !!user.stripe_customer_id,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
});

// Detailed subscription info including billing dates and history
router.get("/details", authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT id, subscription_status, stripe_customer_id, stripe_subscription_id, created_at FROM users WHERE id = $1",
      [req.user!.id],
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const baseResponse: any = {
      subscription_status: user.subscription_status,
      signup_date: user.created_at,
    };

    if (!user.stripe_customer_id) {
      return res.json({ ...baseResponse, plan: null, invoices: [] });
    }

    // Load subscription if present
    let subscription: Stripe.Subscription | null = null;
    if (user.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      } catch (error: any) {
        // Handle missing or deleted Stripe subscription
        if (
          error?.statusCode === 404 ||
          error?.type === 'StripeInvalidRequestError'
        ) {
          console.warn(
            `Stripe subscription not found or invalid: ${user.stripe_subscription_id}`,
            error
          );
          subscription = null;
        } else {
          // Rethrow unexpected errors
          throw error;
        }
      }
    }

    // Only fetch invoices if explicitly requested (lazy loading)
    const includeInvoices = req.query.includeInvoices === 'true';
    let invoices: any[] = [];
    
    if (includeInvoices) {
      // Payment history (last 10 invoices) - only when requested
      const invoicesResponse = await stripe.invoices.list({
        customer: user.stripe_customer_id,
        limit: 10,
      });

      invoices = invoicesResponse.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number || invoice.id,
        amount_paid: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
        hosted_invoice_url: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
      }));
    }

    const currentPeriodStart = subscription?.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : null;
    const currentPeriodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;
    const daysRemaining = calculateDaysRemaining(subscription?.current_period_end);
    const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false;

    const plan = subscription
      ? {
          id: subscription.items.data[0]?.price?.id ?? null,
          name: formatPlanName(subscription.items.data[0]?.price?.id),
          status: subscription.status,
          cancel_at_period_end: cancelAtPeriodEnd,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          start_date: subscription.start_date
            ? new Date(subscription.start_date * 1000).toISOString()
            : null,
          trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          days_remaining: daysRemaining,
          renewal_date: cancelAtPeriodEnd ? null : currentPeriodEnd,
          cancel_effective_date: cancelAtPeriodEnd ? currentPeriodEnd : null,
        }
      : null;

    res.json({
      ...baseResponse,
      plan,
      ...(includeInvoices && { invoices }),
    });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).json({ error: "Failed to fetch subscription details" });
  }
});

// Get invoices with pagination and caching
router.get("/invoices", authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT stripe_customer_id FROM users WHERE id = $1",
      [req.user!.id],
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.stripe_customer_id) {
      return res.json({ invoices: [], has_more: false });
    }

    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100, default 10
    const startingAfter = req.query.startingAfter as string | undefined;

    // Check cache first
    const cacheKey = InvoiceCache.getKey(user.stripe_customer_id, limit, startingAfter);
    const cached = invoiceCache.get<{
      invoices: any[];
      has_more: boolean;
      last_invoice_id: string | null;
    }>(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Fetch from Stripe
    const listParams: Stripe.InvoiceListParams = {
      customer: user.stripe_customer_id,
      limit,
    };

    if (startingAfter) {
      listParams.starting_after = startingAfter;
    }

    const invoicesResponse = await stripe.invoices.list(listParams);

    const invoices = invoicesResponse.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number || invoice.id,
      amount_paid: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
      currency: invoice.currency,
      status: invoice.status,
      created: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
      hosted_invoice_url: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
    }));

    const response = {
      invoices,
      has_more: invoicesResponse.has_more,
      last_invoice_id: invoices.length > 0 ? invoices[invoices.length - 1].id : null,
    };

    // Cache the response
    invoiceCache.set(cacheKey, response);

    res.json(response);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// Fetch prices for given price IDs
router.post("/prices", async (req, res) => {
  try {
    const { priceIds } = req.body;

    if (!priceIds || !Array.isArray(priceIds)) {
      return res.status(400).json({ error: 'priceIds array is required' });
    }

    const prices: Record<string, number> = {};

    // Fetch each price from Stripe
    for (const priceId of priceIds) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        
        // Convert from cents to dollars
        const amountInDollars = price.unit_amount ? price.unit_amount / 100 : 0;
        prices[priceId] = amountInDollars;
      } catch (error) {
        console.error(`Failed to fetch price ${priceId}:`, error);
        // Continue with other prices even if one fails
      }
    }

    res.json({ prices });
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices', details: error });
  }
});

// Upgrade to Pro - Update existing subscription
router.post("/upgrade-to-pro", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const currentStatus = req.user!.subscription_status;

    // Validate user is on Basic
    if (currentStatus !== "basic_premium") {
      return res.status(400).json({ 
        error: "Only Basic subscribers can upgrade to Pro" 
      });
    }

    // Fetch current subscription ID from database
    const userResult = await pool.query(
      "SELECT stripe_subscription_id FROM users WHERE id = $1",
      [userId]
    );
    const user = userResult.rows[0];

    if (!user || !user.stripe_subscription_id) {
       return res.status(400).json({ error: "No active subscription found to upgrade" });
    }

    const subscriptionId = user.stripe_subscription_id;
    const proPriceId = process.env.STRIPE_PRICE_ID_PRO;
    
    if (!proPriceId) {
      return res.status(500).json({ error: "Pro price ID not configured" });
    }

    // Retrieve subscription to get item ID
    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.type === 'StripeInvalidRequestError') {
        console.error(`Stripe subscription not found: ${subscriptionId}`, error);
        return res.status(400).json({ 
          error: "Subscription not found in Stripe. Please contact support." 
        });
      }
      throw error;
    }

    // Find the item corresponding to the Basic plan
    const basicPriceId = process.env.STRIPE_PRICE_ID_BASIC;
    const subscriptionItem = subscription.items.data.find(
      item => item.price.id === basicPriceId || item.price.product === basicPriceId
    );
    const subscriptionItemId = subscriptionItem?.id;

    if (!subscriptionItemId) {
        // If we can't find a specific Basic item, and there's only one item, we might be safe to assume it's the one (legacy behavior fallback)
        // BUT strict requirement is to find correct item. Let's return error if we can't be sure.
        console.error(`Could not find item with price ${basicPriceId} in subscription ${subscriptionId}`);
        return res.status(400).json({ error: "Could not identify the Basic subscription item to upgrade. Please contact support." });
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscriptionItemId,
        price: proPriceId,
      }],
      proration_behavior: 'always_invoice',
      payment_behavior: 'pending_if_incomplete', // Handle payment failures gracefully
      expand: ['latest_invoice'],
    });

    // Check status and return appropriate URL
    // If active, payment succeeded immediately
    if (updatedSubscription.status === 'active') {
       return res.json({ 
         sessionId: "updated_direct", 
         url: `${process.env.FRONTEND_URL}/manage-subscription?success=true&upgraded=pro` 
       });
    } 
    
    // If incomplete, past_due, or trialing, we might need to show an invoice or just success (for trials)
    if (['past_due', 'incomplete', 'trialing'].includes(updatedSubscription.status)) {
       const latestInvoice = updatedSubscription.latest_invoice;
       
       // Because we expanded it, it should be an object
       if (latestInvoice && typeof latestInvoice !== 'string') {
           const invoice = latestInvoice as Stripe.Invoice;
           if (invoice.hosted_invoice_url && updatedSubscription.status !== 'trialing') {
               // Only redirect to invoice if we actually need payment (not strictly for trialing if no payment needed yet, but usually standard flow)
               // However, if it's trialing, we often just want to show success unless there's an immediate charge failing?
               // The request asked to treat trialing same as others for hosted_invoice_url fallbacks if present.
               return res.json({ 
                   sessionId: invoice.id, 
                   url: invoice.hosted_invoice_url 
               });
           }
       } else if (typeof latestInvoice === 'string') {
           // Fallback if expansion failed for some reason
           const invoice = await stripe.invoices.retrieve(latestInvoice);
           if (invoice.hosted_invoice_url) {
                return res.json({ 
                    sessionId: latestInvoice, 
                    url: invoice.hosted_invoice_url 
                });
            }
       }
    }

    // Fallback if state is unexpected or no invoice url found (e.g. successful trial start without immediate payment)
    const successUrlParam = updatedSubscription.status === 'trialing' ? '&upgraded=pro&trial=true' : '&check_status=true';
    res.json({ 
        sessionId: "manual_check", 
        url: `${process.env.FRONTEND_URL}/manage-subscription?success=true${successUrlParam}` 
    });

  } catch (error: any) {
    console.error("Error upgrading subscription:", error);

    if (error.type === 'StripeCardError') {
      return res.status(402).json({
        error: error.message,
        payment_intent: error.payment_intent,
        client_secret: error.payment_intent?.client_secret,
        code: error.code,
        decline_code: error.decline_code,
      });
    }

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(500).json({ 
        error: "Failed to upgrade subscription",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Downgrade to Basic - Schedule change at period end
router.post("/downgrade-to-basic", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const currentStatus = req.user!.subscription_status;

    // Validate user is on Pro
    if (currentStatus !== "pro_premium") {
      return res.status(400).json({ 
        error: "Only Pro subscribers can downgrade to Basic" 
      });
    }

    // Fetch subscription ID from database
    const userResult = await pool.query(
      "SELECT stripe_subscription_id FROM users WHERE id = $1",
      [userId]
    );
    const subscriptionId = userResult.rows[0]?.stripe_subscription_id;

    if (!subscriptionId) {
      return res.status(400).json({ 
        error: "No active subscription found" 
      });
    }

    const basicPriceId = process.env.STRIPE_PRICE_ID_BASIC;
    if (!basicPriceId) {
      return res.status(500).json({ error: "Basic price ID not configured" });
    }

    // Retrieve current subscription with expanded schedule
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['schedule'],
    });
    
    // Check if subscription is active
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return res.status(400).json({ 
        error: `Cannot downgrade subscription with status: ${subscription.status}` 
      });
    }
    
    const currentItemId = subscription.items.data[0]?.id;
    const currentPeriodEnd = subscription.current_period_end;

    if (!currentItemId) {
      return res.status(400).json({ error: "Invalid subscription structure" });
    }

    // Use subscription schedules to schedule downgrade at period end
    const currentPriceId = subscription.items.data[0].price.id;
    
    // Check if subscription already has a schedule or is set to cancel
    let scheduleId: string | null = null;
    if (subscription.schedule) {
      scheduleId = typeof subscription.schedule === 'string' ? subscription.schedule : subscription.schedule.id;
    }

    // If subscription is set to cancel, we need to cancel that first or update the schedule
    if (subscription.cancel_at_period_end) {
      // Remove cancel_at_period_end first
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
    }

    // Build phases for downgrade schedule (shared for both update and create)
    const phases = buildDowngradePhases(
      currentPriceId,
      basicPriceId,
      subscription.current_period_start,
      currentPeriodEnd
    );

    if (scheduleId) {
      // Update existing schedule - include start_date for updates
      await stripe.subscriptionSchedules.update(scheduleId, {
        phases,
      });
    } else {
      // Create new schedule from existing subscription first (without phases)
      // Then update it with the phases we want
      const newSchedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscriptionId,
      });
      
      // Now update the schedule with our custom phases
      // When updating, we need start_date in the first phase to anchor end dates
      await stripe.subscriptionSchedules.update(newSchedule.id, {
        phases,
      });
    }

    const currentPeriodEndDate = currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : null;

    res.json({
      message: "Subscription will be downgraded to Basic Premium at period end",
      current_period_end: currentPeriodEndDate,
      days_remaining: calculateDaysRemaining(currentPeriodEnd),
    });
  } catch (error: any) {
    console.error("Error downgrading subscription:", error);
    const errorMessage = error?.message || "Failed to downgrade subscription";
    const errorDetails = error?.type ? ` (${error.type})` : "";
    res.status(500).json({ 
      error: `Failed to downgrade subscription${errorDetails}`,
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined
    });
  }
});

// Cancel subscription
router.post("/cancel-subscription", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const currentStatus = req.user!.subscription_status;

    // Validate user has active subscription
    if (currentStatus === "free") {
      return res.status(400).json({ 
        error: "No active subscription to cancel" 
      });
    }

    // Fetch subscription ID from database
    const userResult = await pool.query(
      "SELECT stripe_subscription_id FROM users WHERE id = $1",
      [userId]
    );
    const subscriptionId = userResult.rows[0]?.stripe_subscription_id;

    if (!subscriptionId) {
      return res.status(400).json({ 
        error: "No active subscription found" 
      });
    }

    // Retrieve subscription to check its current state
    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['schedule'],
      });
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.type === 'StripeInvalidRequestError') {
        console.error(`Stripe subscription not found: ${subscriptionId}`, error);
        return res.status(400).json({ 
          error: "Subscription not found in Stripe. Please contact support." 
        });
      }
      throw error;
    }

    // Check if subscription is already canceled or in a state that can't be canceled
    if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      return res.status(400).json({ 
        error: `Subscription is already ${subscription.status}` 
      });
    }

    // Check if subscription already has cancel_at_period_end set
    if (subscription.cancel_at_period_end) {
      const currentPeriodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      
      return res.json({
        message: "Subscription is already scheduled for cancellation",
        cancel_at_period_end: true,
        current_period_end: currentPeriodEnd,
        days_remaining: calculateDaysRemaining(subscription.current_period_end),
      });
    }

    // If subscription has a schedule, we need to handle it differently
    if (subscription.schedule) {
      const scheduleId = typeof subscription.schedule === 'string' 
        ? subscription.schedule 
        : subscription.schedule.id;
      
      // Cancel the schedule and set cancel_at_period_end on the subscription
      try {
        await stripe.subscriptionSchedules.release(scheduleId);
      } catch (scheduleError: any) {
        console.error(`Error releasing schedule ${scheduleId}:`, scheduleError);
        // Continue with cancel_at_period_end update even if schedule release fails
      }
    }

    // Set subscription to cancel at period end
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    const currentPeriodEnd = updatedSubscription.current_period_end
      ? new Date(updatedSubscription.current_period_end * 1000).toISOString()
      : null;

    res.json({
      message: "Subscription will be canceled at period end",
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
      current_period_end: currentPeriodEnd,
      days_remaining: calculateDaysRemaining(updatedSubscription.current_period_end),
    });
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    const errorMessage = error?.message || "Failed to cancel subscription";
    const errorType = error?.type || error?.code;
    const errorDetails = errorType ? ` (${errorType})` : "";
    
    // Provide more specific error messages
    if (error?.statusCode === 404) {
      return res.status(400).json({ 
        error: "Subscription not found. Please contact support." 
      });
    }
    
    if (error?.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: `Invalid subscription: ${errorMessage}` 
      });
    }

    res.status(500).json({ 
      error: `Failed to cancel subscription${errorDetails}`,
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined
    });
  }
});

export default router;
