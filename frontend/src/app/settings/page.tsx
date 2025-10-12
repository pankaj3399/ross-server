"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { MFASetup } from "../../components/MFASetup";
import { apiService } from "../../lib/api";

export default function SettingsPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);

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
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
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
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-lg font-medium transition-all duration-300"
                >
                  Change
                </motion.button>
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
                  <p className="font-medium text-gray-900 dark:text-white">
                    Email Notifications
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Receive updates about your assessments
                  </p>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only" defaultChecked />
                  <div className="w-12 h-6 bg-purple-600 rounded-full shadow-inner"></div>
                  <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
