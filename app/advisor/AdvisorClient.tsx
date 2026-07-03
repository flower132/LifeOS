"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { AdvisorInput } from "@/components/advisor/AdvisorInput";
import { AdvisorOutput } from "@/components/advisor/AdvisorOutput";
import { useTranslation } from "@/lib/useTranslation";
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <Link
            href={object ? `/objects/${object.id}` : "/home"}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {object ? t("backToObject") : t("backToHome")}
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Compass className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("advisorTitle")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("advisorSubtitle")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        {!isReady ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : !object || !context ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">{t("advisorNoObject")}</p>
            <Link
              href="/create-object"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/90"
            >
              {t("createObject")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <ObjectTypeBadge type={object.type} />
              <span className="text-base font-medium text-foreground">
                {object.name}
              </span>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <AdvisorInput onSubmit={handleSubmit} isLoading={isLoading} />

            {!result && !isLoading && (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("advisorEmptyState")}
                </p>
              </div>
            )}

            {result && <AdvisorOutput result={result} />}
          </>
        )}
      </div>
    </div>
  );
}
