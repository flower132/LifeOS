"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AIInputWizard } from "@/components/ai/AIInputWizard";
import { AIReviewPanel } from "@/components/ai/AIReviewPanel";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { NavigationStepper } from "@/components/navigation/NavigationStepper";
import { StepTransition } from "@/components/navigation/StepTransition";
import { ConfirmDialog } from "@/components/navigation/ConfirmDialog";
import { BackButton } from "@/components/navigation/BackButton";
import { useStepController } from "@/hooks/useStepController";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useTranslation } from "@/lib/useTranslation";
import { AIAnalysisResult } from "@/lib/ai/objectIntelligence/types";
import { AIImageInput } from "@/lib/ai/types";
import { isAIProfileSupported } from "@/lib/ai/objectIntelligence/profiles";
import { analyzeObjectUpdate } from "@/lib/ai/objectIntelligence/update";
import { analyzePersonUpdate } from "@/lib/ai/personLiving/analyzePersonUpdate";
import { MergePersonAnalysisResult } from "@/lib/ai/personLiving/mergePersonAnalysis";
import {
  addAIAnalysisHistory,
  createAIAnalysisHistoryEntryInput,
} from "@/lib/ai/objectIntelligence/history";
import { LifeObject } from "@/lib/types";
import { isNonEmptyString } from "@/lib/navigation/dirtyCheck";
import { SkeletonBlock, SkeletonText } from "@/components/ui/Skeleton";

const steps = [
  { key: "input", label: "输入素材" },
  { key: "review", label: "审阅结果" },
];

type UpdatePhase = "input" | "review";

interface RunMeta {
  textInput: string;
  images: AIImageInput[];
  provider: string;
  model: string;
  durationMs: number;
  rawOutput: string;
}

