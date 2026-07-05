"use client";

import Link from "next/link";
import { StickyNote, Link as LinkIcon, Info, Sparkles } from "lucide-react";
import { LifeObject, Note, Relation, Tag, SelfAIProfile } from "@/lib/types";
import { ObjectPropertiesForm } from "@/components/object/ObjectPropertiesForm";
import { TagBadge } from "@/components/tag/TagBadge";
import { TagSelect } from "@/components/tag/TagSelect";
import { RelationList } from "@/components/relation/RelationList";
import { RelationForm } from "@/components/relation/RelationForm";
import { NoteTimeline } from "@/components/note/NoteTimeline";
import { useTranslation } from "@/lib/useTranslation";
import { ObjectProperties } from "@/lib/types";

interface OverviewTabProps {
  object: LifeObject;
  notes: Note[];
  relations: Relation[];
  objectTags: Tag[];
  onTagChange: (tagIds: string[]) => void;
  onPropertiesChange: (properties: ObjectProperties) => void;
}

export function OverviewTab({
  object,
  notes,
  relations,
  objectTags,
  onTagChange,
  onPropertiesChange,
}: OverviewTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("basicInfo")}
          </h2>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <ObjectPropertiesForm
            key={object.id}
            object={object}
            onChange={onPropertiesChange}
          />
        </div>
      </section>

      {object.type === "self" && object.aiProfile && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("aiUnderstanding")}
            </h2>
          </div>
          <SelfSummaryCard profile={object.aiProfile as SelfAIProfile} />
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("tagsSection")}
          </h2>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <TagSelect selectedTagIds={object.tag_ids} onChange={onTagChange} />
          {objectTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {objectTags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </section>

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
  );
}

function SelfSummaryCard({ profile }: { profile: SelfAIProfile }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("selfCurrentFocus")}
        </p>
        <p className="text-sm leading-relaxed text-foreground">
          {profile.currentFocus || t("aiNotAvailable")}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("selfUnderstanding")}
        </p>
        <p className="text-sm leading-relaxed text-foreground">
          {profile.understandingSummary || t("aiNotAvailable")}
        </p>
      </div>
    </div>
  );
}
