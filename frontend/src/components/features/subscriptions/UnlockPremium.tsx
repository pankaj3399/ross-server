"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IconCrown, IconStar, IconX, IconLoader2 } from "@tabler/icons-react";
import { apiService } from "../../../lib/api";
import { showToast } from "../../../lib/toast";
import { usePriceStore } from "../../../store/priceStore";
import { FALLBACK_PRICES } from "../../../lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const BASIC_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_BASIC || "";
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_PRO || "";
const POST_CHECKOUT_RETURN_URL_KEY = "postCheckoutReturnUrl";

interface UnlockPremiumProps {
  onClose?: () => void;
  featureName?: string;
  isOpen?: boolean;
}

export default function UnlockPremium({
  onClose,
  featureName = "this feature",
  isOpen = true
}: UnlockPremiumProps) {
  const { prices: storePrices, loading: storeLoading, fetched, setPrices, setPriceLoading, setFetched } = usePriceStore();
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const prices = storePrices;
  const loadingPrices = storeLoading;

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
    if (fetched) {
      return;
    }

    if (!BASIC_PRICE_ID || !PRO_PRICE_ID) {
      console.error('Price IDs not configured');
      setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
      setFetched(true);
      return;
    }

    const token = typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;

    if (!token) {
      console.error("Auth token missing; cannot fetch subscription prices.");
      setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
      setFetched(true);
      return;
    }

    const fetchPrices = async () => {
      setPriceLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/subscriptions/prices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceIds: [BASIC_PRICE_ID, PRO_PRICE_ID]
          })
        });

        if (response.ok) {
          const data = await response.json();
          setPrices({
            basic: data.prices[BASIC_PRICE_ID] || null,
            pro: data.prices[PRO_PRICE_ID] || null
          });
        } else {
          console.error('Failed to fetch prices');
          setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
        setPrices({ basic: FALLBACK_PRICES.basic, pro: FALLBACK_PRICES.pro });
      } finally {
        setPriceLoading(false);
        setFetched(true);
      }
    };

    fetchPrices();
  }, [fetched, setPrices, setPriceLoading, setFetched]);

  const handleSelectPlan = async (priceId: string, planName: string) => {
    try {
      setUpgradingPlan(planName);
      saveReturnUrlForCheckout();
      const { url } = await apiService.createCheckoutSession(priceId);
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      showToast.error("Failed to start upgrade process. Please try again.");
    } finally {
      setUpgradingPlan(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 bg-transparent [&>button]:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-background rounded-2xl p-8 shadow-2xl border border-border"
        >
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4"
            >
              <IconX className="h-4 w-4" />
            </Button>
          )}

          <DialogHeader className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mx-auto mb-4">
              <IconCrown className="w-8 h-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl">
              Unlock Premium to Access {featureName}
            </DialogTitle>
            <DialogDescription>
              Upgrade to premium to unlock this feature and many more advanced capabilities.
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Basic Premium Plan */}
            <motion.div whileHover={{ scale: 1.02 }} className="h-full">
              <Card className="h-full hover:border-primary transition-all">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">Basic Premium</CardTitle>
                  <div className="mt-2">
                    {loadingPrices ? (
                      <div className="flex items-baseline justify-center gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold">
                          ${prices.basic !== null ? prices.basic : FALLBACK_PRICES.basic}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <IconStar className="w-4 h-4 text-primary" />
                      Access to {featureName}
                    </li>
                    <li className="flex items-center gap-2">
                      <IconStar className="w-4 h-4 text-primary" />
                      Advanced analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <IconStar className="w-4 h-4 text-primary" />
                      Priority support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(BASIC_PRICE_ID, "Basic Premium")}
                    disabled={upgradingPlan !== null || loadingPrices || !BASIC_PRICE_ID}
                    className="w-full"
                  >
                    {upgradingPlan === "Basic Premium" ? (
                      <>
                        <IconLoader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : loadingPrices ? (
                      "Loading..."
                    ) : (
                      "Choose Basic"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Pro Premium Plan */}
            <motion.div whileHover={{ scale: 1.02 }} className="relative h-full">
              <Badge className="absolute -top-2 right-4 z-10">
                POPULAR
              </Badge>
              <Card className="h-full border-primary bg-accent hover:border-primary transition-all">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">Pro Premium</CardTitle>
                  <div className="mt-2">
                    {loadingPrices ? (
                      <div className="flex items-baseline justify-center gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold">
                          ${prices.pro !== null ? prices.pro : FALLBACK_PRICES.pro}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <IconStar className="w-4 h-4 text-primary" />
                      Everything in Basic
                    </li>
                    <li className="flex items-center gap-2">
                      <IconStar className="w-4 h-4 text-primary" />
                      Advanced AI features
                    </li>
                    <li className="flex items-center gap-2">
                      <IconStar className="w-4 h-4 text-primary" />
                      Unlimited projects
                    </li>
                    <li className="flex items-center gap-2">
                      <IconStar className="w-4 h-4 text-primary" />
                      API access
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(PRO_PRICE_ID, "Pro Premium")}
                    disabled={upgradingPlan !== null || loadingPrices || !PRO_PRICE_ID}
                    className="w-full"
                    variant="secondary"
                  >
                    {upgradingPlan === "Pro Premium" ? (
                      <>
                        <IconLoader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : loadingPrices ? (
                      "Loading..."
                    ) : (
                      "Choose Pro"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Cancel anytime. All plans include a 14-day money-back guarantee.
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
