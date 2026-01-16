"use client";

import { Skeleton } from "./ui";

export function AimaDataManagementSkeleton() {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-3">
                            <Skeleton height="2.5rem" width="400px" />
                            <Skeleton height="1.25rem" width="500px" />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton height="3rem" width="200px" variant="rounded" />
                            <Skeleton height="3rem" width="180px" variant="rounded" />
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg">
                        <Skeleton height="1.5rem" width="100px" className="mb-4" />
                        <div className="grid grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="text-center p-4 bg-muted/50 rounded-xl">
                                    <Skeleton height="2rem" width="60px" className="mx-auto mb-2" />
                                    <Skeleton height="1rem" width="80px" className="mx-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Industry Analytics Section */}
                <div className="my-8">
                    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg">
                        <Skeleton height="1.75rem" width="200px" className="mb-6" />
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="text-center p-4 bg-muted/50 rounded-xl">
                                    <Skeleton height="1.75rem" width="60px" className="mx-auto mb-2" />
                                    <Skeleton height="1rem" width="100px" className="mx-auto" />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            <Skeleton height="1.25rem" width="180px" className="mb-4" />
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-muted/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <Skeleton height="1rem" width="200px" />
                                        <Skeleton height="1rem" width="100px" />
                                    </div>
                                    <Skeleton height="0.5rem" width="100%" variant="rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function PremiumDomainsSkeleton() {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-3">
                            <Skeleton height="2.5rem" width="400px" />
                            <Skeleton height="1.25rem" width="500px" />
                        </div>
                    </div>

                    {/* List of Domains */}
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Skeleton variant="circular" width="2rem" height="2rem" />
                                    <div className="space-y-2">
                                        <Skeleton height="1.25rem" width="200px" />
                                        <Skeleton height="1rem" width="150px" />
                                    </div>
                                </div>
                                <Skeleton width="1.5rem" height="1.5rem" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
