"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  validatePassword,
  getPasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthBgColor,
  PasswordRequirements,
} from "../lib/passwordValidation";

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
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password Strength
          </span>
          <span className={`text-sm font-medium ${strengthColor}`}>
            {strength}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${strengthBgColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${validation.score}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
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
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password Requirements:
          </h4>
          <ul className="space-y-1">
            {validation.errors.map((error, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
              >
                <div className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
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
          className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
        >
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              className="w-2.5 h-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          Password meets all requirements
        </motion.div>
      )}
    </div>
  );
};
