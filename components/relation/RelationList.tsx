"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Relation, RELATION_TYPES, RelationType } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { useRelationStore } from "@/stores/relationStore";
import { useMemoryStore } from "@/stores/memoryStore";
import {
  getPendingSuggestionsForObject,
  useRelationSuggestionStore,
} from "@/stores/relationSuggestionStore";
import {
  acceptRelationSuggestion,
  computeRelationStrength,
  explainRelation,
  rejectRelationSuggestion,
  RelationExplanation,
} from "@/lib/graph";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Sparkles, Pencil, Trash2, User, Info, Check, X, History } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { RelationTimelineDialog } from "./RelationTimelineDialog";

interface RelationListProps {
  objectId: string;
  relations: Relation[];
}

const LEVEL_STYLE: Record<string, string> = {
  strong: "bg-green-500/10 text-green-700",
  medium: "bg-amber-500/10 text-amber-600",
  weak: "bg-muted text-muted-foreground",
};

/**
 * 关系区域 — Knowledge Graph edges: AI/User 标识、强度徽章、点击跳转、
 * Explain（透明分解）、编辑、删除，以及 AI 关系建议（Accept/Reject）。
 */
export function RelationList({ objectId, relations }: RelationListProps) {
  const objects = useObjectStore((s) => s.objects);
  const { removeRelation, updateRelation } = useRelationStore();
  const allRelations = useRelationStore((s) => s.relations);
  const memories = useMemoryStore((s) => s.memories);
  // Selector 只读取稳定引用；filter 计算必须移入 useMemo（React 18 +
  // Zustand getSnapshot 要求 selector 结果引用稳定，否则无限循环）。
  const allSuggestions = useRelationSuggestionStore((s) => s.suggestions);
  const suggestions = useMemo(
    () => getPendingSuggestionsForObject(allSuggestions, objectId),
    [allSuggestions, objectId]
  );
  const router = useRouter();
  const { t } = useTranslation();

  const [editing, setEditing] = useState<Relation | null>(null);
  const [editType, setEditType] = useState<RelationType>(RELATION_TYPES[0]);
  const [editLabel, setEditLabel] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [explaining, setExplaining] = useState<RelationExplanation | null>(null);
  const [timelineRelation, setTimelineRelation] = useState<Relation | null>(null);

  // AI-computed strength per relation (memoized per relation id).
  const strengths = useMemo(() => {
    const focus = objects.find((o) => o.id === objectId);
    if (!focus) return new Map<string, ReturnType<typeof computeRelationStrength>>();
    const map = new Map<string, ReturnType<typeof computeRelationStrength>>();
    for (const relation of relations) {
      const otherId =
        relation.source_object_id === objectId
          ? relation.target_object_id
          : relation.source_object_id;
      const other = objects.find((o) => o.id === otherId);
      if (!other) continue;
      map.set(
        relation.id,
        computeRelationStrength({
          objectA: focus,
          objectB: other,
          memories,
          relations: allRelations,
        })
      );
    }
    return map;
  }, [objectId, objects, relations, allRelations, memories]);

  const openEdit = (relation: Relation) => {
    setEditing(relation);
    setEditType(relation.type);
    setEditLabel(relation.label ?? "");
    setEditNote(relation.note ?? "");
  };

  const handleSave = async () => {
    if (!editing || saving) return;
    setSaving(true);
    try {
      await updateRelation(editing.id, {
        type: editType,
        label: editLabel.trim() || undefined,
        note: editNote.trim() || undefined,
      });
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (relation: Relation) => {
    if (!confirm(t("deleteRelationConfirm") ?? "删除这条关系？")) return;
    await removeRelation(relation.id);
  };

  const handleExplain = (relation: Relation) => {
    const explanation = explainRelation({
      relation,
      focusObjectId: objectId,
      objects,
      relations: allRelations,
      memories,
    });
    setExplaining(explanation);
  };

  const objectName = (id: string) => objects.find((o) => o.id === id)?.name ?? "?";

  return (
    <>
      {suggestions.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            {t("relationSuggestions") ?? "AI 发现的关系（确认后加入图谱）"}
          </p>
          {suggestions.map((suggestion) => {
            const otherId =
              suggestion.fromObjectId === objectId
                ? suggestion.toObjectId
                : suggestion.fromObjectId;
            return (
              <div
                key={suggestion.id}
                className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 p-3"
              >
                <div className="text-sm">
                  <span className="font-medium text-foreground">
                    {objectName(otherId)}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {suggestion.type}
                    {suggestion.label ? ` · ${suggestion.label}` : ""} ·{" "}
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void acceptRelationSuggestion(suggestion.id)}
                    className="rounded-lg p-1.5 text-green-600 hover:bg-green-500/10"
                    title={t("accept") ?? "接受"}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void rejectRelationSuggestion(suggestion.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title={t("reject") ?? "拒绝"}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {relations.length === 0 && suggestions.length === 0 ? (
        <EmptyState description={t("relationsEmpty")} />
      ) : (
        <div className="space-y-2">
          {relations.map((relation) => {
            const otherId =
              relation.source_object_id === objectId
                ? relation.target_object_id
                : relation.source_object_id;
            const other = objects.find((o) => o.id === otherId);
            const isAI = relation.createdBy === "ai";
            const strength = strengths.get(relation.id);
            return (
              <div
                key={relation.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
              >
                <button
                  type="button"
                  onClick={() => other && router.push(`/objects/${other.id}`)}
                  className="flex items-center gap-3 text-left"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                    {other?.name.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      {other?.name || "Unknown"}
                      {isAI ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <User className="h-2.5 w-2.5" />
                          {t("relationCreatedByUser") ?? "手动"}
                        </span>
                      )}
                      {strength && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${LEVEL_STYLE[strength.level]}`}
                        >
                          {strength.score}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {relation.label ? `${relation.type} · ${relation.label}` : relation.type}
                      {relation.confidence !== undefined &&
                        ` • ${Math.round(relation.confidence * 100)}%`}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <div className="text-right">
                    {relation.note && (
                      <p className="max-w-[160px] truncate text-xs text-muted-foreground">
                        {relation.note}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(relation.updated_at ?? relation.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTimelineRelation(relation)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={t("relationTimeline") ?? "关系时间线"}
                  >
                    <History className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExplain(relation)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={t("explainRelation") ?? "解释这条关系"}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(relation)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={t("editRelation") ?? "编辑关系"}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(relation)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title={t("deleteRelation") ?? "删除关系"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t("editRelation") ?? "编辑关系"}
        maxWidth="sm"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">
              {t("relationType") ?? "关系类型"}
            </span>
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value as RelationType)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent"
            >
              {RELATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(type) ?? type}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">
              {t("relationLabel") ?? "关系标签"}
            </span>
            <Input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              placeholder={t("relationLabelPlaceholder") ?? "如：合作项目"}
            />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">
              {t("relationNote") ?? "关系说明"}
            </span>
            <Textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              rows={2}
            />
          </div>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? (t("saving") ?? "保存中…") : (t("save") ?? "保存")}
          </Button>
        </div>
      </Dialog>

      {/* Relation timeline dialog */}
      <RelationTimelineDialog
        relation={timelineRelation}
        focusObjectId={objectId}
        onClose={() => setTimelineRelation(null)}
      />

      {/* Explain dialog — fully transparent, data-only */}
      <Dialog
        open={explaining !== null}
        onClose={() => setExplaining(null)}
        title={`${t("explainRelation") ?? "解释关系"} · ${explaining?.otherObjectName ?? ""}`}
        maxWidth="sm"
      >
        {explaining && (
          <div className="space-y-3 text-sm">
            <p className="whitespace-pre-line leading-relaxed text-foreground">
              {explaining.text}
            </p>
            {explaining.sharedProjects.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("sharedProjects") ?? "共同项目"}：
                {explaining.sharedProjects.map((p) => p.name).join("、")}
              </p>
            )}
            {explaining.sharedGoals.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("sharedGoals") ?? "共同目标"}：
                {explaining.sharedGoals.map((g) => g.name).join("、")}
              </p>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
