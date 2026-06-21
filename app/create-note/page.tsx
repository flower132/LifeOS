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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <Link
            href={objectId ? `/objects/${objectId}` : "/home"}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {objectId ? t("backToObject") : t("backToHome")}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("createNoteTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
