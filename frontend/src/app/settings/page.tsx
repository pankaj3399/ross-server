"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Settings,
  User,
  Key,
  Bell,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { MFASetup } from "../../components/MFASetup";
import { apiService } from "../../lib/api";

export default function SettingsPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    setLoading(false);
  }, [isAuthenticated, router]);

  const handleMFAToggle = async () => {
    if (user?.mfa_enabled) {
      // Disable MFA
      try {
        setMfaLoading(true);
        await apiService.disableMFA();
        await refreshUser();
      } catch (error) {
        console.error("Failed to disable MFA:", error);
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

    // Comprehensive password validation
    const password = passwordForm.newPassword;
    const errors: string[] = [];

    // Length validation
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (password.length > 128) {
      errors.push("Password must be no more than 128 characters long");
    }

    // Character type validation
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      errors.push("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)");
    }

    // User info check
    if (user?.email && password.toLowerCase().includes(user.email.split("@")[0].toLowerCase())) {
      errors.push("Password cannot contain your email username");
    }
    if (user?.name && password.toLowerCase().includes(user.name.toLowerCase())) {
      errors.push("Password cannot contain your name");
    }

    if (errors.length > 0) {
      setPasswordError(errors[0]); // Show first error
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
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailNotificationsToggle = () => {
    setEmailNotifications(!emailNotifications);
    // Here you could add API call to save the preference
    console.log("Email notifications:", !emailNotifications);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
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
    <div className="bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account settings and security preferences.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* User Profile Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Profile Information
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage your account details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Name
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {user?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Email
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {user?.email}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {user?.email_verified ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Unverified</span>
                    </div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={refreshUser}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Refresh verification status"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Security Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Protect your account with additional security measures
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* MFA Setting */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {user?.mfa_enabled
                        ? "Add an extra layer of security to your account"
                        : "Protect your account with a second verification step"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {user?.mfa_enabled ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Enabled</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm font-medium">Disabled</span>
                      </div>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMFAToggle}
                    disabled={mfaLoading}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      user?.mfa_enabled
                        ? "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
                        : "bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300"
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
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Key className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Password
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Change your account password
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleChangePasswordClick}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-lg font-medium transition-all duration-300"
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
                                  <span>At least one special character</span>
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

          {/* Notifications Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage your notification preferences
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Email Notifications
                    </p>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emailNotifications 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {emailNotifications ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Receive updates about your assessments
                  </p>
                </div>
                <motion.div 
                  className="relative inline-block w-12 h-6"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={emailNotifications}
                    onChange={handleEmailNotificationsToggle}
                  />
                  <div 
                    className={`w-12 h-6 rounded-full shadow-inner transition-colors duration-300 cursor-pointer ${
                      emailNotifications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    onClick={handleEmailNotificationsToggle}
                  ></div>
                  <motion.div 
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow cursor-pointer"
                    animate={{
                      x: emailNotifications ? 20 : 4
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                    onClick={handleEmailNotificationsToggle}
                  ></motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
