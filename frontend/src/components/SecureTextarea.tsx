"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { sanitizeNoteInput } from "../lib/sanitize";

interface SecureTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  value,
  onChange,
  onSave,
  placeholder = "Add your notes here...",
  maxLength = 5000,
  disabled = false,
  className = "",
}) => {
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Validate input on change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;

      try {
        // Sanitize the input but preserve whitespace during typing
        const sanitizedValue = sanitizeNoteInput(newValue, true);

        // Check if sanitization changed the input (indicates dangerous content)
        // Compare without considering whitespace differences for validation
        const originalTrimmed = newValue.trim();
        const sanitizedTrimmed = sanitizedValue.trim();
        if (sanitizedTrimmed !== originalTrimmed) {
          setIsValid(false);
          setValidationMessage("Invalid characters detected and removed");
        } else {
          setIsValid(true);
          setValidationMessage("");
        }

        onChange(sanitizedValue);
      } catch (error) {
        setIsValid(false);
        setValidationMessage(
          "Invalid input: Contains potentially dangerous content",
        );
        return;
      }
    },
    [onChange],
  );

  // Manual save on Ctrl+S (optional, for user convenience)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!isValid || disabled) return;
        // Trim whitespace before saving
        const trimmedValue = value.trim();
        if (trimmedValue !== value) {
          onChange(trimmedValue);
        }
        onSave().catch((error) => {
          console.error("Failed to save note:", error);
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isValid, disabled, onSave, value, onChange]);

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={`
            w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              isValid
                ? "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                : "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100"
            }
            ${isOverLimit ? "border-red-500" : ""}
          `}
          rows={4}
        />

        {/* Validation indicator */}
        {!isValid && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 right-2"
          >
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </motion.div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {validationMessage && (
            <span className="text-red-500 text-xs">{validationMessage}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs ${
              isOverLimit
                ? "text-red-500"
                : isNearLimit
                ? "text-yellow-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {characterCount}/{maxLength}
          </span>
        </div>
      </div>

      {/* Security notice */}
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
        <strong>Security:</strong> Your notes are automatically sanitized to
        prevent malicious content. HTML tags and scripts are not allowed.
      </div>
    </div>
  );
};
