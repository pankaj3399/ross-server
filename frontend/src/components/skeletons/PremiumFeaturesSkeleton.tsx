"use client"

import { Skeleton } from "./ui";

export function PremiumFeaturesSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-8 my-8">
                    {/* Header */}
                    <div className="mb-12 flex flex-col justify-center items-center space-y-4">
                        <Skeleton height="3rem" width="60%" className="max-w-2xl" />
                        <Skeleton height="1.5rem" width="40%" className="max-w-xl" />
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-card rounded-xl border border-border h-full p-8 flex flex-col items-center text-center space-y-6">
                                <Skeleton variant="circular" width="7rem" height="7rem" />
                                <div className="w-full space-y-3">
                                    <Skeleton height="2rem" width="80%" className="mx-auto" />
                                    <Skeleton height="1rem" width="60%" className="mx-auto" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Button */}
                    <div className="flex justify-center mt-12">
                        <Skeleton height="3.5rem" width="220px" variant="rounded" />
                    </div>
                </div>
            </div>
        </div>
    )
}
