"use client";

import { cn } from "@/lib/utils";
import { Skeleton as ShadcnSkeleton } from "../ui/skeleton";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    variant?: "default" | "circular" | "text" | "rounded";
    width?: string | number;
    height?: string | number;
}

export function Skeleton({
    className,
    variant = "default",
    width,
    height,
    style,
    ...props
}: SkeletonProps) {
    const variantClasses = {
        default: "rounded",
        circular: "rounded-full",
        text: "rounded",
        rounded: "rounded-lg",
    };

    const combinedStyle: React.CSSProperties = {
        width: width || "100%",
        height: height || "1rem",
        ...style,
    };

    return (
        <ShadcnSkeleton
            className={cn(variantClasses[variant], className)}
            style={combinedStyle}
            {...props}
        />
    );
}
