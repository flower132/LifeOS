"use client";

import { ObjectMemory } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface AIMemoryCardProps {
  memory: ObjectMemory;
}

const sourceStyles: Record<ObjectMemory["source"], string> = {
  ai: "bg-accent/10 text-accent",
  user: "bg-muted text-muted-foreground",
  import: "bg-muted text-muted-foreground",
  note: "bg-muted text-muted-foreground",
};

export function AIMemoryCard({ memory }: AIMemoryCardProps) {
  const { t } = useTranslation();

  const sourceLabel = t(
    `aiMemorySource${memory.source.charAt(0).toUpperCase() + memory.source.slice(1)}`
  );

  return (
    <Card variant="ai" className="space-y-2">
      <div>
        <Badge className={sourceStyles[memory.source]}>{sourceLabel}</Badge>
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground">{memory.content}</p>
      <p className="text-xs text-muted-foreground">
        {new Date(memory.createdAt).toLocaleDateString()}
      </p>
    </Card>
  );
}
