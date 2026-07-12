import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function SkeletonText({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-4 w-full rounded", className)}
      {...props}
    />
  );
}

export function SkeletonBlock({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-32 w-full rounded-xl", className)}
      {...props}
    />
  );
}

export function AIInsightSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <SkeletonText className="h-4 w-3/4 bg-accent/10" />
      <SkeletonText className="h-4 w-1/2 bg-accent/10" />
    </div>
  );
}
