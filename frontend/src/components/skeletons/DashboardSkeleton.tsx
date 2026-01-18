"use client";

import { Skeleton } from "./ui";
import { CardSkeleton } from "./common";

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div className="space-y-3">
                            <Skeleton height="3rem" width="200px" />
                            <Skeleton height="1.2rem" width="400px" />
                        </div>
                        <Skeleton height="3rem" width="140px" variant="rounded" />
                    </div>

                    {/* Content Grid */}
                    <div className="space-y-6">
                        <Skeleton height="2rem" width="180px" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <CardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
