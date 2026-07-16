"use client";

import { HeartHandshake } from "lucide-react";
import { RelationshipEvent } from "@/lib/services/relationshipHistory";
import { useTranslation } from "@/lib/useTranslation";

/**
 * RelationshipTimeline — Person Workspace 的关系时间线。
 *
 * 数据全部由 RelationshipHistory 服务从 Memory 自动生成，
 * 组件只负责叙事化展示，禁止人工维护入口。
 */

interface RelationshipTimelineProps {
  events: RelationshipEvent[];
}

const KIND_ICON: Record<RelationshipEvent["kind"], string> = {
  met: "✦",
  birthday: "🎂",
  memory: "·",
  note: "·",
  moment: "✧",
  decision: "→",
  relation_note: "·",
};

export function RelationshipTimeline({ events }: RelationshipTimelineProps) {
  const { t } = useTranslation();

  if (events.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <HeartHandshake className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("relationshipTimeline")}
        </h2>
      </div>
      <div className="space-y-0">
        {events.map((event, index) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 text-xs text-muted-foreground">
                {KIND_ICON[event.kind]}
              </span>
              {index < events.length - 1 && (
                <span className="w-px flex-1 bg-border" />
              )}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium text-foreground">
                {event.title}
              </p>
              {event.excerpt && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {event.excerpt}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground/60">
                {event.occurredAt.slice(0, 10)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
