"use client"

import {
  IconCircleCheck,
  IconInfoCircle,
  IconLoader2,
  IconAlertTriangle,
  IconXboxX,
} from "@tabler/icons-react"
import { useTheme } from "../../contexts/ThemeContext"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import { CSSProperties } from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const toastElement = target.closest('[data-sonner-toast]') as HTMLElement | null;
        if (toastElement && toastElement.getAttribute("data-dismissible") !== "false" && !target.closest('a') && !target.closest('button')) {
          const toastId = toastElement.getAttribute('data-toast-id') || (toastElement.dataset ? toastElement.dataset.toastId : undefined);
          if (toastId) {
            toast.dismiss(toastId);
          } else {
            toast.dismiss();
          }
        }
      }}
    >
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        position="top-right"
        closeButton={true}
        icons={{
          success: <IconCircleCheck className="size-4" />,
          info: <IconInfoCircle className="size-4" />,
          warning: <IconAlertTriangle className="size-4" />,
          error: <IconXboxX className="size-4" />,
          loading: <IconLoader2 className="size-4 animate-spin" />,
        }}
        toastOptions={{
          duration: 4000,
          classNames: {
            toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-none cursor-pointer select-none",
            success: "group-[.toaster]:bg-background group-[.toaster]:text-success group-[.toaster]:border-success/30",
            error: "group-[.toaster]:bg-background group-[.toaster]:text-destructive group-[.toaster]:border-destructive/30",
            warning: "group-[.toaster]:bg-background group-[.toaster]:text-warning group-[.toaster]:border-warning/30",
            info: "group-[.toaster]:bg-background group-[.toaster]:text-primary group-[.toaster]:border-primary/30",
          },
        }}
        style={
          {
            "--normal-bg": "var(--background)",
            "--normal-text": "var(--foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
          } as CSSProperties
        }
        {...props}
      />
    </div>
  )
}

export { Toaster }
