"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { showToast } from "../../lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Settings,
  User,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  CreditCard,
  ArrowRight,
  Star,
} from "lucide-react";
import { MFASetup } from "../../components/MFASetup";
import { apiService, SubscriptionDetailsResponse } from "../../lib/api";
import { SimplePageSkeleton } from "../../components/Skeleton";
import Link from "next/link";
import { validatePassword, ALLOWED_SPECIAL_CHARS } from "../../lib/passwordValidation";

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

  const handleEmailNotificationsToggle = () => {
    setEmailNotifications(!emailNotifications);
    // Here you could add API call to save the preference
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


  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
        <MFASetup
          onComplete={handleMFASetupComplete}
          onCancel={handleMFASetupCancel}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen relative">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Account Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Profile Information
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Update your personal details and how others see you.
                  </p>
                </div>
              </div>
              {!isEditingProfile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEditProfileClick}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-300 rounded-lg font-medium transition-all duration-300"
                >
                  Edit
                </motion.button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="profile-name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none"
                    placeholder="Enter your name"
                    disabled={profileLoading}
                    maxLength={100}
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="profile-email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none"
                    placeholder="Enter your email"
                    disabled={profileLoading}
                  />
                  {user?.email_verified && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Note: Changing your email will require verification
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {profileError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{profileError}</span>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profileLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleProfileCancel}
                    disabled={profileLoading}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      FULL NAME
                    </p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {user?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      EMAIL ADDRESS
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {user?.email || "N/A"}
                      </p>
                      {user?.email_verified ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          UNVERIFIED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!user?.email_verified && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                          Email verification required
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                          Please verify your email address to access all features. Check your inbox for the verification code.
                        </p>
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleVerifyEmailClick}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Verify Email
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleResendVerification}
                            disabled={resendingVerification}
                            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resendingVerification ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 border-2 border-amber-700 dark:border-amber-300 border-t-transparent rounded-full animate-spin" />
                                <span>Sending...</span>
                              </div>
                            ) : (
                              "Resend Code"
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Security Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Enhance your account security with these tools.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* MFA Setting */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Protect your account with a second verification step.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {user?.mfa_enabled ? "Enabled" : "Disabled"}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMFAToggle}
                    disabled={mfaLoading}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${user?.mfa_enabled
                      ? "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
                      : "bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-300"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {mfaLoading
                      ? "Loading..."
                      : user?.mfa_enabled
                        ? "Disable"
                        : "Enable"}
                  </motion.button>
                </div>
              </div>

              {/* Password Setting */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Password
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {formatRelativeTime(user?.updated_at) || "Manage your password."}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleChangePasswordClick}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg font-medium transition-all duration-300"
                  >
                    {showChangePassword ? "Cancel" : "Change"}
                  </motion.button>
                </div>

                {/* Change Password Form */}
                <AnimatePresence>
                  {showChangePassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {passwordSuccess ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center py-6"
                        >
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            Password Changed Successfully!
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300">
                            Your password has been updated successfully.
                          </p>
                        </motion.div>
                      ) : (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                          {/* Current Password */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Current Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.current ? "text" : "password"}
                                name="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordInputChange}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none hover:outline-none focus:outline-none"
                                placeholder="Enter your current password"
                                disabled={passwordLoading}
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility("current")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                {showPasswords.current ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* New Password */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.new ? "text" : "password"}
                                name="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordInputChange}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none hover:outline-none focus:outline-none"
                                placeholder="Enter your new password"
                                disabled={passwordLoading}
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility("new")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                {showPasswords.new ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Confirm Password */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.confirm ? "text" : "password"}
                                name="confirmPassword"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordInputChange}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none hover:outline-none focus:outline-none"
                                placeholder="Confirm your new password"
                                disabled={passwordLoading}
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility("confirm")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                {showPasswords.confirm ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Error Message */}
                          {passwordError && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                            >
                              <AlertCircle className="w-5 h-5 flex-shrink-0" />
                              <span className="text-sm">{passwordError}</span>
                            </motion.div>
                          )}

                          {/* Password Requirements */}
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                            <p className="font-medium">Password Requirements:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <span>At least 8 characters long</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <span>Maximum 128 characters</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <span>At least one uppercase letter (A-Z)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <span>At least one lowercase letter (a-z)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <span>At least one number (0-9)</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <span>At least one special character ({ALLOWED_SPECIAL_CHARS})</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <span>Cannot contain your name</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <span>Cannot contain your email username</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={passwordLoading}
                              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {passwordLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Changing Password...</span>
                                </div>
                              ) : (
                                "Change Password"
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Subscription Management Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Subscription
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Manage your billing cycle and subscription plan.
                </p>
              </div>
            </div>

            {subscriptionLoading ? (
              <div className="space-y-4">
                <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
            ) : subscriptionError ? (
              <div className="space-y-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-200">
                        Failed to load subscription details
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Please try refreshing the page or contact support if the issue persists.
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSubscriptionError(false);
                        fetchSubscriptionDetails();
                      }}
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Retry loading subscription details"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Plan Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        CURRENT PLAN
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white capitalize mb-3">
                        {user?.subscription_status === 'basic_premium' ? 'Basic Premium' :
                          user?.subscription_status === 'pro_premium' ? 'Pro Premium' :
                            'Free Plan'}
                      </p>
                      {subscriptionDetails?.plan && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Status</span>
                            <span className={`font-medium flex items-center gap-1 ${subscriptionDetails.plan.status === 'active' ? 'text-green-600 dark:text-green-400' :
                                subscriptionDetails.plan.status === 'trialing' ? 'text-blue-600 dark:text-blue-400' :
                                  'text-gray-600 dark:text-gray-300'
                              }`}>
                              <span className="w-2 h-2 rounded-full bg-current"></span>
                              {subscriptionDetails.plan.status === 'active' ? 'Active' :
                                subscriptionDetails.plan.status === 'trialing' ? 'Trialing' :
                                  subscriptionDetails.plan.status}
                            </span>
                          </div>
                          {subscriptionDetails.plan.days_remaining !== null && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600 dark:text-gray-300">Days Remaining</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {subscriptionDetails.plan.days_remaining} days
                              </span>
                            </div>
                          )}
                          {subscriptionDetails.plan.cancel_at_period_end && subscriptionDetails.plan.cancel_effective_date && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600 dark:text-gray-300">Cancellation Date</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatDate(subscriptionDetails.plan.cancel_effective_date)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={fetchSubscriptionDetails}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      title="Refresh subscription details"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Manage Subscription Button */}
                <Link
                  href="/manage-subscription"
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 hover:from-purple-700 hover:via-violet-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
                >
                  <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Manage Subscription</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
