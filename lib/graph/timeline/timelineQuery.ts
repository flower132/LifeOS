import { TimelineEvent, TimelineEventType } from "./types";
import { getTimelineEvents } from "./timelineBuilder";

// ---------------------------------------------------------------------------
// Timeline Query — structured filtering + keyword/time-expression matching
// for grounded Q&A ("去年发生了什么" / "第一次见张三是什么时候").
// ---------------------------------------------------------------------------

export interface TimelineQuery {
  types?: TimelineEventType[];
  objectId?: string;
  relationId?: string;
  projectId?: string;
  goalId?: string;
  actor?: TimelineEvent["actor"];
  from?: number;
  to?: number;
  keyword?: string;
  limit?: number;
}

export function queryTimeline(query: TimelineQuery): TimelineEvent[] {
  let events = getTimelineEvents();

  if (query.types?.length) {
    const set = new Set(query.types);
    events = events.filter((e) => set.has(e.type));
  }
  if (query.objectId) {
    events = events.filter(
      (e) =>
        e.objectId === query.objectId ||
        e.goalId === query.objectId ||
        e.projectId === query.objectId ||
        e.metadata.otherObjectId === query.objectId
    );
  }
  if (query.relationId) {
    events = events.filter((e) => e.relationId === query.relationId);
  }
  if (query.projectId) {
    events = events.filter((e) => e.projectId === query.projectId);
  }
  if (query.goalId) {
    events = events.filter((e) => e.goalId === query.goalId);
  }
  if (query.actor) {
    events = events.filter((e) => e.actor === query.actor);
  }
  if (query.from !== undefined) {
    events = events.filter((e) => e.timestamp >= query.from!);
  }
  if (query.to !== undefined) {
    events = events.filter((e) => e.timestamp <= query.to!);
  }
  if (query.keyword) {
    const kw = query.keyword.trim().toLowerCase();
    if (kw) {
      events = events.filter((e) => matchesKeyword(e, kw));
    }
  }

  return events.slice(0, query.limit ?? 50);
}

function matchesKeyword(event: TimelineEvent, keyword: string): boolean {
  return (
    event.title.toLowerCase().includes(keyword) ||
    (event.objectName ?? "").toLowerCase().includes(keyword) ||
    String(event.metadata.label ?? "").toLowerCase().includes(keyword) ||
    (event.metadata.topics as string[] | undefined)?.some((t) =>
      t.toLowerCase().includes(keyword)
    ) === true
  );
}

// ---------------------------------------------------------------------------
// Natural-language matching for Timeline Search (Q&A grounding).
// ---------------------------------------------------------------------------

export interface ParsedTimeRange {
  from?: number;
  to?: number;
  /** e.g. "去年" / "今年" / "上个月" — for grounding the answer. */
  label?: string;
  /** "first" intent: 第一次/最早. */
  first?: boolean;
  /** "when" intent: 什么时候/何时/哪天. */
  when?: boolean;
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** Parse simple Chinese time expressions into a range. */
export function parseTimeExpression(question: string, now = Date.now()): ParsedTimeRange {
  const result: ParsedTimeRange = {};
  const year = new Date(now).getFullYear();

  if (question.includes("去年")) {
    result.from = new Date(`${year - 1}-01-01`).getTime();
    result.to = new Date(`${year - 1}-12-31T23:59:59`).getTime();
    result.label = "去年";
  } else if (question.includes("今年")) {
    result.from = new Date(`${year}-01-01`).getTime();
    result.label = "今年";
  } else if (question.includes("上个月") || question.includes("上月")) {
    const d = new Date(now);
    const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const last = new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59);
    result.from = first.getTime();
    result.to = last.getTime();
    result.label = "上个月";
  } else if (question.includes("这个月") || question.includes("本月")) {
    const d = new Date(now);
    result.from = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    result.label = "本月";
  } else if (question.includes("最近一周") || question.includes("这一周")) {
    result.from = now - 7 * DAY_MS;
    result.label = "最近一周";
  } else if (question.includes("最近一个月") || question.includes("近一个月")) {
    result.from = now - 30 * DAY_MS;
    result.label = "最近一个月";
  } else if (question.includes("最近三个月") || question.includes("近三个月")) {
    result.from = now - 90 * DAY_MS;
    result.label = "最近三个月";
  }

  if (question.includes("第一次") || question.includes("最早")) result.first = true;
  if (question.includes("什么时候") || question.includes("何时") || question.includes("哪天")) {
    result.when = true;
  }

  return result;
}

/**
 * Match events for a free-text question: time expression + keywords
 * (stopwords removed). `first` intent reverses order to return the earliest.
 */
export function matchEventsForQuestion(
  question: string,
  limit = 20
): { events: TimelineEvent[]; parsed: ParsedTimeRange } {
  const parsed = parseTimeExpression(question);

  const STOPWORDS = [
    "什么时候", "第一次", "最早", "是什么", "发生了", "发生", "哪些", "什么",
    "时候", "去年", "今年", "上个月", "这个月", "本月", "上月", "最近", "一周",
    "一个月", "三个月", "近一个月", "近三个月", "我", "的", "了", "吗", "呢",
    "？", "?", "是", "有", "和", "跟", "与",
  ];
  const keywords = question
    .split(/[\s，,。.、；;：:（）()]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOPWORDS.includes(w));

  let events = queryTimeline({ from: parsed.from, to: parsed.to, limit: 500 });

  if (keywords.length > 0) {
    events = events.filter((e) =>
      keywords.some((kw) => matchesKeyword(e, kw.toLowerCase()))
    );
  }

  if (parsed.first) {
    events = [...events].sort((a, b) => a.timestamp - b.timestamp);
  }

  return { events: events.slice(0, limit), parsed };
}
