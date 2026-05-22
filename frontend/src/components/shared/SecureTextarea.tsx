"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Mic } from "lucide-react";
import { sanitizeNoteInput } from "../../lib/sanitize";
import { useSpeechToText } from "../../hooks/useSpeechToText";

interface SecureTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  disableAutoSaveOnBlur?: boolean;
  onBeforeSave?: () => boolean | Promise<boolean>;
}

export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  value,
  onChange,
  onSave,
  placeholder = "Add your notes here...",
  maxLength = 5000,
  disabled = false,
  readOnly = false,
  className = "",
  disableAutoSaveOnBlur = false,
  onBeforeSave,
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

  // Speech-to-text: SecureTextarea has onChange(string), so we
  // can call it directly — no native setter trick needed.
  // Uses refs to always read the latest value/onChange without
  // recreating the callback (which would thrash the hook).
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const handleTranscript = useCallback((text: string) => {
    if (disabled || readOnly) return;

    const currentVal = valueRef.current;
    const space = currentVal.length > 0 && !currentVal.endsWith(' ') ? ' ' : '';
    
    const max = maxLength ?? Infinity;
    const availableChars = max - currentVal.length - space.length;
    
    if (availableChars <= 0) return;
    
    const truncatedText = text.slice(0, availableChars);
    if (!truncatedText) return;

    const newVal = currentVal + space + truncatedText;

    try {
      const sanitizedValue = sanitizeNoteInput(newVal, true);
      const originalTrimmed = newVal.trim();
      const sanitizedTrimmed = sanitizedValue.trim();
      if (sanitizedTrimmed !== originalTrimmed) {
        setIsValid(false);
        setValidationMessage("Invalid characters detected and removed");
      } else {
        setIsValid(true);
        setValidationMessage("");
      }
      onChangeRef.current(sanitizedValue);
    } catch (error) {
      setIsValid(false);
      setValidationMessage("Invalid input: Contains potentially dangerous content");
    }
  }, [disabled, readOnly, maxLength]);

  const { isListening, isSupported, toggleListening } = useSpeechToText(handleTranscript);

  // Manual save on Ctrl+S (optional, for user convenience)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        if (readOnly) return;
        e.preventDefault();
        if (!isValid || disabled) return;

        // Trim whitespace before saving
        const trimmedValue = value.trim();
        if (trimmedValue !== value) {
          onChange(trimmedValue);
        }
        
        onSave(trimmedValue).catch((error) => {
          console.error("Failed to save note:", error);
        });
      }
    };

    const target = textareaRef.current;
    if (target) {
      target.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (target) {
        target.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [isValid, disabled, readOnly, onSave, value, onChange]);

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
          onBlur={async () => {
            if (readOnly || disabled || !isValid || disableAutoSaveOnBlur) return;
            
            // Optional pre-save validation/check
            if (onBeforeSave) {
              const shouldProceed = await Promise.resolve(onBeforeSave());
              if (!shouldProceed) return;
            }

            // Trim whitespace for the final save
            const trimmedValue = value.trim();
            
            // Sync local state if trimmed to ensure UI matches saved value
            if (trimmedValue !== value) {
              onChange(trimmedValue);
            }

            onSave(trimmedValue).catch((error) => {
              console.error("Failed to auto-save note on blur:", error);
            });
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          className={`
            w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            read-only:opacity-80 read-only:cursor-default
            bg-transparent
            ${isValid
              ? "border-input bg-background text-foreground"
              : "border-destructive bg-destructive/10 text-destructive"
            }
            ${isOverLimit ? "border-destructive" : ""}
            ${isSupported ? "pr-12" : ""}
          `}
          rows={4}
        />

        {/* Validation indicator */}
        {!isValid && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute top-2 right-2 ${isSupported ? 'mr-10' : ''}`}
          >
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </motion.div>
        )}

        {isSupported && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleListening();
            }}
            className={`absolute right-2 top-2 w-8 h-8 rounded-full transition-colors z-10 flex items-center justify-center overflow-visible ${
              isListening
                ? "bg-red-500 text-white hover:bg-red-600"
                : "text-muted-foreground hover:bg-muted opacity-50 hover:opacity-100"
            }`}
            title={isListening ? "Stop listening" : "Start speaking"}
          >
            {isListening ? (
              <>
                {/* Ripple rings */}
                <span className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="absolute w-full h-full rounded-full bg-red-500/30"
                      initial={{ scale: 1, opacity: 0.7 }}
                      animate={{ scale: 2.4, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
                    />
                  ))}
                </span>
                {/* Sound-wave bars */}
                <div className="flex items-center gap-[3px] h-3 relative z-10">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-[2.5px] bg-white rounded-full"
                      animate={{ height: ["30%", "100%", "30%"] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse", delay: i * 0.15, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Mic size={16} />
            )}
          </button>
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
