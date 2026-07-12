"use client";

import { LifeObject } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { EmptyState } from "@/components/ui/EmptyState";
import { AIMemoryCard } from "@/components/ai/cards";

interface MemoriesTabProps {
  object: LifeObject;
}

export function MemoriesTab({ object }: MemoriesTabProps) {
  const { t } = useTranslation();
  const memories = object.memories ?? [];

  if (memories.length === 0) {
    return (
      <EmptyState description={t("aiMemoriesEmpty")} />
    );
  }

  return (
    <div className="space-y-4">
      {memories.map((memory) => (
        <AIMemoryCard key={memory.id} memory={memory} />
      ))}
    </div>
  );
}
