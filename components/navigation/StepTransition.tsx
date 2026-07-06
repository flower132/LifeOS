"use client";

import { useLayoutEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StepTransitionProps {
  stepKey: string;
  direction: "forward" | "backward" | "home";
  children: React.ReactNode;
  className?: string;
}

export function StepTransition({
  stepKey,
  direction,
  children,
  className,
}: StepTransitionProps) {
  const [phase, setPhase] = useState<"enter" | "active">("enter");

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      setPhase("active");
    });
    return () => cancelAnimationFrame(raf);
  }, [stepKey]);

  const isForward = direction === "forward";
  const isHome = direction === "home";

  return (
    <div
      key={stepKey}
      className={cn(
        "step-content will-change-transform",
        phase === "enter"
          ? isForward || isHome
            ? "opacity-0 translate-x-4"
            : "opacity-0 -translate-x-4"
          : "opacity-100 translate-x-0",
        className
      )}
    >
      {children}
    </div>
  );
}
