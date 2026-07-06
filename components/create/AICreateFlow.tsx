"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ArrowLeft, Wand2 } from "lucide-react";
import { AIImageInput } from "@/lib/ai/types";
import { extractObjectsFromInput } from "@/lib/ai/objectIntelligence/multiObjectExtractor";
import { AIImageUploader } from "./AIImageUploader";
import { DraftObjectList } from "./DraftObjectList";
import { useTranslation } from "@/lib/useTranslation";
import { useSettingsStore } from "@/stores/settingsStore";
import { PageHeader } from "@/components/navigation/PageHeader";
import { NavigationStepper } from "@/components/navigation/NavigationStepper";
import { StepTransition } from "@/components/navigation/StepTransition";
import { ConfirmDialog } from "@/components/navigation/ConfirmDialog";
import { useStepController } from "@/hooks/useStepController";
import { isNonEmptyString } from "@/lib/navigation/dirtyCheck";
import {
  CreationDraft,
  createDraftId,
  findDuplicateByName,
} from "@/lib/create/draftUtils";
import { createObjectsFromDrafts, enrichDraft } from "@/lib/create/createObjects";
import { useLastCreationStore } from "@/stores/lastCreationStore";
import { useObjectStore } from "@/stores/objectStore";

const steps = [
  { key: "input", label: "输入素材" },
  { key: "review", label: "审阅结果" },
];

export function AICreateFlow() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const objects = useObjectStore((s) => s.objects);
  const setLastCreation = useLastCreationStore((s) => s.setLastCreation);

  const [text, setText] = useState("");
  const [images, setImages] = useState<AIImageInput[]>([]);
  const [drafts, setDrafts] = useState<CreationDraft[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const stepController = useStepController({
    steps,
    isDirty: () =>
      isNonEmptyString(text) || images.length > 0 || drafts.length > 0,
  });

  const hasDrafts = stepController.currentStepIndex === 1;
  const selectedDrafts = useMemo(() => drafts.filter((d) => d.selected), [drafts]);

  const resetFlow = useCallback(() => {
    setText("");
    setImages([]);
    setDrafts([]);
    setError(null);
    setIsExtracting(false);
    setIsEnriching(false);
    setIsCreating(false);
  }, []);

  const handleTitleClick = () => {
    if (stepController.isHome) return;
    if (stepController.isDirty?.()) {
      setShowConfirm(true);
    } else {
      resetFlow();
      stepController.reset();
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirm(false);
    resetFlow();
    stepController.reset();
  };

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

  const handleExtract = useCallback(async () => {
    if (!text.trim() && images.length === 0) return;
    setError(null);
    setIsExtracting(true);

    try {
      const result = await extractObjectsFromInput(
        { textInput: text.trim(), images },
        language
      );

      const initialDrafts = result.objects.map((obj) => ({
        id: createDraftId(),
        type: obj.type,
        name: obj.name,
        context: obj.context,
        selected: true,
      }));

      setDrafts(checkDuplicates(initialDrafts));
      stepController.next();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiAnalysisFailed"));
    } finally {
      setIsExtracting(false);
    }
  }, [text, images, language, stepController, t, checkDuplicates]);

  const handleEnrich = useCallback(async () => {
    if (selectedDrafts.length === 0) return;
    setError(null);
    setIsEnriching(true);

    try {
      const enriched = await Promise.all(
        drafts.map(async (draft) => {
          if (!draft.selected) return draft;
          return enrichDraft(draft);
        })
      );
      setDrafts(checkDuplicates(enriched));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiAnalysisFailed"));
    } finally {
      setIsEnriching(false);
    }
  }, [drafts, selectedDrafts.length, t, checkDuplicates]);

  const handleCreate = useCallback(async () => {
    if (selectedDrafts.length === 0) return;
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
  }, [drafts, selectedDrafts.length, t, router, setLastCreation]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        backHref="/create-object"
        backLabel={t("createSpaceBackToHub")}
        title={t("createSpaceAIRecommended")}
        subtitle={t("createSpaceAIDescription")}
        titleGoesHome
        onTitleClick={handleTitleClick}
        stepper={
          <NavigationStepper
            steps={steps}
            currentStepIndex={stepController.currentStepIndex}
          />
        }
        maxWidth="3xl"
      />

      <div className="mx-auto max-w-3xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <StepTransition
          stepKey={stepController.currentStep.key}
          direction={stepController.direction}
        >
          {!hasDrafts ? (
            <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("aiInputTextLabel")}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("createSpaceAIDescription")}
              rows={10}
              disabled={isExtracting}
              className="w-full resize-y rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("aiInputImagesLabel")}
            </label>
            <AIImageUploader
              images={images}
              onChange={setImages}
              disabled={isExtracting}
            />
          </div>

          <button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting || (!text.trim() && images.length === 0)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("aiAnalyzing")}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t("aiAnalyze")}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-foreground">
            {t("createSpaceExtractedObjects")}
          </div>

          <DraftObjectList
            drafts={drafts}
            onChange={(next) => setDrafts(checkDuplicates(next))}
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setDrafts([]);
                stepController.goBack();
              }}
              disabled={isCreating || isEnriching}
              className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <ArrowLeft className="mr-1 inline h-3.5 w-3.5" />
              {t("createSpaceBackToHub")}
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleEnrich}
                disabled={
                  selectedDrafts.length === 0 || isEnriching || isCreating
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEnriching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("aiAnalyzing")}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    {t("aiCreateWithAI")}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCreate}
                disabled={selectedDrafts.length === 0 || isCreating}
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
                      count: String(selectedDrafts.length),
                    })}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </StepTransition>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title={t("confirmDiscardTitle")}
        message={t("confirmDiscardMessage")}
        confirmLabel={t("discardAndReturn")}
        cancelLabel={t("continueEditing")}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
