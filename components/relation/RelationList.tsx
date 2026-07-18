"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Relation, RELATION_TYPES, RelationType } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { useRelationStore } from "@/stores/relationStore";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Sparkles, Pencil, Trash2, User } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface RelationListProps {
  objectId: string;
  relations: Relation[];
}

/**
 * 关系区域 — Knowledge Graph edges for this object: AI/User 标识、点击跳转、
 * 编辑（类型/标签/说明）、删除。
 */
export function RelationList({ objectId, relations }: RelationListProps) {
  const { getById } = useObjectStore();
  const { removeRelation, updateRelation } = useRelationStore();
  const router = useRouter();
  const { t } = useTranslation();

  const [editing, setEditing] = useState<Relation | null>(null);
  const [editType, setEditType] = useState<RelationType>(RELATION_TYPES[0]);
  const [editLabel, setEditLabel] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

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

  if (relations.length === 0) {
    return <EmptyState description={t("relationsEmpty")} />;
  }

  return (
    <>
      <div className="space-y-2">
        {relations.map((relation) => {
          const otherId =
            relation.source_object_id === objectId
              ? relation.target_object_id
              : relation.source_object_id;
          const other = getById(otherId);
          const isAI = relation.createdBy === "ai";
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
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {relation.label ? `${relation.type} · ${relation.label}` : relation.type}
                    {relation.confidence !== undefined &&
                      ` • ${Math.round(relation.confidence * 100)}%`}
                    {relation.confidence === undefined &&
                      relation.strength !== undefined &&
                      ` • ${Math.round(relation.strength * 100)}%`}
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
    </>
  );
}
