"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { ObjectForm } from "@/components/object/ObjectForm";
import { TemplateSelector } from "@/components/template/TemplateSelector";
import { useTranslation } from "@/lib/useTranslation";
import { LifeObjectType, LIFE_OBJECT_TYPES, Template } from "@/lib/types";
import { useTemplateStore } from "@/stores/templateStore";

type CreateStep = "type" | "template" | "form";

export default function CreateObjectPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const incrementUsage = useTemplateStore((s) => s.incrementUsage);

  const [step, setStep] = useState<CreateStep>("type");
  const [type, setType] = useState<LifeObjectType>("person");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  // Sync step/type/template from URL query params after hydration.
  useEffect(() => {
    const typeParam = searchParams.get("type");
    const templateParam = searchParams.get("template");
    if (
      typeParam &&
      LIFE_OBJECT_TYPES.includes(typeParam as LifeObjectType)
    ) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setType(typeParam as LifeObjectType);
      if (templateParam) {
        const template = useTemplateStore.getState().getById(templateParam);
        if (template) {
          setSelectedTemplate(template);
          setStep("form");
          return;
        }
      }
      setStep("template");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [searchParams]);

  const handleSelectType = (selectedType: LifeObjectType) => {
    setType(selectedType);
    setStep("template");
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
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="border-b border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/objects"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToObjects")}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {step === "type" && t("chooseType")}
            {step === "template" && t("chooseTemplate")}
            {step === "form" &&
              t("createObjectWithTemplate", {
                type: t(type),
              })}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {step === "type" && t("chooseTypeSubtitle")}
            {step === "template" && t("chooseTemplateSubtitle")}
            {step === "form" && t("createObjectSubtitle")}
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            {[
              { key: "type", label: t("type") },
              { key: "template", label: t("selectTemplate") },
              { key: "form", label: t("name") },
            ].map((item, index) => (
              <div key={item.key} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    step === item.key
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {index + 1}. {item.label}
                </span>
                {index < 2 && (
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
                  className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30"
                >
                  <span
                    className={`mb-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color} ${badge.darkColor}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {t(`templateCategory_${typeOption}`)}
                  </span>
                </button>
              );
            })}
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
              onClick={() => setStep("type")}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ← {t("cancel")}
            </button>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-6">
            <ObjectForm
              type={type}
              lockType
              initialDescription={selectedTemplate?.content}
              templateName={selectedTemplate?.name}
            />
            <button
              type="button"
              onClick={() => setStep("template")}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ← {t("chooseTemplate")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