export default function ObjectUpdateAIPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();
  const id = params.id as string;
  const noteId = searchParams.get("noteId");

  const { objects, loaded: objectsLoaded, updateObject } = useObjectStore();
  const {
    getByObjectId: getNotesByObjectId,
    notes: allNotes,
    load: loadNotes,
    loaded: notesLoaded,
  } = useNoteStore();

  useEffect(() => {
    if (!notesLoaded) {
      void loadNotes();
    }
  }, [notesLoaded, loadNotes]);

  const sourceNote = noteId
    ? allNotes.find((n) => n.id === noteId && n.object_id === id)
    : undefined;

  const defaultText = sourceNote?.content ?? "";
  const defaultImages: AIImageInput[] =
    sourceNote?.attachments?.map((a) => ({
      mimeType: a.mimeType,
      base64Data: a.base64Data,
    })) ?? [];

  const [showConfirm, setShowConfirm] = useState(false);
  const [textInput, setTextInput] = useState(defaultText);
  const [inputImages, setInputImages] = useState<AIImageInput[]>(defaultImages);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<AIAnalysisResult | null>(null);
  const [baseUpdates, setBaseUpdates] = useState<Partial<LifeObject> | null>(null);
  const [lastRunMeta, setLastRunMeta] = useState<RunMeta | null>(null);

  const stepController = useStepController({
    steps,
    isDirty: () =>
      isNonEmptyString(textInput) ||
      inputImages.length > 0 ||
      reviewResult !== null,
  });

  const phase = stepController.currentStep.key as UpdatePhase;

  const object = objects.find((o) => o.id === id);
  const notes = object ? getNotesByObjectId(object.id) : [];

  if (!objectsLoaded) {
    return (
      <WorkspaceLayout
        title={t("updateObjectAITitle", { type: "" })}
        maxWidth="4xl"
        loading
        loadingSkeleton={
          <div className="space-y-6">
            <SkeletonText className="h-8 w-48" />
            <SkeletonBlock className="h-64" />
          </div>
        }
      />
    );
  }

  if (!object) {
    return (
      <WorkspaceLayout
        title={t("objectNotFound")}
        maxWidth="4xl"
        error={t("objectNotFound")}
      >
        <div className="flex justify-center">
          <BackButton href="/objects" label={t("backToObjects")} />
        </div>
      </WorkspaceLayout>
    );
  }

  if (!isAIProfileSupported(object.type)) {
    return (
      <WorkspaceLayout
        title={t("aiTypeNotSupported")}
        maxWidth="4xl"
        error={t("aiTypeNotSupported")}
      >
        <div className="flex justify-center">
          <BackButton href={`/objects/${id}`} label={t("backToObject")} />
        </div>
      </WorkspaceLayout>
    );
  }

  const handleAnalyze = async (text: string, images: AIImageInput[]) => {
    setIsAnalyzing(true);
    setError(null);
    setTextInput(text);
    setInputImages(images);

    try {
      if (object.type === "person") {
        const result = await analyzePersonUpdate(
          object,
          notes,
          { textInput: text, images },
          { language }
        );

        if (!result.success) {
          setError(result.error);
          return;
        }

        const personMerge = result.data as MergePersonAnalysisResult;
        setReviewResult(personMerge.mergedResult);
        setBaseUpdates(personMerge.mergedObject);
        setLastRunMeta({
          textInput: text,
          images,
          provider: result.provider,
          model: result.model,
          durationMs: result.durationMs,
          rawOutput: result.rawOutput,
        });
        stepController.next();
        return;
      }

      const result = await analyzeObjectUpdate(
        object.type,
        object,
        notes,
        { textInput: text, images },
        { language, saveHistory: false }
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setReviewResult(result.data.mergedResult);
      setBaseUpdates(result.data.mergedObject);
      setLastRunMeta({
        textInput: text,
        images,
        provider: result.provider,
        model: result.model,
        durationMs: result.durationMs,
        rawOutput: result.rawOutput,
      });
      stepController.next();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async (confirmed: AIAnalysisResult) => {
    if (!baseUpdates || !lastRunMeta) return;

    try {
      await updateObject(object.id, {
        aiProfile: confirmed.profile,
        aiInsights: confirmed.insights,
        aiSuggestions: confirmed.suggestions,
        memories: confirmed.memories,
      });

      const entryInput = createAIAnalysisHistoryEntryInput({
        objectType: object.type,
        rawTextInput: lastRunMeta.textInput,
        imageCount: lastRunMeta.images.length,
        imageThumbnails: lastRunMeta.images.map((img) =>
          img.base64Data.slice(0, 120)
        ),
        provider: lastRunMeta.provider,
        model: lastRunMeta.model,
        durationMs: lastRunMeta.durationMs,
        rawOutput: lastRunMeta.rawOutput,
        profileSnapshot: confirmed.profile,
        insightsSnapshot: confirmed.insights,
        suggestionsSnapshot: confirmed.suggestions,
        memoriesSnapshot: confirmed.memories,
      });

      await addAIAnalysisHistory({
        ...entryInput,
        objectId: object.id,
      });

      router.push(`/objects/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const typeLabel = t(object.type);

  const handleTitleClick = () => {
    if (stepController.isHome) return;
    if (stepController.isDirty?.()) {
      setShowConfirm(true);
    } else {
      stepController.reset();
    }
  };

  const resetFlow = () => {
    setTextInput(defaultText);
    setInputImages(defaultImages);
    setReviewResult(null);
    setBaseUpdates(null);
    setLastRunMeta(null);
    setError(null);
    setIsAnalyzing(false);
  };

  const handleConfirmDiscard = () => {
    setShowConfirm(false);
    resetFlow();
    stepController.reset();
  };

  return (
    <WorkspaceLayout
      backHref={`/objects/${id}`}
      backLabel={t("backToObject")}
      title={t("updateObjectAITitle", { type: typeLabel })}
      subtitle={
        phase === "input"
          ? t(`updateObjectAISubtitle_${object.type}`) ??
            t("updatePersonAISubtitle")
          : t(`reviewObjectAISubtitle_${object.type}`) ??
            t("reviewPersonAISubtitle")
      }
      titleGoesHome
      onTitleClick={handleTitleClick}
      stepper={
        <NavigationStepper
          steps={steps}
          currentStepIndex={stepController.currentStepIndex}
        />
      }
      maxWidth="4xl"
      error={error ?? undefined}
      onRetry={() => void handleAnalyze(textInput, inputImages)}
    >
      <StepTransition
        stepKey={phase}
        direction={stepController.direction}
      >
        {phase === "input" && (
          <AIInputWizard
            defaultText={defaultText}
            defaultImages={defaultImages}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        )}

        {phase === "review" && reviewResult && (
          <div className="space-y-6">
            <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-foreground">
              {t("reviewPersonAIHint")}
            </div>
            <AIReviewPanel
              result={reviewResult}
              onChange={setReviewResult}
              onConfirm={handleConfirm}
              onReanalyze={() => {
                stepController.goBack();
                setReviewResult(null);
              }}
            />
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
