"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LifeChapter } from "@/lib/types";
import {
  generateAIChapters,
  generateReplay,
  generateTimeTravelAdvice,
  getReplay,
  getSnapshotAt,
  mergeChapters,
  presetDate,
  renameChapter,
  replayRange,
  splitChapter,
  ReplayPeriod,
  TimeTravelPreset,
} from "@/lib/graph/timeline";
import { computeTimelineStats } from "@/lib/graph/timeline/timelineDiff";
import { queryTimeline } from "@/lib/graph/timeline/timelineQuery";
import { rankTimelineEvents } from "@/lib/graph/timeline/timelineRank";
import { answerTimelineQuestion } from "@/lib/graph/timeline/qa";
import { useLongTermMemoryStore } from "@/stores/longTermMemoryStore";
import { useObjectStore } from "@/stores/objectStore";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Loader2,
  Sparkles,
  Users,
  FolderKanban,
  Target,
  ChevronDown,
  ChevronUp,
  CalendarDays,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

export type ExplorerTab = "travel" | "replay" | "search" | "chapters";

interface TimelineExplorerDialogProps {
  tab: ExplorerTab | null;
  onClose: () => void;
}

const TABS: ExplorerTab[] = ["travel", "replay", "search", "chapters"];

/** 时间线探索器 — 时间旅行 / 人生回放 / 时间线搜索 / 人生章节。 */
export function TimelineExplorerDialog({ tab, onClose }: TimelineExplorerDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ExplorerTab>(tab ?? "travel");
  // 官方 derived-state 模式：render 期间同步 prop 变化（避免 effect 中同步 setState）。
  const [prevTab, setPrevTab] = useState(tab);
  if (tab !== prevTab) {
    setPrevTab(tab);
    if (tab) setActiveTab(tab);
  }

  const TAB_LABEL: Record<ExplorerTab, string> = {
    travel: t("timeTravel"),
    replay: t("lifeReplay"),
    search: t("timelineSearch"),
    chapters: t("lifeChapters"),
  };

  return (
    <Dialog open={tab !== null} onClose={onClose} maxWidth="md">
      <div className="space-y-4">
        <nav className="flex gap-1 border-b border-border">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`border-b-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_LABEL[key]}
            </button>
          ))}
        </nav>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {activeTab === "travel" && <TravelTab />}
          {activeTab === "replay" && <ReplayTab />}
          {activeTab === "search" && <SearchTab />}
          {activeTab === "chapters" && <ChaptersTab />}
        </div>
      </div>
    </Dialog>
  );
}

// ── Time Travel（只读）───────────────────────────────────────────────────────

function TravelTab() {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<TimeTravelPreset>("month");
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Track store hydration — triggers re-render when data becomes available
  const objectsLoaded = useObjectStore((s) => s.loaded);

  // Compute snapshot during render — re-runs when preset or store data changes
  const date = useMemo(() => presetDate(preset), [preset]);
  const snapshot = useMemo(
    () => getSnapshotAt(date),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date, objectsLoaded, preset]
  );

  // AI advice generation — triggered by preset or store hydration
  useEffect(() => {
    let cancelled = false;
    void generateTimeTravelAdvice(snapshot).then((text) => {
      if (cancelled) return;
      setAdvice(text);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, objectsLoaded]);

  const load = (p: TimeTravelPreset) => {
    setPreset(p);
    setAdvice(null);
    setLoading(true);
  };

  const PRESETS: { key: TimeTravelPreset; label: string }[] = [
    { key: "week", label: t("oneWeekAgo") },
    { key: "month", label: t("oneMonthAgo") },
    { key: "year", label: t("oneYearAgo") },
  ];

  const hasAnyData = snapshot
    ? snapshot.activeGoals.length > 0 ||
      snapshot.activeProjects.length > 0 ||
      snapshot.peopleContacted.length > 0 ||
      snapshot.memoriesThatWeek.length > 0 ||
      snapshot.todayFocusTitle != null ||
      snapshot.reflectionQuestion != null
    : false;

  const totalDataPoints = snapshot
    ? snapshot.activeGoals.length +
      snapshot.activeProjects.length +
      snapshot.peopleContacted.length +
      snapshot.memoriesThatWeek.length +
      snapshot.events.length
    : 0;

  const isSparseData = hasAnyData && totalDataPoints <= 2;

  return (
    <div className="space-y-3">
      {/* Period selector */}
      <div className="flex gap-1 rounded-lg bg-muted/40 p-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => void load(p.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-fast ${
              preset === p.key
                ? "bg-surface text-primary shadow-sm"
                : "text-secondary hover:text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stores still loading */}
      {!objectsLoaded ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-sm text-secondary">{t("common.loading")}</p>
        </div>
      ) : snapshot && hasAnyData ? (
        <div className="space-y-3 animate-fade-in">
          {/* ── Date header + graph size ── */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
              <CalendarDays className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">{snapshot.date}</p>
              <p className="text-xs text-tertiary">
                {snapshot.graphSize.objects} {t("dev.objects")} ·{" "}
                {snapshot.graphSize.relations} {t("common.object_other", { count: 0 }).replace("0 ", "")}
                {" · "}{t("readOnly")}
              </p>
            </div>
          </div>

          {/* Sparse data notice */}
          {isSparseData && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-xs text-secondary">
              {t("travelSparseData")}
            </div>
          )}

          {/* Today Focus (if existed) */}
          {snapshot.todayFocusTitle && (
            <div className="rounded-lg border border-accent/10 bg-accent/[0.03] px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                {t("todayFocusLabel") ?? "Today's Focus"}
              </p>
              <p className="mt-0.5 text-sm text-primary">🎯 {snapshot.todayFocusTitle}</p>
            </div>
          )}

          {/* Reflection (if existed) */}
          {snapshot.reflectionQuestion && (
            <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                {t("eveningReflection")}
              </p>
              <p className="mt-0.5 text-sm text-primary">💭 {snapshot.reflectionQuestion}</p>
            </div>
          )}

          {/* Active Goals */}
          {snapshot.activeGoals.length > 0 && (
            <EntitySection
              icon={<Target className="h-3.5 w-3.5" />}
              title={t("activeGoals")}
            >
              <div className="flex flex-wrap gap-1.5">
                {snapshot.activeGoals.map((g) => (
                  <Link
                    key={g.id}
                    href={`/objects/${g.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-primary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                  >
                    {g.name}
                    <span className="text-[10px] text-tertiary">{g.status}</span>
                  </Link>
                ))}
              </div>
            </EntitySection>
          )}

          {/* Active Projects */}
          {snapshot.activeProjects.length > 0 && (
            <EntitySection
              icon={<FolderKanban className="h-3.5 w-3.5" />}
              title={t("activeProjects")}
            >
              <div className="flex flex-wrap gap-1.5">
                {snapshot.activeProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/objects/${p.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-primary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                  >
                    {p.name}
                    <span className="text-[10px] text-tertiary">{p.status}</span>
                  </Link>
                ))}
              </div>
            </EntitySection>
          )}

          {/* People Contacted */}
          {snapshot.peopleContacted.length > 0 && (
            <EntitySection
              icon={<Users className="h-3.5 w-3.5" />}
              title={t("peopleContacted")}
            >
              <div className="flex flex-wrap gap-1.5">
                {snapshot.peopleContacted.map((p) => (
                  <Link
                    key={p.id}
                    href={`/objects/${p.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-primary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                  >
                    {p.name}
                    <span className="text-[10px] text-tertiary">{p.count}{p.count === 1 ? " time" : " times"}</span>
                  </Link>
                ))}
              </div>
            </EntitySection>
          )}

          {/* Memories */}
          {snapshot.memoriesThatWeek.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-tertiary">
                  {t("replayMemories")}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-1">
                {snapshot.memoriesThatWeek.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg px-2.5 py-1.5 text-xs text-secondary transition-colors hover:bg-muted/40"
                  >
                    <span className="mr-2 font-medium text-tertiary tabular-nums">{m.date}</span>
                    {m.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Events */}
          {snapshot.events.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-tertiary">
                  {t("replayKeyMoments")}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-0.5">
                {snapshot.events.slice(0, 8).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/40"
                  >
                    <span className="mt-0.5 shrink-0 text-[10px] text-tertiary tabular-nums">
                      {new Date(event.timestamp).toLocaleDateString("zh-CN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="min-w-0 break-words text-primary">
                      {event.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Advice */}
          {loading ? (
            <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span className="text-xs text-secondary">{t("analyzing")}</span>
            </div>
          ) : advice ? (
            <div className="rounded-xl border border-accent/15 bg-accent/[0.03] p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                {t("ifBackToThatDay")}
              </p>
              <p className="text-sm leading-relaxed text-primary">{advice}</p>
            </div>
          ) : null}
        </div>
      ) : (
        /* ── Empty state: no data at all for this period ── */
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-6 w-6 text-tertiary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">
              {t("travelEmptyTitle")}
            </p>
            <p className="max-w-xs text-xs text-secondary">
              {t("travelEmptyDescription")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Life Replay ─────────────────────────────────────────────────────────────

const INITIAL_EVENTS = 5;

function ReplayTab() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<ReplayPeriod>("month");
  const [text, setText] = useState<string | null>(() => getReplay("month"));
  const [loading, setLoading] = useState(() => getReplay("month") === null);
  const [expanded, setExpanded] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const range = useMemo(() => replayRange(period, new Date()), [period]);

  const { stats, topEvents } = useMemo(() => {
    const s = computeTimelineStats(range.from, range.to, range.label);
    const events = queryTimeline({ from: range.from, to: range.to, limit: 200 });
    const top = rankTimelineEvents(events, 15);
    return { stats: s, topEvents: top };
  }, [range.from, range.to, range.label]);

  // Resolve object IDs → names for goals (stats.goalsProgressed are IDs)
  const objects = useObjectStore((s) => s.objects);
  const goalNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of objects) {
      map.set(o.id, o.name);
    }
    return stats.goalsProgressed
      .map((id) => ({ id, name: map.get(id) ?? id }))
      .filter((g) => g.name);
  }, [objects, stats.goalsProgressed]);

  // Initial generation
  useEffect(() => {
    if (getReplay("month") !== null) return;
    let cancelled = false;
    void generateReplay("month").then((generated) => {
      if (cancelled) return;
      setText(generated);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = (p: ReplayPeriod) => {
    setPeriod(p);
    setExpanded(false);
    setShowAllEvents(false);
    const cached = getReplay(p);
    if (cached) {
      setText(cached);
      setLoading(false);
      return;
    }
    setText(null);
    setLoading(true);
    void generateReplay(p).then((generated) => {
      setText(generated);
      setLoading(false);
    });
  };

  const PERIODS: { key: ReplayPeriod; label: string }[] = [
    { key: "month", label: t("thisMonth") },
    { key: "quarter", label: t("thisQuarter") },
    { key: "year", label: t("thisYear") },
  ];

  const hasContent = text || stats.totalEvents > 0;

  return (
    <div className="space-y-4">
      {/* Period selector — pill style */}
      <div className="flex gap-1 rounded-lg bg-muted/40 p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => void load(p.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-fast ${
              period === p.key
                ? "bg-surface text-primary shadow-sm"
                : "text-secondary hover:text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-sm text-secondary">{t("analyzing")}</p>
        </div>
      ) : hasContent ? (
        <div className="space-y-4 animate-fade-in">
          {/* ── Period header ── */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
              <CalendarDays className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">{range.label}</p>
              <p className="text-xs text-tertiary">
                {new Date(range.from).toLocaleDateString(
                  "zh-CN",
                  { year: "numeric", month: "short", day: "numeric" }
                )}
                {" — "}
                {new Date(range.to).toLocaleDateString(
                  "zh-CN",
                  { year: "numeric", month: "short", day: "numeric" }
                )}
              </p>
            </div>
          </div>

          {/* ── AI Summary card ── */}
          {text && (
            <div className="rounded-xl border border-accent/15 bg-accent/[0.03] p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                  {t("replayAIInsight")}
                </span>
              </div>
              <div className={`text-sm leading-relaxed text-primary ${expanded ? "" : "line-clamp-4"}`}>
                {text}
              </div>
              {text.length > 240 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  {expanded ? t("replayShowLess") : t("expand")}
                  {expanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatBadge label={t("replayEvents")} value={stats.totalEvents} />
            <StatBadge label={t("replayMemories")} value={stats.memoriesCreated} />
            <StatBadge label={t("replayNotes")} value={stats.notesCreated} />
            <StatBadge
              label={t("replayNewRelations")}
              value={stats.newRelations + stats.discoveredRelations}
            />
          </div>

          {/* ── Active People ── */}
          {stats.activePeople.length > 0 && (
            <EntitySection
              icon={<Users className="h-3.5 w-3.5" />}
              title={t("replayActivePeople")}
            >
              <div className="flex flex-wrap gap-1.5">
                {stats.activePeople.map((p) => (
                  <Link
                    key={p.id}
                    href={`/objects/${p.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-primary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                  >
                    {p.name}
                    <span className="text-[10px] text-tertiary">{p.count}</span>
                  </Link>
                ))}
              </div>
            </EntitySection>
          )}

          {/* ── Active Projects ── */}
          {stats.activeProjects.length > 0 && (
            <EntitySection
              icon={<FolderKanban className="h-3.5 w-3.5" />}
              title={t("replayActiveProjects")}
            >
              <div className="flex flex-wrap gap-1.5">
                {stats.activeProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/objects/${p.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-primary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                  >
                    {p.name}
                    <span className="text-[10px] text-tertiary">{p.count}</span>
                  </Link>
                ))}
              </div>
            </EntitySection>
          )}

          {/* ── Goals Progressed ── */}
          {goalNames.length > 0 && (
            <EntitySection
              icon={<Target className="h-3.5 w-3.5" />}
              title={t("replayGoalsProgressed")}
            >
              <div className="flex flex-wrap gap-1.5">
                {goalNames.map((g) => (
                  <Link
                    key={g.id}
                    href={`/objects/${g.id}`}
                    className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-primary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </EntitySection>
          )}

          {/* ── Key Moments ── */}
          {topEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-tertiary">
                  {t("replayKeyMoments")}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-1">
                {topEvents
                  .slice(0, showAllEvents ? topEvents.length : INITIAL_EVENTS)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted/40"
                    >
                      <span className="mt-0.5 shrink-0 text-[10px] font-medium text-tertiary tabular-nums">
                        {new Date(event.timestamp).toLocaleDateString(
                          "zh-CN",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                      <span className="min-w-0 break-words text-primary">
                        {event.title}
                      </span>
                      {event.objectId && event.objectType && (
                        <Link
                          href={`/objects/${event.objectId}`}
                          className="ml-auto shrink-0 text-xs text-accent hover:text-accent/80 transition-colors"
                        >
                          {t("view")}
                        </Link>
                      )}
                    </div>
                  ))}
              </div>
              {topEvents.length > INITIAL_EVENTS && (
                <button
                  type="button"
                  onClick={() => setShowAllEvents((v) => !v)}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-muted/40 hover:text-primary"
                >
                  {showAllEvents
                    ? t("replayShowLess")
                    : t("replayShowMore", { count: topEvents.length })}
                  {showAllEvents ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-5 w-5 text-tertiary" />
          </div>
          <p className="max-w-xs text-sm text-secondary">
            {t("replayEmpty")}
          </p>
        </div>
      )}
    </div>
  );
}

// ── ReplayTab sub-components ────────────────────────────────────────────────

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5 text-center">
      <p className="text-lg font-semibold tabular-nums text-primary">{value}</p>
      <p className="text-[11px] text-tertiary">{label}</p>
    </div>
  );
}

function EntitySection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-tertiary">{icon}</span>
        <span className="text-xs font-medium text-secondary">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── Timeline Search ─────────────────────────────────────────────────────────

function SearchTab() {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    try {
      setAnswer(await answerTimelineQuestion(question.trim()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void ask()}
          placeholder={
            t("timelineSearchPlaceholder")
          }
        />
        <Button onClick={() => void ask()} disabled={loading || !question.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (t("search"))}
        </Button>
      </div>
      {answer && (
        <p className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
          {answer}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {t("timelineSearchHint")}
      </p>
    </div>
  );
}

// ── Life Chapters ───────────────────────────────────────────────────────────

function ChaptersTab() {
  const { t } = useTranslation();
  const chapters = useLongTermMemoryStore((s) => s.chapters);
  const [generating, setGenerating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [splittingId, setSplittingId] = useState<string | null>(null);
  const [splitDate, setSplitDate] = useState("");

  const sorted = [...chapters].sort((a, b) => b.startDate.localeCompare(a.startDate));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateAIChapters();
    } finally {
      setGenerating(false);
    }
  };

  const handleRename = async (id: string) => {
    await renameChapter(id, renameValue);
    setRenamingId(null);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMerge = async () => {
    if (selected.size < 2) return;
    await mergeChapters([...selected]);
    setSelected(new Set());
  };

  const handleSplit = async (id: string) => {
    if (!splitDate) return;
    await splitChapter(id, splitDate);
    setSplittingId(null);
    setSplitDate("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => void handleGenerate()} disabled={generating}>
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {t("generateChapters")}
        </Button>
        {selected.size >= 2 && (
          <Button size="sm" variant="secondary" onClick={() => void handleMerge()}>
            {t("mergeSelected") ?? `合并所选（${selected.size}）`}
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("chaptersEmpty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((chapter) => (
            <li key={chapter.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(chapter.id)}
                    onChange={() => toggleSelect(chapter.id)}
                    className="mt-1 h-4 w-4 rounded border-input text-accent"
                  />
                  <div>
                    {renamingId === chapter.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && void handleRename(chapter.id)}
                        />
                        <Button size="sm" onClick={() => void handleRename(chapter.id)}>
                          {t("save")}
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="text-sm font-medium text-foreground hover:text-accent"
                        onClick={() => {
                          setRenamingId(chapter.id);
                          setRenameValue(chapter.title);
                        }}
                        title={t("renameChapter")}
                      >
                        {chapter.title}
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {chapter.startDate.slice(0, 10)} → {chapter.endDate?.slice(0, 10) ?? (t("ongoing"))}
                    </p>
                    {chapter.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{chapter.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSplittingId(splittingId === chapter.id ? null : chapter.id);
                    setSplitDate("");
                  }}
                >
                  {t("splitChapter")}
                </Button>
              </div>
              {splittingId === chapter.id && (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="date"
                    value={splitDate}
                    onChange={(e) => setSplitDate(e.target.value)}
                  />
                  <Button size="sm" onClick={() => void handleSplit(chapter.id)} disabled={!splitDate}>
                    {t("confirm")}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Referenced to keep import graph explicit for tree-shaking clarity.
export type { LifeChapter };
