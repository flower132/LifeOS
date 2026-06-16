"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ObjectForm } from "@/components/object/ObjectForm";
import { useTranslation } from "@/lib/useTranslation";

export default function CreateObjectPage() {
  const { t } = useTranslation();

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
            {t("createObjectTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("createObjectSubtitle")}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <ObjectForm />
      </div>
    </div>
  );
}
