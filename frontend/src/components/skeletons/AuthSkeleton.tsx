"use client";

import { Skeleton } from "./ui";

export function AuthSkeleton() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <Skeleton variant="circular" width="4rem" height="4rem" className="mx-auto" />
                <Skeleton height="1.25rem" width="200px" className="mx-auto" />
            </div>
        </div>
    );
}

// Alias for SimplePageSkeleton compatibility
export const SimplePageSkeleton = AuthSkeleton;
