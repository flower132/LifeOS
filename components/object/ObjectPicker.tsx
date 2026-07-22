"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Search, Sparkles, X } from "lucide-react";
import { LifeObject, LifeObjectType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useObjectStore } from "@/stores/objectStore";
import { useTagStore } from "@/stores/tagStore";
import {
  recencyScore,
  useObjectRecencyStore,
} from "@/stores/objectRecencyStore";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/useTranslation";

/**
 * ObjectPicker — LifeOS 统一的对象选择组件。
 *
 * 所有「关联对象 / 引用对象 / 建立关系 / Graph 建边 / Memory」场景
 * 统一使用本组件，禁止页面各自维护对象列表。
 *
 * 能力：
 * - 默认按「最近使用」排序（更新 / 创建 / 查看 / 关联），顶部 Recent 区
 * - 即时模糊搜索（名称 / 昵称 / 标签 / 类型 / 备注，忽略大小写与空格，debounce）
 * - 单选 / 多选
 * - 搜索无结果时底部「创建新对象」，创建完成自动返回并选中
 * - 渐进渲染窗口（对象 1k+ 不一次性渲染全部）
 * - suggestedIds：AI 推荐对象高亮（预留接口）
 */

// ── 类型 ────────────────────────────────────────────────────────────────────

export interface ObjectPickerProps {
  open: boolean;
  onClose: () => void;
  /** 多选模式（批量关联 / Graph 建边）。 */
  multiple?: boolean;
  /** 多选时的已选 id（作为初始值）。 */
  selectedIds?: string[];
  /** 单选回调：选中即关闭。 */
  onSelect?: (object: LifeObject) => void;
  /** 多选回调：点击确认时触发。 */
  onChange?: (ids: string[]) => void;
  /** 不可选的对象（如关系两端、已关联对象）。 */
  excludeIds?: string[];
  /** 限定可选类型。 */
  types?: LifeObjectType[];
  /** AI 推荐对象（预留）：列表中高亮「AI 推荐」徽章。 */
  suggestedIds?: string[];
  /** 搜索无结果时展示「创建新对象」入口，默认 true。 */
  allowCreate?: boolean;
  title?: string;
}

export interface ObjectPickerFieldProps {
  /** 单选：string | null；多选：string[]。 */
  value: string | string[] | null;
  onChange: (value: string & string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  excludeIds?: string[];
  types?: LifeObjectType[];
  suggestedIds?: string[];
  allowCreate?: boolean;
  disabled?: boolean;
  className?: string;
}

// ── 搜索 ────────────────────────────────────────────────────────────────────

/** 归一化：忽略大小写与空白，支持「张 三」匹配「张三」。 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

interface SearchContext {
  tagNames: Map<string, string>;
  typeLabel: (type: LifeObjectType) => string;
}

/** 匹配评分：-1 不匹配；分数越高越靠前。 */
function matchScore(
  object: LifeObject,
  q: string,
  ctx: SearchContext
): number {
  const name = normalize(object.name);
  if (name.startsWith(q)) return 100;
  if (name.includes(q)) return 80;

  const nickname = normalize(String(object.properties?.nickname ?? ""));
  if (nickname && nickname.includes(q)) return 60;

  const tags = object.tag_ids.map((id) => ctx.tagNames.get(id) ?? "");
  if (tags.some((tag) => normalize(tag).includes(q))) return 40;

  if (
    normalize(ctx.typeLabel(object.type)).includes(q) ||
    object.type.includes(q)
  ) {
    return 30;
  }

  if (normalize(object.description ?? "").includes(q)) return 20;
  return -1;
}

function useDebouncedValue<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── 快速创建回跳（picker → 新建对象 → 自动返回并选中）────────────────────────

const PICKED_OBJECT_KEY = "lifeos.pickedObjectId";

export function stashPickedObject(id: string) {
  try {
    sessionStorage.setItem(PICKED_OBJECT_KEY, id);
  } catch {
    /* private mode 等场景忽略 */
  }
}

function consumePickedObject(): string | null {
  try {
    const id = sessionStorage.getItem(PICKED_OBJECT_KEY);
    if (id) sessionStorage.removeItem(PICKED_OBJECT_KEY);
    return id;
  } catch {
    return null;
  }
}

// ── 头像 ────────────────────────────────────────────────────────────────────

const AVATAR_STYLES: Record<LifeObjectType, string> = {
  person: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  self: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300",
  event: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
  idea: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  goal: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300",
  project: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300",
  knowledge:
    "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300",
};

export function ObjectAvatar({
  object,
  size = "md",
}: {
  object: LifeObject;
  size?: "sm" | "md";
}) {
  const initial = object.name.trim().charAt(0) || "?";
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        AVATAR_STYLES[object.type],
        size === "sm" ? "h-5 w-5 text-[10px]" : "h-9 w-9 text-sm"
      )}
    >
      {initial}
    </span>
  );
}

// ── ObjectPicker（对话框）────────────────────────────────────────────────────

const RECENT_COUNT = 8;
const PAGE_SIZE = 60;

