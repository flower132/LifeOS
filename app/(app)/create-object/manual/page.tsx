"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ObjectForm } from "@/components/object/ObjectForm";
import { TemplateSelector } from "@/components/template/TemplateSelector";
import { AIMethodSelector } from "@/components/ai/AIMethodSelector";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { NavigationStepper } from "@/components/navigation/NavigationStepper";
import { StepTransition } from "@/components/navigation/StepTransition";
import { ConfirmDialog } from "@/components/navigation/ConfirmDialog";
import { useStepController } from "@/hooks/useStepController";
import { useTranslation } from "@/lib/useTranslation";
import { LifeObjectType, LIFE_OBJECT_TYPES, Template } from "@/lib/types";
import {
  getDefaultProperties,
  getDefaultPropertiesForType,
  templateToEditableProperties,
} from "@/lib/objectProperties";
import { useTemplateStore } from "@/stores/templateStore";
import { isAIProfileSupported } from "@/lib/ai/objectIntelligence/profiles";

type CreateStep = "type" | "method" | "template" | "form";

export default function CreateObjectManualPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const incrementUsage = useTemplateStore((s) => s.incrementUsage);

  const [type, setType] = useState<LifeObjectType>("person");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [formDirty, setFormDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const aiSupported = isAIProfileSupported(type);

  const steps = useMemo(
    () =>
      aiSupported
        ? [
            { key: "type", label: t("type") },
            { key: "method", label: t("method") || "Method" },
            { key: "template", label: t("selectTemplate") },
            { key: "form", label: t("name") },
          ]
        : [
            { key: "type", label: t("type") },
            { key: "template", label: t("selectTemplate") },
            { key: "form", label: t("name") },
          ],
    [aiSupported, t]
  );

  const stepController = useStepController({
    steps,
    isDirty: () => selectedTemplate !== null || formDirty,
  });

  const step = stepController.currentStep.key as CreateStep;

  const initialProperties = (() => {
    if (!selectedTemplate) return getDefaultProperties();
    const parsed = templateToEditableProperties(
      type,
      selectedTemplate.content
    );
    if (Object.keys(parsed).length === 0) {
      return getDefaultPropertiesForType(type);
    }
    return parsed;
  })();

  // Sync step/type/template from URL query params after hydration.
  useEffect(() => {
    const typeParam = searchParams.get("type");
    const templateParam = searchParams.get("template");
    if (
      typeParam &&
      LIFE_OBJECT_TYPES.includes(typeParam as LifeObjectType)
    ) {
      /* eslint-disable react-hooks/set-state-in-effect */
      const resolvedType = typeParam as LifeObjectType;
      setType(resolvedType);
      if (templateParam) {
        const template = useTemplateStore.getState().getById(templateParam);
        if (template) {
          setSelectedTemplate(template);
          stepController.goTo(isAIProfileSupported(resolvedType) ? 3 : 2);
          return;
        }
      }
      stepController.goTo(1);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    // Intentionally only run on mount / searchParams change; stepController is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSelectType = (selectedType: LifeObjectType) => {
    setType(selectedType);
    stepController.goTo(1);
  };

  const handleSelectMethodManual = () => {
    stepController.goTo(2);
  };

  const handleSelectMethodAI = () => {
    router.push(`/create-object-ai?type=${type}`);
  };

  const handleSelectTemplate = (template: Template | null) => {
    if (template) {
      void incrementUsage(template.id);
    }
    setSelectedTemplate(template);
    stepController.goTo(aiSupported ? 3 : 2);
  };

  const typeBadges: Record<
    LifeObjectType,
    { label: string; color: string; darkColor: string }
  > = {
    person: {
      label: t("person"),
      color: "bg-blue-100 text-blue-700",
      darkColor: "dark:bg-blue-900/30 dark:text-blue-300",
    },
    self: {
      label: t("self"),
      color: "bg-emerald-100 text-emerald-700",
      darkColor: "dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    goal: {
      label: t("goal"),
      color: "bg-rose-100 text-rose-700",
      darkColor: "dark:bg-rose-900/30 dark:text-rose-300",
    },
    event: {
      label: t("event"),
      color: "bg-amber-100 text-amber-700",
      darkColor: "dark:bg-amber-900/30 dark:text-amber-300",
    },
    idea: {
      label: t("idea"),
      color: "bg-indigo-100 text-indigo-700",
      darkColor: "dark:bg-indigo-900/30 dark:text-indigo-300",
    },
    project: {
      label: t("project"),
      color: "bg-cyan-100 text-cyan-700",
      darkColor: "dark:bg-cyan-900/30 dark:text-cyan-300",
    },
    knowledge: {
      label: t("knowledge"),
      color: "bg-violet-100 text-violet-700",
      darkColor: "dark:bg-violet-900/30 dark:text-violet-300",
    },
  };

  const handleTitleClick = () => {
    if (stepController.isHome) return;
    if (stepController.isDirty?.()) {
      setShowConfirm(true);
    } else {
      stepController.reset();
      setSelectedTemplate(null);
      setFormDirty(false);
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirm(false);
    stepController.reset();
    setSelectedTemplate(null);
    setFormDirty(false);
  };

  return (
    <WorkspaceLayout
      backHref="/create-object"
      backLabel={t("createSpaceBackToHub")}
      title={t("createObjectTitle")}
      subtitle={
        step === "type"
          ? t("chooseTypeSubtitle")
          : step === "method"
          ? t("chooseCreationMethodSubtitle")
          : step === "template"
          ? t("chooseTemplateSubtitle")
          : t("createObjectSubtitle")
      }
      titleGoesHome
      onTitleClick={handleTitleClick}
      stepper={
        <NavigationStepper
          steps={steps}
          currentStepIndex={stepController.currentStepIndex}
        />
      }
    >
      <StepTransition
        stepKey={step}
        direction={stepController.direction}
      >
          {step === "type" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {LIFE_OBJECT_TYPES.map((typeOption) => {
                const badge = typeBadges[typeOption];
                return (
                  <button
                    key={typeOption}
                    type="button"
                    onClick={() => handleSelectType(typeOption)}
                    className="flex flex-col items-start rounded-xl border border-input bg-background p-5 text-left transition-colors hover:border-accent hover:bg-accent/5"
                  >
                    <span
                      className={`mb-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color} ${badge.darkColor}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t(`templateCategory_${typeOption}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === "method" && (
            <div className="space-y-6">
              <AIMethodSelector
                type={type}
                onManual={handleSelectMethodManual}
                onAI={handleSelectMethodAI}
              />
              <button
                type="button"
                onClick={() => stepController.goBack()}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                ← {t("cancel")}
              </button>
            </div>
          )}

          {step === "template" && (
            <div className="space-y-6">
              <TemplateSelector
                category={type}
                onSelect={handleSelectTemplate}
              />
              <button
                type="button"
                onClick={() => stepController.goBack()}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                ← {aiSupported ? t("back") : t("cancel")}
              </button>
            </div>
          )}

          {step === "form" && (
            <div className="space-y-6">
              <ObjectForm
                key={step}
                type={type}
                lockType
                initialProperties={initialProperties}
                templateName={selectedTemplate?.name}
                onDirtyChange={setFormDirty}
              />
              <button
                type="button"
                onClick={() => stepController.goBack()}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                ← {t("chooseTemplate")}
              </button>
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
