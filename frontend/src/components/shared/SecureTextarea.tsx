"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { sanitizeNoteInput } from "../../lib/sanitize";

interface SecureTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSave: (value: string) => Promise<void>;
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
        const valueToSave = trimmedValue || value;
        if (trimmedValue !== value) {
          onChange(trimmedValue);
        }
        onSave(valueToSave).catch((error) => {
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
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            bg-transparent
            ${isValid
              ? "border-input bg-background text-foreground"
              : "border-destructive bg-destructive/10 text-destructive"
            }
            ${isOverLimit ? "border-destructive" : ""}
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
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </motion.div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {validationMessage && (
            <span className="text-destructive text-xs">{validationMessage}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs ${isOverLimit
              ? "text-destructive"
              : isNearLimit
                ? "text-muted-foreground font-bold"
                : "text-muted-foreground"
              }`}
          >
            {characterCount}/{maxLength}
          </span>
        </div>
      </div>

      {/* Security notice */}
      <div className="text-xs text-muted-foreground bg-muted p-2 rounded-lg">
        <strong>Security:</strong> Your notes are automatically sanitized to
        prevent malicious content. HTML tags and scripts are not allowed.
      </div>
    </div>
  );
};
