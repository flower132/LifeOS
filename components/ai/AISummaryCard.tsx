"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

/**
 * AISummaryCard — LifeOS 统一的 AI 摘要展示组件。
 *
 * 所有 AI 总结（Timeline / Life Replay / Time Travel / Relationship / Goal /
 * Project / Reflection / Review …）都应使用本组件，禁止页面自行拼 UI。
 *
 * 能力：
 * - 头部：AI Insight 图标 + 标题 + 生成时间 + Provider（仅开发模式）
 * - 正文：轻量结构化渲染（bullet / highlight label / quote / **bold**），
 *   最佳阅读宽度与舒适行高
 * - 长内容默认折叠，展开/收起带自然动画
 * - 状态统一：loading / generating / streaming / completed / failed / empty
 * - 深浅主题自动适配（全部使用 design tokens）
 */

export type AISummaryStatus =
  | "loading"
  | "generating"
  | "streaming"
  | "completed"
  | "failed"
  | "empty";

export interface AISummaryCardProps {
  /** AI 摘要正文（纯文本，支持 - / • 列表、> 引用、**标签**：内容、**粗体**）。 */
  content?: string | null;
  /** 显式状态；缺省时由 content 推导（有内容 completed，否则 empty）。 */
  status?: AISummaryStatus;
  /** 标题，默认 t("aiSummary")。 */
  title?: string;
  /** 自定义头部图标（默认 Sparkles）。 */
  icon?: ReactNode;
  /** 生成时间，显示在标题右侧。 */
  generatedAt?: number | string | Date;
  /** Provider 标识，仅开发模式可见。 */
  provider?: string;
  /** 超过该字符数时默认折叠，默认 320。 */
  collapseThreshold?: number;
  defaultExpanded?: boolean;
  emptyText?: string;
  errorText?: string;
  onRetry?: () => void;
  className?: string;
}

// ── 轻量结构化解析 ──────────────────────────────────────────────────────────

type Block =
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "labeled"; label: string; text: string };

/** 常见 AI 洞察小标题（zh / en / ja），命中则渲染为 highlight tag。 */
const KNOWN_LABELS = new Set(
  [
    "最大的成长", "最大成长", "成长", "变化", "收获", "洞察",
    "关键人物", "重要事件", "关键事件", "关键时刻", "亮点",
    "建议", "下一步", "行动", "总结", "概览", "重点",
    "biggest growth", "growth", "key people", "key events", "key moments",
    "highlights", "suggestion", "suggestions", "advice", "next steps",
    "next step", "summary", "overview", "insight", "insights", "action items",
    "成長", "変化", "キーパーソン", "重要な出来事", "提案", "次のステップ", "要約",
  ].map((s) => s.toLowerCase())
);

const BULLET_RE = /^\s*(?:[-*•]|\d{1,2}[.)])\s+/;
const QUOTE_RE = /^\s*>\s?/;
// **标签**：内容  或  标签：内容（标签需命中词表）
const LABELED_RE = /^\s*(?:\*\*(.+?)\*\*|(.+?))\s*[：:]\s*(.*)$/;

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length > 0) {
      blocks.push({ kind: "bullets", items: bullets });
      bullets = [];
    }
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      continue;
    }
    if (BULLET_RE.test(line)) {
      bullets.push(line.replace(BULLET_RE, ""));
      continue;
    }
    flushBullets();
    if (QUOTE_RE.test(line)) {
      blocks.push({ kind: "quote", text: line.replace(QUOTE_RE, "") });
      continue;
    }
    const labeled = line.match(LABELED_RE);
    if (labeled) {
      const label = (labeled[1] ?? labeled[2] ?? "").trim();
      const rest = (labeled[3] ?? "").trim();
      const isMarkdownLabel = labeled[1] != null;
      if (
        rest &&
        label.length <= 20 &&
        (isMarkdownLabel || KNOWN_LABELS.has(label.toLowerCase()))
      ) {
        blocks.push({ kind: "labeled", label, text: rest });
        continue;
      }
    }
    blocks.push({ kind: "paragraph", text: line });
  }
  flushBullets();
  return blocks;
}

