"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { showToast } from "../../lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconShield,
  IconDeviceMobile,
  IconCircleCheck,
  IconAlertCircle,
  IconSettings,
  IconUser,
  IconKey,
  IconRefresh,
  IconEye,
  IconEyeOff,
  IconStar,
  IconMail,
} from "@tabler/icons-react";
import { MFASetup } from "../../components/auth/MFASetup";
import { apiService, SubscriptionDetailsResponse } from "../../lib/api";
import { SimplePageSkeleton } from "../../components/Skeleton";
import { validatePassword } from "../../lib/passwordValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [resendingVerification, setResendingVerification] = useState(false);

  // Subscription management state
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetailsResponse | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    if (!isAuthenticated) {
      return;
    }
    setLoading(false);
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    // Initialize profile form with user data only if form is empty/unmodified
    if (user && (!profileForm.name && !profileForm.email)) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm.name, profileForm.email]);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchSubscriptionDetails = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        setSubscriptionLoading(true);
        setSubscriptionError(false);
      }
      const details = await apiService.getSubscriptionDetails();
      if (isMountedRef.current) {
        setSubscriptionDetails(details);
      }
    } catch (error) {
      console.error("Failed to fetch subscription details:", error);
      showToast.error("Failed to load subscription details");
      if (isMountedRef.current) {
        setSubscriptionError(true);
      }
    } finally {
      if (isMountedRef.current) {
        setSubscriptionLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Fetch subscription details when user is available
    if (user && isAuthenticated) {
      fetchSubscriptionDetails();
    }
  }, [user, isAuthenticated, fetchSubscriptionDetails]);

  const handleMFAToggle = async () => {
    if (user?.mfa_enabled) {
      // Disable MFA
      try {
        setMfaLoading(true);
        await apiService.disableMFA();
        await refreshUser();
        showToast.success("MFA disabled successfully!");
      } catch (error) {
        console.error("Failed to disable MFA:", error);
        showToast.error("Failed to disable MFA. Please try again.");
      } finally {
        setMfaLoading(false);
      }
    } else {
      // Enable MFA - show setup
      setShowMFASetup(true);
    }
  };

  const handleMFASetupComplete = async () => {
    await refreshUser();
    setShowMFASetup(false);
  };

  const handleMFASetupCancel = () => {
    setShowMFASetup(false);
    showToast.info("MFA setup cancelled");
  };

  const handleChangePasswordClick = () => {
    setShowChangePassword(!showChangePassword);
    if (showChangePassword) {
      // Reset form when closing
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordError("");
      setPasswordSuccess(false);
    }
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (passwordError) setPasswordError("");
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validatePasswordForm = () => {
    if (!passwordForm.currentPassword) {
      setPasswordError("Current password is required");
      return false;
    }
    if (!passwordForm.newPassword) {
      setPasswordError("New password is required");
      return false;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return false;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("New password must be different from current password");
      return false;
    }

    // Comprehensive password validation using shared validation function
    const passwordValidation = validatePassword(
      passwordForm.newPassword,
      user ? { email: user.email, name: user.name } : undefined
    );

    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.errors[0]); // Show first error
      return false;
    }

    return true;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    setPasswordLoading(true);
    setPasswordError("");

    try {
      await apiService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      setPasswordSuccess(true);
      showToast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        setPasswordSuccess(false);
        setShowChangePassword(false);
      }, 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
      showToast.error(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEditProfileClick = () => {
    setIsEditingProfile(true);
    setProfileError("");
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
    setProfileError("");
    // Reset to original values
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
      });
    }
  };

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (profileError) setProfileError("");
  };

  const validateProfileForm = () => {
    const trimmedName = profileForm.name.trim();
    const trimmedEmail = profileForm.email.trim();

    if (!trimmedName || trimmedName.length === 0) {
      setProfileError("Name is required");
      return false;
    }
    if (trimmedName.length > 100) {
      setProfileError("Name must be less than 100 characters");
      return false;
    }
    if (!trimmedEmail || trimmedEmail.length === 0) {
      setProfileError("Email is required");
      return false;
    }
    // Stricter email validation using RFC 5322-like pattern
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(trimmedEmail)) {
      setProfileError("Invalid email format");
      return false;
    }
    return true;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) return;

    // Trim values upfront for comparison and payload
    const trimmedName = profileForm.name.trim();
    const trimmedEmail = profileForm.email.trim().toLowerCase();

    // Normalize user values for comparison
    const normalizedUserName = user?.name?.trim() || "";
    const normalizedUserEmail = user?.email?.trim().toLowerCase() || "";

    // Check if anything changed using normalized values
    if (trimmedName === normalizedUserName && trimmedEmail === normalizedUserEmail) {
      setProfileError("No changes to save");
      return;
    }

    // Build update payload only with fields that differ
    const updateData: { name?: string; email?: string } = {};
    if (trimmedName !== normalizedUserName) {
      updateData.name = trimmedName;
    }
    if (trimmedEmail !== normalizedUserEmail) {
      updateData.email = trimmedEmail;
    }

    // Check if update payload is empty after building
    if (Object.keys(updateData).length === 0) {
      setProfileError("No changes to save");
      return;
    }

    setProfileLoading(true);
    setProfileError("");

    try {
      const response = await apiService.updateProfile(updateData);

      await refreshUser();
      setIsEditingProfile(false);
      showToast.success(
        response.emailVerificationSent
          ? "Profile updated successfully! Please verify your new email address."
          : "Profile updated successfully!"
      );
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
      showToast.error(err.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      const response = await apiService.resendVerification();
      if (response.alreadySent) {
        showToast.info(response.message || "Verification email already sent. Please check your email.");
      } else if (response.emailSent) {
        showToast.success("Verification email sent! Please check your inbox.");
      } else {
        showToast.error("Failed to send verification email. Please try again.");
      }
    } catch (err: any) {
      showToast.error(err.message || "Failed to resend verification email");
    } finally {
      setResendingVerification(false);
    }
  };

  const handleVerifyEmailClick = () => {
    if (user?.email) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingVerificationEmail', user.email);
      }
      router.push('/auth/verify-otp');
    }
  };


  const formatRelativeTime = (dateString: string | null | undefined): string | null => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    let diffInSeconds = Math.floor(diffInMs / 1000);

    // Use Intl.RelativeTimeFormat for accurate relative time formatting
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const prefix = "Profile last updated ";

    // Handle negative diffInSeconds (future timestamps/clock skew) by clamping to zero
    if (diffInSeconds < 0) {
      return `${prefix}just now`;
    }

    // Handle "just now" case separately
    if (diffInSeconds < 60) {
      return `${prefix}just now`;
    }

    // Calculate time differences
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    const yearsDiff = now.getFullYear() - date.getFullYear();

    // Determine the best unit and value
    let value: number;
    let unit: Intl.RelativeTimeFormatUnit;

    if (diffInMinutes < 60) {
      value = diffInMinutes;
      unit = 'minute';
    } else if (diffInHours < 24) {
      value = diffInHours;
      unit = 'hour';
    } else if (monthsDiff < 12 && monthsDiff > 0) {
      value = monthsDiff;
      unit = 'month';
    } else if (diffInDays < 365) {
      value = diffInDays;
      unit = 'day';
    } else {
      value = yearsDiff;
      unit = 'year';
    }

    // Return unified format with prefix
    return `${prefix}${rtf.format(-value, unit)}`;
  };

  if (loading) {
    return <SimplePageSkeleton />;
  }

  if (showMFASetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <MFASetup
          onComplete={handleMFASetupComplete}
          onCancel={handleMFASetupCancel}
        />
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-2">
            <IconSettings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Account Settings
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage your account preferences, security settings, and subscriptions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* User Profile Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <IconUser className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal details and how others see you.
                    </CardDescription>
                  </div>
                </div>
                {!isEditingProfile && (
                  <Button variant="outline" onClick={handleEditProfileClick}>
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {isEditingProfile ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Name</Label>
                    <div className="relative">
                      <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="profile-name"
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileInputChange}
                        placeholder="Enter your name"
                        disabled={profileLoading}
                        maxLength={100}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <div className="relative">
                      <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        id="profile-email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileInputChange}
                        placeholder="Enter your email"
                        disabled={profileLoading}
                        className="pl-10"
                      />
                    </div>
                    {user?.email_verified && (
                      <p className="text-xs text-muted-foreground">
                        Note: Changing your email will require verification
                      </p>
                    )}
                  </div>

                  {/* Error Message */}
                  {profileError && (
                    <div className="flex items-center space-x-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                      <IconAlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{profileError}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button type="submit" disabled={profileLoading} className="flex-1">
                      {profileLoading ? (
                        <>
                          <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleProfileCancel}
                      disabled={profileLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        FULL NAME
                      </p>
                      <p className="text-base font-medium text-foreground">
                        {user?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        EMAIL ADDRESS
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-medium text-foreground">
                          {user?.email || "N/A"}
                        </p>
                        {user?.email_verified ? (
                          <Badge variant="secondary" className="bg-success/15 text-success hover:bg-success/25">
                            VERIFIED
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-warning/15 text-warning-foreground hover:bg-warning/25">
                            UNVERIFIED
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {!user?.email_verified && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <IconAlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-warning-foreground mb-1">
                            Email verification required
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Please verify your email address to access all features. Check your inbox for the verification code.
                          </p>
                          <div className="flex items-center space-x-2">
                            <Button onClick={handleVerifyEmailClick} size="sm" className="bg-warning hover:bg-warning/90 text-warning-foreground">
                              Verify Email
                            </Button>
                            <Button
                              onClick={handleResendVerification}
                              disabled={resendingVerification}
                              variant="outline"
                              size="sm"
                            >
                              {resendingVerification ? (
                                <>
                                  <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                "Resend Code"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <IconShield className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Enhance your account security with these tools.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* MFA Setting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <IconDeviceMobile className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Protect your account with a second verification step.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={user?.mfa_enabled ? "default" : "secondary"}>
                    {user?.mfa_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    variant={user?.mfa_enabled ? "destructive" : "default"}
                    onClick={handleMFAToggle}
                    disabled={mfaLoading}
                    size="sm"
                  >
                    {mfaLoading ? (
                      "Loading..."
                    ) : user?.mfa_enabled ? (
                      "Disable"
                    ) : (
                      "Enable"
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Password Setting */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <IconKey className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Password
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(user?.updated_at) || "Manage your password."}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleChangePasswordClick}
                    size="sm"
                  >
                    {showChangePassword ? "Cancel" : "Change"}
                  </Button>
                </div>

                {/* Change Password Form */}
                <AnimatePresence>
                  {showChangePassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-6"
                    >
                      {passwordSuccess ? (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                            <IconCircleCheck className="w-6 h-6 text-success" />
                          </div>
                          <h4 className="text-lg font-semibold text-foreground mb-1">
                            Password Changed Successfully!
                          </h4>
                          <p className="text-muted-foreground">
                            Your password has been updated successfully.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md mx-auto border rounded-xl p-6 bg-muted/20">
                          {/* Current Password */}
                          <div className="space-y-2">
                            <Label>Current Password</Label>
                            <div className="relative">
                              <IconKey className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPasswords.current ? "text" : "password"}
                                name="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordInputChange}
                                placeholder="Enter your current password"
                                disabled={passwordLoading}
                                className="pl-10 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePasswordVisibility("current")}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                              >
                                {showPasswords.current ? (
                                  <IconEyeOff className="w-4 h-4" />
                                ) : (
                                  <IconEye className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* New Password */}
                          <div className="space-y-2">
                            <Label>New Password</Label>
                            <div className="relative">
                              <IconKey className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPasswords.new ? "text" : "password"}
                                name="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordInputChange}
                                placeholder="Enter new password"
                                disabled={passwordLoading}
                                className="pl-10 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePasswordVisibility("new")}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                              >
                                {showPasswords.new ? (
                                  <IconEyeOff className="w-4 h-4" />
                                ) : (
                                  <IconEye className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Confirm Password */}
                          <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <div className="relative">
                              <IconKey className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPasswords.confirm ? "text" : "password"}
                                name="confirmPassword"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordInputChange}
                                placeholder="Confirm new password"
                                disabled={passwordLoading}
                                className="pl-10 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePasswordVisibility("confirm")}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                              >
                                {showPasswords.confirm ? (
                                  <IconEyeOff className="w-4 h-4" />
                                ) : (
                                  <IconEye className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Error */}
                          {passwordError && (
                            <div className="text-destructive text-sm flex items-center gap-2">
                              <IconAlertCircle className="w-4 h-4" />
                              {passwordError}
                            </div>
                          )}

                          {/* Submit Button */}
                          <div className="pt-2">
                            <Button
                              type="submit"
                              disabled={passwordLoading}
                              className="w-full"
                            >
                              {passwordLoading ? (
                                <>
                                  <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                                  Updating Password...
                                </>
                              ) : (
                                "Update Password"
                              )}
                            </Button>
                          </div>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
