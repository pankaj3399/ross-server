"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconShield,
  IconCircleCheck,
  IconCircleX,
  IconArrowLeft,
  IconRefresh,
  IconClock
} from "@tabler/icons-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { Skeleton } from "@/components/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const { refreshUser } = useAuth();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email from sessionStorage or fallback to query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = sessionStorage.getItem('pendingVerificationEmail');
      const queryEmail = searchParams.get("email");
      const emailValue = storedEmail || queryEmail || "";
      setEmail(emailValue);
    }
  }, [searchParams]);

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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-primary/5 rounded-full blur-2xl floating-animation" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center shadow-lg pulse-glow"
            >
              <IconShield className="w-10 h-10 text-primary-foreground" />
            </motion.div>
          </div>

          <h2 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Verify Your Identity</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Enter the 6-digit code sent to
          </p>
          <p className="text-primary font-semibold">
            {email}
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="glass-effect border-0">
            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center"
                  >
                    <IconCircleCheck className="w-16 h-16 text-success mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-success mb-2">
                      Verification Successful!
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Your account has been verified. Redirecting to dashboard...
                    </p>
                    <div className="flex justify-center">
                      <Skeleton variant="circular" width="1.5rem" height="1.5rem" />
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
                    {/* OTP Input Fields */}
                    <div className="space-y-4">
                      <Label className="text-center block">
                        Enter verification code
                      </Label>

                      <div className="flex justify-center space-x-3">
                        {otp.map((digit, index) => (
                          <motion.input
                            key={index}
                            ref={(el) => {
                              inputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            disabled={loading}
                            className={`
                              w-12 h-12 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-300
                              focus:outline-none focus:ring-4 focus:ring-primary/30
                              ${digit
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background text-foreground'
                              }
                              ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/60'}
                            `}
                            style={{
                              boxShadow: digit
                                ? '0 0 20px hsl(var(--primary) / 0.3)'
                                : 'none'
                            }}
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
                          className="flex items-center space-x-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3"
                        >
                          <IconCircleX className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm font-medium">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      <Button
                        onClick={() => handleVerifyOTP()}
                        isLoading={loading}
                        disabled={otp.some(digit => digit === "")}
                        className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold"
                      >
                        {loading ? "Verifying..." : "Verify Code"}
                      </Button>

                      {/* Resend OTP */}
                      <div className="text-center">
                        <Button
                          variant="ghost"
                          onClick={handleResendOTP}
                          isLoading={isResending}
                          disabled={resendCooldown > 0}
                          className="text-primary"
                        >
                          {isResending ? (
                            "Sending..."
                          ) : resendCooldown > 0 ? (
                            <>
                              <IconClock className="w-4 h-4" />
                              Resend in {resendCooldown}s
                            </>
                          ) : (
                            <>
                              <IconRefresh className="w-4 h-4" />
                              Resend Code
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="mt-8 pt-6">
                <Separator className="mb-6" />
                <div className="flex justify-between items-center">
                  <Button variant="ghost" asChild className="p-0">
                    <Link href="/auth">
                      <span className="inline-flex items-center space-x-2">
                        <IconArrowLeft className="w-4 h-4" />
                        <span>Back to Login</span>
                      </span>
                    </Link>
                  </Button>

                  <Button variant="ghost" asChild className="p-0">
                    <Link href="/">Home</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Didn't receive the code? Check your spam folder or{" "}
            <Button
              variant="link"
              onClick={handleResendOTP}
              disabled={resendCooldown > 0}
              className="p-0 h-auto text-primary"
            >
              request a new one
            </Button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
