"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { showToast } from "../../lib/toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PasswordStrengthIndicator } from "../../components/auth/PasswordStrengthIndicator";
import { IconEye, IconEyeOff, IconLoader2, IconUser, IconBuilding, IconMail, IconLock } from "@tabler/icons-react";
import { ALLOWED_SPECIAL_CHARS } from "../../lib/passwordValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AuthPage() {
  const isLogin = useSearchParams().get("isLogin") === "true";
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, register, mfaRequired, setMfaRequired } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    organization: "",
    mfaCode: "",
    backupCode: "",
  });

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
        router.push("/dashboard")
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        const data = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          organization: formData.organization,
        });

        showToast.success("Registration successful! Please check your email for verification.");
        router.push(`/auth/verify-otp?email=${formData.email}`);
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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold mb-2">
            <span className="gradient-text">
              {isLogin ? "Welcome Back" : "Get Started"}
            </span>
          </h2>
          <p className="text-muted-foreground">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </motion.div>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {isLogin ? (
            <>
              Or{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-primary dark:text-primary"
                onClick={() => router.push("/auth?isLogin=false")}
              >
                create a new account
              </Button>
            </>
          ) : (
            <>
              Or{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-primary dark:text-primary"
                onClick={() => router.push("/auth?isLogin=true")}
              >
                sign in to existing account
              </Button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="glass-effect border-0">
            <CardContent className="pt-6">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required={!isLogin}
                          value={formData.name}
                          onChange={handleChange}
                          className="h-12 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization (Optional)</Label>
                      <div className="relative">
                        <IconBuilding className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="organization"
                          name="organization"
                          type="text"
                          value={formData.organization}
                          onChange={handleChange}
                          className="h-12 pl-10"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="h-12 pl-10 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault()
                        setShowPassword(prev => !prev)
                      }}
                    >
                      {showPassword ? <IconEyeOff className="h-4 w-4 text-muted-foreground" /> : <IconEye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="h-12 pl-10 pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault()
                          setShowConfirmPassword(prev => !prev)
                        }}
                      >
                        {showConfirmPassword ? <IconEyeOff className="h-4 w-4 text-muted-foreground" /> : <IconEye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Password Requirements - Only show during registration */}
                {!isLogin && (
                  <PasswordStrengthIndicator
                    password={formData.password}
                    userInfo={{ email: formData.email, name: formData.name }}
                    showDetails={true}
                  />
                )}

                {/* MFA Input - Only show during login when MFA is required */}
                {isLogin && mfaRequired && (
                  <div className="space-y-4">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">!</span>
                        </div>
                        <h3 className="text-primary font-semibold">
                          Two-Factor Authentication Required
                        </h3>
                      </div>
                      <p className="text-primary dark:text-primary/70 text-sm">
                        Please enter your 6-digit authentication code or backup code
                        to continue.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mfaCode">Authentication Code</Label>
                      <Input
                        id="mfaCode"
                        name="mfaCode"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={formData.mfaCode}
                        onChange={handleChange}
                        className="h-12 text-center text-2xl tracking-widest"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the 6-digit code from your authenticator app
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-card text-muted-foreground">
                          Or
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backupCode">Backup Code</Label>
                      <Input
                        id="backupCode"
                        name="backupCode"
                        type="text"
                        placeholder="Enter backup code"
                        value={formData.backupCode}
                        onChange={handleChange}
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use a backup code if you don't have access to your
                        authenticator app
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-destructive text-sm text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-primary/80 font-semibold"
                >
                  {loading ? (
                    <>
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : isLogin ? (
                    "Sign in"
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Button variant="link" asChild className="text-primary">
                    <Link href="/">Back to home</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
