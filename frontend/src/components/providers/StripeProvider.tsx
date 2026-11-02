"use client";

import React, { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

let stripePromiseCache: Promise<Stripe | null> | null = null;

function getStripePromise(): Promise<Stripe | null> | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromiseCache) {
    stripePromiseCache = loadStripe(key).catch((err) => {
      console.warn("Stripe.js failed to initialize (network or ad-blocker):", err?.message || err);
      return null;
    });
  }
  return stripePromiseCache;
}

export default function StripeProvider({ children }: { children: React.ReactNode }) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    const promise = getStripePromise();
    if (promise) {
      setStripePromise(promise);
    }
  }, []);

  if (!stripePromise) {
    return <>{children}</>;
  }

  return <Elements stripe={stripePromise}>{children}</Elements>;
}
