import { Router } from "express";
import Stripe from "stripe";
import express from "express";
import { z } from "zod";
import stripe from "../config/stripe";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";

const router = Router();

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

    // Cancel existing Basic subscription if it exists
    const userResult = await pool.query(
      "SELECT stripe_subscription_id FROM users WHERE id = $1",
      [userId]
    );
    const existingSubscriptionId = userResult.rows[0]?.stripe_subscription_id;
    if (existingSubscriptionId) {
      await stripe.subscriptions.cancel(existingSubscriptionId);
    }

    const proPriceId = process.env.STRIPE_PRICE_ID_PRO;
    if (!proPriceId) {
      return res.status(500).json({ error: "Pro price ID not configured" });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: proPriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?canceled=true`,
      metadata: { userId },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating upgrade checkout session:", error);
    res.status(500).json({ error: "Failed to create upgrade session" });
  }
});

// Downgrade to Basic - Update existing subscription
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

    // Retrieve current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentItemId = subscription.items.data[0]?.id;

    if (!currentItemId) {
      return res.status(400).json({ error: "Invalid subscription structure" });
    }

    // Update subscription to Basic price with no proration
    await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: currentItemId,
        price: basicPriceId,
      }],
      proration_behavior: "none",
      billing_cycle_anchor: "unchanged",
    });

    res.json({ message: "Subscription downgraded to Basic" });
  } catch (error) {
    console.error("Error downgrading subscription:", error);
    res.status(500).json({ error: "Failed to downgrade subscription" });
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
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ message: "Subscription will be canceled at period end" });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

export default router;
