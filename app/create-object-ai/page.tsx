"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AIInputWizard } from "@/components/ai/AIInputWizard";
import { AIReviewPanel } from "@/components/ai/AIReviewPanel";
import { ObjectTypeConfirmation } from "@/components/ai/ObjectTypeConfirmation";
import { aiService } from "@/lib/ai";
import { AIAnalysisInput, AIAnalysisResult } from "@/lib/ai/objectIntelligence/types";
import { useObjectStore } from "@/stores/objectStore";
import { useTranslation } from "@/lib/useTranslation";
import { getObjectDisplayName } from "@/lib/ai/objectIntelligence/mapper";
import { getAIAnalysisHistory, updateAIAnalysisHistoryObjectId } from "@/lib/ai/objectIntelligence/history";
import { isAIProfileSupported } from "@/lib/ai/objectIntelligence/profiles";
import { selectProviderForAnalysis } from "@/lib/ai/objectIntelligence/fallback";
import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";

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

  const [step, setStep] = useState<CreateObjectAIStep>("input");
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
        setResult(runResult.data);
        setStep("review");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("aiAnalysisFailed"));
      } finally {
        setIsAnalyzing(false);
      }
    },
    [objectType, t]
  );

  const handleReanalyze = useCallback(() => {
    setStep("input");
    setError(null);
    setAnalysisMeta(null);
  }, []);

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
          const history = await getAIAnalysisHistory();
          const latest = history[0];
          if (latest) {
            await updateAIAnalysisHistoryObjectId(latest.id, created.id);
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
    [addObject, objectType, router, t]
  );

  if (!isAIProfileSupported(objectType)) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-xl font-semibold text-foreground">{t("aiTypeNotSupported")}</h1>
          <Link
            href="/create-object"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToCreateObject")}
          </Link>
        </div>
      </div>
    );
  }

  const typeLabel = t(objectType);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/create-object"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToCreateObject")}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {step === "input"
              ? t("createObjectAITitle", { type: typeLabel })
              : t("reviewObjectAITitle", { type: typeLabel })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "input"
              ? t(`createObjectAISubtitle_${objectType}`)
              : t(`reviewObjectAISubtitle_${objectType}`)}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

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
      </div>
    </div>
  );
}
