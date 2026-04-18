"use client";

import { useState, useId, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconInfoCircle, IconAlertTriangle, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";

interface InfoSectionProps {
  title: string;
  description: string;
  limitations: string;
  className?: string;
  defaultExpanded?: boolean;
  /** Optional rich content shown below limitations inside the same expandable panel */
  children?: ReactNode;
}

export default function InfoSection({
  title,
  description,
  limitations,
  className = "",
  defaultExpanded = false,
  children,
}: InfoSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const sectionId = useId();
  const contentId = `info-section-content-${sectionId}`;

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${className} ${isExpanded ? "border-primary/30 shadow-md" : "border-border shadow-sm hover:border-primary/20"}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <IconInfoCircle className="size-5" />
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <div className="text-muted-foreground p-1">
          {isExpanded ? (
            <IconChevronUp className="size-5" />
          ) : (
            <IconChevronDown className="size-5" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CardContent className="p-6 pt-2 space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary/80">
                  What it is
                </h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <IconAlertTriangle className="size-4" />
                  <h4 className="text-sm font-bold uppercase tracking-wider">
                    How it doesn't work
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {limitations}
                </p>
              </div>

              {children ? (
                <div className="space-y-4 pt-4 border-t border-border/50 text-sm text-muted-foreground leading-relaxed">
                  {children}
                </div>
              ) : null}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
