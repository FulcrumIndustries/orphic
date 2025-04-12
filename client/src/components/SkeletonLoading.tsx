import React from "react";

interface SkeletonProps {
  className?: string;
}

// Basic skeleton with animation
const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    aria-hidden="true"
  ></div>
);

// Skeleton for color palette
export const ColorPaletteSkeleton: React.FC = () => (
  <div>
    <Skeleton className="h-8 w-64 mb-4" />
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {Array(5)
        .fill(0)
        .map((_, idx) => (
          <div
            key={idx}
            className="border rounded-lg overflow-hidden shadow-sm"
          >
            <Skeleton className="h-24 w-full" />
            <div className="p-3">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
    </div>
  </div>
);

// Skeleton for typography section
export const TypographySkeleton: React.FC = () => (
  <div>
    <Skeleton className="h-8 w-64 mb-4" />
    <div className="space-y-6">
      {Array(3)
        .fill(0)
        .map((_, idx) => (
          <div key={idx} className="border rounded-lg p-4">
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-4 w-40 mb-1" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
    </div>
  </div>
);

// Skeleton for logo prompt section
export const LogoPromptSkeleton: React.FC = () => (
  <div>
    <Skeleton className="h-8 w-72 mb-4" />
    {/* Overall Goal section */}
    <div className="bg-gray-100 p-4 rounded-lg shadow-inner mb-4">
      <Skeleton className="h-5 w-40 mb-3" /> {/* Section title */}
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
    </div>
    {/* Additional sections */}
    {Array(3)
      .fill(0)
      .map((_, idx) => (
        <div key={idx} className="bg-gray-100 p-4 rounded-lg shadow-inner mb-4">
          <Skeleton className="h-5 w-48 mb-3" /> {/* Section title */}
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    <div className="mt-4 flex items-center">
      <span className="mr-2">Primary Color:</span>
      <Skeleton className="w-6 h-6 rounded-full border" />
      <Skeleton className="ml-2 w-24 h-4" />
    </div>
  </div>
);

// Skeleton for image prompts section
export const ImagePromptsSkeleton: React.FC = () => (
  <div>
    <Skeleton className="h-8 w-64 mb-4" />
    <div className="space-y-8">
      {Array(3)
        .fill(0)
        .map((_, idx) => (
          <div
            key={idx}
            className="border rounded-lg overflow-hidden shadow-md"
          >
            <div className="bg-gray-50 p-3 border-b">
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="p-4 bg-white">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
    </div>
  </div>
);
