"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { AIImageInput } from "@/lib/ai/types";
import { extractNamesFromImages } from "@/lib/ai/objectIntelligence/multiObjectExtractor";
import { AIImageUploader } from "./AIImageUploader";
import { DraftObjectList } from "./DraftObjectList";
import { useTranslation } from "@/lib/useTranslation";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  CreationDraft,
  createDraftId,
  findDuplicateByName,
} from "@/lib/create/draftUtils";
import { createObjectsFromDrafts } from "@/lib/create/createObjects";
import { useLastCreationStore } from "@/stores/lastCreationStore";
import { useObjectStore } from "@/stores/objectStore";

export function OCRCreateFlow() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const objects = useObjectStore((s) => s.objects);
  const setLastCreation = useLastCreationStore((s) => s.setLastCreation);

  const [images, setImages] = useState<AIImageInput[]>([]);
  const [drafts, setDrafts] = useState<CreationDraft[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDrafts = drafts.length > 0;
  const selectedCount = drafts.filter((d) => d.selected).length;

  const checkDuplicates = useCallback(
    (nextDrafts: CreationDraft[]): CreationDraft[] => {
      return nextDrafts.map((draft) => {
        const existing = findDuplicateByName(draft.name, objects);
        if (existing) {
          return {
            ...draft,
            duplicate: {
              existing,
              action: draft.duplicate?.action ?? "use-existing",
            },
          };
        }
        return { ...draft, duplicate: undefined };
      });
    },
    [objects]
  );

  const handleAnalyze = useCallback(async () => {
    if (images.length === 0) return;
    setError(null);
    setIsAnalyzing(true);

    try {
      const result = await extractNamesFromImages(images, language);
      const initialDrafts = result.objects.map((obj) => ({
        id: createDraftId(),
        type: obj.type,
        name: obj.name,
        context: obj.context,
        selected: true,
      }));
      setDrafts(checkDuplicates(initialDrafts));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiAnalysisFailed"));
    } finally {
      setIsAnalyzing(false);
    }
  }, [images, language, t, checkDuplicates]);

  const handleCreate = useCallback(async () => {
    setError(null);
    setIsCreating(true);

    try {
      const result = await createObjectsFromDrafts(drafts, t);
      const createdIds = result.created.map((o) => o.id);

      if (createdIds.length > 0) {
        setLastCreation(createdIds);
      }

      if (result.errors.length > 0) {
        setError(
          `${t("failedToCreateObject")}: ${result.errors
            .map((e) => e.draft.name)
            .join(", ")}`
        );
      }

      router.push("/create-object");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToCreateObject"));
    } finally {
      setIsCreating(false);
    }
  }, [drafts, t, router, setLastCreation]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!hasDrafts ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("createSpaceOCRUpload")}
            </label>
            <AIImageUploader
              images={images}
              onChange={setImages}
              disabled={isAnalyzing}
            />
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={images.length === 0 || isAnalyzing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("createSpaceOCRAnalyzing")}
              </>
            ) : (
              <>
                <ScanLine className="h-4 w-4" />
                {t("aiAnalyze")}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-foreground">
            {t("createSpaceOCRExtracted", { count: String(drafts.length) })}
          </div>

          <DraftObjectList
            drafts={drafts}
            onChange={(next) => setDrafts(checkDuplicates(next))}
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setDrafts([])}
              disabled={isCreating}
              className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <ArrowLeft className="mr-1 inline h-3.5 w-3.5" />
              {t("createSpaceBackToHub")}
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={selectedCount === 0 || isCreating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("creating")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("createSpaceCreateSelected", {
                    count: String(selectedCount),
                  })}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
