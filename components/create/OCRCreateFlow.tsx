"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Sparkles, ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
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
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { NavigationStepper } from "@/components/navigation/NavigationStepper";
import { StepTransition } from "@/components/navigation/StepTransition";
import { ConfirmDialog } from "@/components/navigation/ConfirmDialog";
import { useStepController } from "@/hooks/useStepController";

const steps = [
  { key: "upload", label: "上传截图" },
  { key: "review", label: "审阅结果" },
];

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
  const [showConfirm, setShowConfirm] = useState(false);

  const stepController = useStepController({
    steps,
    isDirty: () => images.length > 0 || drafts.length > 0,
  });

  const hasDrafts = stepController.currentStepIndex === 1;
  const selectedCount = drafts.filter((d) => d.selected).length;

  const resetFlow = useCallback(() => {
    setImages([]);
    setDrafts([]);
    setError(null);
    setIsAnalyzing(false);
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
      stepController.next();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiAnalysisFailed"));
    } finally {
      setIsAnalyzing(false);
    }
  }, [images, language, stepController, t, checkDuplicates]);

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
    <WorkspaceLayout
      backHref="/create-object"
      backLabel={t("createSpaceBackToHub")}
      title={t("createSpaceOCR")}
      subtitle={t("createSpaceOCRDescription")}
      titleGoesHome
      onTitleClick={handleTitleClick}
      stepper={
        <NavigationStepper
          steps={steps}
          currentStepIndex={stepController.currentStepIndex}
        />
      }
      maxWidth="3xl"
      error={error ?? undefined}
      onRetry={hasDrafts ? handleCreate : handleAnalyze}
    >
      <StepTransition
        stepKey={stepController.currentStep.key}
        direction={stepController.direction}
      >
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
                    <Spinner size="sm" />
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
                  onClick={() => {
                    setDrafts([]);
                    stepController.goBack();
                  }}
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
                      <Spinner size="sm" />
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
        </StepTransition>

      <ConfirmDialog
        open={showConfirm}
        title={t("confirmDiscardTitle")}
        message={t("confirmDiscardMessage")}
        confirmLabel={t("discardAndReturn")}
        cancelLabel={t("continueEditing")}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowConfirm(false)}
      />
    </WorkspaceLayout>
  );
}
