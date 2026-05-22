import * as React from "react"
import { cn } from "@/lib/utils"
import { Mic } from "lucide-react"
import { useSpeechToText } from "../../hooks/useSpeechToText"
import { motion } from "framer-motion"

const Input = React.forwardRef<HTMLInputElement | null, React.ComponentProps<"input">>(
  ({ className, type, onChange, value, defaultValue, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref as React.Ref<HTMLInputElement | null>, () => innerRef.current, [innerRef.current]);

    // Speech → text injection for React controlled inputs.
    // Bypasses React's value tracker via native setter, updates React's internal state tracker,
    // and fires native 'input' and 'change' events so React state synchronizes correctly.
    const handleTranscript = React.useCallback((text: string) => {
      const el = innerRef.current;
      if (!el) return;

      const currentVal = el.value;
      const space = currentVal.length > 0 && !currentVal.endsWith(' ') ? ' ' : '';
      const newVal = currentVal + space + text;

      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      
      if (nativeSetter) {
        // Set the value using the native setter
        nativeSetter.call(el, newVal);
        
        // Update React's internal value tracker if it exists
        const tracker = (el as any)._valueTracker;
        if (tracker) {
          tracker.setValue(currentVal);
        }
        
        // Dispatch events so React/RHF captures the state change
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        el.value = newVal;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, []);

    const { isListening, isSupported, toggleListening } = useSpeechToText(handleTranscript);

    // Capture the initial type on mount to keep tracking if it was a password input
    const initialTypeRef = React.useRef(type);
    const isPassword = type === "password" || initialTypeRef.current === "password";

    // Only show mic on text-like input types
    const showMic = isSupported
      && !isPassword
      && type !== "file"
      && type !== "checkbox"
      && type !== "radio"
      && type !== "submit"
      && type !== "hidden"
      && type !== "range"
      && type !== "color"
      && type !== "number"
      && type !== "date"
      && type !== "time"
      && type !== "email";

    return (
      <div className="relative w-full group flex items-center">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            showMic && "pr-10",
            className
          )}
          ref={innerRef}
          onChange={onChange}
          value={value}
          defaultValue={defaultValue}
          {...props}
        />
        {showMic && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleListening();
            }}
            className={cn(
              "absolute right-1 w-7 h-7 rounded-full transition-colors z-10 flex items-center justify-center overflow-visible",
              isListening
                ? "bg-red-500 text-white hover:bg-red-600"
                : "text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 focus:opacity-100"
            )}
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
                <div className="flex items-center gap-[2.5px] h-2.5 relative z-10">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-[2px] bg-white rounded-full"
                      animate={{ height: ["30%", "100%", "30%"] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse", delay: i * 0.15, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Mic size={14} />
            )}
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
