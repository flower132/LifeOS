"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NoteForm } from "@/components/note/NoteForm";
import { useTranslation } from "@/lib/useTranslation";

export default function CreateNotePage() {
  return (
    <Suspense fallback={<CreateNoteFallback />}>
      <CreateNoteContent />
    </Suspense>
  );
}

function CreateNoteContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const objectId = searchParams.get("objectId") || undefined;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="border-b border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl">
          <Link
            href={objectId ? `/objects/${objectId}` : "/home"}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {objectId ? t("backToObject") : t("backToHome")}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("createNoteTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("createNoteSubtitle")}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <NoteForm key={objectId ?? "new-note"} initialObjectId={objectId} />
      </div>
    </div>
  );
}

function CreateNoteFallback() {
  return (
    <div className="min-h-screen bg-white px-6 py-10 dark:bg-slate-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}