export function ObjectPicker({
  open,
  onClose,
  multiple = false,
  selectedIds,
  onSelect,
  onChange,
  excludeIds,
  types,
  suggestedIds,
  allowCreate = true,
  title,
}: ObjectPickerProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  // 统一数据来源：Object Store
  const objects = useObjectStore((s) => s.objects);
  const loaded = useObjectStore((s) => s.loaded);
  const objectsLoading = useObjectStore((s) => s._loading);
  const loadObjects = useObjectStore((s) => s.load);
  const tags = useTagStore((s) => s.tags);
  const recency = useObjectRecencyStore((s) => s.entries);
  const markLinked = useObjectRecencyStore((s) => s.markLinked);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(selectedIds)
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const inputRef = useRef<HTMLInputElement>(null);

  // 打开时重置状态（官方 derived-state 模式：render 期间同步，避免级联渲染）
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setSelected(new Set(selectedIds));
      setVisibleCount(PAGE_SIZE);
    }
  }

  // 打开后聚焦搜索框
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (open && !loaded && !objectsLoading) void loadObjects();
  }, [open, loaded, objectsLoading, loadObjects]);

  const searchCtx = useMemo<SearchContext>(
    () => ({
      tagNames: new Map(tags.map((tag) => [tag.id, tag.name])),
      typeLabel: (type) => t(type),
    }),
    [tags, t]
  );

  // 候选集：类型过滤 + 排除
  const candidates = useMemo(() => {
    const excluded = new Set(excludeIds);
    return objects.filter(
      (o) =>
        (!types || types.includes(o.type)) && !(excluded.size && excluded.has(o.id))
    );
  }, [objects, types, excludeIds]);

  const searching = normalize(debouncedQuery).length > 0;

  // 排序：搜索时按匹配分，否则按最近使用
  const sorted = useMemo(() => {
    const q = normalize(debouncedQuery);
    const scored = candidates.map((o) => ({
      object: o,
      recency: recencyScore(o, recency[o.id]),
      match: q ? matchScore(o, q, searchCtx) : 0,
    }));
    const filtered = q ? scored.filter((s) => s.match >= 0) : scored;
    filtered.sort((a, b) =>
      q
        ? b.match - a.match || b.recency - a.recency
        : b.recency - a.recency
    );
    return filtered.map((s) => s.object);
  }, [candidates, debouncedQuery, recency, searchCtx]);

  // 搜索词变化时重置渲染窗口（render 期间同步派生）
  const [prevQuery, setPrevQuery] = useState(debouncedQuery);
  if (debouncedQuery !== prevQuery) {
    setPrevQuery(debouncedQuery);
    setVisibleCount(PAGE_SIZE);
  }

  const recent = useMemo(
    () => (searching ? [] : sorted.slice(0, RECENT_COUNT)),
    [searching, sorted]
  );
  const rest = useMemo(
    () => (searching ? sorted : sorted.slice(RECENT_COUNT)),
    [searching, sorted]
  );

  // 渐进渲染窗口：只渲染前 visibleCount 条，滚动到底加载更多
  const visibleRest = rest.slice(0, visibleCount);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 240) {
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, rest.length));
    }
  };

  const confirmMulti = useCallback(
    (ids: string[]) => {
      markLinked(ids);
      onChange?.(ids);
      onClose();
    },
    [markLinked, onChange, onClose]
  );

  const pickSingle = useCallback(
    (object: LifeObject) => {
      markLinked([object.id]);
      onSelect?.(object);
      onClose();
    },
    [markLinked, onSelect, onClose]
  );

  const toggleMulti = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    const params = new URLSearchParams();
    if (types?.length) params.set("type", types[0]);
    if (query.trim()) params.set("name", query.trim());
    params.set("pick", "1");
    onClose();
    router.push(`/create-object/manual?${params.toString()}`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  const suggested = useMemo(() => new Set(suggestedIds), [suggestedIds]);

  const renderRow = (object: LifeObject) => {
    const isSelected = multiple
      ? selected.has(object.id)
      : false;
    const objectTags = object.tag_ids
      .map((id) => searchCtx.tagNames.get(id))
      .filter((name): name is string => Boolean(name))
      .slice(0, 2);

    return (
      <li key={object.id}>
        <button
          type="button"
          onClick={() => (multiple ? toggleMulti(object.id) : pickSingle(object))}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
            isSelected ? "bg-accent/[0.06]" : "hover:bg-muted/60"
          )}
        >
          <ObjectAvatar object={object} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-primary">
                {object.name}
              </span>
              {suggested.has(object.id) && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  <Sparkles className="h-2.5 w-2.5" />
                  {t("pickerSuggested")}
                </span>
              )}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-tertiary">
              <span>{searchCtx.typeLabel(object.type)}</span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{formatDate(object.updated_at)}</span>
              {objectTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-1.5 py-px text-[10px] text-secondary"
                >
                  {tag}
                </span>
              ))}
            </span>
          </span>
          {multiple && (
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                isSelected
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-background"
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title ?? t("selectObject")}
      maxWidth="md"
      footer={
        multiple ? (
          <>
            <span className="mr-auto self-center text-xs text-secondary">
              {t("pickerSelected", { count: selected.size })}
            </span>
            <Button variant="secondary" size="sm" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              disabled={selected.size === 0}
              onClick={() => confirmMulti([...selected])}
            >
              {t("common.confirm")}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {/* ── 搜索框（固定顶部） ── */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                // 有关键词时 ESC 只清空，不关闭对话框
                e.stopPropagation();
                setQuery("");
              }
            }}
            placeholder={t("searchObjects")}
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-9 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label={t("pickerClear")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-tertiary transition-colors hover:bg-muted hover:text-secondary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ── 列表 ── */}
        <div
          className="-mx-1 max-h-[50vh] overflow-y-auto px-1"
          onScroll={handleScroll}
        >
          {!loaded ? (
            <ul className="space-y-1 py-1" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-2.5 py-2">
                  <span className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                  <span className="flex-1 space-y-1.5">
                    <span className="block h-3.5 w-1/3 animate-pulse rounded bg-muted" />
                    <span className="block h-3 w-1/4 animate-pulse rounded bg-muted" />
                  </span>
                </li>
              ))}
            </ul>
          ) : sorted.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-secondary">{t("pickerNoResults")}</p>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              {recent.length > 0 && (
                <section>
                  <h4 className="px-2.5 pb-1 text-xs font-medium text-tertiary">
                    {t("recentObjects")}
                  </h4>
                  <ul className="space-y-0.5">{recent.map(renderRow)}</ul>
                </section>
              )}
              {visibleRest.length > 0 && (
                <section>
                  {!searching && (
                    <h4 className="px-2.5 pb-1 text-xs font-medium text-tertiary">
                      {t("pickerAllObjects")}
                    </h4>
                  )}
                  <ul className="space-y-0.5">{visibleRest.map(renderRow)}</ul>
                </section>
              )}
            </div>
          )}
        </div>

        {/* ── 快速创建 ── */}
        {allowCreate && loaded && (
          <button
            type="button"
            onClick={handleCreate}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm text-secondary transition-colors hover:border-accent/40 hover:text-accent"
          >
            <Plus className="h-4 w-4" />
            {query.trim()
              ? t("pickerCreateNamed", { name: query.trim() })
              : t("pickerCreateNew")}
          </button>
        )}
      </div>
    </Dialog>
  );
}

