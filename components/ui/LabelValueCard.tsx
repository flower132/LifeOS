import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

export interface LabelValueCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  children: React.ReactNode;
}

export function LabelValueCard({
  label,
  children,
  className,
  ...props
}: LabelValueCardProps) {
  return (
    <Card className={cn(className)} {...props}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </Card>
  );
}
