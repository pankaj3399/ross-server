"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { IconCircleCheck, IconCircleX, IconLoader2 } from "@tabler/icons-react";
import { Skeleton } from "@/components/Skeleton";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";


export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async (token: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been successfully verified!");
        } else {
          setStatus("error");
          setMessage(data.error || "Invalid or expired verification token.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification.");
      }
    };

    const token = searchParams.get("token");
    if (token) verifyEmail(token);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Email Verification</span>
          </h2>
          <p className="text-muted-foreground">
            Verifying your email address
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-lg shadow-xl border-white/20 dark:border-gray-700/50">
            <CardContent className="py-8 px-4 sm:px-10">
              <div className="text-center">
                {status === "loading" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    <Skeleton variant="circular" width="4rem" height="4rem" className="mx-auto mb-4" />
                    <Skeleton height="1.25rem" width="200px" className="mx-auto" />
                  </motion.div>
                )}

                {status === "success" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    <IconCircleCheck className="w-16 h-16 text-green-500 mx-auto" />
                    <p className="mt-4 text-green-600 dark:text-green-400 font-medium">
                      {message}
                    </p>
                  </motion.div>
                )}

                {status === "error" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    <IconCircleX className="w-16 h-16 text-red-500 mx-auto" />
                    <p className="mt-4 text-red-600 dark:text-red-400 font-medium">
                      {message}
                    </p>
                  </motion.div>
                )}

                <div className="mt-8 space-y-4">
                  {status === "success" && (
                    <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 h-12">
                      <Link href="/auth?isLogin=true">
                        Sign In to Your Account
                      </Link>
                    </Button>
                  )}

                  {status === "error" && (
                    <div className="space-y-3">
                      <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 h-12">
                        <Link href="/auth">
                          Try Again
                        </Link>
                      </Button>
                      <Button asChild variant="secondary" className="w-full h-12">
                        <Link href="/">
                          Back to Home
                        </Link>
                      </Button>
                    </div>
                  )}

                  {status === "loading" && (
                    <p className="text-sm text-muted-foreground">
                      Please wait while we verify your email...
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
