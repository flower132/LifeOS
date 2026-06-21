"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { TAG_COLORS, Tag } from "@/lib/types";
import { useTagStore } from "@/stores/tagStore";
import { useTranslation } from "@/lib/useTranslation";
import { X, Plus } from "lucide-react";

interface TagSelectProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

const RECENT_TAGS_KEY = "lifeos_recent_tags";
const DEFAULT_RECENT_TAG_NAMES = ["家人", "工作", "领导", "重要"];

function fuzzyMatch(name: string, query: string): boolean {
  if (!query) return true;
  const lowerName = name.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let qi = 0;
  for (let ni = 0; ni < lowerName.length && qi < lowerQuery.length; ni++) {
    if (lowerName[ni] === lowerQuery[qi]) qi++;
  }
  return qi === lowerQuery.length;
}

function readRecentTagIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_TAGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string");
    }
  } catch {
    // ignore corrupt localStorage
  }
  return [];
}

function writeRecentTagIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_TAGS_KEY, JSON.stringify(ids));
  } catch {
    // best-effort
  }
}

export function TagSelect({ selectedTagIds, onChange }: TagSelectProps) {
  const tags = useTagStore((s) => s.tags);
  const loaded = useTagStore((s) => s.loaded);
  const _loading = useTagStore((s) => s._loading);
  const load = useTagStore((s) => s.load);
  const addTag = useTagStore((s) => s.addTag);
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pendingIndex, setPendingIndex] = useState(0);
  const [recentTagIds, setRecentTagIds] = useState<string[]>(readRecentTagIds);
  const [createError, setCreateError] = useState<string | null>(null);
  const seededRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Ensure tags are loaded when the selector mounts.
  useEffect(() => {
    if (!loaded && !_loading) {
      void load();
    }
  }, [loaded, _loading, load]);

  // Seed default recent tags if the tag library is empty and no recent ids saved.
  useEffect(() => {
    if (!loaded || seededRef.current) return;
    const savedRecent = readRecentTagIds();
    if (tags.length === 0 && savedRecent.length === 0) {
      seededRef.current = true;
      const createdIds: string[] = [];
      for (let i = 0; i < DEFAULT_RECENT_TAG_NAMES.length; i++) {
        const name = DEFAULT_RECENT_TAG_NAMES[i];
        const color = TAG_COLORS[i % TAG_COLORS.length];
        addTag({ name, color })
          .then((tag) => {
            createdIds.push(tag.id);
            if (createdIds.length === DEFAULT_RECENT_TAG_NAMES.length) {
              writeRecentTagIds(createdIds);
              setRecentTagIds(createdIds);
            }
          })
          .catch(() => {
            // ignore seed failures
          });
      }
    }
  }, [loaded, tags.length, addTag]);

  // Close dropdown when clicking outside.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedTags: Tag[] = useMemo(
    () =>
      selectedTagIds
        .map((id) => tags.find((tag) => tag.id === id))
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
    [tags, selectedTagIds]
  );

  const trimmedQuery = query.trim();

  const matchingTags = useMemo(() => {
    return tags
      .filter((tag) => !selectedTagIds.includes(tag.id))
      .filter((tag) => fuzzyMatch(tag.name, trimmedQuery));
  }, [tags, selectedTagIds, trimmedQuery]);

  const recentTags = useMemo(() => {
    if (trimmedQuery) return [];
    const recentSet = new Set(recentTagIds);
    return matchingTags
      .filter((tag) => recentSet.has(tag.id))
      .sort((a, b) => {
        const ai = recentTagIds.indexOf(a.id);
        const bi = recentTagIds.indexOf(b.id);
        return ai - bi;
      });
  }, [matchingTags, recentTagIds, trimmedQuery]);

  const historicalTags = useMemo(() => {
    const recentSet = new Set(recentTagIds);
    return matchingTags
      .filter((tag) => !recentSet.has(tag.id))
      .sort(
        (a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name)
      );
  }, [matchingTags, recentTagIds]);

  const exactMatch =
    trimmedQuery &&
    tags.some((tag) => tag.name.toLowerCase() === trimmedQuery.toLowerCase());
  const canCreate = trimmedQuery && !exactMatch;

  const dropdownItems = useMemo(
    () => [
      ...recentTags,
      ...historicalTags,
      ...(canCreate
        ? [
            {
              id: "__create__",
              name: trimmedQuery,
              createdAt: "",
              usageCount: 0,
            } as Tag,
          ]
        : []),
    ],
    [recentTags, historicalTags, canCreate, trimmedQuery]
  );

  const activeIndex = useMemo(
    () => Math.min(pendingIndex, Math.max(dropdownItems.length - 1, 0)),
    [pendingIndex, dropdownItems.length]
  );

  // Scroll active item into view.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  const moveTagToRecentTop = useCallback((tagId: string) => {
    const next = [tagId, ...recentTagIds.filter((id) => id !== tagId)];
    writeRecentTagIds(next);
    setRecentTagIds(next);
  }, [recentTagIds]);

  const resetFocus = useCallback(() => {
    setQuery("");
    setPendingIndex(0);
    inputRef.current?.focus();
  }, []);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
      moveTagToRecentTop(tagId);
    }
    resetFocus();
  };

  const removeTag = (tagId: string) => {
    onChange(selectedTagIds.filter((id) => id !== tagId));
    inputRef.current?.focus();
  };

  const createTag = async (name: string) => {
    setCreateError(null);
    try {
      const color = TAG_COLORS[tags.length % TAG_COLORS.length];
      const created = await addTag({ name, color });
      onChange([...selectedTagIds, created.id]);
      moveTagToRecentTop(created.id);
      setQuery("");
      setPendingIndex(0);
      setOpen(false);
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to create tag:", err);
      setCreateError(
        err instanceof Error ? err.message : t("failedToCreateTag")
      );
    }
  };

  const finalizeTag = () => {
    if (!trimmedQuery || dropdownItems.length === 0) {
      setOpen(false);
      return;
    }
    const item = dropdownItems[activeIndex] ?? dropdownItems[0];
    if (!item) {
      setOpen(false);
      return;
    }
    if (item.id === "__create__") {
      void createTag(item.name);
    } else {
      toggleTag(item.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setPendingIndex(Math.min(pendingIndex + 1, Math.max(dropdownItems.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setPendingIndex(Math.max(pendingIndex - 1, 0));
    } else if (e.key === "Enter") {
      if (open && dropdownItems.length > 0) {
        e.preventDefault();
        const item = dropdownItems[activeIndex];
        if (!item) return;
        if (item.id === "__create__") {
          void createTag(item.name);
        } else {
          toggleTag(item.id);
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setPendingIndex(0);
      inputRef.current?.blur();
    }
  };

  const handleSelectClick = (item: Tag, index: number) => {
    setPendingIndex(index);
    if (item.id === "__create__") {
      void createTag(item.name);
    } else {
      toggleTag(item.id);
    }
  };

  const showRecentSection = !trimmedQuery && recentTags.length > 0;
  const showHistorySection = !trimmedQuery && historicalTags.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        className={`flex min-h-[42px] flex-wrap items-center gap-2 rounded-lg border bg-background px-2 py-1.5 text-sm transition-colors ${
          open
            ? "border-accent ring-2 ring-accent"
            : "border-input hover:border-accent/50"
        }`}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: tag.color ? `${tag.color}20` : "#e2e8f0",
              color: tag.color || "#475569",
            }}
          >
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag.id);
              }}
              className="ml-0.5 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
              aria-label={`Remove ${tag.name} tag`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setPendingIndex(0);
            setCreateError(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay finalize so clicks on dropdown items can fire first.
            window.setTimeout(() => {
              if (containerRef.current?.contains(document.activeElement)) return;
              finalizeTag();
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? t("addTags") : ""}
          className="min-w-[80px] flex-1 bg-transparent px-1 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {createError && (
        <div className="mt-1 text-xs text-destructive">{createError}</div>
      )}

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-background py-1 shadow-lg"
        >
          {dropdownItems.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {trimmedQuery ? t("noMatchingTags") : t("typeToCreateTag")}
            </div>
          ) : (
            <ul className="py-1">
              {showRecentSection && (
                <>
                  <li className="px-3 py-1 text-xs font-medium text-muted-foreground">
                    {t("recentTags")}
                  </li>
                  {recentTags.map((item, index) => (
                    <TagOption
                      key={item.id}
                      item={item}
                      index={index}
                      activeIndex={activeIndex}
                      onClick={() => handleSelectClick(item, index)}
                      onMouseEnter={() => setPendingIndex(index)}
                      t={t}
                    />
                  ))}
                </>
              )}
              {showHistorySection && (
                <>
                  <li className="px-3 py-1 text-xs font-medium text-muted-foreground">
                    {t("allTags")}
                  </li>
                  {historicalTags.map((item, index) => {
                    const actualIndex = recentTags.length + index;
                    return (
                      <TagOption
                        key={item.id}
                        item={item}
                        index={actualIndex}
                        activeIndex={activeIndex}
                        onClick={() => handleSelectClick(item, actualIndex)}
                        onMouseEnter={() => setPendingIndex(actualIndex)}
                        t={t}
                      />
                    );
                  })}
                </>
              )}
              {trimmedQuery &&
                dropdownItems.map((item, index) => (
                  <TagOption
                    key={item.id}
                    item={item}
                    index={index}
                    activeIndex={activeIndex}
                    onClick={() => handleSelectClick(item, index)}
                    onMouseEnter={() => setPendingIndex(index)}
                    t={t}
                  />
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TagOption({
  item,
  index,
  activeIndex,
  onClick,
  onMouseEnter,
  t,
}: {
  item: Tag;
  index: number;
  activeIndex: number;
  onClick: () => void;
  onMouseEnter: () => void;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  const isCreate = item.id === "__create__";
  const active = index === activeIndex;
  return (
    <li data-active={active}>
      <button
        type="button"
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
          active
            ? "bg-accent/10 text-accent"
            : "text-foreground hover:bg-muted"
        }`}
      >
        <div className="flex items-center gap-2">
          {isCreate ? (
            <>
              <Plus className="h-3.5 w-3.5 text-accent" />
              <span>{t("createTag", { name: item.name })}</span>
            </>
          ) : (
            <>
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color || "#94a3b8" }}
              />
              <span>{item.name}</span>
            </>
          )}
        </div>
        {!isCreate && (
          <span className="text-xs text-muted-foreground">
            {item.usageCount}
          </span>
        )}
      </button>
    </li>
  );
}
