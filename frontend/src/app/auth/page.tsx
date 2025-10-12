"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PasswordStrengthIndicator } from "../../components/PasswordStrengthIndicator";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, register, mfaRequired, setMfaRequired } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    organization: "",
    mfaCode: "",
    backupCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          organization: formData.organization,
        });
      }
      router.push("/dashboard");
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
          <p className="text-gray-300">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </motion.div>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              Or{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                create a new account
              </button>
            </>
          ) : (
            <>
              Or{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                sign in to existing account
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-effect py-8 px-4 sm:rounded-2xl sm:px-10"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required={!isLogin}
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="organization"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Organization (Optional)
                  </label>
                  <div className="mt-1">
                    <input
                      id="organization"
                      name="organization"
                      type="text"
                      value={formData.organization}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

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
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                    <h3 className="text-blue-300 font-semibold">
                      Two-Factor Authentication Required
                    </h3>
                  </div>
                  <p className="text-blue-200 text-sm">
                    Please enter your 6-digit authentication code or backup code
                    to continue.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="mfaCode"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Authentication Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="mfaCode"
                      name="mfaCode"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={formData.mfaCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-center text-2xl tracking-widest"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-gray-400">
                      Or
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="backupCode"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Backup Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="backupCode"
                      name="backupCode"
                      type="text"
                      placeholder="Enter backup code"
                      value={formData.backupCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Use a backup code if you don't have access to your
                    authenticator app
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none pulse-glow"
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                  ? "Sign in"
                  : "Create account"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-400">Or</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                Back to home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
