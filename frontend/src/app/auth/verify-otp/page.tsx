"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconShield,
  IconCircleCheck,
  IconCircleX,
  IconArrowLeft,
  IconRefresh,
  IconClock,
  IconLoader2,
  IconArrowRight
} from "@tabler/icons-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { Skeleton } from "@/components/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function VerifyOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const { refreshUser } = useAuth();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email from the URL query (preferred) or sessionStorage as fallback.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const match = window.location.search.match(/[?&]email=([^&]*)/);
    const queryEmail = match ? decodeURIComponent(match[1]) : null;
    let storedEmail: string | null = null;
    try {
      storedEmail = sessionStorage.getItem('pendingVerificationEmail');
    } catch {
      storedEmail = null;
    }
    setEmail(queryEmail || storedEmail || "");
  }, []);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = Array(6).fill("").map((_, i) => pastedData[i] || "");
    setOtp(newOtp);
    setError("");

    // Focus the last filled input or the first empty one
    const lastFilledIndex = newOtp.findIndex(digit => digit === "");
    const focusIndex = lastFilledIndex === -1 ? 5 : lastFilledIndex;
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if all fields are filled
    if (pastedData.length === 6) {
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join("");
    if (code.length !== 6) {
      setError("Please enter a complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: code
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear sessionStorage after successful verification
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingVerificationEmail');
        }

        // Store the token and refresh user context
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
          await refreshUser();
        }

        setSuccess(true);
        showToast.success("Email verified successfully!");

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(data.error || "Invalid or expired OTP code");
        showToast.error(data.error || "Invalid or expired OTP code");
        // Clear the OTP inputs on error
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError("An error occurred during verification. Please try again.");
      showToast.error("An error occurred during verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendCooldown(30); // 30 seconds cooldown
        setError(""); // Clear any previous errors
        showToast.success("OTP sent successfully! Please check your email.");
      } else {
        setError(data.error || "Failed to resend OTP. Please try again.");
        showToast.error(data.error || "Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
      showToast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
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
            <div className="h-[3px] flex-1 bg-black dark:bg-white rounded-full" />
            <div className="h-[3px] flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          </div>

          {/* Back link */}
          <div className="mb-2 sm:mb-3">
            <Link href="/auth" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground font-medium">
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
              Check your inbox
            </h2>
            <p className="text-sm text-muted-foreground">
              We sent a 6 digit code to <span className="font-semibold text-foreground">{email}</span>.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <IconCircleCheck className="w-12 h-12 text-success mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-success mb-1">
                    Verification Successful!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your account has been verified. Redirecting to dashboard...
                  </p>
                  <div className="flex justify-center">
                    <Skeleton variant="circular" width="1.25rem" height="1.25rem" className="mx-auto" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="flex justify-start gap-2.5">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          aria-label={`Digit ${index + 1} of 6`}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          disabled={loading}
                          className="w-[52px] h-[64px] text-center text-2xl font-medium rounded-[12px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground transition-all duration-200 focus:outline-none focus:border-black dark:focus:border-white focus:ring-0 shadow-none"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center space-x-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5"
                      >
                        <IconCircleX className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-3">
                    <Button
                      onClick={() => handleVerifyOTP()}
                      disabled={loading || otp.some(digit => digit === "")}
                      className="btn-auth-submit"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <IconLoader2 className="animate-spin h-4 w-4" />
                          Verifying...
                        </span>
                      ) : (
                        <>
                          Verify code
                          <IconArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>

                    {/* Resend OTP */}
                    <div className="text-center text-sm text-muted-foreground pt-2">
                      {isResending ? (
                        "Sending code..."
                      ) : resendCooldown > 0 ? (
                        <span>
                          Didn't get it? <span className="font-semibold text-foreground">Resend in {resendCooldown}s</span>
                        </span>
                      ) : (
                        <span>
                          Didn't get it?{" "}
                          <Button
                            type="button"
                            variant="link"
                            onClick={handleResendOTP}
                            className="p-0 h-auto font-semibold text-foreground hover:underline inline"
                          >
                            Resend code
                          </Button>
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

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
