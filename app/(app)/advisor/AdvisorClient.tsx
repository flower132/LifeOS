"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { AdvisorInput } from "@/components/advisor/AdvisorInput";
import { AdvisorOutput } from "@/components/advisor/AdvisorOutput";
import { useTranslation } from "@/lib/useTranslation";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import {
  AdvisorContext,
  AdvisorResult,
} from "@/lib/ai/advisor/types";
import { advisorService } from "@/lib/ai/advisor";
import { selectTodayFocus } from "@/lib/ai/advisor/focusSelector";
import { ObjectTypeBadge } from "@/components/object/ObjectTypeBadge";

interface AdvisorClientProps {
  objectId?: string;
}

export function AdvisorClient({ objectId }: AdvisorClientProps) {
  const { t } = useTranslation();
  const { objects, loaded: objectsLoaded } = useObjectStore();
  const { notes, loaded: notesLoaded } = useNoteStore();
  const { getByObjectId: getRelationsByObjectId } = useRelationStore();

  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");

  const object = useMemo(() => {
    if (objectId) {
      return objects.find((o) => o.id === objectId) ?? null;
    }
    return selectTodayFocus(objects, notes);
  }, [objectId, objects, notes]);

  const context: AdvisorContext | null = useMemo(() => {
    if (!object) return null;
    const objectNotes = notes
      .filter((n) => n.object_id === object.id)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    const relations = getRelationsByObjectId(object.id);
    const relatedObjectIds = new Set<string>();
    relations.forEach((r) => {
      relatedObjectIds.add(r.source_object_id);
      relatedObjectIds.add(r.target_object_id);
    });
    relatedObjectIds.delete(object.id);
    const relatedObjects = objects.filter((o) => relatedObjectIds.has(o.id)
    );
    return {
      object,
      notes: objectNotes,
      relations,
      relatedObjects,
    };
  }, [object, notes, getRelationsByObjectId, objects]);

  const handleSubmit = async (question: string) => {
    if (!context) return;
    setError(null);
    setIsLoading(true);
    setLastQuestion(question);
    try {
      const res = await advisorService.ask(context, question);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiAnalysisFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const isReady = objectsLoaded && notesLoaded;

  return (
    <WorkspaceLayout
      backHref={object ? `/objects/${object.id}` : "/home"}
      backLabel={object ? t("backToObject") : t("backToHome")}
      title={t("advisorTitle")}
      subtitle={t("advisorSubtitle")}
      icon={
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Compass className="h-5 w-5 text-foreground" />
        </div>
      }
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {!isReady ? (
          <div className="space-y-4">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-32" />
          </div>
        ) : !object || !context ? (
          <EmptyState
            icon={<Compass className="h-6 w-6" />}
            description={t("advisorNoObject")}
            action={
              <Link
                href="/create-object"
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-3 text-button font-medium text-accent-foreground transition-colors duration-fast ease-out hover:bg-accent/90"
              >
                {t("createObject")}
              </Link>
            }
          />
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <ObjectTypeBadge type={object.type} />
              <span className="text-base font-medium text-foreground">
                {object.name}
              </span>
            </div>

            {error && (
              <ErrorState
                description={error}
                onRetry={() => {
                  if (!lastQuestion) return;
                  void handleSubmit(lastQuestion);
                }}
              />
            )}

            <AdvisorInput onSubmit={handleSubmit} isLoading={isLoading} />

            {!result && !isLoading && (
              <EmptyState description={t("advisorEmptyState")} />
            )}

            {result && <AdvisorOutput result={result} />}
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}
