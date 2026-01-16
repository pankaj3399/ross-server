"use client";

import { Skeleton } from "./ui";
import { TextSkeleton } from "./common";

export function AssessmentSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="space-y-3">
                    <Skeleton height="2rem" width="400px" />
                    <Skeleton height="1rem" width="300px" />
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <Skeleton height="3rem" width="150px" variant="rounded" />
                    <Skeleton height="3rem" width="150px" variant="rounded" />
                    <Skeleton height="3rem" width="150px" variant="rounded" />
                </div>

                {/* Question Card */}
                <div className="bg-card rounded-2xl p-8 border border-border space-y-6">
                    <Skeleton height="2rem" width="70%" />
                    <TextSkeleton lines={4} />
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} height="3rem" width="100%" variant="rounded" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function OptionsGridSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Skeleton height="1.5rem" width="60px" variant="rounded" />
                        <Skeleton height="1px" width="1px" />
                        <div className="space-y-2">
                            <Skeleton height="1.5rem" width="300px" />
                            <Skeleton height="1rem" width="400px" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-8 text-center space-y-3">
                    <Skeleton height="1.5rem" width="300px" className="mx-auto" />
                    <Skeleton height="1rem" width="500px" className="mx-auto" />
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-card rounded-2xl border-2 border-border p-6 space-y-4"
                        >
                            <Skeleton variant="circular" width="4rem" height="4rem" />
                            <Skeleton height="1.5rem" width="70%" />
                            <TextSkeleton lines={2} />
                        </div>
                    ))}
                </div>

                {/* Button */}
                <div className="flex justify-center">
                    <Skeleton height="3rem" width="150px" variant="rounded" />
                </div>
            </div>
        </div>
    );
}

export function FairnessTestSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Skeleton height="1.5rem" width="60px" variant="rounded" />
                        <Skeleton height="1px" width="1px" />
                        <div className="space-y-2">
                            <Skeleton height="1.5rem" width="300px" />
                            <Skeleton height="1rem" width="400px" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <Skeleton height="2rem" width="100%" variant="rounded" />
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-card rounded-lg p-4 space-y-3">
                                <Skeleton height="1.25rem" width="70%" />
                                <Skeleton height="1rem" width="50%" />
                            </div>
                        ))}
                    </div>

                    {/* Main Question Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-card rounded-2xl p-8 border border-border space-y-6">
                            <Skeleton height="2rem" width="80%" />
                            <TextSkeleton lines={3} />
                            <div className="space-y-4">
                                <Skeleton height="4rem" width="100%" variant="rounded" />
                                <Skeleton height="4rem" width="100%" variant="rounded" />
                            </div>
                            <div className="flex gap-4 mt-6">
                                <Skeleton height="3rem" width="120px" variant="rounded" />
                                <Skeleton height="3rem" width="120px" variant="rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
