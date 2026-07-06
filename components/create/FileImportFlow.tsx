"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";
import { FilePicker, SelectedFile } from "./FilePicker";
import { DraftObjectList } from "./DraftObjectList";
import { useTranslation } from "@/lib/useTranslation";
import { useObjectStore } from "@/stores/objectStore";
import { useLastCreationStore } from "@/stores/lastCreationStore";
import { PageHeader } from "@/components/navigation/PageHeader";
import { NavigationStepper } from "@/components/navigation/NavigationStepper";
import { StepTransition } from "@/components/navigation/StepTransition";
import { ConfirmDialog } from "@/components/navigation/ConfirmDialog";
import { useStepController } from "@/hooks/useStepController";
import { parseImportFile, ImportParseError } from "@/lib/create/importParser";
import { classifyImportRecords } from "@/lib/ai/objectIntelligence/importClassifier";
import { CreationDraft, findDuplicateByName } from "@/lib/create/draftUtils";
import { createObjectsFromDrafts } from "@/lib/create/createObjects";
import {
  buildDraftsFromRecords,
  updateDraftsDefaultType,
} from "@/lib/create/importDraftBuilder";

const steps = [
  { key: "upload", label: "选择文件" },
  { key: "review", label: "审阅结果" },
];

export function FileImportFlow() {
  const { t } = useTranslation();
  const router = useRouter();
  const objects = useObjectStore((s) => s.objects);
  const setLastCreation = useLastCreationStore((s) => s.setLastCreation);

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<CreationDraft[]>([]);
  const [mode, setMode] = useState<"single-column" | "name-type" | "auto" | null>(null);
  const [defaultType, setDefaultType] = useState<LifeObjectType>("person");
  const [showConfirm, setShowConfirm] = useState(false);

  const stepController = useStepController({
    steps,
    isDirty: () => file !== null || drafts.length > 0,
  });

  const isLoading = isParsing || isClassifying;

  const resetFlow = useCallback(() => {
    setFile(null);
    setDrafts([]);
    setMode(null);
    setError(null);
    setIsParsing(false);
    setIsClassifying(false);
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

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setError(null);
      setDrafts([]);
      setMode(null);
      setIsParsing(true);

      try {
        const parseResult = await parseImportFile(selectedFile);
        const buildResult = buildDraftsFromRecords(parseResult.records);

        if (buildResult.mode === "auto" && parseResult.records.length > 0) {
          setIsClassifying(true);
          try {
            const classified = await classifyImportRecords(parseResult.records);
            const classifiedBuild = buildDraftsFromRecords(
              parseResult.records,
              classified.rows
            );
            setMode(classifiedBuild.mode);
            setDrafts(checkDuplicates(classifiedBuild.drafts));
          } finally {
            setIsClassifying(false);
          }
        } else {
          setMode(buildResult.mode);
          setDrafts(checkDuplicates(buildResult.drafts));
        }
        stepController.next();
      } catch (err) {
        const parseError = err as ImportParseError;
        const errorKeyMap: Record<string, string> = {
          wrong_format: "createSpaceFileImportWrongFormat",
          too_large: "createSpaceFileImportTooLarge",
          empty_file: "createSpaceFileImportEmptyFile",
          no_data: "createSpaceFileImportNoData",
          encoding_error: "createSpaceFileImportEncodingError",
          read_error: "createSpaceFileImportReadError",
        };
        setError(t(errorKeyMap[parseError.code] || "createSpaceFileImportReadError"));
      } finally {
        setIsParsing(false);
      }
    },
    [t, stepController, checkDuplicates]
  );

  const handleDefaultTypeChange = useCallback(
    (type: LifeObjectType) => {
      setDefaultType(type);
      if (mode === "single-column") {
        setDrafts((prev) => checkDuplicates(updateDraftsDefaultType(prev, type)));
      }
    },
    [mode, checkDuplicates]
  );

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

  const handleClear = useCallback(() => {
    setFile(null);
    setDrafts([]);
    setMode(null);
    setError(null);
    stepController.goBack();
  }, [stepController]);

  const stats = useMemo(() => {
    const counts: Record<LifeObjectType, number> = {} as Record<LifeObjectType, number>;
    LIFE_OBJECT_TYPES.forEach((type) => (counts[type] = 0));
    drafts.forEach((d) => {
      if (d.selected) counts[d.type] = (counts[d.type] || 0) + 1;
    });
    return counts;
  }, [drafts]);

  const selectedCount = drafts.filter((d) => d.selected).length;

  const isReview = stepController.currentStepIndex === 1;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        backHref="/create-object"
        backLabel={t("createSpaceBackToHub")}
        title={t("createSpaceFileImportUploadTitle")}
        subtitle={t("createSpaceFileImportUploadSubtitle")}
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
          {!isReview ? (
            <div className="space-y-6">
              {isLoading ? (
                <div className="space-y-3 rounded-xl border border-border bg-card p-5">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <FilePicker onFileSelect={handleFileSelect} disabled={isLoading} />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <SelectedFile
                file={file!}
                onClear={handleClear}
                disabled={isLoading || isCreating}
              />

              {mode === "single-column" && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <label className="text-sm font-medium text-foreground">
                    {t("createSpaceFileImportDefaultType")}
                  </label>
                  <select
                    value={defaultType}
                    onChange={(e) =>
                      handleDefaultTypeChange(e.target.value as LifeObjectType)
                    }
                    className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                  >
                    {LIFE_OBJECT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(type)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{t("createSpaceFileImportStats")}:</span>
                  {LIFE_OBJECT_TYPES.filter((type) => stats[type] > 0).map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-muted px-2 py-0.5"
                    >
                      {t(type)}: {stats[type]}
                    </span>
                  ))}
                </div>

                <DraftObjectList
                  drafts={drafts}
                  onChange={(next) => setDrafts(checkDuplicates(next))}
                />

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleClear}
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
