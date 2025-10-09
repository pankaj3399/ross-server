import { Router } from "express";
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

// Webhook handler
router.post(
  "/webhook",
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

          if (userId) {
            await pool.query(
              "UPDATE users SET subscription_status = 'premium' WHERE id = $1",
              [userId],
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

export default router;
