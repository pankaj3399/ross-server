"use client";

import { Skeleton } from "./ui";

export function ManageSubscriptionSkeleton() {
    return (
        <div className="min-h-full flex flex-col bg-background">
            <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Skeleton variant="rounded" width="4rem" height="4rem" />
                    <div className="flex-1 space-y-2">
                        <Skeleton height="2.5rem" width="400px" />
                        <Skeleton height="1.25rem" width="500px" />
                    </div>
                </div>

                {/* Current Plan Section */}
                <div className="bg-muted/50 rounded-2xl p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <Skeleton height="1rem" width="120px" />
                                <Skeleton height="1.5rem" width="80px" variant="rounded" />
                            </div>
                            <Skeleton height="2rem" width="200px" />
                            <Skeleton height="1.25rem" width="300px" />
                        </div>
                        <Skeleton height="3rem" width="140px" variant="rounded" />
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Four Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-card rounded-xl p-6 border border-border space-y-3">
                                    <Skeleton variant="rounded" width="1.5rem" height="1.5rem" />
                                    <Skeleton height="0.75rem" width="100px" />
                                    <Skeleton height="1.5rem" width="120px" />
                                    <Skeleton height="1rem" width="80px" />
                                </div>
                            ))}
                        </div>

                        {/* FAQ Section */}
                        <div className="bg-card rounded-xl p-6 border border-border">
                            <div className="flex items-center gap-3 mb-4">
                                <Skeleton variant="rounded" width="1.5rem" height="1.5rem" />
                                <Skeleton height="1.5rem" width="250px" />
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="border border-border rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <Skeleton height="1.25rem" width="80%" />
                                            <Skeleton variant="rounded" width="1.25rem" height="1.25rem" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Billing History Skeleton */}
                    <div className="bg-card rounded-xl px-6 py-3.5 border border-border">
                        <Skeleton height="1.5rem" width="150px" className="mb-4" />
                        <BillingHistorySkeleton />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function BillingHistorySkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton variant="circular" width="1.25rem" height="1.25rem" />
                        <div className="space-y-2">
                            <Skeleton height="1rem" width="100px" />
                            <Skeleton height="0.75rem" width="80px" />
                        </div>
                    </div>
                    <Skeleton variant="rounded" width="1.25rem" height="1.25rem" />
                </div>
            ))}
            <div className="pt-2">
                <Skeleton height="0.75rem" width="180px" className="ml-auto" />
            </div>
        </div>
    );
}
