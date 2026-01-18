"use client";

import { Skeleton } from "./ui";

export function ReportSkeleton() {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="space-y-3">
                    <Skeleton height="2.5rem" width="300px" />
                    <Skeleton height="1rem" width="400px" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-card rounded-xl p-6 border border-border">
                            <Skeleton height="1rem" width="60%" className="mb-4" />
                            <Skeleton height="2rem" width="40%" />
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-card rounded-xl p-6 border border-border">
                            <Skeleton height="1.5rem" width="50%" className="mb-4" />
                            <Skeleton height="300px" width="100%" variant="rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
