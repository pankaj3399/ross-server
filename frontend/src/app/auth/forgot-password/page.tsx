"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IconMail, IconLoader2, IconArrowLeft, IconCircleCheck, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { apiService } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiService.forgotPassword(email);
      setSubmitted(true);
      showToast.success("If an account exists, a reset link has been sent.");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen flex w-full bg-white dark:bg-black p-2 sm:p-3.5 overflow-hidden">
      {/* Left Pane - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between py-2 sm:py-3 px-4 sm:px-8 lg:px-10 bg-white dark:bg-black overflow-y-auto">
        <div className="flex justify-between items-center w-full mb-2 sm:mb-3">
          <Link href="/" className="flex items-center">
            <span className="text-lg font-bold tracking-tight text-foreground">MATUR.ai</span>
          </Link>
          <Link href="/auth?isLogin=true" className="text-sm font-semibold text-foreground hover:underline">
            Sign in
          </Link>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-1 sm:py-2">
          {/* Progress Bar */}
          <div className="flex gap-2 w-full mb-4 sm:mb-5">
            <div className="h-[3px] flex-1 bg-black dark:bg-white rounded-full" />
            <div className={`h-[3px] flex-1 rounded-full ${submitted ? "bg-black dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800"}`} />
            <div className="h-[3px] flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          </div>

          {submitted ? (
            <>
              {/* Back link */}
              <div className="mb-2 sm:mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                  className="p-0 h-auto inline-flex items-center text-sm text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                >
                  <IconArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-4"
              >
                <h2 className="text-2xl sm:text-3xl font-bold mb-0.5 tracking-tight text-foreground">
                  Check your inbox
                </h2>
                <p className="text-sm text-muted-foreground">
                  We sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-4 pt-2"
              >
                <Button
                  variant="outline"
                  className="h-10 text-sm border-zinc-200 dark:border-zinc-800 rounded-[10px] px-4 font-medium"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                >
                  Try a different email
                </Button>
              </motion.div>
            </>
          ) : (
            <>
              {/* Back link */}
              <div className="mb-2 sm:mb-3">
                <Link href="/auth?isLogin=true" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground font-medium">
                  <IconArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-2 sm:mb-3"
              >
                <h2 className="text-2xl sm:text-3xl font-bold mb-0.5 tracking-tight text-foreground">
                  Reset your password
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email and we'll send you a password reset link.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm flex items-center gap-1.5 mb-0.5">
                    <IconMail className="h-4 w-4 text-muted-foreground" />
                    Email address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="h-[42px] text-sm px-4 input-auth"
                  />
                </div>

                {error && (
                  <div className="text-destructive text-sm text-center bg-destructive/10 border border-destructive/20 rounded-lg p-2">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-auth-submit"
                >
                  {loading ? (
                    <>
                      <IconLoader2 className="h-4 w-4 animate-spin mr-1" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send reset link
                      <IconArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

              </form>
            </motion.div>
          </>
        )}
        </div>

        {/* Bottom Footer Row */}
        <div className="flex justify-between items-center w-full text-xs text-muted-foreground mt-2 sm:mt-3">
          <span>&copy; {new Date().getFullYear()} MATUR.ai</span>
          <div className="flex gap-3">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right Pane - Image */}
      <div className="hidden lg:block lg:w-[55%] relative h-full">
        <div className="w-full h-full rounded-[12px] overflow-hidden shadow-lg relative bg-auth-visual-bg flex items-center justify-center">
          <img
            src="/auth_bg_light.png"
            alt="Auth visual"
            className="w-full h-full object-contain dark:hidden"
          />
          <img
            src="/auth_bg_dark.png"
            alt="Auth visual"
            className="w-full h-full object-contain hidden dark:block"
          />
        </div>
      </div>
    </div>
  );
}
