"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { ObjectForm } from "@/components/object/ObjectForm";
import { TemplateSelector } from "@/components/template/TemplateSelector";
import { AIMethodSelector } from "@/components/ai/AIMethodSelector";
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

  const [step, setStep] = useState<CreateStep>("type");
  const [type, setType] = useState<LifeObjectType>("person");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  const aiSupported = isAIProfileSupported(type);

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
          setStep("form");
          return;
        }
      }
      setStep(isAIProfileSupported(resolvedType) ? "method" : "template");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [searchParams]);

  const handleSelectType = (selectedType: LifeObjectType) => {
    setType(selectedType);
    if (isAIProfileSupported(selectedType)) {
      setStep("method");
    } else {
      setStep("template");
    }
  };

  const handleSelectMethodManual = () => {
    setStep("template");
  };

  const handleSelectMethodAI = () => {
    router.push(`/create-object-ai?type=${type}`);
  };

  const handleSelectTemplate = (template: Template | null) => {
    if (template) {
      void incrementUsage(template.id);
    }
    setSelectedTemplate(template);
    setStep("form");
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

  const stepItems = aiSupported
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
      ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/create-object"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("createSpaceBackToHub")}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {step === "type" && t("chooseType")}
            {step === "method" && t("chooseCreationMethod")}
            {step === "template" && t("chooseTemplate")}
            {step === "form" &&
              t("createObjectWithTemplate", {
                type: t(type),
              })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "type" && t("chooseTypeSubtitle")}
            {step === "method" && t("chooseCreationMethodSubtitle")}
            {step === "template" && t("chooseTemplateSubtitle")}
            {step === "form" && t("createObjectSubtitle")}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {stepItems.map((item, index) => (
              <div key={item.key} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    step === item.key
                      ? "bg-accent/10 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}. {item.label}
                </span>
                {index < stepItems.length - 1 && (
                  <ChevronRight className="h-3 w-3" />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
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
              onClick={() => setStep("type")}
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
              onClick={() => setStep(aiSupported ? "method" : "type")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ← {aiSupported ? t("back") : t("cancel")}
            </button>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-6">
            <ObjectForm
              key={selectedTemplate?.id ?? "blank"}
              type={type}
              lockType
              initialProperties={initialProperties}
              templateName={selectedTemplate?.name}
            />
            <button
              type="button"
              onClick={() => setStep("template")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ← {t("chooseTemplate")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
