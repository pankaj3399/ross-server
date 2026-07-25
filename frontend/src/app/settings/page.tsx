"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  IconCreditCard,
  IconArrowRight,
  IconTrash,
  IconRotate,
  IconBell,
} from "@tabler/icons-react";
import { MFASetup } from "../../components/auth/MFASetup";
import { apiService, SubscriptionDetailsResponse, Project } from "../../lib/api";
import SubscriptionModal from "../../components/features/subscriptions/SubscriptionModal";
import { SimplePageSkeleton } from "../../components/Skeleton";
import { validatePassword } from "../../lib/passwordValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
    lastName: "",
    email: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [resendingVerification, setResendingVerification] = useState(false);

  // Subscription management state
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetailsResponse | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Deleted projects state
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [deletedError, setDeletedError] = useState<string | null>(null);
  const [restoringProjectIds, setRestoringProjectIds] = useState<Record<string, boolean>>({});

  // Notifications state
  const [notificationPrefs, setNotificationPrefs] = useState({
    weekly_digest: true,
    critical_alerts: true,
    vendor_reassessment: true,
    timezone: "UTC",
  });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState(false);

  const prefsUpdateInFlightRef = useRef<Promise<any>>(Promise.resolve());
  const lastUpdateSequenceRef = useRef<number>(0);

  const fetchNotificationPreferences = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        setPrefsLoading(true);
        setPrefsError(false);
      }
      const prefs = await apiService.getNotificationPreferences();
      if (isMountedRef.current) {
        if (
          prefs &&
          typeof prefs.weekly_digest === "boolean" &&
          typeof prefs.critical_alerts === "boolean" &&
          typeof prefs.vendor_reassessment === "boolean" &&
          typeof prefs.timezone === "string"
        ) {
          setNotificationPrefs({
            weekly_digest: prefs.weekly_digest,
            critical_alerts: prefs.critical_alerts,
            vendor_reassessment: prefs.vendor_reassessment,
            timezone: prefs.timezone,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
      if (isMountedRef.current) {
        setPrefsError(true);
      }
    } finally {
      if (isMountedRef.current) {
        setPrefsLoading(false);
      }
    }
  }, []);

  const handlePreferenceToggle = async (key: 'weekly_digest' | 'critical_alerts' | 'vendor_reassessment') => {
    const nextSeq = ++lastUpdateSequenceRef.current;
    const updatedValue = !notificationPrefs[key];
    setNotificationPrefs(prev => ({ ...prev, [key]: updatedValue }));

    prefsUpdateInFlightRef.current = prefsUpdateInFlightRef.current.then(async () => {
      try {
        await apiService.updateNotificationPreferences({ [key]: updatedValue });
        if (isMountedRef.current && nextSeq === lastUpdateSequenceRef.current) {
          showToast.success("Notification preferences updated.");
        }
      } catch (error) {
        console.error("Failed to update preference:", error);
        if (isMountedRef.current && nextSeq === lastUpdateSequenceRef.current) {
          showToast.error("Failed to save preference. Please try again.");
          fetchNotificationPreferences();
        }
      }
    });

    await prefsUpdateInFlightRef.current;
  };

  const handleTimezoneChange = async (tz: string) => {
    const nextSeq = ++lastUpdateSequenceRef.current;
    setNotificationPrefs(prev => ({ ...prev, timezone: tz }));

    prefsUpdateInFlightRef.current = prefsUpdateInFlightRef.current.then(async () => {
      try {
        await apiService.updateNotificationPreferences({ timezone: tz });
        if (isMountedRef.current && nextSeq === lastUpdateSequenceRef.current) {
          showToast.success("Timezone updated successfully.");
        }
      } catch (error) {
        console.error("Failed to update timezone:", error);
        if (isMountedRef.current && nextSeq === lastUpdateSequenceRef.current) {
          showToast.error("Failed to save timezone. Please try again.");
          fetchNotificationPreferences();
        }
      }
    });

    await prefsUpdateInFlightRef.current;
  };

  const fetchDeletedProjects = useCallback(async () => {
    try {
      setDeletedLoading(true);
      setDeletedError(null);
      const res = await apiService.getDeletedProjects();
      setDeletedProjects(res.projects || []);
    } catch (error: any) {
      console.error("Failed to fetch deleted projects:", error);
      setDeletedError(error?.message || "Failed to load deleted projects");
    } finally {
      setDeletedLoading(false);
    }
  }, []);

  const handleRestoreProject = async (projectId: string) => {
    if (restoringProjectIds[projectId]) return;
    try {
      setRestoringProjectIds((prev) => ({ ...prev, [projectId]: true }));
      await apiService.restoreProject(projectId);
      showToast.success("Project restored successfully!");
      setDeletedProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error("Failed to restore project:", error);
      showToast.error("Failed to restore project. Please try again.");
    } finally {
      setRestoringProjectIds((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
    }
  };

  const getDaysRemaining = (deletedAt?: string) => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const diffTime = expiryDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

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

  const initializedForEmailRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user) {
      initializedForEmailRef.current = null;
      return;
    }

    // Initialize profile form if user changed or not yet initialized
    if (initializedForEmailRef.current !== user.email) {
      let initialName = user.name || "";
      let initialLastName = user.lastName || "";

      // Handle legacy cases where last name is missing but name contains a space
      if (!initialLastName && initialName.trim().includes(" ")) {
        const parts = initialName.trim().split(/\s+/);
        if (parts.length > 1) {
          initialName = parts[0];
          initialLastName = parts.slice(1).join(" ");
        }
      }

      setProfileForm({
        name: initialName,
        lastName: initialLastName,
        email: user.email || "",
      });
      initializedForEmailRef.current = user.email || null;
    }
  }, [user]);

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
    // Fetch subscription details, deleted projects and notification preferences when user is available
    if (user && isAuthenticated) {
      fetchSubscriptionDetails();
      fetchDeletedProjects();
      fetchNotificationPreferences();
    }
  }, [user, isAuthenticated, fetchSubscriptionDetails, fetchDeletedProjects, fetchNotificationPreferences]);

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
        lastName: user.lastName || "",
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
      setProfileError("First name is required");
      return false;
    }
    if (trimmedName.length > 50) {
      setProfileError("First name must be less than 50 characters");
      return false;
    }
    if (/[0-9]/.test(trimmedName)) {
      setProfileError("First name should not contain numbers");
      return false;
    }

    const trimmedLastName = profileForm.lastName.trim();
    if (trimmedLastName && trimmedLastName.length > 50) {
      setProfileError("Last name must be less than 50 characters");
      return false;
    }
    if (trimmedLastName && /[0-9]/.test(trimmedLastName)) {
      setProfileError("Last name should not contain numbers");
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
    const trimmedLastName = profileForm.lastName.trim();
    const trimmedEmail = profileForm.email.trim().toLowerCase();

    // Normalize user values for comparison
    const normalizedUserName = user?.name?.trim() || "";
    const normalizedUserLastName = user?.lastName?.trim() || "";
    const normalizedUserEmail = user?.email?.trim().toLowerCase() || "";

    // Build update payload only with fields that differ
    const updateData: { name?: string; lastName?: string; email?: string } = {};

    // Update name (first name) and lastName independently
    if (trimmedName !== normalizedUserName) {
      updateData.name = trimmedName;
    }
    if (trimmedLastName !== normalizedUserLastName) {
      updateData.lastName = trimmedLastName;
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
      const response = await apiService.resendVerification(user?.email);
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
    <div className="bg-background min-h-screen relative">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">First Name</Label>
                      <div className="relative">
                        <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="profile-name"
                          name="name"
                          value={profileForm.name}
                          onChange={handleProfileInputChange}
                          placeholder="Enter your first name"
                          disabled={profileLoading}
                          maxLength={50}
                          pattern="^[^0-9]*$"
                          onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("First name should not contain numbers")}
                          onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-lastName">Last Name</Label>
                      <div className="relative">
                        <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="profile-lastName"
                          name="lastName"
                          value={profileForm.lastName}
                          onChange={handleProfileInputChange}
                          placeholder="Enter your last name"
                          disabled={profileLoading}
                          maxLength={50}
                          pattern="^[^0-9]*$"
                          onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Last name should not contain numbers")}
                          onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                          className="pl-10"
                        />
                      </div>
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
                      <IconAlertCircle className="w-5 h-5 shrink-0" />
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
                        FIRST NAME
                      </p>
                      <p className="text-base font-medium text-foreground">
                        {user?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        LAST NAME
                      </p>
                      <p className="text-base font-medium text-foreground">
                        {user?.lastName || "N/A"}
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
                        <IconAlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
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
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                              <IconKey className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPasswords.current ? "text" : "password"}
                                id="currentPassword"
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
                                aria-label={showPasswords.current ? "Hide current password" : "Show current password"}
                                aria-pressed={showPasswords.current}
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
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                              <IconKey className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPasswords.new ? "text" : "password"}
                                id="newPassword"
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
                                aria-label={showPasswords.new ? "Hide new password" : "Show new password"}
                                aria-pressed={showPasswords.new}
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
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                              <IconKey className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPasswords.confirm ? "text" : "password"}
                                id="confirmPassword"
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
                                aria-label={showPasswords.confirm ? "Hide confirm password" : "Show confirm password"}
                                aria-pressed={showPasswords.confirm}
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

          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <IconBell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Manage how and when you receive email updates.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {prefsLoading ? (
                <div className="space-y-4 py-4">
                  <div className="h-12 bg-muted rounded-lg animate-pulse" />
                  <div className="h-12 bg-muted rounded-lg animate-pulse" />
                  <div className="h-12 bg-muted rounded-lg animate-pulse" />
                </div>
              ) : prefsError ? (
                <div className="text-center py-6 border border-dashed rounded-xl bg-destructive/5 border-destructive/20">
                  <p className="text-sm text-destructive mb-3">
                    Failed to load notification preferences.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchNotificationPreferences}
                    className="gap-1.5"
                  >
                    <IconRefresh className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  {/* Weekly Digest */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weekly_digest" className="text-base font-semibold text-foreground">
                        Weekly Digest
                      </Label>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Receive a weekly summary of your project activity, readiness score changes, and quick wins every Monday morning.
                      </p>
                    </div>
                    <Switch
                      id="weekly_digest"
                      checked={notificationPrefs.weekly_digest}
                      onCheckedChange={() => handlePreferenceToggle("weekly_digest")}
                    />
                  </div>

                  <Separator />

                  {/* Critical Risk Alerts */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="critical_alerts" className="text-base font-semibold text-foreground">
                        Critical Risk Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Get immediate email alerts when risks reach Critical severity or pass their target dates. Max 3 alerts/day.
                      </p>
                    </div>
                    <Switch
                      id="critical_alerts"
                      checked={notificationPrefs.critical_alerts}
                      onCheckedChange={() => handlePreferenceToggle("critical_alerts")}
                    />
                  </div>

                  <Separator />

                  {/* Vendor Reassessment Reminders */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="vendor_reassessment" className="text-base font-semibold text-foreground">
                        Vendor Reassessment Reminders
                      </Label>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Receive reminders when a vendor risk assessment completed 12 months ago requires annual review.
                      </p>
                    </div>
                    <Switch
                      id="vendor_reassessment"
                      checked={notificationPrefs.vendor_reassessment}
                      onCheckedChange={() => handlePreferenceToggle("vendor_reassessment")}
                    />
                  </div>

                  <Separator />

                  {/* Timezone Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="timezone-selector" className="text-base font-semibold text-foreground">
                      Local Timezone
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Determine your Monday morning digest time based on your local timezone.
                    </p>
                    <div className="max-w-xs">
                      <select
                        id="timezone-selector"
                        value={notificationPrefs.timezone}
                        onChange={(e) => handleTimezoneChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="UTC">UTC (GMT+0)</option>
                        <option value="America/New_York">US Eastern Time (EST/EDT)</option>
                        <option value="America/Chicago">US Central Time (CST/CDT)</option>
                        <option value="America/Denver">US Mountain Time (MST/MDT)</option>
                        <option value="America/Los_Angeles">US Pacific Time (PST/PDT)</option>
                        <option value="Europe/London">London (GMT/BST)</option>
                        <option value="Europe/Paris">Paris (CET/CEST)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                        <option value="Asia/Kolkata">Kolkata (IST)</option>
                        <option value="Asia/Singapore">Singapore (SGT)</option>
                        <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Deleted Projects Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <IconTrash className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Deleted Projects</CardTitle>
                  <CardDescription>
                    Recover deleted projects within 30 days of deletion.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {deletedLoading ? (
                <div className="space-y-3">
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
              ) : deletedError ? (
                <div className="text-center py-6 border border-dashed rounded-xl bg-destructive/5 border-destructive/20">
                  <p className="text-sm text-destructive mb-3">
                    {deletedError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchDeletedProjects}
                    className="gap-1.5"
                  >
                    <IconRefresh className="w-4 h-4" />
                    Retry
                  </Button>
                </div>
              ) : deletedProjects.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-xl bg-muted/10">
                  <p className="text-sm text-muted-foreground">
                    No deleted projects. Projects you delete will be kept here for 30 days before permanent deletion.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {deletedProjects.map((project) => {
                    const daysRemaining = getDaysRemaining(project.deleted_at);
                    const isRestoring = !!restoringProjectIds[project.id];
                    return (
                      <div
                        key={project.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-4 min-w-0"
                      >
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <h4 className="font-semibold text-foreground truncate break-words">{project.name}</h4>
                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5 break-words">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap min-w-0">
                            <span className="text-xs text-muted-foreground shrink-0">
                              Deleted on {new Date(project.deleted_at!).toLocaleDateString()}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0",
                                daysRemaining <= 7
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              )}
                            >
                              {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreProject(project.id)}
                          disabled={isRestoring}
                          className="self-start sm:self-center gap-1.5"
                        >
                          {isRestoring ? (
                            <>
                              <IconRefresh className="w-4 h-4 animate-spin" />
                              Restoring...
                            </>
                          ) : (
                            <>
                              <IconRotate className="w-4 h-4" />
                              Restore
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Management Section */}
        <Card className="mt-12">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                <IconStar className="w-6 h-6 text-warning" />
              </div>
              <div>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>
                  Manage your billing cycle and subscription plan.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {subscriptionLoading ? (
              <div className="space-y-4">
                <div className="h-20 bg-muted rounded-lg animate-pulse" />
                <div className="h-12 bg-muted rounded-lg animate-pulse" />
              </div>
            ) : subscriptionError ? (
              <div className="text-center py-6">
                <IconAlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load subscription details</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSubscriptionDetails}
                  className="mt-3"
                >
                  <IconRefresh className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Plan Info */}
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        CURRENT PLAN
                      </p>
                      <p className="text-xl font-bold text-foreground capitalize mb-3">
                        {user?.subscription_status === 'basic_premium' ? 'BLOOM' :
                          user?.subscription_status === 'pro_premium' ? 'BLOOM PLUS' :
                            user?.subscription_status === 'trial' ? 'FREE TRIAL' :
                            'SEED'}
                      </p>
                      {subscriptionDetails?.plan && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Status</span>
                            <span className={cn(
                              "font-medium flex items-center gap-1",
                              subscriptionDetails.plan.status === 'active' ? 'text-success' :
                                subscriptionDetails.plan.status === 'trialing' ? 'text-primary' :
                                  'text-muted-foreground'
                            )}>
                              <span className="w-2 h-2 rounded-full bg-current"></span>
                              {subscriptionDetails.plan.status === 'active' ? 'Active' :
                                subscriptionDetails.plan.status === 'trialing' ? 'Trialing' :
                                  subscriptionDetails.plan.status}
                            </span>
                          </div>
                          {subscriptionDetails.plan.days_remaining !== null && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Days remaining</span>
                              <span className="font-medium text-foreground">
                                {subscriptionDetails.plan.days_remaining} days
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button asChild className="flex-1 h-14 text-base gap-3 group">
                    <Link href="/manage-subscription">
                      <IconCreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Manage Subscription</span>
                      <IconArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-14 text-base gap-3 group"
                    onClick={() => setShowSubscriptionModal(true)}
                  >
                    <span>Compare Plans</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentPlan={user?.subscription_status || "free"}
        onUpgrade={() => router.push("/manage-subscription")}
        onDowngrade={() => router.push("/manage-subscription")}
      />
    </div>
  );
}
