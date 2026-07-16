import { useMemo } from "react";
import { Note } from "@/lib/types";
import { NoteCard } from "./NoteCard";
import { MemoryTimeline } from "@/components/memory/MemoryTimeline";
import { buildMemoryStream } from "@/lib/services/memoryStream";
import { buildTimeline } from "@/lib/services/timelineService";

interface NoteTimelineProps {
  notes: Note[];
}

/**
 * 对象级记忆时间线 —— 叙事结构由 TimelineService 统一生成
 * （今天 / 昨天 → 上午 · 下午 · 晚上；更早按天、按月），
 * 组件只负责展示，不自行计算时间。
 */
export function NoteTimeline({ notes }: NoteTimelineProps) {
  const noteById = useMemo(
    () => new Map(notes.map((n) => [n.id, n])),
    [notes]
  );

  const timeline = useMemo(() => {
    const records = buildMemoryStream({ notes, objects: [] });
    return buildTimeline(records, "all");
  }, [notes]);

  return (
    <MemoryTimeline
      timeline={timeline}
      renderRecord={(record) => {
        const note = noteById.get(record.sourceId);
        return note ? <NoteCard note={note} /> : null;
      }}
    />
  );
}
