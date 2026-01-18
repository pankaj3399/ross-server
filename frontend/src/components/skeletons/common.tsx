"use client";

import { Skeleton } from "./ui";

export function PageSkeleton() {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="space-y-3">
                    <Skeleton height="2rem" width="300px" />
                    <Skeleton height="1rem" width="500px" />
                </div>

                {/* Content Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton height="1.5rem" width="60%" />
                <Skeleton variant="circular" width="2rem" height="2rem" />
            </div>
            <Skeleton height="1rem" width="100%" />
            <Skeleton height="1rem" width="80%" />
            <div className="flex gap-2 mt-4">
                <Skeleton height="2.5rem" width="80px" variant="rounded" />
                <Skeleton height="2.5rem" width="80px" variant="rounded" />
            </div>
        </div>
    );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    height="1rem"
                    width={i === lines - 1 ? "75%" : "100%"}
                />
            ))}
        </div>
    );
}

export function ButtonSkeleton({ width = "120px" }: { width?: string | number }) {
    return <Skeleton height="2.5rem" width={width} variant="rounded" />;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} height="1.5rem" width="100%" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-4">
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <Skeleton key={colIdx} height="1rem" width="100%" />
                    ))}
                </div>
            ))}
        </div>
    );
}
