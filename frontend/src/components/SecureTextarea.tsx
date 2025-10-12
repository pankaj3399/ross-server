"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, AlertTriangle, CheckCircle } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Validate input on change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;

      try {
        // Sanitize the input
        const sanitizedValue = sanitizeNoteInput(newValue);

        // Check if sanitization changed the input (indicates dangerous content)
        if (sanitizedValue !== newValue) {
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

  // Auto-save functionality
  const handleSave = useCallback(async () => {
    if (!isValid || disabled) return;

    setIsSaving(true);
    try {
      await onSave();
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsSaving(false);
    }
  }, [isValid, disabled, onSave]);

  // Debounced auto-save
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (value.trim() && isValid) {
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [value, isValid, handleSave]);

  // Manual save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

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
          {isSaving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 text-purple-600 dark:text-purple-400"
            >
              <Save className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </motion.div>
          )}

          {lastSaved && !isSaving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 text-green-600 dark:text-green-400"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {validationMessage && (
            <span className="text-red-500 text-xs">{validationMessage}</span>
          )}

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
