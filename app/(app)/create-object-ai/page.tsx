"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AIInputWizard } from "@/components/ai/AIInputWizard";
import { AIReviewPanel } from "@/components/ai/AIReviewPanel";
import { ObjectTypeConfirmation } from "@/components/ai/ObjectTypeConfirmation";
import { PageHeader } from "@/components/navigation/PageHeader";
import { NavigationStepper } from "@/components/navigation/NavigationStepper";
import { StepTransition } from "@/components/navigation/StepTransition";
import { ConfirmDialog } from "@/components/navigation/ConfirmDialog";
import { BackButton } from "@/components/navigation/BackButton";
import { useStepController } from "@/hooks/useStepController";
import { aiService } from "@/lib/ai";
import { AIAnalysisInput, AIAnalysisResult } from "@/lib/ai/objectIntelligence/types";
import { AIAnalysisRunResult } from "@/lib/ai/types";
import { useObjectStore } from "@/stores/objectStore";
import { useTranslation } from "@/lib/useTranslation";
import { getObjectDisplayName } from "@/lib/ai/objectIntelligence/mapper";
import { updateAIAnalysisHistoryObjectId } from "@/lib/ai/objectIntelligence/history";
import { isAIProfileSupported } from "@/lib/ai/objectIntelligence/profiles";
import { selectProviderForAnalysis } from "@/lib/ai/objectIntelligence/fallback";
import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";
import { isNonEmptyString } from "@/lib/navigation/dirtyCheck";

const steps = [
  { key: "input", label: "输入素材" },
  { key: "review", label: "审阅结果" },
];

type CreateObjectAIStep = "input" | "review";

export default function CreateObjectAIPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const addObject = useObjectStore((s) => s.addObject);

  const rawType = searchParams.get("type") ?? "person";
  const objectType: LifeObjectType = LIFE_OBJECT_TYPES.includes(rawType as LifeObjectType)
    ? (rawType as LifeObjectType)
    : "person";

  const [showConfirm, setShowConfirm] = useState(false);
  const [lastInput, setLastInput] = useState<AIAnalysisInput>({ textInput: "", images: [] });
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [analysisMeta, setAnalysisMeta] = useState<{
    provider: string;
    model: string;
    durationMs?: number;
  } | null>(null);
  const [lastRunResult, setLastRunResult] = useState<AIAnalysisRunResult<AIAnalysisResult> | null>(null);

  const stepController = useStepController({
    steps,
    isDirty: () =>
      isNonEmptyString(lastInput.textInput) ||
      lastInput.images.length > 0 ||
      result !== null,
  });

  const step = stepController.currentStep.key as CreateObjectAIStep;

  const handleTitleClick = () => {
    if (stepController.isHome) return;
    if (stepController.isDirty?.()) {
      setShowConfirm(true);
    } else {
      stepController.reset();
    }
  };

  const resetFlow = useCallback(() => {
    setLastInput({ textInput: "", images: [] });
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
    setIsCreating(false);
    setAnalysisMeta(null);
    setLastRunResult(null);
  }, []);

  const handleConfirmDiscard = useCallback(() => {
    setShowConfirm(false);
    resetFlow();
    stepController.reset();
  }, [resetFlow, stepController]);

  const handleAnalyze = useCallback(
    async (textInput: string, images: AIAnalysisInput["images"]) => {
      setError(null);
      setIsAnalyzing(true);
      setLastInput({ textInput, images });

      try {
        const selected = selectProviderForAnalysis();
        setAnalysisMeta({
          provider: selected.providerId,
          model: selected.model,
        });

        const runResult = await aiService.analyzeObject(objectType, {
          textInput,
          images,
        });

        if (!runResult.success || !runResult.data) {
          setError(runResult.error || t("aiAnalysisFailed"));
          return;
        }

        setAnalysisMeta((prev) =>
          prev
            ? { ...prev, durationMs: runResult.durationMs }
            : { provider: runResult.provider, model: runResult.model, durationMs: runResult.durationMs }
        );
        setLastRunResult(runResult);
        setResult(runResult.data);
        stepController.next();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("aiAnalysisFailed"));
      } finally {
        setIsAnalyzing(false);
      }
    },
    [objectType, stepController, t]
  );

  const handleReanalyze = useCallback(() => {
    stepController.goBack();
    setError(null);
    setAnalysisMeta(null);
    setLastRunResult(null);
  }, [stepController]);

  const handleConfirm = useCallback(
    async (finalResult: AIAnalysisResult) => {
      if (!finalResult) return;
      setError(null);
      setIsCreating(true);

      try {
        const displayName = getObjectDisplayName(objectType, finalResult.properties);
        const created = await addObject({
          type: objectType,
          name: displayName || t(`aiDefaultObjectName_${objectType}`),
          description: finalResult.analysisSummary || undefined,
          properties: finalResult.properties,
          aiProfile: finalResult.profile,
          aiInsights: finalResult.insights,
          aiSuggestions: finalResult.suggestions,
          memories: finalResult.memories,
          tag_ids: [],
        });

        try {
          if (lastRunResult?.historyEntryId) {
            await updateAIAnalysisHistoryObjectId(lastRunResult.historyEntryId, created.id);
          }
        } catch (historyErr) {
          console.error("[CreateObjectAI] Failed to link history:", historyErr);
        }

        router.push(`/objects/${created.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("failedToCreateObject"));
        setIsCreating(false);
      }
    },
    [addObject, lastRunResult, objectType, router, t]
  );

  if (!isAIProfileSupported(objectType)) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-xl font-semibold text-foreground">{t("aiTypeNotSupported")}</h1>
          <div className="mt-4 flex justify-center">
            <BackButton href="/create-object" label={t("backToCreateObject")} />
          </div>
        </div>
      </div>
    );
  }

  const typeLabel = t(objectType);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        backHref="/create-object"
        backLabel={t("backToCreateObject")}
        title={t("createObjectAITitle", { type: typeLabel })}
        subtitle={
          step === "input"
            ? t(`createObjectAISubtitle_${objectType}`)
            : t(`reviewObjectAISubtitle_${objectType}`)
        }
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
          stepKey={step}
          direction={stepController.direction}
        >
          {step === "input" ? (
            <div className="space-y-6">
              <ObjectTypeConfirmation type={objectType} />
              <AIInputWizard
                defaultText={lastInput.textInput}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
              />

              {(isAnalyzing || analysisMeta) && (
                <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-foreground">
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      <span>
                        {t("aiAnalyzingWithProvider", {
                          provider: analysisMeta?.provider ?? "",
                          model: analysisMeta?.model ?? "",
                        })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>
                        {t("aiAnalysisCompleted")}: {analysisMeta?.provider} / {analysisMeta?.model}
                      </span>
                      {analysisMeta?.durationMs && (
                        <span>{analysisMeta.durationMs}ms</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : result ? (
            <AIReviewPanel
              result={result}
              onChange={setResult}
              onConfirm={handleConfirm}
              onReanalyze={handleReanalyze}
              isCreating={isCreating}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
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
