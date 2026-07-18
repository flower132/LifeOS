"use client";

import { useEffect, useState } from "react";
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
  splitChapter,
  ReplayPeriod,
  TimeSnapshot,
  TimeTravelPreset,
} from "@/lib/graph/timeline";
import { answerTimelineQuestion } from "@/lib/graph/timeline/qa";
import { useLongTermMemoryStore } from "@/stores/longTermMemoryStore";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Sparkles } from "lucide-react";
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
    travel: t("timeTravel") ?? "时间旅行",
    replay: t("lifeReplay") ?? "人生回放",
    search: t("timelineSearch") ?? "时间线搜索",
    chapters: t("lifeChapters") ?? "人生章节",
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
  const [snapshot, setSnapshot] = useState<TimeSnapshot | null>(() =>
    getSnapshotAt(presetDate("month"))
  );
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始建议：仅异步 setState（effect 内不同步 setState，遵循 react-hooks 规则）。
  useEffect(() => {
    let cancelled = false;
    const snap = getSnapshotAt(presetDate("month"));
    void generateTimeTravelAdvice(snap).then((text) => {
      if (cancelled) return;
      setAdvice(text);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 事件处理器中可以自由 setState。
  const load = (p: TimeTravelPreset) => {
    setPreset(p);
    const snap = getSnapshotAt(presetDate(p));
    setSnapshot(snap);
    setAdvice(null);
    setLoading(true);
    void generateTimeTravelAdvice(snap).then((text) => {
      setAdvice(text);
      setLoading(false);
    });
  };

  const PRESETS: { key: TimeTravelPreset; label: string }[] = [
    { key: "week", label: t("oneWeekAgo") ?? "一周前" },
    { key: "month", label: t("oneMonthAgo") ?? "一个月前" },
    { key: "year", label: t("oneYearAgo") ?? "一年前" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            variant={preset === p.key ? "primary" : "secondary"}
            size="sm"
            onClick={() => void load(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {snapshot && (
        <div className="space-y-2 text-sm">
          <p className="text-xs text-muted-foreground">
            {snapshot.date} · {t("readOnly") ?? "只读，历史不可修改"}
          </p>
          {snapshot.todayFocusTitle && (
            <p className="text-foreground">🎯 {snapshot.todayFocusTitle}</p>
          )}
          {snapshot.activeGoals.length > 0 && (
            <p className="text-muted-foreground">
              {t("activeGoals") ?? "进行中的目标"}：
              {snapshot.activeGoals.map((g) => g.name).join("、")}
            </p>
          )}
          {snapshot.activeProjects.length > 0 && (
            <p className="text-muted-foreground">
              {t("activeProjects") ?? "进行中的项目"}：
              {snapshot.activeProjects.map((p) => p.name).join("、")}
            </p>
          )}
          {snapshot.peopleContacted.length > 0 && (
            <p className="text-muted-foreground">
              {t("peopleContacted") ?? "当周联系"}：
              {snapshot.peopleContacted.map((p) => `${p.name}（${p.count}次）`).join("、")}
            </p>
          )}
          {snapshot.memoriesThatWeek.length > 0 && (
            <ul className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {snapshot.memoriesThatWeek.map((m) => (
                <li key={m.id}>
                  {m.date} · {m.text}
                </li>
              ))}
            </ul>
          )}
          {loading ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("analyzing") ?? "分析中…"}
            </p>
          ) : advice ? (
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm leading-relaxed text-foreground">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                {t("ifBackToThatDay") ?? "如果回到那一天"}
              </p>
              {advice}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Life Replay ─────────────────────────────────────────────────────────────

function ReplayTab() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<ReplayPeriod>("month");
  const [text, setText] = useState<string | null>(() => getReplay("month"));
  const [loading, setLoading] = useState(() => getReplay("month") === null);

  // 初次生成：仅异步 setState。
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
    { key: "month", label: t("thisMonth") ?? "本月" },
    { key: "quarter", label: t("thisQuarter") ?? "本季度" },
    { key: "year", label: t("thisYear") ?? "今年" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.key}
            variant={period === p.key ? "primary" : "secondary"}
            size="sm"
            onClick={() => void load(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      {loading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("analyzing") ?? "分析中…"}
        </p>
      ) : text ? (
        <p className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
          {text}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("replayEmpty") ?? "这段时间还没有足够的记录生成回放。"}
        </p>
      )}
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
            t("timelineSearchPlaceholder") ??
            "例如：第一次见张三是什么时候？今年完成了哪些目标？"
          }
        />
        <Button onClick={() => void ask()} disabled={loading || !question.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (t("search") ?? "搜索")}
        </Button>
      </div>
      {answer && (
        <p className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
          {answer}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {t("timelineSearchHint") ?? "回答只来自你的时间线，不会自由发挥。"}
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
          {t("generateChapters") ?? "AI 生成章节"}
        </Button>
        {selected.size >= 2 && (
          <Button size="sm" variant="secondary" onClick={() => void handleMerge()}>
            {t("mergeSelected") ?? `合并所选（${selected.size}）`}
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("chaptersEmpty") ?? "还没有章节。点击「AI 生成章节」让 AI 根据你的时间线划分人生阶段。"}
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
                          {t("save") ?? "保存"}
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
                        title={t("renameChapter") ?? "点击重命名"}
                      >
                        {chapter.title}
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {chapter.startDate.slice(0, 10)} → {chapter.endDate?.slice(0, 10) ?? (t("ongoing") ?? "进行中")}
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
                  {t("splitChapter") ?? "拆分"}
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
                    {t("confirm") ?? "确定"}
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
