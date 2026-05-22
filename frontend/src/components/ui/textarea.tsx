import * as React from "react"
import { cn } from "@/lib/utils"
import { Mic } from "lucide-react"
import { useSpeechToText } from "../../hooks/useSpeechToText"
import { motion } from "framer-motion"

const Textarea = React.forwardRef<
  HTMLTextAreaElement | null,
  React.ComponentProps<"textarea">
>(({ className, onChange, value, defaultValue, ...props }, ref) => {
  const innerRef = React.useRef<HTMLTextAreaElement>(null);
  React.useImperativeHandle(ref as React.Ref<HTMLTextAreaElement | null>, () => innerRef.current, [innerRef.current]);

  // Speech → text injection for React controlled textareas.
  // Bypasses React's value tracker via native setter, updates React's internal state tracker,
  // and fires native 'input' and 'change' events so React state synchronizes correctly.
  const handleTranscript = React.useCallback((text: string) => {
    const el = innerRef.current;
    if (!el) return;

    const currentVal = el.value;
    const space = currentVal.length > 0 && !currentVal.endsWith(' ') ? ' ' : '';
    const newVal = currentVal + space + text;

    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
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

  return (
    <div className="relative w-full group">
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          isSupported && "pr-10",
          className
        )}
        ref={innerRef}
        onChange={onChange}
        value={value}
        defaultValue={defaultValue}
        {...props}
      />
      {isSupported && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleListening();
          }}
          className={cn(
            "absolute right-2 top-2 w-8 h-8 rounded-full transition-colors z-10 flex items-center justify-center overflow-visible",
            isListening
              ? "bg-red-500 text-white hover:bg-red-600"
              : "text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
          title={isListening ? "Stop listening" : "Start speaking"}
          aria-label={isListening ? "Stop listening" : "Start speaking"}
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
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
