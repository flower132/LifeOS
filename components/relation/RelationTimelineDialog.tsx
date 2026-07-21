"use client";

import { useEffect, useMemo, useState } from "react";
import { Relation } from "@/lib/types";
import {
  buildRelationTimeline,
  getCachedEvolution,
  summarizeRelationEvolution,
} from "@/lib/graph/timeline";
import { useObjectStore } from "@/stores/objectStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { useRelationStore } from "@/stores/relationStore";
import { Dialog } from "@/components/ui/Dialog";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface RelationTimelineDialogProps {
  relation: Relation | null;
  focusObjectId: string;
  onClose: () => void;
}

/** Relation Timeline — creation → changes → shared moments → AI evolution. */
export function RelationTimelineDialog({
  relation,
  focusObjectId,
  onClose,
}: RelationTimelineDialogProps) {
  const { t } = useTranslation();
  const objects = useObjectStore((s) => s.objects);
  const memories = useMemoryStore((s) => s.memories);
  const relations = useRelationStore((s) => s.relations);

  const otherName = useMemo(() => {
    if (!relation) return "";
    const otherId =
      relation.source_object_id === focusObjectId
        ? relation.target_object_id
        : relation.source_object_id;
    return objects.find((o) => o.id === otherId)?.name ?? "?";
  }, [relation, focusObjectId, objects]);

  const events = useMemo(
    () => (relation ? buildRelationTimeline(relation.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [relation?.id, memories, relations]
  );

  const [evolution, setEvolution] = useState<{ id: string; text: string } | null>(() => {
    if (!relation) return null;
    const cached = getCachedEvolution("relation", relation.id);
    return cached ? { id: relation.id, text: cached } : null;
  });

  // 后台生成演化叙述：effect 内仅异步 setState。
  useEffect(() => {
    if (!relation || evolution?.id === relation.id) return;
    let cancelled = false;
    void summarizeRelationEvolution(relation.id, otherName).then((text) => {
      if (!cancelled && text) setEvolution({ id: relation.id, text });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relation?.id, otherName]);

  const evolutionText =
    relation && evolution?.id === relation.id ? evolution.text : null;

  return (
    <Dialog
      open={relation !== null}
      onClose={onClose}
      title={`${t("relationTimeline")} · ${otherName}`}
      maxWidth="md"
    >
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {evolutionText && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {t("relationshipEvolution")}
            </p>
            <p className="text-sm leading-relaxed text-foreground">{evolutionText}</p>
          </div>
        )}

        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("timelineEmpty")}
          </p>
        ) : (
          <ol className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="flex items-baseline gap-3 text-sm">
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(event.timestamp).toISOString().slice(0, 10)}
                </span>
                <span className="text-foreground">{event.title}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Dialog>
  );
}
