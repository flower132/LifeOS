import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
};

export function Spinner({
  className,
  size = "md",
  ...props
}: SpinnerProps) {
  const { t } = useTranslation();
  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
      aria-label={t("common.loading")}
      role="status"
    >
      <Loader2
        className={cn("animate-spin text-accent", sizeClass[size])}
        aria-hidden="true"
      />
    </span>
  );
}
