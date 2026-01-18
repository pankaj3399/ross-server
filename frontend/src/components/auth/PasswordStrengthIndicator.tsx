"use client";

import React from "react";
import { motion } from "framer-motion";
import { IconCircleCheck } from "@tabler/icons-react";
import {
  validatePassword,
  getPasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthBgColor,
  PasswordRequirements,
} from "../../lib/passwordValidation";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthIndicatorProps {
  password: string;
  userInfo?: { email?: string; name?: string };
  requirements?: PasswordRequirements;
  showDetails?: boolean;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<
  PasswordStrengthIndicatorProps
> = ({
  password,
  userInfo,
  requirements,
  showDetails = true,
  className = "",
}) => {
    const validation = validatePassword(password, userInfo, requirements);
    const strength = getPasswordStrength(validation.score);
    const strengthColor = getPasswordStrengthColor(validation.score);
    const strengthBgColor = getPasswordStrengthBgColor(validation.score);

    if (!password) {
      return null;
    }

    return (
      <div className={`space-y-3 ${className}`}>
        {/* Strength Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Password Strength
            </span>
            <span className={`text-sm font-medium ${strengthColor}`}>
              {strength}
            </span>
          </div>

          <div className="relative">
            <Progress
              value={validation.score}
              className="h-2"
            />
            {/* Colored overlay */}
            <div
              className={`absolute inset-0 h-2 rounded-full transition-all duration-300 ${strengthBgColor}`}
              style={{ width: `${validation.score}%` }}
            />
          </div>
        </div>

        {/* Requirements List */}
        {showDetails && validation.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            <h4 className="text-sm font-medium text-muted-foreground">
              Password Requirements:
            </h4>
            <ul className="space-y-1">
              {validation.errors.map((error, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 text-sm text-destructive"
                >
                  <div className="w-1 h-1 bg-destructive rounded-full flex-shrink-0" />
                  {error}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Success Message */}
        {validation.isValid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-sm text-primary"
          >
            <IconCircleCheck className="w-4 h-4" />
            Password meets all requirements
          </motion.div>
        )}
      </div>
    );
  };
