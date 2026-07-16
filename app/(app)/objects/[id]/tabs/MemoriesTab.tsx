"use client";

import { LifeObject } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { EmptyState } from "@/components/ui/EmptyState";
import { AIMemoryCard } from "@/components/ai/cards";
import { useNoteStore } from "@/stores/noteStore";
import { useObjectStore } from "@/stores/objectStore";
import { useRelationStore } from "@/stores/relationStore";
import { useLongTermMemoryStore } from "@/stores/longTermMemoryStore";
import { buildRelationshipTimeline } from "@/lib/services/relationshipHistory";
import { buildGoalJourney } from "@/lib/services/goalJourney";
import { RelationshipTimeline } from "@/components/memory/RelationshipTimeline";
import { GoalJourneyView } from "@/components/memory/GoalJourneyView";

interface MemoriesTabProps {
  object: LifeObject;
}

export function MemoriesTab({ object }: MemoriesTabProps) {
  const { t } = useTranslation();
  const memories = object.memories ?? [];

  // Person Workspace：关系时间线（全部来自 Memory，自动生成）
  const { notes } = useNoteStore();
  const { objects } = useObjectStore();
  const { relations } = useRelationStore();
  const { moments, decisions } = useLongTermMemoryStore();

  if (object.type === "person") {
    const events = buildRelationshipTimeline({
      person: object,
      objects,
      notes,
      relations,
      moments,
      decisions,
    });
    return (
      <div className="space-y-8">
        <RelationshipTimeline events={events} />
        {memories.length > 0 && (
          <div className="space-y-4">
            {memories.map((memory) => (
              <AIMemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (object.type === "goal") {
    const journey = buildGoalJourney(object, notes);
    return (
      <div className="space-y-8">
        <GoalJourneyView journey={journey} />
        {memories.length > 0 && (
          <div className="space-y-4">
            {memories.map((memory) => (
              <AIMemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </div>
    );
  }

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
