"use client";

import { useCallback } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import {
  AIAnalysisResult,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
} from "@/lib/ai/objectIntelligence/types";
import { aiProfileRegistry } from "@/lib/ai/objectIntelligence/profiles";
import { useTranslation } from "@/lib/useTranslation";
import { v4 as uuidv4 } from "uuid";

interface AIReviewPanelProps {
  result: AIAnalysisResult;
  isCreating?: boolean;
  onChange: (result: AIAnalysisResult) => void;
  onConfirm: (result: AIAnalysisResult) => void;
  onReanalyze: () => void;
}

function generateId(prefix: string): string {
  return `${prefix}-${uuidv4()}`;
}

export function AIReviewPanel({
  result,
  isCreating = false,
  onChange,
  onConfirm,
  onReanalyze,
}: AIReviewPanelProps) {
  const { t } = useTranslation();

  const update = useCallback(
    (patch: Partial<AIAnalysisResult>) => onChange({ ...result, ...patch }),
    [result, onChange]
  );

  const profileDef = aiProfileRegistry.get(result.profile.type);
  const ProfileRenderer = profileDef?.ProfileRenderer;

  return (
    <div className="space-y-8">
      {result.analysisSummary && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-foreground">
          {result.analysisSummary}
        </div>
      )}

      <section className="space-y-3">
        <SectionTitle icon={Sparkles}>{t("aiProfileSection")}</SectionTitle>
        {ProfileRenderer ? (
          <ProfileRenderer
            profile={result.profile}
            onChange={(profile) => update({ profile })}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-4">
            <pre className="text-xs text-muted-foreground">
              {JSON.stringify(result.profile, null, 2)}
            </pre>
          </div>
        )}
      </section>

      <ListSection
        title={t("aiInsightsSection")}
        items={result.insights}
        emptyText={t("aiNoInsights")}
        onChange={(insights) => update({ insights })}
        createItem={() => ({
          id: generateId("insight"),
          category: "",
          title: "",
          description: "",
          confidence: 50,
          evidence: [],
          createdAt: new Date().toISOString(),
        })}
      >
        {(insight, onUpdate) => (
          <InsightEditor key={insight.id} insight={insight} onUpdate={onUpdate} />
        )}
      </ListSection>

      <ListSection
        title={t("aiSuggestionsSection")}
        items={result.suggestions}
        emptyText={t("aiNoSuggestions")}
        onChange={(suggestions) => update({ suggestions })}
        createItem={() => ({
          id: generateId("suggestion"),
          title: "",
          description: "",
          priority: "medium" as const,
          status: "active" as const,
          generatedAt: new Date().toISOString(),
        })}
      >
        {(suggestion, onUpdate) => (
          <SuggestionEditor key={suggestion.id} suggestion={suggestion} onUpdate={onUpdate} />
        )}
      </ListSection>

      <ListSection
        title={t("aiMemoriesSection")}
        items={result.memories}
        emptyText={t("aiNoMemories")}
        onChange={(memories) => update({ memories })}
        createItem={() => ({
          id: generateId("memory"),
          content: "",
          source: "user" as const,
          createdAt: new Date().toISOString(),
        })}
      >
        {(memory, onUpdate) => (
          <MemoryEditor key={memory.id} memory={memory} onUpdate={onUpdate} />
        )}
      </ListSection>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onReanalyze}
          disabled={isCreating}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("aiReanalyze")}
        </button>
        <button
          type="button"
          onClick={() => onConfirm(result)}
          disabled={isCreating}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? t("aiCreatingObject") : t("aiConfirmCreate")}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-accent" />
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {children}
      </h3>
    </div>
  );
}

interface ListSectionProps<T extends { id: string }> {
  title: string;
  items: T[];
  emptyText: string;
  onChange: (items: T[]) => void;
  createItem: () => T;
  children: (item: T, onUpdate: (item: T) => void) => React.ReactNode;
}

function ListSection<T extends { id: string }>({
  title,
  items,
  emptyText,
  onChange,
  createItem,
  children,
}: ListSectionProps<T>) {
  const { t } = useTranslation();

  const update = (index: number, updated: T) => {
    const next = [...items];
    next[index] = updated;
    onChange(next);
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle icon={Sparkles}>{title}</SectionTitle>
        <button
          type="button"
          onClick={() => onChange([...items, createItem()])}
          className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-accent/5"
        >
          <Plus className="h-3 w-3" />
          {t("aiAdd")}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <EditableCard key={item.id} onDelete={() => remove(index)}>
              {children(item, (updated) => update(index, updated))}
            </EditableCard>
          ))}
        </div>
      )}
    </section>
  );
}

function EditableCard({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">{children}</div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function InlineEdit({
  value,
  onChange,
  multiline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const className =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent";
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className={className}
      />
    );
  }
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={className} />;
}

function InsightEditor({
  insight,
  onUpdate,
}: {
  insight: ObjectAIInsight;
  onUpdate: (insight: ObjectAIInsight) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <InlineEdit
          value={insight.category}
          onChange={(category) => onUpdate({ ...insight, category })}
        />
        <input
          type="number"
          min={0}
          max={100}
          value={insight.confidence}
          onChange={(e) => onUpdate({ ...insight, confidence: Number(e.target.value) })}
          className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </div>
      <InlineEdit value={insight.title} onChange={(title) => onUpdate({ ...insight, title })} />
      <InlineEdit
        value={insight.description}
        onChange={(description) => onUpdate({ ...insight, description })}
        multiline
      />
    </div>
  );
}

function SuggestionEditor({
  suggestion,
  onUpdate,
}: {
  suggestion: ObjectAISuggestion;
  onUpdate: (suggestion: ObjectAISuggestion) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <select
        value={suggestion.priority}
        onChange={(e) =>
          onUpdate({
            ...suggestion,
            priority: e.target.value as ObjectAISuggestion["priority"],
          })
        }
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
      >
        <option value="low">{t("aiPriorityLow")}</option>
        <option value="medium">{t("aiPriorityMedium")}</option>
        <option value="high">{t("aiPriorityHigh")}</option>
      </select>
      <InlineEdit value={suggestion.title} onChange={(title) => onUpdate({ ...suggestion, title })} />
      <InlineEdit
        value={suggestion.description}
        onChange={(description) => onUpdate({ ...suggestion, description })}
        multiline
      />
    </div>
  );
}

function MemoryEditor({
  memory,
  onUpdate,
}: {
  memory: ObjectMemory;
  onUpdate: (memory: ObjectMemory) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <select
        value={memory.source}
        onChange={(e) => onUpdate({ ...memory, source: e.target.value as ObjectMemory["source"] })}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
      >
        <option value="user">{t("aiMemorySourceUser")}</option>
        <option value="ai">{t("aiMemorySourceAi")}</option>
        <option value="import">{t("aiMemorySourceImport")}</option>
        <option value="note">{t("aiMemorySourceNote")}</option>
      </select>
      <InlineEdit
        value={memory.content}
        onChange={(content) => onUpdate({ ...memory, content })}
        multiline
      />
    </div>
  );
}
