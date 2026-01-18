"use client";

import { Skeleton } from "./ui";

export function LandingSkeleton() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative py-20 px-4">
                <div className="max-w-7xl mx-auto text-center space-y-8 flex flex-col items-center">
                    <Skeleton height="5rem" width="50%" className="max-w-2xl" />
                    <Skeleton height="1.5rem" width="60%" className="max-w-3xl" />
                    <Skeleton height="1.5rem" width="40%" className="max-w-2xl" />
                    <div className="pt-4">
                        <Skeleton height="3.5rem" width="200px" variant="rounded" />
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20 px-4">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="text-center space-y-4 flex flex-col items-center">
                        <Skeleton height="3rem" width="400px" />
                        <Skeleton height="1.5rem" width="500px" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-card rounded-xl p-8 border border-border h-64 space-y-4">
                                <Skeleton variant="rounded" width="3rem" height="3rem" />
                                <Skeleton height="1.5rem" width="70%" />
                                <Skeleton height="1rem" width="90%" />
                                <Skeleton height="1rem" width="80%" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
