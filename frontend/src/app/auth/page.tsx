"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { showToast } from "../../lib/toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PasswordStrengthIndicator } from "../../components/auth/PasswordStrengthIndicator";
import { IconEye, IconEyeOff, IconLoader2, IconUser, IconBuilding, IconMail, IconLock, IconArrowRight, IconInfoCircle } from "@tabler/icons-react";
import { validatePassword, ALLOWED_SPECIAL_CHARS } from "../../lib/passwordValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const isLogin = searchParams.get("isLogin") === "true";
  const redirectTo = searchParams.get("redirect");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, register, mfaRequired, setMfaRequired } = useAuth();
  const [showRequirements, setShowRequirements] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    lastName: "",
    organization: "",
    mfaCode: "",
    backupCode: "",
  });

  const validateRedirect = (url: string | null): string => {
    if (!url) return "/dashboard";
    const isSafeRelative = url.startsWith("/") && !url.startsWith("//") && !url.includes("://");
    if (!isSafeRelative) return "/dashboard";
    const allowedPrefixes = ["/dashboard", "/profile", "/assess", "/invite"];
    const isWhitelisted = allowedPrefixes.some(prefix => url.startsWith(prefix));
    return isWhitelisted ? url : "/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await login(
          formData.email,
          formData.password,
          formData.mfaCode || undefined,
          formData.backupCode || undefined,
        );
        showToast.success("Login successful!");
        router.push(validateRedirect(redirectTo));
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        const passwordValidation = validatePassword(formData.password, { email: formData.email, name: formData.name });
        if (!passwordValidation.isValid) {
          setError(passwordValidation.errors.join(". "));
          setLoading(false);
          return;
        }

        const data = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          lastName: formData.lastName,
          organization: formData.organization,
        });

        showToast.success("Registration successful! Please check your email for verification.");
        try {
          sessionStorage.setItem('pendingVerificationEmail', formData.email);
        } catch (storageErr) {
          console.warn('Could not persist pending verification email:', storageErr);
        }
        router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err: any) {
      if (err.message === "MFA_REQUIRED") {
        setMfaRequired(true);
        setError("");
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-black p-[14px]">
      {/* Left Pane - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between py-4 px-6 sm:px-10 bg-white dark:bg-black overflow-y-auto">
        <div className="flex justify-between items-center w-full mb-4">
          <Link href="/" className="flex items-center">
            <span className="text-lg font-bold tracking-tight text-foreground">MATUR.ai</span>
          </Link>
          <Link href={isLogin ? "/auth?isLogin=false" : "/auth?isLogin=true"} className="text-sm font-semibold text-foreground hover:underline">
            {isLogin ? "Sign up" : "Sign in"}
          </Link>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-2">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <h2 className="text-3xl font-bold mb-1 tracking-tight text-foreground">
              {isLogin ? "Welcome Back" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Sign in to your account" : "Enter the details below"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-sm flex items-center gap-1.5 mb-1">
                        <IconUser className="h-4 w-4 text-muted-foreground" />
                        First Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required={!isLogin}
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="First Name"
                        maxLength={50}
                        pattern="^[^0-9]*$"
                        onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("First name should not contain numbers")}
                        onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                        className="h-[50px] text-sm input-auth"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-sm flex items-center gap-1.5 mb-1">
                        <IconUser className="h-4 w-4 text-muted-foreground" />
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last Name"
                        maxLength={50}
                        pattern="^[^0-9]*$"
                        onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Last name should not contain numbers")}
                        onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                        className="h-[50px] text-sm input-auth"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="organization" className="text-sm flex items-center gap-1.5 mb-1">
                      <IconBuilding className="h-4 w-4 text-muted-foreground" />
                      Organization (Optional)
                    </Label>
                    <Input
                      id="organization"
                      name="organization"
                      type="text"
                      value={formData.organization}
                      onChange={handleChange}
                      className="h-[50px] text-sm input-auth"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm flex items-center gap-1.5 mb-1">
                  <IconMail className="h-4 w-4 text-muted-foreground" />
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="h-[50px] text-sm input-auth"
                />
              </div>

              {isLogin ? (
                // Login Password Row (Includes Forgot password)
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="password" className="text-sm flex items-center gap-1.5">
                      <IconLock className="h-4 w-4 text-muted-foreground" />
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center"
                    >
                      {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="h-[50px] text-sm input-auth"
                  />
                  <div className="flex justify-end mt-1">
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm text-black dark:text-white hover:underline font-normal"
                      onClick={() => router.push("/auth/forgot-password")}
                    >
                      Forgot password?
                    </Button>
                  </div>
                </div>
              ) : (
                // Registration Password Row (Side-by-side Password and Confirm Password)
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="password" className="text-sm flex items-center gap-1.5">
                        <IconLock className="h-4 w-4 text-muted-foreground" />
                        Password
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
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setShowRequirements(true)}
                        onBlur={() => setTimeout(() => setShowRequirements(false), 200)}
                        className="h-[50px] text-sm input-auth"
                      />
                      <AnimatePresence>
                        {showRequirements && (() => {
                          const emailUsername = formData.email ? formData.email.split("@")[0].toLowerCase() : "";
                          const containsEmailUser = emailUsername && emailUsername.length >= 3 && formData.password.toLowerCase().includes(emailUsername);
                          return (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="absolute right-0 z-50 mt-1 w-[280px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xl text-xs space-y-2"
                            >
                              <h4 className="font-semibold text-foreground">Password requirements:</h4>
                              <ul className="space-y-1.5 text-muted-foreground">
                                <li className="flex items-center gap-1.5">
                                  <span className={formData.password.length >= 8 ? "text-green-500 font-semibold" : ""}>
                                    ✓ At least 8 characters
                                  </span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                  <span className={/[A-Z]/.test(formData.password) ? "text-green-500 font-semibold" : ""}>
                                    ✓ One uppercase letter (A-Z)
                                  </span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                  <span className={/[a-z]/.test(formData.password) ? "text-green-500 font-semibold" : ""}>
                                    ✓ One lowercase letter (a-z)
                                  </span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                  <span className={/[0-9]/.test(formData.password) ? "text-green-500 font-semibold" : ""}>
                                    ✓ One number (0-9)
                                  </span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                  <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(formData.password) ? "text-green-500 font-semibold" : ""}>
                                    ✓ One special character
                                  </span>
                                </li>
                                {emailUsername && emailUsername.length >= 3 && (
                                  <li className="flex items-center gap-1.5">
                                    <span className={containsEmailUser ? "text-destructive font-semibold" : "text-green-500 font-semibold"}>
                                      {containsEmailUser ? "✕ Cannot contain email username" : "✓ Cannot contain email username"}
                                    </span>
                                  </li>
                                )}
                              </ul>
                            </motion.div>
                          );
                        })()}
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
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="h-[50px] text-sm input-auth"
                    />
                  </div>
                </div>
              )}

              {!isLogin && (
                <PasswordStrengthIndicator
                  password={formData.password}
                  userInfo={{ email: formData.email, name: formData.name }}
                  showDetails={false} // Hide details to keep it extremely compact and avoid overflow
                />
              )}

              {isLogin && mfaRequired && (
                <div className="space-y-3">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <h3 className="text-primary text-xs font-semibold">
                        Two-Factor Authentication Required
                      </h3>
                    </div>
                    <p className="text-primary dark:text-primary/70 text-sm">
                      Please enter your 6-digit authentication code or backup code.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="mfaCode" className="text-sm">Authentication Code</Label>
                    <Input
                      id="mfaCode"
                      name="mfaCode"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={formData.mfaCode}
                      onChange={handleChange}
                      className="h-[50px] text-center text-xl tracking-widest input-auth"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white dark:bg-black text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="backupCode" className="text-sm">Backup Code</Label>
                    <Input
                      id="backupCode"
                      name="backupCode"
                      type="text"
                      placeholder="Enter backup code"
                      value={formData.backupCode}
                      onChange={handleChange}
                      className="h-[50px] text-sm input-auth"
                    />
                  </div>
                </div>
              )}

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
                    Please wait...
                  </>
                ) : isLogin ? (
                  <>
                    Sign in
                    <IconArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Create account
                    <IconArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground space-y-3">
              <div>
                {isLogin ? (
                  <>
                    New to MATUR.ai?{" "}
                    <Link href="/auth?isLogin=false" className="font-semibold text-foreground hover:underline">
                      Create an account
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link href="/auth?isLogin=true" className="font-semibold text-foreground hover:underline">
                      Sign in
                    </Link>
                  </>
                )}
              </div>
              <div>
                <Link href="/" className="hover:text-foreground text-xs text-muted-foreground hover:underline">
                  Back to home
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Footer Row */}
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