// ── ObjectPickerField（表单内联触发器）───────────────────────────────────────

export function ObjectPickerField({
  value,
  onChange,
  multiple = false,
  placeholder,
  excludeIds,
  types,
  suggestedIds,
  allowCreate = true,
  disabled = false,
  className,
}: ObjectPickerFieldProps) {
  const { t } = useTranslation();
  const objects = useObjectStore((s) => s.objects);
  const [open, setOpen] = useState(false);

  const selectedIds = useMemo(
    () =>
      multiple
        ? Array.isArray(value)
          ? value
          : []
        : typeof value === "string" && value
          ? [value]
          : [],
    [multiple, value]
  );
  const selectedObjects = useMemo(
    () =>
      selectedIds
        .map((id) => objects.find((o) => o.id === id))
        .filter((o): o is LifeObject => Boolean(o)),
    [selectedIds, objects]
  );

  // 快速创建回跳：创建页返回后自动选中新对象
  //（组件未卸载时靠 focus 事件，重新挂载时靠 mount 检查）
  useEffect(() => {
    const consume = () => {
      const id = consumePickedObject();
      if (!id) return;
      if (multiple) {
        onChange([...selectedIds, id] as string & string[]);
      } else {
        onChange(id as string & string[]);
      }
    };
    consume();
    window.addEventListener("focus", consume);
    return () => window.removeEventListener("focus", consume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiple, selectedIds.join(",")]);

  const clearOne = (id: string) => {
    if (multiple) {
      onChange(selectedIds.filter((s) => s !== id) as string & string[]);
    } else {
      onChange("" as string & string[]);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "flex min-h-[42px] w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors",
          "focus:border-accent focus:ring-2 focus:ring-accent disabled:bg-muted",
          selectedObjects.length === 0 && "text-muted-foreground"
        )}
      >
        {selectedObjects.length === 0 ? (
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            {placeholder ?? t("selectObject")}
          </span>
        ) : (
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {selectedObjects.map((object) => (
              <span
                key={object.id}
                className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-muted py-0.5 pl-1 pr-1.5 text-xs font-medium text-primary"
              >
                <ObjectAvatar object={object} size="sm" />
                <span className="max-w-[10rem] truncate">{object.name}</span>
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={t("pickerClear")}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearOne(object.id);
                  }}
                  className="rounded-full p-0.5 text-tertiary transition-colors hover:text-secondary"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))}
          </span>
        )}
      </button>

      <ObjectPicker
        open={open}
        onClose={() => setOpen(false)}
        multiple={multiple}
        selectedIds={selectedIds}
        onSelect={(object) => onChange(object.id as string & string[])}
        onChange={(ids) => onChange(ids as string & string[])}
        excludeIds={excludeIds}
        types={types}
        suggestedIds={suggestedIds}
        allowCreate={allowCreate}
        title={placeholder}
      />
    </div>
  );
}
