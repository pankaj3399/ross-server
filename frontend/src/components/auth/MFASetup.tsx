"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  IconShield,
  IconDeviceMobile,
  IconDownload,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
  IconLoader2,
} from "@tabler/icons-react";
import { apiService } from "../../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
      >
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconShield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              Enable Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">
                How it works:
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Install an authenticator app on your phone</li>
                <li>• Scan the QR code to add your account</li>
                <li>• Enter the 6-digit code to complete setup</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSetup}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Start Setup"
                )}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconDeviceMobile className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Scan QR Code</CardTitle>
          <CardDescription>
            Use your authenticator app to scan this code
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="text-center">
            <div className="inline-block p-4 bg-card rounded-lg border-2 border-border">
              <img
                src={mfaData?.qrCodeUrl}
                alt="MFA QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>

          {/* Secret Key */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label>Secret Key:</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(mfaData?.secret || "")}
                className="text-primary hover:text-primary/80"
              >
                <IconCopy className="w-4 h-4" />
                Copy
              </Button>
            </div>
            <code className="text-sm font-mono break-all text-muted-foreground">
              {mfaData?.secret}
            </code>
          </div>

          {/* Verification Code Input */}
          <div className="space-y-2">
            <Label>Enter 6-digit code from your app:</Label>
            <Input
              type="text"
              value={mfaCode}
              onChange={(e) =>
                setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              className="text-center text-2xl font-mono tracking-widest h-14"
              maxLength={6}
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <IconAlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm text-destructive">
                {error}
              </span>
            </motion.div>
          )}

          {/* Backup Codes */}
          <div className="bg-secondary p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">
                Backup Codes
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showBackupCodes ? (
                    <IconEyeOff className="w-4 h-4" />
                  ) : (
                    <IconEye className="w-4 h-4" />
                  )}
                  {showBackupCodes ? "Hide" : "Show"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadBackupCodes}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <IconDownload className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>

            {showBackupCodes && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Save these codes in a secure location. Each code can only be
                  used once.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {mfaData?.backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="p-2 bg-background rounded border font-mono text-sm text-center text-muted-foreground"
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
            <Button
              onClick={handleVerify}
              disabled={loading || mfaCode.length !== 6}
              className="flex-1"
            >
              {loading ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
            <Button variant="outline" onClick={() => setStep("setup")}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
