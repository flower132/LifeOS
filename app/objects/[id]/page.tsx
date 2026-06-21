"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, StickyNote, Link as LinkIcon, Sparkles } from "lucide-react";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useTagStore } from "@/stores/tagStore";
import { ObjectTypeBadge } from "@/components/object/ObjectTypeBadge";
import { TagBadge } from "@/components/tag/TagBadge";
import { TagSelect } from "@/components/tag/TagSelect";
import { NoteTimeline } from "@/components/note/NoteTimeline";
import { RelationList } from "@/components/relation/RelationList";
import { RelationForm } from "@/components/relation/RelationForm";
import { PersonInsightCard } from "@/components/ai/PersonInsightCard";
import { SelfInsightCard } from "@/components/ai/SelfInsightCard";
import { GoalEventInsightCard } from "@/components/ai/GoalEventInsightCard";
import { useTranslation } from "@/lib/useTranslation";

export default function ObjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const id = params.id as string;

  const { objects, loaded: objectsLoaded, removeObject, updateObject } = useObjectStore();
  const { getByObjectId: getNotesByObjectId } = useNoteStore();
  const { getByObjectId: getRelationsByObjectId } = useRelationStore();
  const { tags } = useTagStore();

  const object = objects.find((o) => o.id === id);
  const notes = object ? getNotesByObjectId(object.id) : [];
  const relations = object ? getRelationsByObjectId(object.id) : [];
  const objectTags = object
    ? object.tag_ids
        .map((tagId) => tags.find((t) => t.id === tagId))
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
    : [];

  const getObjectName = (objectId: string) => {
    const found = objects.find((o) => o.id === objectId);
    return found?.name || "Unknown";
  };

  const handleDelete = async () => {
    if (!object) return;
    if (!confirm(t("deleteConfirm", { name: object.name }))) return;
    await removeObject(object.id);
    router.push("/objects");
  };

  const handleTagChange = async (tagIds: string[]) => {
    if (!object) return;
    await updateObject(object.id, { tag_ids: tagIds });
  };

  if (!objectsLoaded) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-xl font-semibold text-foreground">{t("objectNotFound")}</h1>
          <Link
            href="/objects"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToObjects")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-start justify-between">
          <div className="space-y-1">
            <Link
              href="/objects"
              className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("backToObjects")}
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {object.name}
              </h1>
              <ObjectTypeBadge type={object.type} />
            </div>
            {object.description && (
              <p className="max-w-2xl text-sm text-muted-foreground">{object.description}</p>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title={t("deleteObject")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-10 px-6 py-6">
        {/* Tags */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("tagsSection")}
            </h2>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <TagSelect
              selectedTagIds={object.tag_ids}
              onChange={handleTagChange}
            />
            {objectTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {objectTags.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* AI Insight */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("aiUnderstanding")}
            </h2>
          </div>
          {object.type === "person" && (
            <PersonInsightCard
              object={object}
              notes={notes}
              relations={relations}
              getObjectName={getObjectName}
            />
          )}
          {object.type === "self" && (
            <SelfInsightCard
              object={object}
              notes={notes}
              relations={relations}
              getObjectName={getObjectName}
            />
          )}
          {(object.type === "event" || object.type === "goal" || object.type === "idea") && (
            <GoalEventInsightCard object={object} notes={notes} />
          )}
        </section>

        {/* Relations */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("relations")}
            </h2>
          </div>
          <RelationForm sourceObjectId={object.id} />
          <div className="pt-2">
            <RelationList objectId={object.id} relations={relations} />
          </div>
        </section>

        {/* Notes */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("notesTimeline")}
              </h2>
            </div>
            <Link
              href={`/create-note?objectId=${object.id}`}
              className="text-sm font-medium text-accent hover:text-accent/90"
            >
              + {t("addNote")}
            </Link>
          </div>
          <NoteTimeline notes={notes} />
        </section>
      </div>
    </div>
  );
}
