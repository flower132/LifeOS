"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AIInputWizard } from "@/components/ai/AIInputWizard";
import { AIReviewPanel } from "@/components/ai/AIReviewPanel";
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

  const [phase, setPhase] = useState<UpdatePhase>("input");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<AIAnalysisResult | null>(null);
  const [baseUpdates, setBaseUpdates] = useState<Partial<LifeObject> | null>(null);
  const [lastRunMeta, setLastRunMeta] = useState<RunMeta | null>(null);

  const object = objects.find((o) => o.id === id);
  const notes = object ? getNotesByObjectId(object.id) : [];

  if (!objectsLoaded) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-xl font-semibold text-foreground">{t("objectNotFound")}</h1>
          <Link
            href="/objects"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToObjects")}
          </Link>
        </div>
      </div>
    );
  }

  if (!isAIProfileSupported(object.type)) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-xl font-semibold text-foreground">
            {t("aiTypeNotSupported")}
          </h1>
          <Link
            href={`/objects/${id}`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToObject")}
          </Link>
        </div>
      </div>
    );
  }

  const handleAnalyze = async (text: string, images: AIImageInput[]) => {
    setIsAnalyzing(true);
    setError(null);

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
        setPhase("review");
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
      setPhase("review");
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="space-y-1">
            <Link
              href={`/objects/${id}`}
              className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("backToObject")}
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {phase === "input"
                ? t("updateObjectAITitle", { type: typeLabel })
                : t("reviewObjectAITitle", { type: typeLabel })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {phase === "input"
                ? t(`updateObjectAISubtitle_${object.type}`) ??
                  t("updatePersonAISubtitle")
                : t(`reviewObjectAISubtitle_${object.type}`) ??
                  t("reviewPersonAISubtitle")}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

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
              {t("reviewPersonAIHint") ??
                "Review the updated profile below. Items reflect both existing and new understanding."}
            </div>
            <AIReviewPanel
              result={reviewResult}
              onChange={setReviewResult}
              onConfirm={handleConfirm}
              onReanalyze={() => setPhase("input")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
