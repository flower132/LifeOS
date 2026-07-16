"use client";

import { ReactNode } from "react";
import { MemoryRecord } from "@/lib/types";
import { NarrativeTimeline } from "@/lib/services/timelineService";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/lib/useTranslation";

/**
 * MemoryTimeline — 叙事时间线渲染器（纯展示组件）。
 *
 * 数据全部来自 TimelineService；组件不做任何时间计算。
 * 结构：今天 / 昨天 → 上午 · 下午 · 晚上；更早 → 按天；更远 → 按月。
 */

interface MemoryTimelineProps {
  timeline: NarrativeTimeline;
  renderRecord: (record: MemoryRecord) => ReactNode;
}

export function MemoryTimeline({ timeline, renderRecord }: MemoryTimelineProps) {
  const { t } = useTranslation();

  if (timeline.isEmpty) {
    return <EmptyState description={timeline.emptyText} />;
  }

  const dayLabel = (group: NarrativeTimeline["days"][number]): string => {
    if (group.relativeLabel === "today") return t("timeToday");
    if (group.relativeLabel === "yesterday") return t("timeYesterday");
    return group.dayKey;
  };

  const daypartLabel: Record<string, string> = {
    earlyMorning: t("daypartEarlyMorning"),
    morning: t("daypartMorning"),
    afternoon: t("daypartAfternoon"),
    evening: t("daypartEvening"),
    night: t("daypartNight"),
  };

  const renderDay = (group: NarrativeTimeline["days"][number]) => (
    <div key={group.dayKey} className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">
        {dayLabel(group)}
      </h3>
      {group.segments.length > 0 ? (
        group.segments.map((segment) => (
          <div key={segment.daypart} className="space-y-2">
            <p className="text-xs text-muted-foreground/70">
              {daypartLabel[segment.daypart]}
            </p>
            <div className="space-y-2">
              {segment.records.map((record) => (
                <div key={record.id}>{renderRecord(record)}</div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="space-y-2">
          {group.records.map((record) => (
            <div key={record.id}>{renderRecord(record)}</div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {timeline.days.map(renderDay)}
      {timeline.months.map((month) => (
        <div key={month.monthKey} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {month.monthKey}
          </h3>
          <div className="space-y-4">
            {month.days.map((day) => (
              <div key={day.dayKey} className="space-y-2">
                <p className="text-xs text-muted-foreground/70">{day.dayKey}</p>
                <div className="space-y-2">
                  {day.records.map((record) => (
                    <div key={record.id}>{renderRecord(record)}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
