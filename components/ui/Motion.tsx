"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* LifeOS Motion Primitives                                           */
/*                                                                    */
/* Lightweight animation wrappers using CSS keyframes + Intersection   */
/* Observer for scroll-triggered entrance. All durations/easings      */
/* reference the --duration-* / --ease-* tokens in globals.css.       */
/* ------------------------------------------------------------------ */

type MotionVariant =
  | "fade-in"
  | "fade-in-up"
  | "fade-in-down"
  | "fade-in-left"
  | "scale-in"
  | "scale-in-up";

const variantClass: Record<MotionVariant, string> = {
  "fade-in": "animate-fade-in",
  "fade-in-up": "animate-fade-in-up",
  "fade-in-down": "animate-fade-in-down",
  "fade-in-left": "animate-fade-in-left",
  "scale-in": "animate-scale-in",
  "scale-in-up": "animate-scale-in-up",
};

/* ------------------------------------------------------------------ */
/* Motion — entrance animation with optional scroll trigger            */
/* ------------------------------------------------------------------ */

export interface MotionProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: MotionVariant;
  /** Delay in ms before the animation starts */
  delay?: number;
  /** Only animate when scrolled into view (IntersectionObserver) */
  scrollTrigger?: boolean;
  /** Root margin for IntersectionObserver (default: "0px 0px -40px 0px") */
  rootMargin?: string;
  /** Render as a different container element */
  as?: "div" | "section" | "article" | "main" | "header" | "footer" | "aside" | "nav";
}

export function Motion({
  variant = "fade-in-up",
  delay,
  scrollTrigger = false,
  rootMargin = "0px 0px -40px 0px",
  as: Tag = "div",
  className,
  style,
  children,
  ...rest
}: MotionProps) {
  const [visible, setVisible] = React.useState(!scrollTrigger);
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!scrollTrigger || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [scrollTrigger, rootMargin]);

  const animStyle: React.CSSProperties = {
    animationDelay: delay ? `${delay}ms` : undefined,
    ...(scrollTrigger && !visible ? { opacity: 0 } : {}),
    ...style,
  };

  return (
    <Tag
      ref={ref as never}
      className={cn(visible && variantClass[variant], className)}
      style={animStyle}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* MotionStagger — staggered children animation                       */
/* ------------------------------------------------------------------ */

export type MotionStaggerProps = React.HTMLAttributes<HTMLDivElement>;

export function MotionStagger({
  className,
  children,
  ...rest
}: MotionStaggerProps) {
  return (
    <div className={cn("animate-stagger", className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MotionPress — subtle scale-down on tap/click                       */
/* ------------------------------------------------------------------ */

export function MotionPress({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("motion-press", className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MotionCard — card with hover lift                                  */
/* ------------------------------------------------------------------ */

export function MotionCard({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("motion-card", className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PageTransition — wrapper for route-level page enter animation      */
/* ------------------------------------------------------------------ */

export function PageTransition({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("page-transition", className)} {...rest}>
      {children}
    </div>
  );
}
