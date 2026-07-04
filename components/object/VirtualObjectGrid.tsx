"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface VirtualObjectGridProps {
  items: { id: string }[];
  renderItem: (item: { id: string }, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

function VirtualItem({
  children,
  rootMargin,
}: {
  children: React.ReactNode;
  rootMargin: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={cn(
        "min-h-[120px] rounded-xl transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 120px" }}
    >
      {visible ? children : null}
    </div>
  );
}

export function VirtualObjectGrid({
  items,
  renderItem,
  overscan = 300,
  className,
}: VirtualObjectGridProps) {
  const rootMargin = `${overscan}px 0px ${overscan}px 0px`;

  const renderCell = useCallback(
    (item: { id: string }, index: number) => (
      <VirtualItem key={item.id} rootMargin={rootMargin}>
        {renderItem(item, index)}
      </VirtualItem>
    ),
    [renderItem, rootMargin]
  );

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item, index) => renderCell(item, index))}
    </div>
  );
}
