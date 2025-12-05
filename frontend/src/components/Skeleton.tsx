"use client";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "default" | "circular" | "text" | "rounded";
  width?: string | number;
  height?: string | number;
}

function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  ...props
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700";
  
  const variantClasses = {
    default: "rounded",
    circular: "rounded-full",
    text: "rounded",
    rounded: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width || "100%",
    height: height || "1rem",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <Skeleton height="2rem" width="300px" />
          <Skeleton height="1rem" width="500px" />
        </div>
        
        {/* Content Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton height="1.5rem" width="60%" />
        <Skeleton variant="circular" width="2rem" height="2rem" />
      </div>
      <Skeleton height="1rem" width="100%" />
      <Skeleton height="1rem" width="80%" />
      <div className="flex gap-2 mt-4">
        <Skeleton height="2.5rem" width="80px" variant="rounded" />
        <Skeleton height="2.5rem" width="80px" variant="rounded" />
      </div>
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? "75%" : "100%"}
        />
      ))}
    </div>
  );
}

export function ButtonSkeleton({ width = "120px" }: { width?: string | number }) {
  return <Skeleton height="2.5rem" width={width} variant="rounded" />;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="1.5rem" width="100%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} height="1rem" width="100%" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AssessmentSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 space-y-6">
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

export function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <Skeleton height="2.5rem" width="300px" />
          <Skeleton height="1rem" width="400px" />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <Skeleton height="1rem" width="60%" className="mb-4" />
              <Skeleton height="2rem" width="40%" />
            </div>
          ))}
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <Skeleton height="1.5rem" width="50%" className="mb-4" />
              <Skeleton height="300px" width="100%" variant="rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OptionsGridSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
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
              className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 space-y-4"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
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
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <Skeleton height="1.25rem" width="70%" />
                <Skeleton height="1rem" width="50%" />
              </div>
            ))}
          </div>
          
          {/* Main Question Area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 space-y-6">
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

export function SimplePageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center space-y-4">
        <Skeleton variant="circular" width="4rem" height="4rem" className="mx-auto" />
        <Skeleton height="1.25rem" width="200px" className="mx-auto" />
      </div>
    </div>
  );
}

export function AimaDataManagementSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-6">
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
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg">
            <Skeleton height="1.5rem" width="100px" className="mb-4" />
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <Skeleton height="2rem" width="60px" className="mx-auto mb-2" />
                  <Skeleton height="1rem" width="80px" className="mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Industry Analytics Section */}
        <div className="my-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg">
            <Skeleton height="1.75rem" width="200px" className="mb-6" />
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <Skeleton height="1.75rem" width="60px" className="mx-auto mb-2" />
                  <Skeleton height="1rem" width="100px" className="mx-auto" />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Skeleton height="1.25rem" width="180px" className="mb-4" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
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

