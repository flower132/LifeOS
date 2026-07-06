"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Sparkles, Compass } from "lucide-react";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useTagStore } from "@/stores/tagStore";
import { PageHeader } from "@/components/navigation/PageHeader";
import { BackButton } from "@/components/navigation/BackButton";
import { ObjectTypeBadge } from "@/components/object/ObjectTypeBadge";
import { useTranslation } from "@/lib/useTranslation";
import { LifeObjectType, ObjectProperties } from "@/lib/types";
import { OverviewTab } from "./tabs/OverviewTab";
import { AIProfileTab } from "./tabs/AIProfileTab";
import { AIInsightsTab } from "./tabs/AIInsightsTab";
import { AISuggestionsTab } from "./tabs/AISuggestionsTab";
import { MemoriesTab } from "./tabs/MemoriesTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { GrowthTab } from "./tabs/GrowthTab";
import { isAIProfileSupported } from "@/lib/ai/objectIntelligence/profiles";

type DetailTab = "overview" | "aiProfile" | "aiInsights" | "aiSuggestions" | "memories" | "history" | "growth";

const BASE_TABS: DetailTab[] = [
  "overview",
  "aiProfile",
  "aiInsights",
  "aiSuggestions",
  "memories",
  "history",
];

const ADVISOR_TYPES: LifeObjectType[] = ["person", "goal", "project", "self"];

export default function ObjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const id = params.id as string;

  const { objects, loaded: objectsLoaded, removeObject, updateObject } = useObjectStore();
  const { getByObjectId: getNotesByObjectId } = useNoteStore();
  const { getByObjectId: getRelationsByObjectId } = useRelationStore();
  const { tags } = useTagStore();

  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  const object = objects.find((o) => o.id === id);
  const notes = object ? getNotesByObjectId(object.id) : [];
  const relations = object ? getRelationsByObjectId(object.id) : [];
  const objectTags = object
    ? object.tag_ids
        .map((tagId) => tags.find((tag) => tag.id === tagId))
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
    : [];

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

  const handlePropertiesChange = async (properties: ObjectProperties) => {
    if (!object) return;
    await updateObject(object.id, { properties });
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
          <div className="mt-4 flex justify-center">
            <BackButton href="/objects" label={t("backToObjects")} />
          </div>
        </div>
      </div>
    );
  }

  const tabs: DetailTab[] =
    object.type === "self"
      ? [...BASE_TABS.slice(0, 5), "growth", ...BASE_TABS.slice(5)]
      : BASE_TABS;

  const hasAnyAIData =
    object.aiProfile ||
    (object.aiInsights && object.aiInsights.length > 0) ||
    (object.aiSuggestions && object.aiSuggestions.length > 0) ||
    (object.memories && object.memories.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        backHref="/objects"
        backLabel={t("backToObjects")}
        title={object.name}
        subtitle={object.description}
        icon={<ObjectTypeBadge type={object.type} />}
        actions={
          <>
            {ADVISOR_TYPES.includes(object.type) && (
              <Link
                href={`/advisor?objectId=${object.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/20"
              >
                <Compass className="h-4 w-4" />
                {t("askLifeOS")}
              </Link>
            )}
            {isAIProfileSupported(object.type) && (
              <Link
                href={`/objects/${object.id}/update-ai`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
              >
                <Sparkles className="h-4 w-4" />
                {t("updateObjectAITitle", { type: t(object.type) })}
              </Link>
            )}
            <button
              onClick={handleDelete}
              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title={t("deleteObject")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        }
        maxWidth="4xl"
      />

      <div className="mx-auto max-w-4xl px-6 py-6">
        <nav className="mb-8 border-b border-border">
          <ul className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isDisabled = tab !== "overview" && tab !== "growth" && !hasAnyAIData;
              return (
                <li key={tab}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    disabled={isDisabled}
                    className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      activeTab === tab
                        ? "border-accent text-accent"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(`detailTab_${tab}`)}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {activeTab === "overview" && (
          <OverviewTab
            object={object}
            notes={notes}
            relations={relations}
            objectTags={objectTags}
            onTagChange={handleTagChange}
            onPropertiesChange={handlePropertiesChange}
          />
        )}
        {activeTab === "aiProfile" && <AIProfileTab object={object} />}
        {activeTab === "aiInsights" && <AIInsightsTab object={object} />}
        {activeTab === "aiSuggestions" && <AISuggestionsTab object={object} />}
        {activeTab === "memories" && <MemoriesTab object={object} />}
        {activeTab === "history" && <HistoryTab object={object} />}
        {activeTab === "growth" && object.type === "self" && <GrowthTab object={object} />}
      </div>
    </div>
  );
}
