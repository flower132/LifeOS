"use client";

import { LifeObject, ObjectMemory } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";

interface MemoriesTabProps {
  object: LifeObject;
}

export function MemoriesTab({ object }: MemoriesTabProps) {
  const { t } = useTranslation();
  const memories = object.memories ?? [];

  if (memories.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {t("aiMemoriesEmpty")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {memories.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} />
      ))}
    </div>
  );
}

function MemoryCard({ memory }: { memory: ObjectMemory }) {
  const { t } = useTranslation();

  const sourceClass =
    memory.source === "ai"
      ? "bg-accent/10 text-accent"
      : "bg-muted text-muted-foreground";

  const sourceLabel = t(
    `aiMemorySource${memory.source.charAt(0).toUpperCase() + memory.source.slice(1)}`
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sourceClass}`}>
          {sourceLabel}
        </span>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{memory.content}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {new Date(memory.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}