/** 行内 **粗体** 渲染。 */
function renderInline(text: string): ReactNode {
  if (!text.includes("**")) return text;
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

// ── 组件 ────────────────────────────────────────────────────────────────────

const COLLAPSED_HEIGHT = 132; // px，折叠时可见高度（约 5 行）

export function AISummaryCard({
  content,
  status,
  title,
  icon,
  generatedAt,
  provider,
  collapseThreshold = 320,
  defaultExpanded = false,
  emptyText,
  errorText,
  onRetry,
  className,
}: AISummaryCardProps) {
  const { t, locale } = useTranslation();

  const resolvedStatus: AISummaryStatus =
    status ?? (content ? "completed" : "empty");

  const text = content?.trim() ?? "";
  const blocks = useMemo(() => (text ? parseBlocks(text) : []), [text]);

  const collapsible = text.length > collapseThreshold;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState<number>(COLLAPSED_HEIGHT);

  // 内容变化时重新测量高度，保证展开动画自然。
  useEffect(() => {
    if (bodyRef.current) setBodyHeight(bodyRef.current.scrollHeight);
  }, [text, expanded]);

  const formattedTime = useMemo(() => {
    if (!generatedAt) return null;
    const d = new Date(generatedAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [generatedAt, locale]);

  const showProvider = process.env.NODE_ENV === "development" && provider;

  return (
    <section
      className={cn(
        "rounded-xl border border-accent/15 bg-surface shadow-sm",
        className
      )}
    >
      {/* ── Header ── */}
      <header className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
          {icon ?? <Sparkles className="h-3.5 w-3.5 text-accent" />}
        </span>
        <h3 className="text-sm font-semibold text-foreground">
          {title ?? t("aiSummary")}
        </h3>
        <span className="ml-auto flex items-center gap-2">
          {showProvider && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-tertiary">
              {provider}
            </span>
          )}
          {formattedTime && (
            <time className="text-xs text-tertiary tabular-nums">
              {formattedTime}
            </time>
          )}
        </span>
      </header>

      {/* ── Body ── */}
      <div className="px-4 pb-3.5">
        {resolvedStatus === "loading" || resolvedStatus === "generating" ? (
          <div className="space-y-2.5 py-1" aria-busy="true">
            <div className="flex items-center gap-2 text-xs text-secondary">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              {resolvedStatus === "generating"
                ? t("aiSummaryGenerating")
                : t("common.loading")}
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3.5 w-11/12 animate-pulse rounded bg-accent/10" />
              <div className="h-3.5 w-full animate-pulse rounded bg-accent/10" />
              <div className="h-3.5 w-3/5 animate-pulse rounded bg-accent/10" />
            </div>
          </div>
        ) : resolvedStatus === "failed" ? (
          <div className="flex items-center gap-3 py-1.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" />
            <p className="text-sm text-secondary">
              {errorText ?? t("aiSummaryFailed")}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-secondary transition-colors hover:border-accent/30 hover:text-accent"
              >
                <RefreshCw className="h-3 w-3" />
                {t("retry")}
              </button>
            )}
          </div>
        ) : resolvedStatus === "empty" || !text ? (
          <p className="py-1 text-sm text-tertiary">
            {emptyText ?? t("aiSummaryEmpty")}
          </p>
        ) : (
          <>
            <div
              className="relative overflow-hidden transition-[max-height] duration-300 ease-in-out"
              style={{
                maxHeight:
                  collapsible && !expanded
                    ? COLLAPSED_HEIGHT
                    : Math.max(bodyHeight, COLLAPSED_HEIGHT),
              }}
            >
              <div
                ref={bodyRef}
                className="max-w-[65ch] space-y-2 py-0.5 text-sm leading-7 text-primary"
              >
                {blocks.map((block, i) => {
                  switch (block.kind) {
                    case "bullets":
                      return (
                        <ul key={i} className="space-y-1.5">
                          {block.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2.5">
                              <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/50" />
                              <span className="min-w-0">{renderInline(item)}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    case "quote":
                      return (
                        <blockquote
                          key={i}
                          className="border-l-2 border-accent/30 pl-3 text-secondary"
                        >
                          {renderInline(block.text)}
                        </blockquote>
                      );
                    case "labeled":
                      return (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="mt-1 inline-flex shrink-0 items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                            {block.label}
                          </span>
                          <span className="min-w-0">{renderInline(block.text)}</span>
                        </div>
                      );
                    default:
                      return <p key={i}>{renderInline(block.text)}</p>;
                  }
                })}
                {resolvedStatus === "streaming" && (
                  <span
                    className="ml-0.5 inline-block h-4 w-[2px] animate-pulse rounded bg-accent align-text-bottom"
                    aria-hidden
                  />
                )}
              </div>
              {/* 折叠时底部渐隐 */}
              {collapsible && !expanded && (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface to-transparent"
                  aria-hidden
                />
              )}
            </div>

            {collapsible && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/80"
                aria-expanded={expanded}
              >
                {expanded ? t("replayShowLess") : t("expand")}
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
