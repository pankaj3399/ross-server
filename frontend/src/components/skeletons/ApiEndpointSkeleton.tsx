"use client";

import { Skeleton } from "./ui";

export function ApiEndpointSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Skeleton height="1.5rem" width="60px" variant="rounded" />
                            <div className="h-6 w-px bg-border" />
                            <div className="space-y-2">
                                <Skeleton height="1.75rem" width="220px" />
                                <Skeleton height="1rem" width="300px" />
                            </div>
                        </div>
                        <Skeleton height="2.5rem" width="170px" variant="rounded" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* API Endpoint Card */}
                <div className="bg-card rounded-2xl border border-border p-8 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Skeleton variant="rounded" width="3rem" height="3rem" />
                        <div className="space-y-2">
                            <Skeleton height="1.5rem" width="180px" />
                            <Skeleton height="1rem" width="250px" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Endpoint URL Field */}
                        <div className="space-y-2">
                            <Skeleton height="1rem" width="100px" />
                            <Skeleton height="3rem" width="100%" variant="rounded" />
                        </div>

                        {/* Request Template Field */}
                        <div className="space-y-2">
                            <Skeleton height="1rem" width="150px" />
                            <Skeleton height="200px" width="100%" variant="rounded" />
                            <Skeleton height="0.75rem" width="350px" />
                        </div>

                        {/* Response Key Field */}
                        <div className="space-y-2">
                            <Skeleton height="1rem" width="130px" />
                            <Skeleton height="3rem" width="100%" variant="rounded" />
                            <Skeleton height="0.75rem" width="300px" />
                        </div>

                        {/* API Key Fields Grid */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Skeleton height="1rem" width="150px" />
                                <Skeleton height="3rem" width="100%" variant="rounded" />
                                <Skeleton height="0.75rem" width="180px" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton height="1rem" width="120px" />
                                <Skeleton height="3rem" width="100%" variant="rounded" />
                                <Skeleton height="0.75rem" width="200px" />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Skeleton height="3.5rem" width="100%" variant="rounded" />
                        <Skeleton height="0.75rem" width="400px" className="mx-auto" />
                    </div>
                </div>

                {/* What Happens Next Card */}
                <div className="bg-card rounded-2xl border border-dashed border-border p-6">
                    <Skeleton height="1.5rem" width="180px" className="mb-4" />
                    <div className="space-y-2">
                        <Skeleton height="1rem" width="80%" />
                        <Skeleton height="1rem" width="90%" />
                        <Skeleton height="1rem" width="75%" />
                    </div>
                </div>
            </div>
        </div>
    );
}
