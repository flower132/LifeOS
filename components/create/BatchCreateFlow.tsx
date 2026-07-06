"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";
import { DraftObjectList } from "./DraftObjectList";
import { useTranslation } from "@/lib/useTranslation";
import {
  CreationDraft,
  createDraftId,
  findDuplicateByName,
  parseBatchInput,
} from "@/lib/create/draftUtils";
import { createObjectsFromDrafts } from "@/lib/create/createObjects";
import { useLastCreationStore } from "@/stores/lastCreationStore";
import { useObjectStore } from "@/stores/objectStore";
import { PageHeader } from "@/components/navigation/PageHeader";
import { NavigationStepper } from "@/components/navigation/NavigationStepper";
import { StepTransition } from "@/components/navigation/StepTransition";
import { ConfirmDialog } from "@/components/navigation/ConfirmDialog";
import { useStepController } from "@/hooks/useStepController";
import { isNonEmptyString } from "@/lib/navigation/dirtyCheck";

const steps = [
  { key: "input", label: "批量输入" },
  { key: "review", label: "审阅结果" },
];

export function BatchCreateFlow() {
  const { t } = useTranslation();
  const router = useRouter();
  const objects = useObjectStore((s) => s.objects);
  const setLastCreation = useLastCreationStore((s) => s.setLastCreation);

  const [text, setText] = useState("");
  const [type, setType] = useState<LifeObjectType>("person");
  const [drafts, setDrafts] = useState<CreationDraft[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const stepController = useStepController({
    steps,
    isDirty: () => isNonEmptyString(text) || drafts.length > 0,
  });

  const parsedNames = useMemo(() => parseBatchInput(text), [text]);

  const resetFlow = useCallback(() => {
    setText("");
    setDrafts([]);
    setError(null);
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

  const handleParse = useCallback(() => {
    const nextDrafts = parsedNames.map((name) => ({
      id: createDraftId(),
      type,
      name,
      selected: true,
    }));
    setDrafts(checkDuplicates(nextDrafts));
    stepController.next();
  }, [parsedNames, type, stepController, checkDuplicates]);

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

  const selectedCount = drafts.filter((d) => d.selected).length;
  const isReview = stepController.currentStepIndex === 1;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        backHref="/create-object"
        backLabel={t("createSpaceBackToHub")}
        title={t("createSpaceBatch")}
        subtitle={t("createSpaceBatchDescription")}
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
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("createSpaceBatchTypeLabel")}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LifeObjectType)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                >
                  {LIFE_OBJECT_TYPES.map((typeOption) => (
                    <option key={typeOption} value={typeOption}>
                      {t(typeOption)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("content")}
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("createSpaceBatchPlaceholder")}
                  rows={10}
                  className="w-full resize-y rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent"
                />
                {parsedNames.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("createSpaceBatchDeduped", {
                      count: String(parsedNames.length),
                    })}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleParse}
                disabled={parsedNames.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {t("createSpaceCreateSelected", {
                  count: String(parsedNames.length),
                })}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <DraftObjectList
                drafts={drafts}
                onChange={(next) => setDrafts(checkDuplicates(next))}
                showTypeSelector={false}
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
