"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Smartphone,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { apiService } from "../lib/api";

interface MFASetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [mfaData, setMfaData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetup = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiService.setupMFA();
      setMfaData(data);
      setStep("verify");
    } catch (error: any) {
      setError(error.message || "Failed to setup MFA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await apiService.verifyMFASetup(mfaCode);
      onComplete();
    } catch (error: any) {
      setError(error.message || "Invalid MFA code");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadBackupCodes = () => {
    if (!mfaData) return;

    const content = `MATUR.ai - Backup Codes\n\nSave these codes in a secure location. Each code can only be used once.\n\n${mfaData.backupCodes.join(
      "\n",
    )}\n\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "matur-ai-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (step === "setup") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Enable Two-Factor Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Add an extra layer of security to your account
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How it works:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Install an authenticator app on your phone</li>
              <li>• Scan the QR code to add your account</li>
              <li>• Enter the 6-digit code to complete setup</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSetup}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting up..." : "Start Setup"}
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Scan QR Code
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Use your authenticator app to scan this code
        </p>
      </div>

      <div className="space-y-6">
        {/* QR Code */}
        <div className="text-center">
          <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200 dark:border-gray-600">
            <img
              src={mfaData?.qrCodeUrl}
              alt="MFA QR Code"
              className="w-48 h-48"
            />
          </div>
        </div>

        {/* Secret Key */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Secret Key:
            </span>
            <button
              onClick={() => copyToClipboard(mfaData?.secret || "")}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
          <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
            {mfaData?.secret}
          </code>
        </div>

        {/* Verification Code Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter 6-digit code from your app:
          </label>
          <input
            type="text"
            value={mfaCode}
            onChange={(e) =>
              setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="123456"
            className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            maxLength={6}
          />
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {error}
            </span>
          </motion.div>
        )}

        {/* Backup Codes */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
              Backup Codes
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="flex items-center gap-1 text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors"
              >
                {showBackupCodes ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showBackupCodes ? "Hide" : "Show"}
              </button>
              <button
                onClick={downloadBackupCodes}
                className="flex items-center gap-1 text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          {showBackupCodes && (
            <div className="space-y-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Save these codes in a secure location. Each code can only be
                used once.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {mfaData?.backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="p-2 bg-white dark:bg-gray-800 rounded border font-mono text-sm text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleVerify}
            disabled={loading || mfaCode.length !== 6}
            className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Complete Setup"}
          </button>
          <button
            onClick={() => setStep("setup")}
            className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-300"
          >
            Back
          </button>
        </div>
      </div>
    </motion.div>
  );
};
