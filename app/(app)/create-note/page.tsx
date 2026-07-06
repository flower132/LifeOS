"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NoteForm } from "@/components/note/NoteForm";
import { PageHeader } from "@/components/navigation/PageHeader";
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
      <PageHeader
        backHref={objectId ? `/objects/${objectId}` : "/home"}
        backLabel={objectId ? t("backToObject") : t("backToHome")}
        title={t("createNoteTitle")}
        subtitle={t("createNoteSubtitle")}
      />

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
