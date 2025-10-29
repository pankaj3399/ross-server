"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ArrowLeft,
  RefreshCw,
  Clock
} from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { showToast } from "@/lib/toast";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const email = searchParams.get("email") || "";

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
        setResendCooldown(60); // 60 seconds cooldown
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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-slate-950 dark:via-purple-950 dark:to-violet-950">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-blue-500/5 rounded-full blur-2xl floating-animation" style={{ animationDelay: '4s' }}></div>
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
              className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg pulse-glow"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          
          <h2 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Verify Your Identity</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Enter the 6-digit code sent to
          </p>
          <p className="text-purple-600 dark:text-purple-400 font-semibold">
            {email}
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-effect py-8 px-4 sm:rounded-2xl sm:px-10"
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
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                  Verification Successful!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your account has been verified. Redirecting to dashboard...
                </p>
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                    Enter verification code
                  </label>
                  
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
                          focus:outline-none focus:ring-4 focus:ring-purple-500/30
                          ${digit 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                            : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white'
                          }
                          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-400'}
                        `}
                        style={{
                          boxShadow: digit 
                            ? '0 0 20px rgba(139, 92, 246, 0.3)' 
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
                      className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                    >
                      <XCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <button
                    onClick={() => handleVerifyOTP()}
                    disabled={loading || otp.some(digit => digit === "")}
                    className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none pulse-glow disabled:pulse-glow-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </button>

                  {/* Resend OTP */}
                  <div className="text-center">
                    <button
                      onClick={handleResendOTP}
                      disabled={resendCooldown > 0 || isResending}
                      className="flex items-center justify-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : resendCooldown > 0 ? (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>Resend in {resendCooldown}s</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Resend Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-white/10">
            <div className="flex justify-between items-center">
              <Link
                href="/auth"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </Link>
              
              <Link
                href="/"
                className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Didn't receive the code? Check your spam folder or{" "}
            <button
              onClick={handleResendOTP}
              disabled={resendCooldown > 0}
              className="text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50"
            >
              request a new one
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
