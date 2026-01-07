import { Router } from "express";
import Stripe from "stripe";
import express from "express";
import { z } from "zod";
import stripe from "../config/stripe";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";

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
      stripe_customer_id: user.stripe_customer_id,
      stripe_subscription_id: user.stripe_subscription_id,
      signup_date: user.created_at,
    };

    if (!user.stripe_customer_id) {
      return res.json({ ...baseResponse, plan: null, invoices: [] });
    }

    // Load subscription if present
    let subscription: Stripe.Subscription | null = null;
    if (user.stripe_subscription_id) {
      subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    }

    // Payment history (last 10 invoices)
    const invoicesResponse = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 10,
    });

    const invoices = invoicesResponse.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number || invoice.id,
      amount_paid: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
      currency: invoice.currency,
      status: invoice.status,
      created: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
      hosted_invoice_url: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
    }));

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
      invoices,
    });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).json({ error: "Failed to fetch subscription details" });
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

// Upgrade to Pro - Create Stripe Checkout Session
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

    // Get or create Stripe customer
    let customerId = req.user!.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await pool.query(
        "UPDATE users SET stripe_customer_id = $1 WHERE id = $2",
        [customerId, userId]
      );
    }

    // Fetch current subscription ID from database
    const userResult = await pool.query(
      "SELECT stripe_subscription_id FROM users WHERE id = $1",
      [userId]
    );
    const currentSubscriptionId = userResult.rows[0]?.stripe_subscription_id || "";

    const proPriceId = process.env.STRIPE_PRICE_ID_PRO;
    if (!proPriceId) {
      return res.status(500).json({ error: "Pro price ID not configured" });
    }

    // Create checkout session for upgrade
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: proPriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/manage-subscription?success=true&upgraded=pro`,
      cancel_url: `${process.env.FRONTEND_URL}/manage-subscription?canceled=true`,
      metadata: { 
        userId,
        action: "upgrade_to_pro",
        currentSubscriptionId: currentSubscriptionId,
      },
      subscription_data: {
        metadata: {
          userId,
          action: "upgrade_to_pro",
        },
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating upgrade checkout session:", error);
    res.status(500).json({ error: "Failed to create upgrade session" });
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

    if (scheduleId) {
      // Update existing schedule - include start_date for updates
      const updatePhases = [
        {
          items: [{ price: currentPriceId, quantity: 1 }],
          start_date: subscription.current_period_start,
          end_date: currentPeriodEnd,
        },
        {
          items: [{ price: basicPriceId, quantity: 1 }],
          start_date: currentPeriodEnd,
        },
      ];
      await stripe.subscriptionSchedules.update(scheduleId, {
        phases: updatePhases,
      });
    } else {
      // Create new schedule from existing subscription first (without phases)
      // Then update it with the phases we want
      const newSchedule = await (stripe.subscriptionSchedules as any).create({
        from_subscription: subscriptionId,
      });
      
      // Now update the schedule with our custom phases
      // When updating, we need start_date in the first phase to anchor end dates
      const createPhases = [
        {
          items: [{ price: currentPriceId, quantity: 1 }],
          start_date: subscription.current_period_start,
          end_date: currentPeriodEnd,
        },
        {
          items: [{ price: basicPriceId, quantity: 1 }],
          start_date: currentPeriodEnd,
        },
      ];
      
      await stripe.subscriptionSchedules.update(newSchedule.id, {
        phases: createPhases,
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
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

export default router;
