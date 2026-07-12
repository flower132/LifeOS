import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export interface PageLoaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export function PageLoader({
  className,
  message,
  ...props
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-background px-4",
        className
      )}
      {...props}
    >
      <div className="text-center">
        <Spinner size="lg" className="mx-auto" />
        {message && (
          <p className="mt-4 text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}
