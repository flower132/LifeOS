"use client";

import { useEffect, useMemo, useState } from "react";
import { LifeObject } from "@/lib/types";
import {
  buildObjectTimeline,
  getCachedEvolution,
  summarizeObjectEvolution,
} from "@/lib/graph/timeline";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface TimelineTabProps {
  object: LifeObject;
}

const TYPE_ICON: Record<string, string> = {
  object_created: "✨",
  goal_created: "🎯",
  project_started: "🚀",
  object_updated: "✏️",
  note_created: "📝",
  memory_created: "💭",
  reflection: "🌙",
  decision: "⚖️",
  today_focus: "🎯",
  relation_created: "🤝",
  relation_updated: "🔄",
  relation_discovered: "🔍",
  insight_generated: "💡",
  profile_updated: "🧠",
  summary_created: "📖",
};

function evolutionKind(type: LifeObject["type"]): "relationship" | "project" | "goal" {
  if (type === "person") return "relationship";
  if (type === "project") return "project";
  return "goal";
}

/** Object Timeline — how this object evolved, step by step (+ AI evolution). */
export function TimelineTab({ object }: TimelineTabProps) {
  const { t } = useTranslation();
  const objects = useObjectStore((s) => s.objects);
  const notes = useNoteStore((s) => s.notes);
  const relations = useRelationStore((s) => s.relations);
  const memories = useMemoryStore((s) => s.memories);

  const events = useMemo(
    () => buildObjectTimeline(object.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [object.id, objects, notes, relations, memories]
  );

  const kind = evolutionKind(object.type);
  const [evolution, setEvolution] = useState<{ id: string; text: string } | null>(() => {
    const cached = getCachedEvolution(kind, object.id);
    return cached ? { id: object.id, text: cached } : null;
  });

  // 后台生成演化叙述：effect 内仅异步 setState。
  useEffect(() => {
    if (evolution?.id === object.id) return;
    let cancelled = false;
    void summarizeObjectEvolution(object.id, object.name, kind).then((text) => {
      if (!cancelled && text) setEvolution({ id: object.id, text });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object.id, events.length]);

  const evolutionText = evolution?.id === object.id ? evolution.text : null;

  if (events.length === 0) {
    return <EmptyState description={t("timelineEmpty")} />;
  }

  return (
    <div className="space-y-4">
      {evolutionText && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            {kind === "relationship"
              ? (t("relationshipEvolution"))
              : kind === "project"
                ? (t("projectHistory"))
                : (t("goalRoadmap"))}
          </p>
          <p className="text-sm leading-relaxed text-foreground">{evolutionText}</p>
        </div>
      )}

      <ol className="relative space-y-3 border-l border-border pl-5">
        {events.map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute -left-[27px] flex h-4 w-4 items-center justify-center rounded-full bg-surface text-[10px]">
              {TYPE_ICON[event.type] ?? "·"}
            </span>
            <p className="text-xs text-muted-foreground">
              {new Date(event.timestamp).toISOString().slice(0, 10)}
              {event.actor === "ai" && (
                <span className="ml-1.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
                  AI
                </span>
              )}
            </p>
            <p className="text-sm text-foreground">{event.title}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
