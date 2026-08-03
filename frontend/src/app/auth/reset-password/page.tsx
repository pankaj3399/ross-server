"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconLock,
  IconLoader2,
  IconCircleCheck,
  IconCircleX,
  IconEye,
  IconEyeOff,
  IconArrowLeft,
  IconArrowRight,
  IconInfoCircle,
} from "@tabler/icons-react";
import Link from "next/link";
import { apiService } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { validatePassword } from "@/lib/passwordValidation";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const noToken = !token;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.errors.join(". "));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiService.resetPassword(token, password);
      setSuccess(true);
      showToast.success("Password reset successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-black p-[14px]">
      {/* Left Pane - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between py-4 px-6 sm:px-10 bg-white dark:bg-black overflow-y-auto">
        <div className="flex justify-between items-center w-full mb-4">
          <Link href="/" className="flex items-center">
            <span className="text-lg font-bold tracking-tight text-foreground">MATUR.ai</span>
          </Link>
          <Link href="/auth?isLogin=true" className="text-sm font-semibold text-foreground hover:underline">
            Sign in
          </Link>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-2">
          {/* Progress Bar */}
          <div className="flex gap-2 w-full mb-6">
            <div className="h-[3px] flex-1 bg-black dark:bg-white rounded-full" />
            <div className="h-[3px] flex-1 bg-black dark:bg-white rounded-full" />
          </div>

          {/* Back link */}
          <div className="mb-4">
            <Link href="/auth?isLogin=true" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground font-medium">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <h2 className="text-3xl font-bold mb-1 tracking-tight text-foreground">
              {success ? "Password Reset" : "Reset your password"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {success
                ? "Your password has been updated"
                : "Create a strong new password for your account"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {noToken ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <IconCircleX className="h-6 w-6 text-destructive" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-md font-semibold">Invalid Reset Link</h3>
                  <p className="text-sm text-muted-foreground">
                    This password reset link is invalid or has expired. Please request a new one.
                  </p>
                </div>
                <Button
                  className="w-full h-10 bg-primary hover:bg-primary/80 text-sm font-semibold"
                  onClick={() => router.push("/auth/forgot-password")}
                >
                  Request New Reset Link
                </Button>
              </div>
            ) : success ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconCircleCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-md font-semibold">Password Updated!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your password has been reset successfully. You can now sign in with your new password.
                  </p>
                </div>
                <button
                  className="btn-auth-submit"
                  onClick={() => router.push("/auth?isLogin=true")}
                >
                  Sign In
                  <IconArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="password" className="text-sm flex items-center gap-1.5">
                        <IconLock className="h-4 w-4 text-muted-foreground" />
                        New Password
                      </Label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRequirements(prev => !prev)}
                          className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center"
                          title="Password requirements"
                        >
                          <IconInfoCircle className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center"
                        >
                          {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setShowRequirements(true)}
                        onBlur={() => setTimeout(() => setShowRequirements(false), 200)}
                        placeholder="New password"
                        className="h-[50px] text-sm px-4 input-auth"
                      />
                      <AnimatePresence>
                        {showRequirements && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute right-0 z-50 mt-1 w-[280px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xl text-xs space-y-2"
                          >
                            <h4 className="font-semibold text-foreground">Password requirements:</h4>
                            <ul className="space-y-1.5 text-muted-foreground">
                              <li className="flex items-center gap-1.5">
                                <span className={password.length >= 8 ? "text-green-500 font-semibold" : ""}>
                                  ✓ At least 8 characters
                                </span>
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className={/[A-Z]/.test(password) ? "text-green-500 font-semibold" : ""}>
                                  ✓ One uppercase letter (A-Z)
                                </span>
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className={/[a-z]/.test(password) ? "text-green-500 font-semibold" : ""}>
                                  ✓ One lowercase letter (a-z)
                                </span>
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className={/[0-9]/.test(password) ? "text-green-500 font-semibold" : ""}>
                                  ✓ One number (0-9)
                                </span>
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) ? "text-green-500 font-semibold" : ""}>
                                  ✓ One special character
                                </span>
                              </li>
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="confirmPassword" className="text-sm flex items-center gap-1.5">
                        <IconLock className="h-4 w-4 text-muted-foreground" />
                        Confirm Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center"
                      >
                        {showConfirmPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="h-[50px] text-sm px-4 input-auth"
                    />
                  </div>
                </div>

                <PasswordStrengthIndicator
                  password={password}
                  userInfo={{}}
                  showDetails={false}
                />

                {error && (
                  <div className="text-destructive text-sm text-center bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-auth-submit"
                >
                  {loading ? (
                    <>
                      <IconLoader2 className="h-4 w-4 animate-spin mr-1" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <IconArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>

              </form>
            )}
          </motion.div>
        </div>

        <div className="flex justify-between items-center w-full text-xs text-muted-foreground mt-4">
          <span>&copy; {new Date().getFullYear()} MATUR.ai</span>
          <div className="flex gap-3">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right Pane - Image */}
      <div className="hidden lg:block lg:w-[55%] relative">
        <div className="w-full h-full rounded-[12px] overflow-hidden shadow-lg relative">
          <img
            src="/auth_bg_light.png"
            alt="Auth visual"
            className="absolute inset-0 w-full h-full object-cover dark:hidden"
          />
          <img
            src="/auth_bg_dark.jpg"
            alt="Auth visual"
            className="absolute inset-0 w-full h-full object-cover hidden dark:block"
          />
        </div>
      </div>
    </div>
  );
}
