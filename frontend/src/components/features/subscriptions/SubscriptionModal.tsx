"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCrown,
  IconBuilding,
  IconShield,
  IconCircleCheck,
  IconLoader2,
  IconStar,
  IconAward,
  IconCircleLetterS,
  IconX
} from "@tabler/icons-react";
import { apiService } from "../../../lib/api";
import { showToast } from "../../../lib/toast";
import { FALLBACK_PRICES } from "../../../lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const BASIC_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_BASIC || "";
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_PRO || "";
const POST_CHECKOUT_RETURN_URL_KEY = "postCheckoutReturnUrl";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [prices, setPrices] = useState<{ basic: number | null; pro: number | null }>({
    basic: null,
    pro: null,
  });
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const saveReturnUrlForCheckout = () => {
    if (typeof window === "undefined") return;
    try {
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      localStorage.setItem(POST_CHECKOUT_RETURN_URL_KEY, currentUrl);
    } catch (error) {
      console.error("Failed to save return URL:", error);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchPrices = async () => {
      if (!BASIC_PRICE_ID || !PRO_PRICE_ID) {
        console.error("Price IDs not configured");
        setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
        return;
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      if (!token) {
        console.error("Auth token missing; cannot fetch subscription prices.");
        setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
        return;
      }

      setLoadingPrices(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/subscriptions/prices`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              priceIds: [BASIC_PRICE_ID, PRO_PRICE_ID],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setPrices({
            basic: data.prices[BASIC_PRICE_ID] ?? null,
            pro: data.prices[PRO_PRICE_ID] ?? null,
          });
        } else {
          console.error("Failed to fetch prices");
          setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
        setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, [isOpen]);

  const handleSelectPlan = async (priceId: string, planName: string) => {
    if (!priceId) {
      showToast.warning("Plan price configuration missing. Please contact support.");
      return;
    }
    try {
      setUpgradingPlan(planName);
      saveReturnUrlForCheckout();
      const { url } = await apiService.createCheckoutSession(priceId);
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      showToast.error("Failed to start upgrade process. Please try again.");
      setUpgradingPlan(null);
    }
  };

  const basicFeatures = [
    "Unlimited AI assessments",
    "Advanced reporting & analytics",
    "Priority email support",
    "PDF export capabilities",
    "Team collaboration tools",
    "Custom assessment templates",
    "Data backup & security",
  ];

  const proFeatures = [
    "Everything in Basic Premium",
    "Custom assessment templates",
    "Advanced API access",
    "White-label options",
    "Advanced analytics dashboard",
    "24/7 phone & chat support",
    "Dedicated account manager",
    "Custom integrations",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-y-auto max-h-[90vh] border-0 bg-transparent [&>button]:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-background rounded-3xl p-8 shadow-xl border border-border"
        >
          {/* Header */}
          <DialogHeader className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 flex justify-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full">
                <IconCrown className="w-8 h-8 text-primary" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DialogTitle className="text-4xl font-bold">
                Choose Your Premium Plan
              </DialogTitle>
            </motion.div>
          </DialogHeader>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Basic Premium Plan */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -4 }}
              className="relative group"
            >
              <Badge
                className="absolute -top-3 left-6 z-30 bg-secondary text-secondary-foreground border-0 uppercase tracking-wide"
              >
                Small Teams
              </Badge>

              <Card className="h-full border-border hover:border-primary/50 transition-all duration-300 rounded-2xl">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IconBuilding className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">Premium Basic</CardTitle>
                  <div className="mt-3">
                    {loadingPrices ? (
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-12 w-24" />
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold text-primary">
                          ${prices.basic || FALLBACK_PRICES.basic}
                        </span>
                        <span className="text-lg text-muted-foreground">/month</span>
                      </div>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    Everything you need to get started.
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="space-y-3">
                    {basicFeatures.map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <IconCircleCheck className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(BASIC_PRICE_ID, "basic")}
                    disabled={upgradingPlan === "basic" || loadingPrices}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {upgradingPlan === "basic" ? (
                      <>
                        <IconLoader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <IconStar className="w-4 h-4" />
                        Choose Basic Premium
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Pro Premium Plan */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ y: -4 }}
              className="relative group"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                className="absolute -top-3 right-6 z-30"
              >
                <Badge className="bg-primary text-primary-foreground border-0 font-bold tracking-wide">
                  ★ MOST POPULAR
                </Badge>
              </motion.div>

              <Card className="h-full border-border hover:border-primary/50 transition-all duration-300 rounded-2xl ring-1 ring-primary/10">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IconAward className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">Premium Pro</CardTitle>
                  <div className="mt-3">
                    {loadingPrices ? (
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-12 w-24" />
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold text-primary">
                          ${prices.pro || FALLBACK_PRICES.pro}
                        </span>
                        <span className="text-lg text-muted-foreground">/month</span>
                      </div>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    For growing organizations.
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="space-y-3">
                    {proFeatures.map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <IconCircleCheck className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(PRO_PRICE_ID, "pro")}
                    disabled={upgradingPlan === "pro" || loadingPrices}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {upgradingPlan === "pro" ? (
                      <>
                        <IconLoader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <IconAward className="w-5 h-5" />
                        Choose Pro Premium
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>

          {/* Close Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              Maybe later
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
