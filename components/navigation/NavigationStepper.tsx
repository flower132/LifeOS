"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepItem } from "@/lib/navigation/stepTypes";

interface NavigationStepperProps<TStep extends StepItem = StepItem> {
  steps: TStep[];
  currentStepIndex: number;
}

export function NavigationStepper<TStep extends StepItem = StepItem>({
  steps,
  currentStepIndex,
}: NavigationStepperProps<TStep>) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isPast = index < currentStepIndex;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-medium transition-colors",
                isActive
                  ? "bg-accent/10 text-accent"
                  : isPast
                  ? "bg-accent/5 text-accent/80"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}. {step.label}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            )}
          </div>
        );
      })}
    </div>
  );
}
