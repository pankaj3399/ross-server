"use client";

import { Skeleton } from "./ui";

export function SettingsSkeleton() {
    return (
        <div className="bg-muted/30 min-h-screen relative">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton variant="circular" width="2rem" height="2rem" />
                        <Skeleton height="2.5rem" width="250px" />
                    </div>
                    <Skeleton height="1rem" width="400px" />
                </div>

                <div className="space-y-8">
                    {/* Profile Card */}
                    <div className="bg-card rounded-xl border border-border">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <div className="flex gap-4 items-center">
                                <Skeleton variant="circular" width="3rem" height="3rem" />
                                <div className="space-y-2">
                                    <Skeleton height="1.5rem" width="180px" />
                                    <Skeleton height="1rem" width="250px" />
                                </div>
                            </div>
                            <Skeleton height="2.5rem" width="80px" variant="rounded" />
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Skeleton height="0.8rem" width="80px" />
                                    <Skeleton height="1.5rem" width="150px" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton height="0.8rem" width="100px" />
                                    <Skeleton height="1.5rem" width="200px" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="bg-card rounded-xl border border-border">
                        <div className="p-6 border-b border-border flex gap-4 items-center">
                            <Skeleton variant="circular" width="3rem" height="3rem" />
                            <div className="space-y-2">
                                <Skeleton height="1.5rem" width="180px" />
                                <Skeleton height="1rem" width="250px" />
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* MFA Row */}
                            <div className="flex justify-between items-center">
                                <div className="flex gap-4 items-center">
                                    <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
                                    <div className="space-y-2">
                                        <Skeleton height="1.2rem" width="150px" />
                                        <Skeleton height="0.9rem" width="200px" />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Skeleton height="1.5rem" width="60px" variant="rounded" />
                                    <Skeleton height="2rem" width="80px" variant="rounded" />
                                </div>
                            </div>
                            <Skeleton height="1px" width="100%" />
                            {/* Password Row */}
                            <div className="flex justify-between items-center">
                                <div className="flex gap-4 items-center">
                                    <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
                                    <div className="space-y-2">
                                        <Skeleton height="1.2rem" width="100px" />
                                        <Skeleton height="0.9rem" width="150px" />
                                    </div>
                                </div>
                                <Skeleton height="2rem" width="80px" variant="rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
